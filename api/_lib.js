// Shared helpers for the admin API. Files starting with _ are not exposed as routes.
// Which repository the admin edits. On Vercel, the owner and repo are filled in for you.
// Set GITHUB_OWNER, GITHUB_REPO and GITHUB_BRANCH to override. ALLOWED_USER is the GitHub username of the site owner.
const OWNER = process.env.GITHUB_OWNER || process.env.VERCEL_GIT_REPO_OWNER || "";
const REPO = process.env.GITHUB_REPO || process.env.VERCEL_GIT_REPO_SLUG || "";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const ALLOWED_USER = (process.env.ALLOWED_USER || OWNER).toLowerCase();

// A plain sentence about anything missing, shown on the sign in page.
function configProblem() {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) return "Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your hosting settings. See docs/SETUP.md.";
  if (!OWNER || !REPO) return "Could not tell which repository to edit. Set GITHUB_OWNER and GITHUB_REPO. See docs/SETUP.md.";
  if (!ALLOWED_USER) return "Set ALLOWED_USER to your GitHub username. See docs/SETUP.md.";
  return "";
}

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || "").split(";").forEach(part => {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function cookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

async function gh(token, path, options = {}) {
  const r = await fetch("https://api.github.com" + path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "git-cms-starter",
      ...(options.headers || {})
    }
  });
  const text = await r.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { message: text }; }
  return { ok: r.ok, status: r.status, body };
}

// The people allowed in. The owner (ALLOWED_USER) always is. Others are listed in team/users.json.
const TEAM_PATH = "team/users.json";
let teamCache = { at: 0, users: [] };

// Edits are saved with GITHUB_TOKEN, so team members never need access to the repository.
const serverToken = () => process.env.GITHUB_TOKEN || "";

async function readTeam() {
  const token = serverToken();
  if (!token) return { raw: [], users: [], sha: null };
  const r = await gh(token, `/repos/${OWNER}/${REPO}/contents/${TEAM_PATH}?ref=${BRANCH}`);
  if (!r.ok) return { raw: [], users: [], sha: null };
  let raw = [];
  try { raw = (JSON.parse(Buffer.from(r.body.content, "base64").toString("utf8")).users || []).map(u => String(u.login || u)); } catch {}
  return { raw, users: raw.map(x => x.toLowerCase()), sha: r.body.sha };
}

async function roleFor(login) {
  const l = String(login || "").toLowerCase();
  if (l === ALLOWED_USER) return "owner";
  if (Date.now() - teamCache.at > 30000) teamCache = { at: Date.now(), ...(await readTeam()) };
  return teamCache.users.includes(l) ? "editor" : null;
}
const forgetTeam = () => { teamCache.at = 0; };

// Returns { login, role, token } if the cookie holds a valid GitHub sign in for someone allowed in, else null.
async function currentUser(req) {
  const token = parseCookies(req).admin_token;
  if (!token) return null;
  const r = await gh(token, "/user");
  if (!r.ok || !r.body) return null;
  const role = await roleFor(r.body.login);
  return role ? { login: r.body.login, role, token } : null;
}

// The token used to read and write the repository. The owner can still fall back to their own sign in.
const apiToken = user => serverToken() || (user.role === "owner" ? user.token : "");

module.exports = { configProblem, OWNER, REPO, BRANCH, ALLOWED_USER, TEAM_PATH, parseCookies, cookie, gh, currentUser, roleFor, readTeam, forgetTeam, serverToken, apiToken };
