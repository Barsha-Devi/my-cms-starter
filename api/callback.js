const { parseCookies, cookie, gh, roleFor } = require("./_lib");

// Step 2 of sign in. GitHub sends the browser back here with a code.
module.exports = async (req, res) => {
  const { code, state } = req.query;
  const saved = parseCookies(req).oauth_state;
  if (!code || !state || state !== saved) { res.status(400).send("Sign in failed. Please try again."); return; }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    })
  });
  const tokenBody = await tokenRes.json();
  if (!tokenBody.access_token) { res.status(400).send("GitHub did not approve the sign in."); return; }

  const user = await gh(tokenBody.access_token, "/user");
  const role = user.ok ? await roleFor(user.body.login) : null;
  if (!role) {
    res.status(403).send("This GitHub account is not on the team for this site. Ask the site owner to add your GitHub username.");
    return;
  }

  res.setHeader("Set-Cookie", [
    cookie("admin_token", tokenBody.access_token, 60 * 60 * 24 * 7),
    cookie("oauth_state", "", 0)
  ]);
  res.redirect(302, "/admin.html");
};
