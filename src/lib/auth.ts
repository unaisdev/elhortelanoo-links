import { env } from 'cloudflare:workers';
import bcrypt from 'bcryptjs';

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export async function isLoginLocked(db: D1Database): Promise<{
  locked: boolean;
  retryAfterSeconds?: number;
}> {
  const row = await db
    .prepare('SELECT fail_count, locked_until FROM login_attempts WHERE id = 1')
    .first<{ fail_count: number; locked_until: string | null }>();

  if (!row?.locked_until) {
    return { locked: false };
  }

  const lockedUntil = Date.parse(row.locked_until + 'Z');
  const now = Date.now();

  if (Number.isNaN(lockedUntil) || lockedUntil <= now) {
    await db
      .prepare(
        `UPDATE login_attempts SET fail_count = 0, locked_until = NULL WHERE id = 1`,
      )
      .run();
    return { locked: false };
  }

  return {
    locked: true,
    retryAfterSeconds: Math.ceil((lockedUntil - now) / 1000),
  };
}

export async function registerFailedLogin(db: D1Database): Promise<void> {
  const row = await db
    .prepare('SELECT fail_count FROM login_attempts WHERE id = 1')
    .first<{ fail_count: number }>();

  const next = (row?.fail_count ?? 0) + 1;

  if (next >= MAX_FAILS) {
    await db
      .prepare(
        `UPDATE login_attempts
         SET fail_count = ?, locked_until = datetime('now', '+' || ? || ' minutes')
         WHERE id = 1`,
      )
      .bind(next, LOCK_MINUTES)
      .run();
    return;
  }

  await db
    .prepare(`UPDATE login_attempts SET fail_count = ? WHERE id = 1`)
    .bind(next)
    .run();
}

export async function clearLoginAttempts(db: D1Database): Promise<void> {
  await db
    .prepare(
      `UPDATE login_attempts SET fail_count = 0, locked_until = NULL WHERE id = 1`,
    )
    .run();
}

export function getEnv(): Env {
  if (!env?.DB) {
    throw new Error('D1 binding DB is not configured');
  }
  return env as Env;
}
