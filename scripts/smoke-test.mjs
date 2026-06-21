import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";

const required = [
  "index.html",
  "public/choir.json",
];

for (const item of required) {
  await access(path.join(process.cwd(), item));
}

const htmlPath = path.join(process.cwd(), "index.html");
const html = await readFile(htmlPath, "utf8");
const htmlStat = await stat(htmlPath);
const choir = JSON.parse(await readFile(path.join(process.cwd(), "public", "choir.json"), "utf8"));

if (!html.includes("Pull Request Choir")) {
  throw new Error("index.html does not contain the expected title.");
}

if (!Array.isArray(choir.voices) || choir.voices.length < 1) {
  throw new Error("public/choir.json has no voices.");
}

if (html.includes("backdrop-filter")) {
  throw new Error("index.html contains forbidden backdrop-filter CSS.");
}

if (html.includes("/src/main.tsx") || html.includes("react")) {
  throw new Error("index.html still references the framework app.");
}

if (htmlStat.size > 50 * 1024) {
  throw new Error(`index.html is ${htmlStat.size} bytes; expected less than 50KB.`);
}

console.log(`Smoke test passed for ${choir.voices.length} voice(s), ${htmlStat.size} byte HTML.`);
