import type { APIRoute } from 'astro';
import { json, requireAdmin } from '../../../lib/api';
import { getAllLinks, reorderLinks } from '../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const auth = await requireAdmin(context);
  if (auth.error) return auth.error;

  try {
    const body = (await context.request.json()) as { orderedIds?: string[] };
    const orderedIds = body.orderedIds;

    if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== 'string')) {
      return json({ error: 'orderedIds inválido' }, 400);
    }

    await reorderLinks(auth.env.DB, orderedIds);
    const links = await getAllLinks(auth.env.DB);
    return json({ links });
  } catch (error) {
    console.error(error);
    return json({ error: 'Error interno' }, 500);
  }
};
