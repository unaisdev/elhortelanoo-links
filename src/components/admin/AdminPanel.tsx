import { useMemo, useState, type FormEvent } from 'react';
import { resolveLinkIcon } from '../../lib/favicon';
import type { LinkItem, Profile } from '../../lib/types';

type Props = {
  initialProfile: Profile;
  initialLinks: LinkItem[];
};

export default function AdminPanel({ initialProfile, initialLinks }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [links, setLinks] = useState(initialLinks);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newIconUrl, setNewIconUrl] = useState('');

  const sortedLinks = useMemo(
    () => [...links].sort((a, b) => a.sort_order - b.sort_order),
    [links],
  );

  function flash(ok: string) {
    setMessage(ok);
    setError('');
    window.setTimeout(() => setMessage(''), 2500);
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          theme: profile.theme,
        }),
      });
      const data = (await res.json()) as { profile?: Profile; error?: string };
      if (!res.ok || !data.profile) {
        setError(data.error || 'No se pudo guardar el perfil');
        return;
      }
      setProfile(data.profile);
      flash('Perfil guardado');
    } catch {
      setError('Error de red al guardar el perfil');
    } finally {
      setBusy(false);
    }
  }

  async function addLink(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          url: newUrl,
          icon_url: newIconUrl,
        }),
      });
      const data = (await res.json()) as { link?: LinkItem; error?: string };
      if (!res.ok || !data.link) {
        setError(data.error || 'No se pudo crear el link');
        return;
      }
      setLinks((prev) => [...prev, data.link!]);
      setNewTitle('');
      setNewUrl('');
      setNewIconUrl('');
      flash('Link creado');
    } catch {
      setError('Error de red al crear el link');
    } finally {
      setBusy(false);
    }
  }

  async function patchLink(id: string, patch: Partial<LinkItem>) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as { link?: LinkItem; error?: string };
      if (!res.ok || !data.link) {
        setError(data.error || 'No se pudo actualizar el link');
        return;
      }
      setLinks((prev) => prev.map((l) => (l.id === id ? data.link! : l)));
      flash('Link actualizado');
    } catch {
      setError('Error de red al actualizar');
    } finally {
      setBusy(false);
    }
  }

  async function removeLink(id: string) {
    if (!window.confirm('¿Borrar este link?')) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || 'No se pudo borrar');
        return;
      }
      setLinks((prev) => prev.filter((l) => l.id !== id));
      flash('Link borrado');
    } catch {
      setError('Error de red al borrar');
    } finally {
      setBusy(false);
    }
  }

  async function moveLink(id: string, direction: -1 | 1) {
    const ordered = sortedLinks.map((l) => l.id);
    const index = ordered.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;

    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];

    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/links/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: next }),
      });
      const data = (await res.json()) as { links?: LinkItem[]; error?: string };
      if (!res.ok || !data.links) {
        setError(data.error || 'No se pudo reordenar');
        return;
      }
      setLinks(data.links);
    } catch {
      setError('Error de red al reordenar');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  return (
    <div className="admin">
      <div className="admin-top">
        <div>
          <p className="eyebrow">Panel de administración</p>
          <h1>elhortelanoo</h1>
        </div>
        <div className="top-actions">
          <a href="/" target="_blank" rel="noreferrer">
            Ver página
          </a>
          <button type="button" className="ghost" onClick={logout}>
            Salir
          </button>
        </div>
      </div>

      {message ? <p className="ok">{message}</p> : null}
      {error ? (
        <p className="err" role="alert">
          {error}
        </p>
      ) : null}

      <section className="card">
        <h2>Perfil</h2>
        <form className="grid" onSubmit={saveProfile}>
          <label>
            Nombre
            <input
              value={profile.display_name}
              onChange={(e) =>
                setProfile((p) => ({ ...p, display_name: e.target.value }))
              }
              required
            />
          </label>
          <label>
            Bio
            <textarea
              rows={3}
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
            />
          </label>
          <label>
            Avatar URL
            <input
              type="url"
              placeholder="https://..."
              value={profile.avatar_url}
              onChange={(e) =>
                setProfile((p) => ({ ...p, avatar_url: e.target.value }))
              }
            />
          </label>
          <button type="submit" disabled={busy}>
            Guardar perfil
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Nuevo link</h2>
        <form className="grid" onSubmit={addLink}>
          <label>
            Título
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
          </label>
          <label>
            URL
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://"
              required
            />
          </label>
          <label>
            Icono URL (opcional)
            <input
              type="url"
              value={newIconUrl}
              onChange={(e) => setNewIconUrl(e.target.value)}
              placeholder="Vacío = favicon automático de la URL"
            />
          </label>
          {newUrl ? (
            <div className="icon-preview">
              <img
                src={resolveLinkIcon(newIconUrl, newUrl)}
                alt=""
                width={28}
                height={28}
              />
              <span>
                {newIconUrl.trim()
                  ? 'Icono personalizado'
                  : 'Favicon automático del dominio'}
              </span>
            </div>
          ) : null}
          <button type="submit" disabled={busy}>
            Añadir link
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Links ({sortedLinks.length})</h2>
        <ul className="link-list">
          {sortedLinks.map((link, index) => {
            const preview = resolveLinkIcon(link.icon_url, link.url);
            return (
              <li key={link.id} className={!link.is_visible ? 'hidden-row' : ''}>
                <div className="link-row">
                  {preview ? (
                    <img className="thumb" src={preview} alt="" width={28} height={28} />
                  ) : (
                    <span className="thumb empty" />
                  )}
                  <div className="link-main">
                    <input
                      className="title"
                      value={link.title}
                      onChange={(e) =>
                        setLinks((prev) =>
                          prev.map((l) =>
                            l.id === link.id ? { ...l, title: e.target.value } : l,
                          ),
                        )
                      }
                      onBlur={(e) => {
                        void patchLink(link.id, { title: e.target.value });
                      }}
                    />
                    <input
                      className="url"
                      value={link.url}
                      onChange={(e) =>
                        setLinks((prev) =>
                          prev.map((l) =>
                            l.id === link.id ? { ...l, url: e.target.value } : l,
                          ),
                        )
                      }
                      onBlur={(e) => {
                        void patchLink(link.id, { url: e.target.value });
                      }}
                    />
                    <input
                      className="url"
                      value={link.icon_url}
                      placeholder="Icono URL (vacío = favicon auto)"
                      onChange={(e) =>
                        setLinks((prev) =>
                          prev.map((l) =>
                            l.id === link.id
                              ? { ...l, icon_url: e.target.value }
                              : l,
                          ),
                        )
                      }
                      onBlur={(e) => {
                        void patchLink(link.id, { icon_url: e.target.value });
                      }}
                    />
                  </div>
                </div>
                <div className="link-actions">
                  <button
                    type="button"
                    className="ghost"
                    disabled={busy || !link.icon_url}
                    onClick={() => patchLink(link.id, { icon_url: '' })}
                  >
                    Usar favicon auto
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    disabled={busy || index === 0}
                    onClick={() => moveLink(link.id, -1)}
                    aria-label="Subir"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    disabled={busy || index === sortedLinks.length - 1}
                    onClick={() => moveLink(link.id, 1)}
                    aria-label="Bajar"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    disabled={busy}
                    onClick={() =>
                      patchLink(link.id, { is_visible: link.is_visible ? 0 : 1 })
                    }
                  >
                    {link.is_visible ? 'Ocultar' : 'Mostrar'}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    disabled={busy}
                    onClick={() => removeLink(link.id)}
                  >
                    Borrar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <style>{`
        .admin {
          display: grid;
          gap: 1.25rem;
        }
        .admin-top {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: flex-start;
          flex-wrap: wrap;
        }
        .eyebrow {
          margin: 0 0 0.25rem;
          color: var(--accent);
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        h1 {
          margin: 0;
          font-size: 1.8rem;
          letter-spacing: -0.03em;
        }
        h2 {
          margin: 0 0 1rem;
          font-size: 1.15rem;
        }
        .top-actions {
          display: flex;
          gap: 0.6rem;
          align-items: center;
        }
        .top-actions a,
        .ghost,
        .danger,
        button {
          border-radius: 0.7rem;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.06);
          color: var(--text);
          padding: 0.55rem 0.8rem;
          cursor: pointer;
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .card button[type="submit"] {
          border: 0;
          background: var(--accent);
          color: #102016;
          font-weight: 700;
        }
        .danger {
          color: #ffd7d7;
          border-color: rgba(229, 115, 115, 0.4);
        }
        .card {
          border: 1px solid var(--border);
          border-radius: 1rem;
          padding: 1.1rem;
          background: rgba(255,255,255,0.04);
        }
        .grid {
          display: grid;
          gap: 0.8rem;
        }
        label {
          display: grid;
          gap: 0.35rem;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        input, textarea {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 0.7rem;
          background: rgba(0,0,0,0.28);
          color: var(--text);
          padding: 0.7rem 0.8rem;
        }
        .ok { margin: 0; color: var(--accent); }
        .err { margin: 0; color: var(--danger); }
        .icon-preview {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .icon-preview img,
        .thumb {
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 0.4rem;
          object-fit: contain;
          background: rgba(255,255,255,0.08);
        }
        .thumb.empty {
          display: inline-block;
        }
        .link-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.75rem;
        }
        .link-list li {
          display: grid;
          gap: 0.65rem;
          padding: 0.8rem;
          border-radius: 0.85rem;
          border: 1px solid var(--border);
          background: rgba(0,0,0,0.18);
        }
        .hidden-row {
          opacity: 0.55;
        }
        .link-row {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.75rem;
          align-items: start;
        }
        .link-main {
          display: grid;
          gap: 0.45rem;
        }
        .link-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .title { font-weight: 600; }
        .url { font-size: 0.9rem; color: var(--text-muted); }
      `}</style>
    </div>
  );
}
