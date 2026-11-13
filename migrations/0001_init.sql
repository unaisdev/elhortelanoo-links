CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  display_name TEXT NOT NULL DEFAULT 'elhortelanoo',
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  theme TEXT NOT NULL DEFAULT 'dark'
);

CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  fail_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT
);

INSERT OR IGNORE INTO profile (id, display_name, bio, avatar_url, theme)
VALUES (
  1,
  'elhortelanoo',
  'Huerta, contenido y más. Todo en un solo enlace.',
  '',
  'dark'
);

INSERT OR IGNORE INTO links (id, title, url, sort_order, is_visible)
VALUES
  ('seed_ig', 'Instagram', 'https://instagram.com/elhortelanoo', 0, 1),
  ('seed_yt', 'YouTube', 'https://youtube.com/@elhortelanoo', 1, 1),
  ('seed_web', 'Tienda / web', 'https://elhortelanoo.com', 2, 1);

INSERT OR IGNORE INTO login_attempts (id, fail_count, locked_until)
VALUES (1, 0, NULL);
