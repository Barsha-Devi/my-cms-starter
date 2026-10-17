const { OWNER, REPO, BRANCH, gh, currentUser, apiToken } = require("./_lib");

const FILES = ["photos", "writing", "quotes", "site", "pages"];
const IMAGE_PATH = /^img\/[a-z0-9][a-z0-9._-]*\.(jpg|jpeg|png|webp|svg)$/;

// SVG logos are allowed, but only plain drawings. Anything that could run code is refused.
function svgOk(b64) {
  try {
    const t = Buffer.from(b64, "base64").toString("utf8");
    return t.length < 300000 && /<svg[\s>]/i.test(t) && !/<script|\son[a-z]+\s*=|javascript:|<foreignObject|<iframe|<!ENTITY|<embed|<object/i.test(t);
  } catch { return false; }
}

// GET  /api/content?file=photos   reads the latest list straight from GitHub
// PUT  /api/content               saves a list (and any new images) back to GitHub
module.exports = async (req, res) => {
  const user = await currentUser(req);
  if (!user) { res.status(401).json({ error: "Please sign in again." }); return; }
  const token = apiToken(user);
  if (!token) { res.status(500).json({ error: "Saving is not set up yet. The site owner needs to add GITHUB_TOKEN in Vercel." }); return; }

  if (req.method === "GET") {
    const file = req.query.file;
    if (!FILES.includes(file)) { res.status(400).json({ error: "Unknown file." }); return; }
    const r = await gh(token, `/repos/${OWNER}/${REPO}/contents/content/${file}.json?ref=${BRANCH}`);
    if (!r.ok) { res.status(502).json({ error: "Could not read from GitHub.", detail: r.body && r.body.message }); return; }
    const data = JSON.parse(Buffer.from(r.body.content, "base64").toString("utf8"));
    res.status(200).json({ data, sha: r.body.sha });
    return;
  }

  if (req.method === "PUT") {
    if (req.headers["x-admin"] !== "1") { res.status(400).json({ error: "Bad request." }); return; }
    const { file, data, sha, images = [] } = req.body || {};
    if (!FILES.includes(file) || !data || typeof data !== "object" || !sha) { res.status(400).json({ error: "Bad request." }); return; }

    for (const img of images) {
      if (!IMAGE_PATH.test(img.path) || typeof img.base64 !== "string" || (img.path.endsWith(".svg") && !svgOk(img.base64))) {
        res.status(400).json({ error: "Bad image." }); return;
      }
      const up = await gh(token, `/repos/${OWNER}/${REPO}/contents/${img.path}`, {
        method: "PUT",
        body: JSON.stringify({ message: `Add ${img.path} via admin (${user.login})`, content: img.base64, branch: BRANCH })
      });
      // 422 means the file already exists, which is fine because names are unique.
      if (!up.ok && up.status !== 422) {
        res.status(502).json({ error: "Could not upload an image.", detail: up.body && up.body.message }); return;
      }
    }

    const put = await gh(token, `/repos/${OWNER}/${REPO}/contents/content/${file}.json`, {
      method: "PUT",
      body: JSON.stringify({
        message: `Update ${file} via admin (${user.login})`,
        content: Buffer.from(JSON.stringify(data, null, 2) + "\n", "utf8").toString("base64"),
        sha,
        branch: BRANCH
      })
    });
    if (!put.ok) {
      const conflict = put.status === 409 || put.status === 422;
      res.status(conflict ? 409 : 502).json({
        error: conflict ? "This list changed on GitHub since you opened it. Reload the page and try again." : "Could not save to GitHub.",
        detail: put.body && put.body.message
      });
      return;
    }
    res.status(200).json({ ok: true, sha: put.body.content.sha });
    return;
  }

  res.status(405).json({ error: "Method not allowed." });
};
