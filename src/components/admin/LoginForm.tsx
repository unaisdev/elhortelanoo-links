import { useState, type FormEvent } from 'react';

export default function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error || 'No se pudo iniciar sesión');
        return;
      }

      window.location.href = '/admin';
    } catch {
      setError('Error de red. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="login-form" onSubmit={onSubmit}>
      <label htmlFor="password">Contraseña de admin</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={1}
      />
      {error ? <p className="error" role="alert">{error}</p> : null}
      <button type="submit" disabled={loading}>
        {loading ? 'Entrando…' : 'Entrar'}
      </button>

      <style>{`
        .login-form {
          display: grid;
          gap: 0.85rem;
          width: min(100%, 22rem);
          margin: 0 auto;
          padding: 1.5rem;
          border: 1px solid var(--border);
          border-radius: 1rem;
          background: rgba(255, 255, 255, 0.04);
        }
        label {
          font-size: 0.95rem;
          color: var(--text-muted);
        }
        input {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          background: rgba(0, 0, 0, 0.25);
          color: var(--text);
          padding: 0.8rem 0.9rem;
        }
        input:focus {
          outline: 2px solid var(--accent);
          outline-offset: 1px;
        }
        button {
          border: 0;
          border-radius: 0.75rem;
          background: var(--accent);
          color: #102016;
          font-weight: 700;
          padding: 0.85rem 1rem;
          cursor: pointer;
        }
        button:disabled {
          opacity: 0.7;
          cursor: wait;
        }
        .error {
          margin: 0;
          color: var(--danger);
          font-size: 0.9rem;
        }
      `}</style>
    </form>
  );
}
