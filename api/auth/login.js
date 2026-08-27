import { missingEnvError, supabaseFetch, verifyPassword, setSessionCookie, isValidEmail } from "../_util.js";

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

  const { email, password } = req.body || {};
  if (!isValidEmail(email) || !password) {
    res.status(400).json({ error: "Enter your email and password." });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const rows = await supabaseFetch(`users?email=eq.${encodeURIComponent(normalizedEmail)}&select=id,full_name,email,password_hash`);
    const user = rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    setSessionCookie(res, user.id);
    res.status(200).json({ user: { id: user.id, fullName: user.full_name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
}
