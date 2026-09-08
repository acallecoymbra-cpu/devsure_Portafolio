'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import {
  AdminApiError,
  changePassword,
  getSession,
  logout,
} from '../api/admin-api';
import type { AdminUser } from '../types';
import styles from '../admin.module.css';

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const firstNavRef = useRef<HTMLAnchorElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [user, setUser] = useState<AdminUser>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'forbidden' | 'error'>('loading');
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    getSession()
      .then(({ user: currentUser }) => {
        if (!active) return;
        if (currentUser.role !== 'ADMIN') {
          setStatus('forbidden');
          return;
        }
        setUser(currentUser);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof AdminApiError && error.status === 401) {
          router.replace('/admin/login');
          return;
        }
        setStatus(error instanceof AdminApiError && error.status === 403 ? 'forbidden' : 'error');
      });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) firstNavRef.current?.focus();
  }, [menuOpen]);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError('');
    try {
      await logout();
      router.replace('/admin/login');
      router.refresh();
    } catch {
      setLogoutError('No pudimos cerrar la sesión. Inténtalo nuevamente.');
    } finally {
      setLoggingOut(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className={styles.centerState} role="status" aria-live="polite">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Cargando espacio de administración…</p>
      </div>
    );
  }

  if (status === 'forbidden') {
    return (
      <section className={styles.stateCard} role="alert">
        <p className={styles.eyebrow}>Acceso restringido</p>
        <h1>No tienes permiso para administrar el catálogo</h1>
        <p>Solicita acceso a una persona administradora o entra con otra cuenta.</p>
        {logoutError ? <p role="alert">{logoutError}</p> : null}
        <button className={styles.secondaryButton} type="button" disabled={loggingOut} onClick={handleLogout}>
          Usar otra cuenta
        </button>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className={styles.stateCard} role="alert">
        <h1>No pudimos validar tu sesión</h1>
        <p>Comprueba que el API esté disponible e inténtalo nuevamente.</p>
        <button className={styles.primaryButton} type="button" onClick={() => location.reload()}>
          Reintentar
        </button>
      </section>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} data-open={menuOpen}>
        <div className={styles.sidebarBrand}>
          <span className={styles.brandMark} aria-hidden="true">
            DS
          </span>
          <span>
            <strong>DevSure</strong>
            <small>Administración</small>
          </span>
        </div>
        <nav
          className={styles.adminNav}
          aria-label="Navegación administrativa"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setMenuOpen(false);
              menuButtonRef.current?.focus();
            }
          }}
        >
          <Link
            ref={firstNavRef}
            href="/admin/profile"
            aria-current={pathname.startsWith('/admin/profile') ? 'page' : undefined}
          >
            <span aria-hidden="true">◐</span>
            Profile
          </Link>
          <Link
            href="/admin/translations"
            aria-current={pathname.startsWith('/admin/translations') ? 'page' : undefined}
          >
            <span aria-hidden="true">✎</span>
            Translations
          </Link>
          <Link
            href="/admin/experiences"
            aria-current={pathname.startsWith('/admin/experiences') ? 'page' : undefined}
          >
            <span aria-hidden="true">🧭</span>
            Experiencias
          </Link>
          <Link
            href="/admin/projects"
            aria-current={pathname.startsWith('/admin/projects') ? 'page' : undefined}
          >
            <span aria-hidden="true">▣</span>
            Proyectos
          </Link>
          <Link
            href="/admin/studies"
            aria-current={pathname.startsWith('/admin/studies') ? 'page' : undefined}
          >
            <span aria-hidden="true">🎓</span>
            Educación
          </Link>
          <Link
            href="/admin/services"
            aria-current={pathname.startsWith('/admin/services') ? 'page' : undefined}
          >
            <span aria-hidden="true">⚙</span>
            Servicios
          </Link>
          <Link
            href="/admin/strengths"
            aria-current={pathname.startsWith('/admin/strengths') ? 'page' : undefined}
          >
            <span aria-hidden="true">★</span>
            Fortalezas
          </Link>
          <Link
            href="/admin/work-style-items"
            aria-current={pathname.startsWith('/admin/work-style-items') ? 'page' : undefined}
          >
            <span aria-hidden="true">☰</span>
            Estilo de trabajo
          </Link>
          <Link
            href="/admin/faqs"
            aria-current={pathname.startsWith('/admin/faqs') ? 'page' : undefined}
          >
            <span aria-hidden="true">?</span>
            Preguntas frecuentes
          </Link>
          <Link
            href="/admin/testimonials"
            aria-current={pathname.startsWith('/admin/testimonials') ? 'page' : undefined}
          >
            <span aria-hidden="true">❝</span>
            Testimonios
          </Link>
          <Link
            href="/admin/technologies"
            aria-current={pathname.startsWith('/admin/technologies') ? 'page' : undefined}
          >
            <span aria-hidden="true">⌘</span>
            Tecnologías
          </Link>
        </nav>
        <div className={styles.sidebarAccount}>
          <span title={user?.email}>{user?.username}</span>
          <button type="button" onClick={() => setPasswordOpen(true)}>
            Cambiar contraseña
          </button>
          <button type="button" disabled={loggingOut} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {menuOpen ? (
        <button
          className={styles.backdrop}
          type="button"
          aria-label="Cerrar navegación"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <button
            ref={menuButtonRef}
            className={styles.menuButton}
            type="button"
            aria-label="Menú administrativo"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">☰</span>
          </button>
          <p>Catálogo tecnológico</p>
          <a href="/" target="_blank" rel="noreferrer">
            Ver sitio <span aria-hidden="true">↗</span>
          </a>
        </header>
        <div className={styles.content}>
          {logoutError ? <p className={styles.alertError} role="alert">{logoutError}</p> : null}
          {user?.mustChangePassword ? (
            <section className={styles.stateCard}>
              <h1>Actualiza tu contraseña para continuar</h1>
              <p>El primer acceso requiere que elijas una contraseña personal.</p>
            </section>
          ) : children}
        </div>
      </div>

      {passwordOpen || user?.mustChangePassword ? (
        <PasswordDialog
          required={Boolean(user?.mustChangePassword)}
          onClose={() => setPasswordOpen(false)}
          onChanged={(updatedUser) => { setUser(updatedUser); setPasswordOpen(true); }}
        />
      ) : null}
    </div>
  );
}

