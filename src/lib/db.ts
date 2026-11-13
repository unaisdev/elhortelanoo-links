import type { LinkItem, Profile } from './types';

const LINK_COLUMNS =
  'id, title, url, icon_url, sort_order, is_visible, created_at, updated_at';

export async function getProfile(db: D1Database): Promise<Profile> {
  const row = await db
    .prepare('SELECT id, display_name, bio, avatar_url, theme FROM profile WHERE id = 1')
    .first<Profile>();

  if (!row) {
    return {
      id: 1,
      display_name: 'elhortelanoo',
      bio: '',
      avatar_url: '',
      theme: 'dark',
    };
  }

  return row;
}

export async function updateProfile(
  db: D1Database,
  data: Pick<Profile, 'display_name' | 'bio' | 'avatar_url' | 'theme'>,
): Promise<Profile> {
  await db
    .prepare(
      `UPDATE profile
       SET display_name = ?, bio = ?, avatar_url = ?, theme = ?
       WHERE id = 1`,
    )
    .bind(data.display_name, data.bio, data.avatar_url, data.theme)
    .run();

  return getProfile(db);
}

export async function getVisibleLinks(db: D1Database): Promise<LinkItem[]> {
  const { results } = await db
    .prepare(
      `SELECT ${LINK_COLUMNS}
       FROM links
       WHERE is_visible = 1
       ORDER BY sort_order ASC, created_at ASC`,
    )
    .all<LinkItem>();

  return results ?? [];
}

export async function getAllLinks(db: D1Database): Promise<LinkItem[]> {
  const { results } = await db
    .prepare(
      `SELECT ${LINK_COLUMNS}
       FROM links
       ORDER BY sort_order ASC, created_at ASC`,
    )
    .all<LinkItem>();

  return results ?? [];
}

export async function createLink(
  db: D1Database,
  data: { id: string; title: string; url: string; icon_url?: string },
): Promise<LinkItem> {
  const max = await db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM links')
    .first<{ max_order: number }>();

  const sortOrder = (max?.max_order ?? -1) + 1;
  const iconUrl = data.icon_url?.trim() ?? '';

  await db
    .prepare(
      `INSERT INTO links (id, title, url, icon_url, sort_order, is_visible)
       VALUES (?, ?, ?, ?, ?, 1)`,
    )
    .bind(data.id, data.title, data.url, iconUrl, sortOrder)
    .run();

  const link = await db
    .prepare(`SELECT ${LINK_COLUMNS} FROM links WHERE id = ?`)
    .bind(data.id)
    .first<LinkItem>();

  if (!link) throw new Error('Failed to create link');
  return link;
}

export async function updateLink(
  db: D1Database,
  id: string,
  data: Partial<Pick<LinkItem, 'title' | 'url' | 'icon_url' | 'is_visible' | 'sort_order'>>,
): Promise<LinkItem | null> {
  const current = await db
    .prepare(`SELECT ${LINK_COLUMNS} FROM links WHERE id = ?`)
    .bind(id)
    .first<LinkItem>();

  if (!current) return null;

  const title = data.title ?? current.title;
  const url = data.url ?? current.url;
  const iconUrl = data.icon_url !== undefined ? data.icon_url.trim() : current.icon_url;
  const isVisible = data.is_visible ?? current.is_visible;
  const sortOrder = data.sort_order ?? current.sort_order;

  await db
    .prepare(
      `UPDATE links
       SET title = ?, url = ?, icon_url = ?, is_visible = ?, sort_order = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(title, url, iconUrl, isVisible, sortOrder, id)
    .run();

  return db
    .prepare(`SELECT ${LINK_COLUMNS} FROM links WHERE id = ?`)
    .bind(id)
    .first<LinkItem>();
}

export async function deleteLink(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM links WHERE id = ?').bind(id).run();
  return (result.meta.changes ?? 0) > 0;
}

export async function reorderLinks(db: D1Database, orderedIds: string[]): Promise<void> {
  const statements = orderedIds.map((id, index) =>
    db
      .prepare(
        `UPDATE links SET sort_order = ?, updated_at = datetime('now') WHERE id = ?`,
      )
      .bind(index, id),
  );

  if (statements.length > 0) {
    await db.batch(statements);
  }
}
