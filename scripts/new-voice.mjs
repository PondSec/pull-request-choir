import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { colorFromSeed, hashString, moods, normalizeId, notes, validateVoice } from "./voice-rules.mjs";

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) {
      continue;
    }

    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      result[key] = true;
    } else {
      result[key] = next;
      index += 1;
    }
  }
  return result;
}

async function askMissing(args) {
  const rl = readline.createInterface({ input, output });
  const answer = async (key, question, fallback = "") => {
    if (args[key]) {
      return args[key];
    }
    const suffix = fallback ? ` (${fallback})` : "";
    const response = await rl.question(`${question}${suffix}: `);
    return response.trim() || fallback;
  };

  try {
    const handle = await answer("handle", "GitHub handle");
    const displayName = await answer("displayName", "Display name", handle);
    const phrase = await answer("phrase", "One sentence for the choir");
    const moodList = Object.keys(moods).join(", ");
    const mood = await answer("mood", `Mood [${moodList}]`, "wonder");
    const note = await answer("note", `Note [${notes.join(", ")}]`, notes[hashString(handle || phrase) % notes.length]);
    const color = await answer("color", "Hex color", colorFromSeed(hashString(`${handle}:${phrase}`)));
    const respondsToText = await answer("respondsTo", "Reply to voice ids, comma-separated", "");
    const respondsTo = respondsToText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    return {
      id: normalizeId(args.id || handle || displayName),
      handle,
      displayName,
      phrase,
      mood,
      note,
      color,
      respondsTo,
    };
  } finally {
    rl.close();
  }
}

const args = parseArgs(process.argv.slice(2));
const voice = await askMissing(args);
const result = validateVoice(voice);

if (!result.ok) {
  console.error("Your voice is close, but not valid yet:");
  for (const error of result.errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

const voicesDirectory = path.join(process.cwd(), "community", "voices");
const filePath = path.join(voicesDirectory, `${result.value.id}.json`);

try {
  await access(filePath);
  console.error(`community/voices/${result.value.id}.json already exists. Pick another --id.`);
  process.exit(1);
} catch {
  await mkdir(voicesDirectory, { recursive: true });
}

await writeFile(filePath, `${JSON.stringify(result.value, null, 2)}\n`);

console.log(`Created community/voices/${result.value.id}.json`);
console.log("Next: npm run validate && npm run build");
