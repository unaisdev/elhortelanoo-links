import type { APIRoute } from 'astro';
import {
  clearLoginAttempts,
  getEnv,
  isLoginLocked,
  registerFailedLogin,
  verifyPassword,
} from '../../../lib/auth';
import {
  buildSessionCookie,
  createSessionToken,
} from '../../../lib/session';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const env = getEnv();
    const locked = await isLoginLocked(env.DB);
    if (locked.locked) {
      return new Response(
        JSON.stringify({
          error: `Demasiados intentos. Espera ${locked.retryAfterSeconds}s.`,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const body = (await request.json()) as { password?: string };
    const password = body.password ?? '';

    const ok = await verifyPassword(password, env.ADMIN_PASSWORD_HASH);
    if (!ok) {
      await registerFailedLogin(env.DB);
      return new Response(JSON.stringify({ error: 'Contraseña incorrecta' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await clearLoginAttempts(env.DB);
    const token = await createSessionToken(env.SESSION_SECRET);
    const secure = new URL(request.url).protocol === 'https:';

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': buildSessionCookie(token, secure),
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
