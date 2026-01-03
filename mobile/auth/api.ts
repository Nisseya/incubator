const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("Missing EXPO_PUBLIC_API_URL in mobile/.env");
}

export type Tokens = { access_token: string; refresh_token: string; token_type: "bearer" };

export async function apiRegister(email: string, password: string) {
  const r = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!r.ok) throw new Error(await safeErr(r));
  return r.json();
}

export async function apiLogin(email: string, password: string): Promise<Tokens> {
  // FastAPI OAuth2PasswordRequestForm expects x-www-form-urlencoded with username/password
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);

  const r = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!r.ok) throw new Error(await safeErr(r));
  return r.json();
}

export async function apiGoogle(idToken: string): Promise<Tokens> {
  const r = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });

  if (!r.ok) throw new Error(await safeErr(r));
  return r.json();
}

export async function apiMe(accessToken: string) {
  const r = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!r.ok) throw new Error(await safeErr(r));
  return r.json();
}

export async function apiRefresh(refreshToken: string): Promise<Tokens> {
  const r = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!r.ok) throw new Error(await safeErr(r));
  return r.json();
}

async function safeErr(r: Response) {
  try {
    const j = await r.json();
    return j?.detail ? String(j.detail) : JSON.stringify(j);
  } catch {
    return await r.text();
  }
}
