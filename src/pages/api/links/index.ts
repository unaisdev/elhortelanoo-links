import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';
import { isValidHttpUrl, json, requireAdmin } from '../../../lib/api';
import { createLink, getAllLinks } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const auth = await requireAdmin(context);
  if (auth.error) return auth.error;

  const links = await getAllLinks(auth.env.DB);
  return json({ links });
};

export const POST: APIRoute = async (context) => {
  const auth = await requireAdmin(context);
  if (auth.error) return auth.error;

  try {
    const body = (await context.request.json()) as {
      title?: string;
      url?: string;
      icon_url?: string;
    };

    const title = (body.title ?? '').trim();
    const url = (body.url ?? '').trim();
    const icon_url = (body.icon_url ?? '').trim();

    if (!title || !url) {
      return json({ error: 'Título y URL son obligatorios' }, 400);
    }
    if (!isValidHttpUrl(url)) {
      return json({ error: 'URL no válida' }, 400);
    }
    if (icon_url && !isValidHttpUrl(icon_url)) {
      return json({ error: 'URL de icono no válida' }, 400);
    }

    const link = await createLink(auth.env.DB, {
      id: nanoid(12),
      title,
      url,
      icon_url,
    });

    return json({ link }, 201);
  } catch (error) {
    console.error(error);
    return json({ error: 'Error interno' }, 500);
  }
};
