'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace('/admin');
        router.refresh();
        return;
      }
      setError(res.status === 401 ? 'Clave incorrecta.' : 'No se pudo iniciar sesión. Intenta de nuevo.');
    } catch {
      setError('No se pudo conectar. Intenta de nuevo.');
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl bg-surface-container-lowest p-space-xl shadow-sm">
      <h1 className="mb-space-md font-headline-md text-headline-md text-on-surface">Administración</h1>
      <label htmlFor="password" className="mb-space-xs block font-label-lg text-label-lg text-on-surface-variant">
        Clave de acceso
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-space-sm w-full rounded-lg border border-outline-variant bg-surface px-space-sm py-space-xs text-on-surface"
      />
      {error && (
        <p role="alert" className="mb-space-sm text-primary">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-primary-container px-space-xl py-space-sm font-label-lg text-label-lg text-on-primary hover:bg-primary disabled:opacity-60"
      >
        {busy ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}
