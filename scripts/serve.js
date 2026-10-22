import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEFAULT_PORT = 4173;
const DEFAULT_HOST = "127.0.0.1";

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
]);

function sendText(response, statusCode, message, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  });
  response.end(message);
}

async function resolveFile(pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return { error: 400 };
  }

  const requestedPath = decodedPath.endsWith("/")
    ? `${decodedPath}index.html`
    : decodedPath;
  const filePath = path.resolve(ROOT, `.${requestedPath}`);

  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
    return { error: 403 };
  }

  try {
    const fileStats = await stat(filePath);
    if (fileStats.isDirectory()) {
      return resolveFile(path.posix.join(pathname, "index.html"));
    }
    if (!fileStats.isFile()) return { error: 404 };
    return { filePath, fileStats };
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return { error: 404 };
    throw error;
  }
}

export function createStaticServer() {
  return createServer(async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      sendText(response, 405, "Method not allowed\n", { Allow: "GET, HEAD" });
      return;
    }

    let pathname;
    try {
      pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    } catch {
      sendText(response, 400, "Bad request\n");
      return;
    }

    try {
      const resolved = await resolveFile(pathname);
      if (resolved.error === 400) {
        sendText(response, 400, "Bad request\n");
        return;
      }
      if (resolved.error === 403) {
        sendText(response, 403, "Forbidden\n");
        return;
      }
      if (resolved.error === 404) {
        sendText(response, 404, "Not found\n");
        return;
      }

      const extension = path.extname(resolved.filePath).toLowerCase();
      const contentType = MIME_TYPES.get(extension) ?? "application/octet-stream";

      response.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": resolved.fileStats.size,
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      });

      if (request.method === "HEAD") {
        response.end();
        return;
      }

      createReadStream(resolved.filePath)
        .on("error", () => {
          if (!response.headersSent) sendText(response, 500, "Server error\n");
          else response.destroy();
        })
        .pipe(response);
    } catch (error) {
      console.error("Static server error:", error);
      if (!response.headersSent) sendText(response, 500, "Server error\n");
      else response.destroy();
    }
  });
}

function parsePort(value) {
  if (value === undefined) return DEFAULT_PORT;
  const port = Number(value);
  return Number.isInteger(port) && port >= 0 && port <= 65535 ? port : DEFAULT_PORT;
}

export function startServer({ port = parsePort(process.env.PORT), host = process.env.HOST || DEFAULT_HOST } = {}) {
  const server = createStaticServer();
  server.listen(port, host, () => {
    const address = server.address();
    const activePort = typeof address === "object" && address ? address.port : port;
    console.log(`Freebie Finder is running at http://${host}:${activePort}`);
    console.log("Press Ctrl+C to stop.");
  });
  return server;
}

const isEntryPoint =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isEntryPoint) {
  startServer().on("error", (error) => {
    console.error(`Could not start the local server: ${error.message}`);
    process.exitCode = 1;
  });
}