function PasswordDialog({ onClose, onChanged, required }: { onClose: () => void; onChanged: (user: AdminUser) => void; required: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const next = String(data.get('newPassword') ?? '');
    const confirmation = String(data.get('confirmation') ?? '');
    if (next !== confirmation) {
      setMessage({ kind: 'error', text: 'La confirmación no coincide con la nueva contraseña.' });
      return;
    }

    setSubmitting(true);
    setMessage(undefined);
    try {
      const session = await changePassword(String(data.get('currentPassword') ?? ''), next);
      form.reset();
      onChanged(session.user);
      setMessage({ kind: 'success', text: 'Contraseña actualizada correctamente.' });
    } catch (error) {
      setMessage({
        kind: 'error',
        text:
          error instanceof AdminApiError && error.status === 401
            ? 'La contraseña actual no es correcta.'
            : 'No pudimos actualizar la contraseña.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="password-dialog-title"
      onClose={onClose}
      onCancel={(event) => { if (required || submitting) event.preventDefault(); else onClose(); }}
    >
      <div className={styles.dialogHeading}>
        <div>
          <p className={styles.eyebrow}>Seguridad</p>
          <h2 id="password-dialog-title">Cambiar contraseña</h2>
        </div>
        <button type="button" disabled={required || submitting} aria-label="Cerrar" onClick={() => dialogRef.current?.close()}>
          ×
        </button>
      </div>
      {message ? (
        <div
          className={message.kind === 'success' ? styles.alertSuccess : styles.alertError}
          role={message.kind === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </div>
      ) : null}
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>Contraseña actual</span>
          <input name="currentPassword" type="password" autoComplete="current-password" required />
        </label>
        <label className={styles.field}>
          <span>Nueva contraseña</span>
          <input name="newPassword" type="password" autoComplete="new-password" minLength={12} required />
        </label>
        <label className={styles.field}>
          <span>Confirmar nueva contraseña</span>
          <input name="confirmation" type="password" autoComplete="new-password" minLength={12} required />
        </label>
        <div className={styles.formActions}>
          <button className={styles.secondaryButton} disabled={required || submitting} type="button" onClick={() => dialogRef.current?.close()}>
            Cancelar
          </button>
          <button className={styles.primaryButton} type="submit" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
