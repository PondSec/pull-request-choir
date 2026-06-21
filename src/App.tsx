import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MutableRefObject, RefObject } from "react";
import { choir, type Voice } from "./generated/choir";

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const repoUrl = "https://github.com/PondSec/pull-request-choir";
const voices: readonly Voice[] = choir.voices;
const voiceById = new Map(voices.map((voice) => [voice.id, voice]));

function playVoice(ctx: AudioContext, voice: Voice) {
  const now = ctx.currentTime;
  const main = ctx.createOscillator();
  const shimmer = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const shimmerGain = ctx.createGain();

  main.type = voice.mood === "chaos" ? "sawtooth" : voice.mood === "calm" ? "sine" : "triangle";
  shimmer.type = "sine";
  main.frequency.setValueAtTime(voice.frequency, now);
  shimmer.frequency.setValueAtTime(voice.frequency * 2.01, now);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(780 + voice.intensity * 1800, now);
  filter.Q.setValueAtTime(2.6, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12 + voice.intensity * 0.1, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);
  shimmerGain.gain.setValueAtTime(0.0001, now);
  shimmerGain.gain.exponentialRampToValueAtTime(0.045, now + 0.05);
  shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

  main.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(ctx.destination);
  main.start(now);
  shimmer.start(now + 0.015);
  main.stop(now + 0.8);
  shimmer.stop(now + 0.62);
}

async function ensureAudioContext(audioRef: MutableRefObject<AudioContext | null>) {
  if (!audioRef.current) {
    const AudioContextCtor = window.AudioContext || (window as AudioWindow).webkitAudioContext;
    if (!AudioContextCtor) {
      throw new Error("This browser does not support Web Audio.");
    }
    audioRef.current = new AudioContextCtor();
  }

  if (audioRef.current.state === "suspended") {
    await audioRef.current.resume();
  }

  return audioRef.current;
}

function useChoirCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  activeIndexRef: MutableRefObject<number>,
  selectedIdRef: MutableRefObject<string>,
  playingRef: MutableRefObject<boolean>,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return undefined;
    }

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#050706";
      context.fillRect(0, 0, width, height);

      const active = voices[activeIndexRef.current];
      const selectedId = selectedIdRef.current;
      const heartbeat = 0.5 + Math.sin(time * 0.003) * 0.5;

      context.save();
      context.globalAlpha = 0.18;
      context.strokeStyle = "#dfffee";
      context.lineWidth = 1;
      for (let x = 0; x < width; x += 64) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 0; y < height; y += 64) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
      context.restore();

      for (const link of choir.links) {
        const source = voiceById.get(link.source);
        const target = voiceById.get(link.target);
        if (!source || !target) {
          continue;
        }

        const isHot = source.id === active?.id || target.id === active?.id || source.id === selectedId || target.id === selectedId;
        context.beginPath();
        context.moveTo(source.x * width, source.y * height);
        context.lineTo(target.x * width, target.y * height);
        context.strokeStyle = isHot ? source.color : "rgba(230, 255, 244, 0.18)";
        context.globalAlpha = isHot ? 0.78 : 0.28;
        context.lineWidth = isHot ? 1.7 : 1;
        context.stroke();
      }
      context.globalAlpha = 1;

      voices.forEach((voice, index) => {
        const x = voice.x * width;
        const y = voice.y * height;
        const isActive = index === activeIndexRef.current;
        const isSelected = voice.id === selectedId;
        const twinkle = 0.5 + Math.sin(time * 0.0025 + (voice.seed % 360)) * 0.5;
        const radius = 4.5 + voice.intensity * 5 + (isActive ? 11 + heartbeat * 5 : twinkle * 1.8);

        if (isActive || isSelected) {
          context.beginPath();
          context.arc(x, y, radius + 18 + heartbeat * 18, 0, Math.PI * 2);
          context.strokeStyle = voice.color;
          context.globalAlpha = isActive ? 0.28 : 0.14;
          context.lineWidth = isActive ? 2 : 1.5;
          context.stroke();
          context.globalAlpha = 1;
        }

        context.beginPath();
        context.shadowColor = voice.color;
        context.shadowBlur = isActive ? 26 : isSelected ? 18 : playingRef.current ? 9 : 5;
        context.fillStyle = voice.color;
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;

        context.beginPath();
        context.fillStyle = "#fffdf2";
        context.globalAlpha = isActive ? 0.95 : 0.45;
        context.arc(x - radius * 0.28, y - radius * 0.28, Math.max(1.4, radius * 0.22), 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = 1;
      });

      const centerX = width * 0.5;
      const centerY = height * 0.52;
      const coreRadius = Math.min(width, height) * 0.055 + heartbeat * 5;
      const gradient = context.createRadialGradient(centerX, centerY, 4, centerX, centerY, coreRadius * 3.6);
      gradient.addColorStop(0, "rgba(255, 255, 246, 0.72)");
      gradient.addColorStop(0.34, "rgba(98, 247, 212, 0.18)");
      gradient.addColorStop(1, "rgba(5, 7, 6, 0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(centerX, centerY, coreRadius * 3.6, 0, Math.PI * 2);
      context.fill();

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    animationFrame = window.requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [activeIndexRef, canvasRef, playingRef, selectedIdRef]);
}

