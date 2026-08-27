import { missingEnvError, supabaseFetch, getUserIdFromRequest } from "../_util.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Use GET" });
    return;
  }

  const envError = missingEnvError();
  if (envError) {
    res.status(500).json({ error: envError });
    return;
  }

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }

  try {
    const rows = await supabaseFetch(`users?id=eq.${encodeURIComponent(userId)}&select=id,full_name,email`);
    const user = rows[0];
    if (!user) {
      res.status(401).json({ error: "Not signed in." });
      return;
    }
    res.status(200).json({ user: { id: user.id, fullName: user.full_name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
}
