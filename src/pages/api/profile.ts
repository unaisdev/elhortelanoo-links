import type { APIRoute } from 'astro';
import { json, requireAdmin } from '../../lib/api';
import { updateProfile } from '../../lib/db';

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  const auth = await requireAdmin(context);
  if (auth.error) return auth.error;

  try {
    const body = (await context.request.json()) as {
      display_name?: string;
      bio?: string;
      avatar_url?: string;
      theme?: string;
    };

    const display_name = (body.display_name ?? '').trim();
    if (!display_name) {
      return json({ error: 'El nombre es obligatorio' }, 400);
    }

    const profile = await updateProfile(auth.env.DB, {
      display_name,
      bio: (body.bio ?? '').trim(),
      avatar_url: (body.avatar_url ?? '').trim(),
      theme: body.theme === 'light' ? 'light' : 'dark',
    });

    return json({ profile });
  } catch (error) {
    console.error(error);
    return json({ error: 'Error interno' }, 500);
  }
};
