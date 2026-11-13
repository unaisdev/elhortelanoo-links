import type { APIContext } from 'astro';
import { getEnv } from './auth';
import { isAuthenticated } from './session';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function requireAdmin(context: APIContext) {
  const env = getEnv();
  const ok = await isAuthenticated(context.request, env.SESSION_SECRET);
  if (!ok) {
    return { env, error: json({ error: 'No autorizado' }, 401) };
  }
  return { env, error: null };
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
