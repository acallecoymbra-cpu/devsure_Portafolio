'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { AdminApiError, getProfile, updateProfile } from '../api/admin-api';
import { SUPPORTED_LOCALES } from '../types';
import type { Profile, UpdateProfileInput } from '../types';
import { collectTranslatable } from '../lib/translatable-form';
import { LOCALE_LABELS, LocaleTabs } from './locale-tabs';
import styles from '../admin.module.css';

export function ProfileForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [profile, setProfile] = useState<Profile>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();
  const [activeLocales, setActiveLocales] = useState<string[]>(['en']);
  const [defaultLocale, setDefaultLocale] = useState('en');

  useEffect(() => {
    let active = true;
    getProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setActiveLocales(data.activeLocales);
        setDefaultLocale(data.defaultLocale);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof AdminApiError && error.status === 401) {
          router.replace('/admin/login');
          return;
        }
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!activeLocales.includes(defaultLocale)) setDefaultLocale(activeLocales[0]);
  }, [activeLocales, defaultLocale]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  function toggleLocale(locale: string, checked: boolean) {
    setDirty(true);
    setActiveLocales((current) => {
      if (checked) return current.includes(locale) ? current : [...current, locale];
      const next = current.filter((entry) => entry !== locale);
      return next.length > 0 ? next : current;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(undefined);
    const input = formDataToInput(new FormData(event.currentTarget), activeLocales, defaultLocale);

    try {
      const updated = await updateProfile(input);
      setProfile(updated);
      setDirty(false);
      setMessage({ kind: 'success', text: 'Perfil actualizado correctamente.' });
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      const text =
        error instanceof AdminApiError && error.status === 409
          ? 'Ese correo ya está en uso por otra cuenta.'
          : error instanceof AdminApiError && error.status === 400
            ? 'Revisa los campos: hay datos inválidos o el idioma por defecto no está entre los activos.'
            : 'No pudimos guardar los cambios. Inténtalo nuevamente.';
      setMessage({ kind: 'error', text });
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(':invalid')?.focus());
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className={styles.centerState} role="status" aria-live="polite">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Cargando perfil…</p>
      </div>
    );
  }

  if (status === 'error' || !profile) {
    return (
      <div className={styles.stateCard} role="alert">
        <h1>No pudimos cargar el perfil</h1>
        <p>Comprueba la conexión con el API e inténtalo nuevamente.</p>
        <button className={styles.primaryButton} type="button" onClick={() => location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <section aria-labelledby="profile-form-title">
      <div className={styles.pageHeading}>
        <div>
          <h1 id="profile-form-title">Profile</h1>
          <p className={styles.muted}>
            Identidad pública, biografía y locales activos del sitio.
          </p>
        </div>
        {dirty ? <span className={styles.dirtyBadge}>Cambios sin guardar</span> : null}
      </div>

      {message ? (
        <div
          className={message.kind === 'success' ? styles.alertSuccess : styles.alertError}
          role={message.kind === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </div>
      ) : null}

      <form ref={formRef} className={styles.editorCard} onSubmit={handleSubmit} onChange={() => setDirty(true)}>
        <fieldset disabled={submitting}>
          <legend>Identidad</legend>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Usuario</span>
              <input value={profile.username} readOnly disabled />
              <small>El usuario de acceso es inmutable.</small>
            </label>
            <label className={styles.field}>
              <span>Correo electrónico <em aria-hidden="true">*</em></span>
              <input name="email" type="email" defaultValue={profile.email} maxLength={254} required autoComplete="off" />
            </label>
            <label className={styles.field}>
              <span>Nombre <em aria-hidden="true">*</em></span>
              <input name="name" defaultValue={profile.name} maxLength={150} required autoComplete="off" />
              <small>Nombre corto usado en el título y la barra lateral.</small>
            </label>
            <label className={styles.field}>
              <span>Nombre completo</span>
              <input name="fullName" defaultValue={profile.fullName} maxLength={150} autoComplete="off" />
              <small>Solo en la sección About; si se deja vacío usa el nombre corto.</small>
            </label>
            <label className={`${styles.field} ${styles.fullField}`}>
              <span>Avatar (ruta relativa)</span>
              <input name="avatar" defaultValue={profile.avatar} maxLength={255} placeholder="avatars/eduardo.webp" autoComplete="off" />
              <small>La carga de archivos llega en una sesión futura; por ahora indica la ruta ya subida.</small>
            </label>
          </div>
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Headline</legend>
          <LocaleTabs idPrefix="headline" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Headline ({LOCALE_LABELS[locale] ?? locale})</span>
                <input
                  name={`headline.${locale}`}
                  defaultValue={profile.headline[locale] ?? ''}
                  maxLength={300}
                  autoComplete="off"
                />
              </label>
            )}
          </LocaleTabs>
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Bio</legend>
          <LocaleTabs idPrefix="bio" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Bio ({LOCALE_LABELS[locale] ?? locale})</span>
                <textarea name={`bio.${locale}`} defaultValue={profile.bio[locale] ?? ''} maxLength={5000} rows={6} />
              </label>
            )}
          </LocaleTabs>
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Currículum (ruta por idioma)</legend>
          <LocaleTabs idPrefix="resume" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>CV ({LOCALE_LABELS[locale] ?? locale})</span>
                <input
                  name={`resume.${locale}`}
                  defaultValue={profile.resume[locale] ?? ''}
                  maxLength={255}
                  placeholder="resumes/eduardo-en.pdf"
                  autoComplete="off"
                />
              </label>
            )}
          </LocaleTabs>
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Idiomas</legend>
          <div className={styles.formGrid}>
            {SUPPORTED_LOCALES.map((locale) => (
              <label key={locale} className={styles.checkField}>
                <input
                  type="checkbox"
                  checked={activeLocales.includes(locale)}
                  onChange={(event) => toggleLocale(locale, event.target.checked)}
                />
                <span>
                  <strong>{LOCALE_LABELS[locale] ?? locale}</strong>
                </span>
              </label>
            ))}
          </div>
          <label className={styles.field}>
            <span>Idioma por defecto</span>
            <select
              value={defaultLocale}
              onChange={(event) => {
                setDirty(true);
                setDefaultLocale(event.target.value);
              }}
            >
              {activeLocales.map((locale) => (
                <option key={locale} value={locale}>
                  {LOCALE_LABELS[locale] ?? locale}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        <div className={styles.formActions}>
          <button className={styles.primaryButton} type="submit" disabled={submitting || !dirty}>
            {submitting ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </section>
  );
}

function formDataToInput(
  data: FormData,
  activeLocales: string[],
  defaultLocale: string,
): Partial<UpdateProfileInput> {
  const fullName = String(data.get('fullName') ?? '').trim();
  const avatar = String(data.get('avatar') ?? '').trim();

  return {
    email: String(data.get('email') ?? '').trim(),
    name: String(data.get('name') ?? '').trim(),
    ...(fullName ? { fullName } : {}),
    ...(avatar ? { avatar } : {}),
    headline: collectTranslatable(data, 'headline', activeLocales),
    bio: collectTranslatable(data, 'bio', activeLocales),
    resume: collectTranslatable(data, 'resume', activeLocales),
    activeLocales,
    defaultLocale,
  };
}
