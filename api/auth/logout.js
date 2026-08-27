import { clearSessionCookie } from "../_util.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}
