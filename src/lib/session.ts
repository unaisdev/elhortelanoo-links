import { seal, unseal, defaults } from 'iron-webcrypto';
import { parseCookie, stringifySetCookie } from 'cookie';
import type { SessionData } from './types';

export const SESSION_COOKIE = 'eh_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function assertSecret(secret: string): string {
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters');
  }
  return secret;
}

export async function createSessionToken(
  secret: string,
  data: Omit<SessionData, 'exp'> = { admin: true },
): Promise<string> {
  const payload: SessionData = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  return seal(payload, assertSecret(secret), {
    ...defaults,
    ttl: SESSION_TTL_SECONDS * 1000,
  });
}

export async function readSessionToken(
  secret: string,
  token: string | undefined,
): Promise<SessionData | null> {
  if (!token) return null;

  try {
    const payload = (await unseal(token, assertSecret(secret), {
      ...defaults,
      ttl: SESSION_TTL_SECONDS * 1000,
    })) as SessionData;

    if (!payload?.admin || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieValue(request: Request): string | undefined {
  const header = request.headers.get('cookie');
  if (!header) return undefined;
  return parseCookie(header)[SESSION_COOKIE];
}

export function buildSessionCookie(token: string, secure: boolean): string {
  return stringifySetCookie({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(secure: boolean): string {
  return stringifySetCookie({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function isAuthenticated(
  request: Request,
  secret: string,
): Promise<boolean> {
  const token = getSessionCookieValue(request);
  const session = await readSessionToken(secret, token);
  return session?.admin === true;
}