function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(voices[0]?.id ?? "");
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState<number>(choir.tempo);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const activeIndexRef = useRef(activeIndex);
  const selectedIdRef = useRef(selectedId);
  const playingRef = useRef(isPlaying);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedVoice = voiceById.get(selectedId) ?? voices[activeIndex] ?? voices[0];
  const stepMs = Math.max(220, Math.round(60000 / tempo));

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);

  useChoirCanvas(canvasRef, activeIndexRef, selectedIdRef, playingRef);

  useEffect(() => {
    if (!isPlaying || voices.length === 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      const next = (activeIndexRef.current + 1) % voices.length;
      const voice = voices[next];
      activeIndexRef.current = next;
      setActiveIndex(next);
      setSelectedId(voice.id);

      if (audioRef.current) {
        playVoice(audioRef.current, voice);
      }
    }, stepMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, stepMs]);

  const moodCounts = useMemo(() => {
    return voices.reduce<Record<string, number>>((accumulator, voice) => {
      accumulator[voice.mood] = (accumulator[voice.mood] ?? 0) + 1;
      return accumulator;
    }, {});
  }, []);

  const recentVoices = useMemo(() => voices.slice(-6).reverse(), []);

  const togglePlayback = async () => {
    const ctx = await ensureAudioContext(audioRef);
    if (!isPlaying && voices[activeIndex]) {
      playVoice(ctx, voices[activeIndex]);
    }
    setIsPlaying((current) => !current);
  };

  const soloVoice = async (voice: Voice) => {
    const ctx = await ensureAudioContext(audioRef);
    const index = voices.findIndex((candidate) => candidate.id === voice.id);
    activeIndexRef.current = Math.max(0, index);
    setActiveIndex(Math.max(0, index));
    setSelectedId(voice.id);
    playVoice(ctx, voice);
  };

  const copyCommand = async () => {
    await navigator.clipboard.writeText("npm run new-voice");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <main className="app-shell">
      <canvas ref={canvasRef} className="choir-canvas" aria-hidden="true" />

      <section className="topbar" aria-label="Choir controls">
        <div className="identity">
          <p className="eyebrow">GitHub is the database. Pull requests are the instrument.</p>
          <h1>Pull Request Choir</h1>
        </div>

        <div className="transport">
          <button className="primary-button" onClick={togglePlayback} type="button">
            {isPlaying ? "Pause" : "Play choir"}
          </button>
          <label className="tempo-control">
            <span>{tempo} BPM</span>
            <input
              min="64"
              max="148"
              onChange={(event) => setTempo(Number(event.target.value))}
              type="range"
              value={tempo}
            />
          </label>
          <a className="repo-link" href={repoUrl} rel="noreferrer" target="_blank">
            Open repo
          </a>
        </div>
      </section>

      <aside className="voice-panel" aria-label="Selected voice">
        <div className="panel-header">
          <span className="voice-number">Voice {selectedVoice.number}</span>
          <span className="signature">#{choir.signature}</span>
        </div>

        <h2>{selectedVoice.displayName}</h2>
        <p className="phrase">"{selectedVoice.phrase}"</p>

        <dl className="voice-facts">
          <div>
            <dt>Handle</dt>
            <dd>@{selectedVoice.handle}</dd>
          </div>
          <div>
            <dt>Mood</dt>
            <dd>{choir.moods[selectedVoice.mood].label}</dd>
          </div>
          <div>
            <dt>Note</dt>
            <dd>{selectedVoice.note}</dd>
          </div>
          <div>
            <dt>Frequency</dt>
            <dd>{selectedVoice.frequency} Hz</dd>
          </div>
        </dl>

        <button className="ghost-button" onClick={() => soloVoice(selectedVoice)} type="button">
          Solo this voice
        </button>

        <div className="mood-stack" aria-label="Mood distribution">
          {Object.entries(choir.moods).map(([key, mood]) => (
            <button
              className={key === selectedVoice.mood ? "mood-chip active" : "mood-chip"}
              key={key}
              onClick={() => {
                const voice = voices.find((candidate) => candidate.mood === key) ?? selectedVoice;
                setSelectedId(voice.id);
              }}
              style={{ "--chip-color": mood.accent } as CSSProperties}
              type="button"
            >
              <span>{mood.label}</span>
              <strong>{moodCounts[key] ?? 0}</strong>
            </button>
          ))}
        </div>
      </aside>

      <section className="join-panel" aria-label="Join the choir">
        <div>
          <span className="join-kicker">30 second contribution</span>
          <h2>Add one permanent note</h2>
          <p>
            Fork the repo, run the voice wizard, open a PR. When it merges, the
            song and the constellation both change.
          </p>
        </div>
        <button className="copy-command" onClick={copyCommand} type="button">
          {copied ? "Copied" : "npm run new-voice"}
        </button>
      </section>

      <section className="voice-strip" aria-label="Recent voices">
        {recentVoices.map((voice) => (
          <button
            className={voice.id === selectedVoice.id ? "voice-pill active" : "voice-pill"}
            key={voice.id}
            onClick={() => setSelectedId(voice.id)}
            style={{ "--voice-color": voice.color } as CSSProperties}
            type="button"
          >
            <span>{voice.displayName}</span>
            <small>{voice.note}</small>
          </button>
        ))}
      </section>
    </main>
  );
}

export default App;
