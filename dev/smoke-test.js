// Quick end to end check of the admin API. Run with: npm test
// It starts the dev server against a temporary copy of your content, so nothing real is changed.
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cms-test-"));
for (const d of ["content", "img", "team"]) fs.cpSync(path.join(root, d), path.join(tmp, d), { recursive: true });
const PORT = 4500 + Math.floor(Math.random() * 400), base = `http://127.0.0.1:${PORT}`;
const server = spawn(process.execPath, [path.join(__dirname, "server.js")], { env: { ...process.env, PORT, CMS_ROOT: tmp }, stdio: "pipe" });

let pass = 0, fail = 0;
const check = (name, ok, extra = "") => { ok ? pass++ : fail++; console.log(`${ok ? "  ok  " : " FAIL "} ${name}${ok ? "" : "  " + extra}`); };
const call = async (url, opts = {}) => {
  const r = await fetch(base + url, { ...opts, headers: { "Content-Type": "application/json", "X-Admin": "1", ...(opts.headers || {}) } });
  let body = null; try { body = await r.json(); } catch {}
  return { status: r.status, body };
};
const put = (file, data, sha, images) => call("/api/content", { method: "PUT", body: JSON.stringify({ file, data, sha, images }) });
const b64 = t => Buffer.from(t).toString("base64");

async function run() {
  for (let i = 0; i < 50; i++) { try { if ((await fetch(base + "/api/me")).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }

  const me = await call("/api/me");
  check("signed in as the owner", me.status === 200 && me.body.role === "owner");

  const site = await call("/api/content?file=site");
  check("reads the site settings", site.status === 200 && site.body.data && site.body.sha);
  check("refuses unknown files", (await call("/api/content?file=secrets")).status === 400);

  const changed = { ...site.body.data, brand: "Test Name" };
  const saved = await put("site", changed, site.body.sha);
  check("saves a change", saved.status === 200);
  check("the change is on disk", JSON.parse(fs.readFileSync(path.join(tmp, "content/site.json"), "utf8")).brand === "Test Name");
  check("rejects a stale copy (conflict)", (await put("site", changed, site.body.sha)).status === 409);

  const fresh = (await call("/api/content?file=quotes")).body;
  const svgOk = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>';
  check("accepts a clean SVG logo", (await put("quotes", fresh.data, fresh.sha, [{ path: "img/logo-test.svg", base64: b64(svgOk) }])).status === 200);
  const f2 = (await call("/api/content?file=quotes")).body;
  const bad = (p, t) => put("quotes", f2.data, f2.sha, [{ path: p, base64: b64(t) }]);
  check("refuses an SVG with a script", (await bad("img/x.svg", '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')).status === 400);
  check("refuses an SVG with an event handler", (await bad("img/y.svg", '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>')).status === 400);
  check("refuses files outside the images folder", (await bad("../evil.png", "x")).status === 400);

  const team = await call("/api/team");
  check("the owner can read the team", team.status === 200 && Array.isArray(team.body.users));
  check("rejects a bad username", (await call("/api/team", { method: "PUT", body: JSON.stringify({ users: [{ login: "bad name!" }] }) })).status === 400);
  const added = await call("/api/team", { method: "PUT", body: JSON.stringify({ users: [{ login: "octocat" }] }) });
  check("adds a team member", added.status === 200 && added.body.users[0].login === "octocat");
  const removed = await call("/api/team", { method: "PUT", body: JSON.stringify({ users: [] }) });
  check("removes a team member", removed.status === 200 && removed.body.users.length === 0);
}

run().catch(e => { fail++; console.log(" FAIL ", e.message); }).finally(() => {
  server.kill();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
});
