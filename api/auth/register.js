import { missingEnvError, supabaseFetch, hashPassword, setSessionCookie, isValidEmail } from "../_util.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  const envError = missingEnvError();
  if (envError) {
    res.status(500).json({ error: envError });
    return;
  }

  const { fullName, email, password } = req.body || {};
  if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
    res.status(400).json({ error: "Full name is required." });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existing = await supabaseFetch(`users?email=eq.${encodeURIComponent(normalizedEmail)}&select=id`);
    if (existing.length > 0) {
      res.status(409).json({ error: "An account with that email already exists." });
      return;
    }

    const inserted = await supabaseFetch("users", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        full_name: fullName.trim(),
        email: normalizedEmail,
        password_hash: hashPassword(password)
      })
    });

    const user = inserted[0];
    setSessionCookie(res, user.id);
    res.status(200).json({ user: { id: user.id, fullName: user.full_name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
}
