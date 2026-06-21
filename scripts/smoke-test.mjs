import { access, readFile } from "node:fs/promises";
import path from "node:path";

const required = [
  "dist/index.html",
  "dist/assets",
  "public/choir.json",
  "src/generated/choir.ts",
];

for (const item of required) {
  await access(path.join(process.cwd(), item));
}

const html = await readFile(path.join(process.cwd(), "dist", "index.html"), "utf8");
const choir = JSON.parse(await readFile(path.join(process.cwd(), "public", "choir.json"), "utf8"));

if (!html.includes("Pull Request Choir")) {
  throw new Error("dist/index.html does not contain the expected title.");
}

if (!Array.isArray(choir.voices) || choir.voices.length < 1) {
  throw new Error("public/choir.json has no voices.");
}

console.log(`Smoke test passed for ${choir.voices.length} voice(s).`);
