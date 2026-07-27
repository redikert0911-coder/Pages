import { sql } from "~/db";

const crypto = await import("node:crypto");

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const verify = crypto
    .pbkdf2Sync(password, salt!, 10000, 64, "sha512")
    .toString("hex");
  return hash === verify;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Simple token store in DB — for MVP, we use a sessions table
// The token is stored in a cookie and looked up on each request.
const sessions = new Map<string, { userId: number; expiresAt: number }>();

export async function signup(
  email: string,
  password: string,
  name: string,
): Promise<{ token: string; userId: number } | { error: string }> {
  try {
    const db = sql();
    const existing = await db`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return { error: "Email already registered" };
    }
    const hash = hashPassword(password);
    const result = await db`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email}, ${hash}, ${name})
      RETURNING id
    `;
    const userId = result[0]!.id as number;
    const token = generateToken();
    sessions.set(token, { userId, expiresAt: Date.now() + 7 * 24 * 3600 * 1000 });
    return { token, userId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("DATABASE_URL")) throw err;
    return { error: msg };
  }
}

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; userId: number; name: string } | { error: string }> {
  try {
    const db = sql();
    const rows = await db`
      SELECT id, password_hash, name FROM users WHERE email = ${email}
    `;
    if (rows.length === 0) {
      return { error: "Invalid email or password" };
    }
    const user = rows[0]!;
    if (!verifyPassword(password, user.password_hash as string)) {
      return { error: "Invalid email or password" };
    }
    const token = generateToken();
    sessions.set(token, {
      userId: user.id as number,
      expiresAt: Date.now() + 7 * 24 * 3600 * 1000,
    });
    return { token, userId: user.id as number, name: user.name as string };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("DATABASE_URL")) throw err;
    return { error: msg };
  }
}

export function getSession(
  token: string,
): { userId: number } | null {
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return { userId: s.userId };
}

export function logout(token: string): void {
  sessions.delete(token);
}
