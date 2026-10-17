// Local development server.
//
// Serves the site and runs the REAL admin API (api/*.js), but instead of talking to GitHub it reads and writes
// the files on your disk. You are signed in automatically. Nothing here is used in production.
//
//   npm run dev        then open http://localhost:3000/admin.html
//
// Options (environment variables): PORT (default 3000), DEV_USER (default local-owner), CMS_ROOT (folder holding content, img and team)
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
// Where the content, images and pages live. Normally the project itself. The tests point this at a temporary copy.
const siteRoot = path.resolve(process.env.CMS_ROOT || root);
const PORT = Number(process.env.PORT) || 3000;
const DEV_USER = process.env.DEV_USER || "local-owner";

// Pretend to be a fully configured deployment. These must be set before the API files are loaded.
Object.assign(process.env, {
  ALLOWED_USER: DEV_USER, GITHUB_OWNER: "local", GITHUB_REPO: "repo", GITHUB_BRANCH: "main",
  GITHUB_TOKEN: "local-dev-token", GITHUB_CLIENT_ID: "local", GITHUB_CLIENT_SECRET: "local"
});

const sha = buf => crypto.createHash("sha1").update(buf).digest("hex");

// A tiny stand-in for the GitHub "contents" API, backed by your files.
const realFetch = global.fetch;
global.fetch = async (url, opts = {}) => {
  const u = String(url);
  if (!u.startsWith("https://api.github.com")) return realFetch(url, opts);
  const reply = (status, body) => ({ ok: status < 300, status, text: async () => JSON.stringify(body), json: async () => body });
  if (u.endsWith("/user")) return reply(200, { login: DEV_USER });
  const m = u.match(/\/repos\/[^/]+\/[^/]+\/contents\/([^?]+)/);
  if (!m) return reply(404, { message: "Not Found" });
  const rel = decodeURIComponent(m[1]);
  if (!/^(content|img|team)\//.test(rel) || rel.split("/").includes("..")) return reply(404, { message: "Not Found" });
  const file = path.join(siteRoot, rel);
  const exists = fs.existsSync(file);
  if ((opts.method || "GET") === "GET") {
    if (!exists) return reply(404, { message: "Not Found" });
    const buf = fs.readFileSync(file);
    return reply(200, { content: buf.toString("base64"), sha: sha(buf) });
  }
  const body = JSON.parse(opts.body);
  if (exists) {
    if (!body.sha) return reply(422, { message: "sha wasn't supplied" });
    if (body.sha !== sha(fs.readFileSync(file))) return reply(409, { message: "does not match" });
  }
  const buf = Buffer.from(body.content, "base64");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  console.log(`  saved ${rel}`);
  return reply(200, { content: { sha: sha(buf) } });
};

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".css": "text/css", ".ico": "image/x-icon" };
const PUBLIC = /^\/(index\.html|admin\.html|fonts\.js|content\/[^/]+\.json|img\/[^/]+)$/;

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname.startsWith("/api/")) {
    const name = url.pathname.slice(5);
    const file = path.join(root, "api", name + ".js");
    if (name.startsWith("_") || name.includes("/") || !fs.existsSync(file)) { res.statusCode = 404; return res.end("Not found"); }
    if (name === "login") { res.statusCode = 302; res.setHeader("Location", "/admin.html"); return res.end(); }
    let raw = ""; for await (const c of req) raw += c;
    try { req.body = raw && /json/.test(req.headers["content-type"] || "") ? JSON.parse(raw) : undefined; } catch { res.statusCode = 400; return res.end("Bad JSON"); }
    req.query = Object.fromEntries(url.searchParams);
    req.headers.cookie = "admin_token=local-dev";
    res.status = c => { res.statusCode = c; return res; };
    res.json = o => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); };
    res.send = t => { res.setHeader("Content-Type", "text/plain; charset=utf-8"); res.end(String(t)); };
    res.redirect = (c, to) => { res.statusCode = c; res.setHeader("Location", to); res.end(); };
    try { return await require(file)(req, res); }
    catch (e) { console.error(e); res.statusCode = 500; return res.end("Server error"); }
  }

  let p = decodeURIComponent(url.pathname);
  if (p === "/") p = "/index.html";
  if (!PUBLIC.test(p)) { res.statusCode = 404; return res.end("Not found"); }
  const file = path.join(siteRoot, p);
  if (!fs.existsSync(file)) { res.statusCode = 404; return res.end("Not found"); }
  res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream");
  res.setHeader("Cache-Control", "no-store");
  res.end(fs.readFileSync(file));
}).listen(PORT, "127.0.0.1", () => {
  console.log(`\n  Site   http://localhost:${PORT}/`);
  console.log(`  Admin  http://localhost:${PORT}/admin.html   (signed in as ${DEV_USER})`);
  console.log("  Changes you save are written to content/ and img/ on your disk.\n");
});
