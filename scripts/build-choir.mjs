import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { hashString, moods, noteToFrequency, validateVoice } from "./voice-rules.mjs";

const voicesDirectory = path.join(process.cwd(), "community", "voices");
const publicDirectory = path.join(process.cwd(), "public");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function unit(seed, salt) {
  return (hashString(`${seed}:${salt}`) % 10000) / 10000;
}

async function loadVoices() {
  const filenames = (await readdir(voicesDirectory))
    .filter((filename) => filename.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right));

  const rawItems = [];
  for (const filename of filenames) {
    rawItems.push({
      filename,
      raw: JSON.parse(await readFile(path.join(voicesDirectory, filename), "utf8")),
    });
  }

  const knownIds = new Set(rawItems.map((item) => item.raw.id));
  return rawItems.map((item) => {
    const result = validateVoice(item.raw, { knownIds });
    if (!result.ok) {
      throw new Error(`${item.filename}: ${result.errors.join("; ")}`);
    }
    return result.value;
  });
}

function layoutVoices(voices) {
  const moodKeys = Object.keys(moods);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const sorted = voices.sort((left, right) => left.id.localeCompare(right.id));

  return sorted.map((voice, index) => {
    const seed = hashString(`${voice.id}:${voice.handle}:${voice.phrase}`);
    const moodIndex = moodKeys.indexOf(voice.mood);
    const clusterAngle = (moodIndex / moodKeys.length) * Math.PI * 2;
    const orbit = 0.12 + unit(seed, "orbit") * 0.31;
    const jitter = (unit(seed, "jitter") - 0.5) * 0.84;
    const spiral = index * goldenAngle * 0.11;
    const angle = clusterAngle + jitter + spiral;
    const x = clamp(0.5 + Math.cos(angle) * orbit + (unit(seed, "x") - 0.5) * 0.08, 0.06, 0.94);
    const y = clamp(0.5 + Math.sin(angle) * orbit + (unit(seed, "y") - 0.5) * 0.08, 0.08, 0.92);

    return {
      ...voice,
      number: index + 1,
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
      frequency: noteToFrequency(voice.note),
      intensity: Number((0.45 + unit(seed, "intensity") * 0.55).toFixed(3)),
      delay: Number((index * 0.125).toFixed(3)),
      seed,
    };
  });
}

function buildLinks(voices) {
  const links = [];
  const byMood = new Map();

  for (const voice of voices) {
    for (const target of voice.respondsTo) {
      links.push({
        source: voice.id,
        target,
        kind: "reply",
      });
    }

    const previousMoodVoice = byMood.get(voice.mood);
    if (previousMoodVoice && !voice.respondsTo.includes(previousMoodVoice.id)) {
      links.push({
        source: previousMoodVoice.id,
        target: voice.id,
        kind: "echo",
      });
    }
    byMood.set(voice.mood, voice);
  }

  return links;
}

const voices = layoutVoices(await loadVoices());
const links = buildLinks(voices);
const signature = hashString(voices.map((voice) => `${voice.id}:${voice.phrase}:${voice.note}`).join("|"))
  .toString(16)
  .padStart(8, "0");

const choir = {
  name: "Pull Request Choir",
  version: 1,
  signature,
  tempo: 82,
  moods,
  stats: {
    voices: voices.length,
    links: links.length,
    moods: Object.keys(moods).length,
  },
  voices,
  links,
};

await mkdir(publicDirectory, { recursive: true });

const json = JSON.stringify(choir, null, 2);
await writeFile(path.join(publicDirectory, "choir.json"), `${json}\n`);

console.log(`Built choir ${signature} with ${voices.length} voice(s) and ${links.length} link(s).`);
