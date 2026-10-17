const crypto = require("crypto");
const { cookie, configProblem } = require("./_lib");

// Step 1 of sign in. Sends the browser to GitHub to approve the login.
module.exports = (req, res) => {
  const problem = configProblem();
  if (problem) { res.status(500).send(problem); return; }
  const clientId = process.env.GITHUB_CLIENT_ID;
  const state = crypto.randomBytes(16).toString("hex");
  res.setHeader("Set-Cookie", cookie("oauth_state", state, 600));
  const url = "https://github.com/login/oauth/authorize?" + new URLSearchParams({
    client_id: clientId,
    // With GITHUB_TOKEN set, people only prove who they are. Without it, the owner signs in with repo access.
    scope: process.env.GITHUB_TOKEN ? "read:user" : "repo",
    state,
    allow_signup: "false"
  });
  res.redirect(302, url);
};
