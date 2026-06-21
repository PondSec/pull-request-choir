export const moods = {
  wonder: {
    label: "Wonder",
    accent: "#62f7d4",
    description: "curious, bright, impossible-to-ignore",
  },
  hope: {
    label: "Hope",
    accent: "#f8d34a",
    description: "warm, forward, stubbornly alive",
  },
  defiance: {
    label: "Defiance",
    accent: "#ff5f7e",
    description: "sharp, brave, unafraid of noise",
  },
  focus: {
    label: "Focus",
    accent: "#6ea8ff",
    description: "clean, precise, locked in",
  },
  calm: {
    label: "Calm",
    accent: "#9df58d",
    description: "soft, steady, grounding",
  },
  joy: {
    label: "Joy",
    accent: "#ffad5a",
    description: "playful, quick, contagious",
  },
  chaos: {
    label: "Chaos",
    accent: "#e66dff",
    description: "strange, glitchy, beautifully unstable",
  },
};

export const notes = [
  "C3",
  "D3",
  "E3",
  "F3",
  "G3",
  "A3",
  "B3",
  "C4",
  "D4",
  "E4",
  "F4",
  "G4",
  "A4",
  "B4",
  "C5",
  "D5",
  "E5",
  "F5",
  "G5",
  "A5",
];

const noteOffsets = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export function noteToFrequency(note) {
  const match = /^([A-G])([0-8])$/.exec(note);
  if (!match) {
    throw new Error(`Unknown note "${note}"`);
  }

  const [, pitch, octaveText] = match;
  const octave = Number(octaveText);
  const midi = 12 * (octave + 1) + noteOffsets[pitch];
  return Number((440 * 2 ** ((midi - 69) / 12)).toFixed(3));
}

export function hashString(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function normalizeId(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function colorFromSeed(seed) {
  const palette = Object.values(moods).map((mood) => mood.accent);
  return palette[seed % palette.length];
}

export function validateVoice(raw, context = {}) {
  const errors = [];
  const value = { ...raw };

  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(value.id ?? "")) {
    errors.push("id must be 3-40 lowercase letters, numbers, or hyphens");
  }

  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(value.handle ?? "")) {
    errors.push("handle must look like a GitHub username");
  }

  if (typeof value.displayName !== "string" || value.displayName.trim().length < 1 || value.displayName.length > 40) {
    errors.push("displayName must be 1-40 characters");
  }

  if (typeof value.phrase !== "string" || value.phrase.trim().length < 12 || value.phrase.length > 140) {
    errors.push("phrase must be 12-140 characters");
  }

  if (typeof value.phrase === "string" && /https?:\/\//i.test(value.phrase)) {
    errors.push("phrase cannot contain links");
  }

  if (!Object.hasOwn(moods, value.mood ?? "")) {
    errors.push(`mood must be one of: ${Object.keys(moods).join(", ")}`);
  }

  if (!notes.includes(value.note)) {
    errors.push(`note must be one of: ${notes.join(", ")}`);
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(value.color ?? "")) {
    errors.push("color must be a 6-digit hex color, for example #62f7d4");
  }

  if (!Array.isArray(value.respondsTo)) {
    errors.push("respondsTo must be an array");
  } else if (value.respondsTo.length > 3) {
    errors.push("respondsTo can contain at most 3 ids");
  } else {
    for (const id of value.respondsTo) {
      if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(id)) {
        errors.push(`respondsTo contains invalid id "${id}"`);
      }
      if (id === value.id) {
        errors.push("respondsTo cannot point at the same voice");
      }
      if (context.knownIds && !context.knownIds.has(id)) {
        errors.push(`respondsTo points at unknown voice "${id}"`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    value: {
      id: value.id,
      handle: value.handle,
      displayName: value.displayName?.trim(),
      phrase: value.phrase?.trim(),
      mood: value.mood,
      note: value.note,
      color: value.color?.toLowerCase(),
      respondsTo: value.respondsTo ?? [],
    },
  };
}
