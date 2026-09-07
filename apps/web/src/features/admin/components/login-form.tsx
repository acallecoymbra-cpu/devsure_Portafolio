'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { AdminApiError, getSession, login } from '../api/admin-api';
import styles from '../admin.module.css';

export function LoginForm() {
  const router = useRouter();
  const usernameRef = useRef<HTMLInputElement>(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getSession()
      .then(() => router.replace('/admin/profile'))
      .catch(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const data = new FormData(event.currentTarget);
    try {
      await login(String(data.get('username') ?? ''), String(data.get('password') ?? ''));
      router.replace('/admin/profile');
      router.refresh();
    } catch (caught) {
      const message =
        caught instanceof AdminApiError && caught.status === 401
          ? 'El usuario o la contraseña no son correctos.'
          : 'No pudimos iniciar sesión. Revisa la conexión e inténtalo nuevamente.';
      setError(message);
      setSubmitting(false);
      requestAnimationFrame(() => usernameRef.current?.focus());
    }
  }

  if (checking) {
    return (
      <div className={styles.centerState} role="status" aria-live="polite">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Comprobando sesión…</p>
      </div>
    );
  }

  return (
    <section className={styles.loginCard} aria-labelledby="login-title">
      <div className={styles.brandMark} aria-hidden="true">
        DS
      </div>
      <p className={styles.eyebrow}>Administración DevSure</p>
      <h1 id="login-title">Accede al catálogo</h1>
      <p className={styles.muted}>Gestiona la información que se publica en el sitio.</p>

      {error ? (
        <div className={styles.alertError} role="alert">
          {error}
        </div>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>Usuario</span>
          <input
            ref={usernameRef}
            name="username"
            type="text"
            autoComplete="username"
            minLength={3}
            maxLength={32}
            required
            disabled={submitting}
          />
        </label>
        <label className={styles.field}>
          <span>Contraseña</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={8}
            required
            disabled={submitting}
          />
        </label>
        <button className={styles.primaryButton} type="submit" disabled={submitting}>
          {submitting ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </section>
  );
}
