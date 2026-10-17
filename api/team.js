const { OWNER, REPO, BRANCH, TEAM_PATH, gh, currentUser, readTeam, forgetTeam, serverToken } = require("./_lib");

const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;

// GET  /api/team   the people who can edit the site (owner only)
// PUT  /api/team   replace the list of team members (owner only)
module.exports = async (req, res) => {
  const user = await currentUser(req);
  if (!user) { res.status(401).json({ error: "Please sign in again." }); return; }
  if (user.role !== "owner") { res.status(403).json({ error: "Only the site owner can manage the team." }); return; }
  const token = serverToken();

  if (req.method === "GET") {
    const t = await readTeam();
    res.status(200).json({ owner: user.login, users: t.raw.map(login => ({ login })), tokenConfigured: !!token });
    return;
  }

  if (req.method === "PUT") {
    if (req.headers["x-admin"] !== "1") { res.status(400).json({ error: "Bad request." }); return; }
    if (!token) { res.status(400).json({ error: "Add GITHUB_TOKEN in Vercel first, so the team list can be saved." }); return; }
    const list = Array.isArray(req.body && req.body.users) ? req.body.users : null;
    if (!list || list.length > 50) { res.status(400).json({ error: "Bad request." }); return; }
    const seen = new Set(), users = [];
    for (const raw of list) {
      const login = String(raw && raw.login ? raw.login : raw).trim();
      if (!LOGIN.test(login)) { res.status(400).json({ error: `"${login}" is not a valid GitHub username.` }); return; }
      const key = login.toLowerCase();
      if (key === user.login.toLowerCase() || seen.has(key)) continue;
      seen.add(key); users.push({ login });
    }
    const current = await readTeam();
    const put = await gh(token, `/repos/${OWNER}/${REPO}/contents/${TEAM_PATH}`, {
      method: "PUT",
      body: JSON.stringify({
        message: `Update team via admin (${user.login})`,
        content: Buffer.from(JSON.stringify({ users }, null, 2) + "\n", "utf8").toString("base64"),
        sha: current.sha || undefined,
        branch: BRANCH
      })
    });
    if (!put.ok) { res.status(502).json({ error: "Could not save the team list.", detail: put.body && put.body.message }); return; }
    forgetTeam();
    res.status(200).json({ ok: true, users });
    return;
  }

  res.status(405).json({ error: "Method not allowed." });
};
