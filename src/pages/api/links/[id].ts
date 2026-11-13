import type { APIRoute } from 'astro';
import { isValidHttpUrl, json, requireAdmin } from '../../../lib/api';
import { deleteLink, updateLink } from '../../../lib/db';

export const prerender = false;

export const PATCH: APIRoute = async (context) => {
  const auth = await requireAdmin(context);
  if (auth.error) return auth.error;

  const id = context.params.id;
  if (!id) return json({ error: 'ID requerido' }, 400);

  try {
    const body = (await context.request.json()) as {
      title?: string;
      url?: string;
      icon_url?: string;
      is_visible?: number;
      sort_order?: number;
    };

    if (body.url !== undefined && !isValidHttpUrl(body.url)) {
      return json({ error: 'URL no válida' }, 400);
    }

    if (body.title !== undefined && !body.title.trim()) {
      return json({ error: 'El título no puede estar vacío' }, 400);
    }

    if (
      body.icon_url !== undefined &&
      body.icon_url.trim() !== '' &&
      !isValidHttpUrl(body.icon_url.trim())
    ) {
      return json({ error: 'URL de icono no válida' }, 400);
    }

    const link = await updateLink(auth.env.DB, id, {
      title: body.title?.trim(),
      url: body.url?.trim(),
      icon_url: body.icon_url !== undefined ? body.icon_url.trim() : undefined,
      is_visible: body.is_visible,
      sort_order: body.sort_order,
    });

    if (!link) return json({ error: 'Link no encontrado' }, 404);
    return json({ link });
  } catch (error) {
    console.error(error);
    return json({ error: 'Error interno' }, 500);
  }
};

export const DELETE: APIRoute = async (context) => {
  const auth = await requireAdmin(context);
  if (auth.error) return auth.error;

  const id = context.params.id;
  if (!id) return json({ error: 'ID requerido' }, 400);

  const deleted = await deleteLink(auth.env.DB, id);
  if (!deleted) return json({ error: 'Link no encontrado' }, 404);
  return json({ ok: true });
};
