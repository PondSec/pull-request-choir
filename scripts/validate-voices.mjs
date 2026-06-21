import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { validateVoice } from "./voice-rules.mjs";

const voicesDirectory = path.join(process.cwd(), "community", "voices");

async function readVoices() {
  const filenames = (await readdir(voicesDirectory))
    .filter((filename) => filename.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right));

  const parsed = [];
  for (const filename of filenames) {
    const filePath = path.join(voicesDirectory, filename);
    try {
      parsed.push({
        filename,
        raw: JSON.parse(await readFile(filePath, "utf8")),
      });
    } catch (error) {
      throw new Error(`${filename}: ${error.message}`);
    }
  }

  return parsed;
}

const parsed = await readVoices();
const ids = new Map();
const duplicateIds = new Set();

for (const item of parsed) {
  const id = item.raw?.id;
  if (ids.has(id)) {
    duplicateIds.add(id);
  }
  ids.set(id, item.filename);
}

const knownIds = new Set(ids.keys());
let failureCount = 0;

for (const item of parsed) {
  const expectedFilename = `${item.raw?.id}.json`;
  const result = validateVoice(item.raw, { knownIds });
  const errors = [...result.errors];

  if (duplicateIds.has(item.raw?.id)) {
    errors.push(`duplicate id "${item.raw.id}"`);
  }

  if (item.raw?.id && item.filename !== expectedFilename) {
    errors.push(`filename must be ${expectedFilename}`);
  }

  if (errors.length > 0) {
    failureCount += 1;
    console.error(`\n${item.filename}`);
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
  }
}

if (failureCount > 0) {
  console.error(`\n${failureCount} voice file(s) failed validation.`);
  process.exit(1);
}

console.log(`Validated ${parsed.length} voice file(s). The choir is in tune.`);
