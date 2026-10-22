import { Hono } from "hono";
import path from "node:path";
import { promises as fs } from "node:fs";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";

const app = new Hono<{ Bindings: HttpBindings }>();

function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "SAMEORIGIN",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
  if (env.isProduction) {
    headers["Content-Security-Policy"] = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "script-src 'self'",
      "script-src-attr 'none'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-src https://www.google.com https://maps.google.com",
    ].join("; ");
  }
  return headers;
}

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(getSecurityHeaders())) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

app.use("*", async (c, next) => {
  for (const [name, value] of Object.entries(getSecurityHeaders())) {
    c.header(name, value);
  }
  await next();
});

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.all("/api/trpc/*", async (c) => {
  console.log(`[Route-Debug] Incoming request: ${c.req.method} ${c.req.path}`);
  try {
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: c.req.raw,
      router: appRouter,
      createContext,
    });
    console.log(`[Route-Debug] tRPC response status: ${response.status}`);
    return withSecurityHeaders(response);
  } catch (err) {
    const errorType = err instanceof Error ? err.name : typeof err;
    console.error(`[Route-Debug] tRPC handler error type: ${errorType}`);
    throw err;
  }
});
app.get("/api/files/:key", async (c) => {
  const rawKey = c.req.param("key");
  const key = decodeURIComponent(rawKey);
  if (!key) return c.text("Bad Request", 400);
  // Disallow path traversal and absolute paths.
  if (key.includes("..") || path.isAbsolute(key) || key.includes("\\")) {
    return c.text("Forbidden", 403);
  }
  const safePath = path.normalize(key);
  const storageDir = process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), "uploads");
  const filePath = path.join(storageDir, safePath);
  const resolved = path.resolve(filePath);
  const base = path.resolve(storageDir);
  if (!resolved.startsWith(base + path.sep)) {
    return c.text("Forbidden", 403);
  }
  try {
    const stat = await fs.stat(resolved);
    if (!stat.isFile()) return c.text("Not Found", 404);
  } catch {
    return c.text("Not Found", 404);
  }
  const ext = path.extname(resolved).toLowerCase();
  const MIME_BY_EXT: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
  };
  const mime = MIME_BY_EXT[ext] ?? "application/octet-stream";
  const file = await fs.readFile(resolved);
  return new Response(file, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=86400",
    },
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
