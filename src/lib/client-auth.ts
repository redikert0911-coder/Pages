// Client-side auth helpers
const TOKEN_KEY = "pp_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function isSignedIn(): boolean {
  return getToken() !== null;
}

// Get user info from stored data
const USER_KEY = "pp_user";

export function getUserInfo(): { name: string; email: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUserInfo(info: { name: string; email: string }): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(info));
}

export function clearUserInfo(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
}
