import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(root, "..");
const port = Number(process.env.PORT || 4173);

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
]);

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  const cleanPath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const target = path.resolve(projectRoot, cleanPath || "index.html");

  if (!target.startsWith(projectRoot)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const info = await stat(target);
    const file = info.isDirectory() ? path.join(target, "index.html") : target;
    response.writeHead(200, {
      "content-type": types.get(path.extname(file)) ?? "application/octet-stream",
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Pull Request Choir: http://127.0.0.1:${port}/`);
});
