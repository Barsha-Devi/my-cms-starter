const { currentUser } = require("./_lib");

// Contact form. Messages are emailed to you through Resend. The settings live in your hosting settings, never in the code.
//   RESEND_API_KEY   your Resend API key
//   CONTACT_TO       the email address that should receive messages
//   CONTACT_FROM     optional. Defaults to Resend's shared sender, which needs no domain
//
// GET  /api/contact          tells the page whether sending is switched on
// POST /api/contact          sends a visitor's message
// POST /api/contact {test}   sends a test email to you (only when signed in to the admin)

const TOPICS = { idea: "I have an idea", work: "Let's work together", ask: "A marketing question", photo: "About a photo", hello: "Just saying hi" };
const hits = new Map(); // a soft limit per visitor. A serverless instance forgets it after a while, which is fine for a small site

const configured = () => Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO);
const clean = (s, max) => String(s == null ? "" : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
const oneLine = (s, max) => clean(s, max).replace(/\s+/g, " ");

async function sendEmail({ subject, text, replyTo }) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || "Site contact <onboarding@resend.dev>",
      to: [process.env.CONTACT_TO],
      subject, text,
      ...(replyTo ? { reply_to: replyTo } : {})
    })
  });
  let body = null; try { body = await r.json(); } catch {}
  return { ok: r.ok, status: r.status, body };
}

module.exports = async (req, res) => {
  if (req.method === "GET") { res.status(200).json({ enabled: configured() }); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed." }); return; }

  // Only messages sent from this site itself are accepted
  const origin = req.headers.origin;
  if (origin) { try { if (new URL(origin).host !== req.headers.host) { res.status(403).json({ error: "Not allowed." }); return; } } catch { res.status(403).json({ error: "Not allowed." }); return; } }

  const body = req.body || {};

  if (body.test === true) {
    const user = await currentUser(req);
    if (!user) { res.status(401).json({ error: "Please sign in to the admin first." }); return; }
    if (!configured()) { res.status(400).json({ error: "Sending is not set up yet. Add RESEND_API_KEY and CONTACT_TO in your hosting settings, then redeploy." }); return; }
    const r = await sendEmail({ subject: "Test from your site", text: `This is a test sent from your site's admin by ${user.login}.\n\nIf you can read this, your contact form can deliver messages to you.` });
    if (r.ok) { res.status(200).json({ ok: true }); return; }
    console.error("contact: test email failed", r.status, r.body && r.body.message);
    res.status(502).json({ error: "Resend would not send the test email.", detail: r.body && r.body.message });
    return;
  }

  if (!configured()) { res.status(503).json({ error: "Messages cannot be sent from this page right now." }); return; }

  // Spam traps. A hidden field that only robots fill in, and a form that was sent faster than a person can type
  if (clean(body.company, 200)) { res.status(200).json({ ok: true }); return; }
  if (!(Number(body.elapsed) >= 2500)) { res.status(400).json({ error: "Please take a moment and try again." }); return; }

  const name = oneLine(body.name, 100), email = oneLine(body.email, 200), message = clean(body.message, 5000);
  const topic = TOPICS[body.topic] ? body.topic : "hello";
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) { res.status(400).json({ error: "Please fill in your name, a valid email address and a message." }); return; }

  // A few messages per visitor, then a pause. Only valid messages count, so a typo never uses one up
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown", now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
  if (recent.length >= 3) { res.status(429).json({ error: "You have sent a few messages already. Please try again a little later." }); return; }
  recent.push(now); hits.set(ip, recent);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some(t => now - t < 10 * 60 * 1000)) hits.delete(k);

  const r = await sendEmail({
    subject: oneLine(`New message from ${name} (${TOPICS[topic]})`, 150),
    text: `From: ${name} <${email}>\nAbout: ${TOPICS[topic]}\n\n${message}\n\n---\nSent from the contact form on your site. Reply to this email to answer ${name}.`,
    replyTo: email
  });
  if (r.ok) { res.status(200).json({ ok: true }); return; }
  console.error("contact: message not sent", r.status, r.body && r.body.message);
  res.status(502).json({ error: "That did not go through. Please try again in a moment." });
};
