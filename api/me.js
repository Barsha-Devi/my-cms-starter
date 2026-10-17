const { currentUser, cookie } = require("./_lib");

// Tells the admin page whether you are signed in. POST signs you out.
module.exports = async (req, res) => {
  if (req.method === "POST") {
    res.setHeader("Set-Cookie", cookie("admin_token", "", 0));
    res.status(200).json({ ok: true });
    return;
  }
  const user = await currentUser(req);
  res.status(user ? 200 : 401).json(user ? { login: user.login, role: user.role } : { error: "not signed in" });
};
