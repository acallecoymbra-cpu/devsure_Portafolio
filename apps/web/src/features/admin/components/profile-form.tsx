'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { AdminApiError, getProfile, updateProfile } from '../api/admin-api';
import { SUPPORTED_LOCALES } from '../types';
import type { Profile, ProfileStat, UpdateProfileInput } from '../types';
import { collectTranslatable } from '../lib/translatable-form';
import { FileUploadField } from './file-upload-field';
import { LOCALE_LABELS, LocaleTabs } from './locale-tabs';
import { RepeaterField } from './repeater-field';
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
  const [stats, setStats] = useState<ProfileStat[]>([]);

  useEffect(() => {
    let active = true;
    getProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setActiveLocales(data.activeLocales);
        setDefaultLocale(data.defaultLocale);
        setStats(data.stats);
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
    const input = formDataToInput(new FormData(event.currentTarget), activeLocales, defaultLocale, stats);

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
            <div className={styles.fullField}>
              <FileUploadField
                label="Avatar"
                folder="avatars"
                accept="image/png,image/jpeg,image/webp"
                hiddenName="avatar"
                value={profile.avatar}
                helpText="PNG, JPEG o WEBP, hasta 2 MB."
              />
            </div>
            <div className={styles.fullField}>
              <FileUploadField
                label="Icono del sitio"
                folder="site-logo"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                hiddenName="logo"
                value={profile.logo}
                helpText="PNG, JPEG, WEBP o SVG, hasta 1 MB. El símbolo/marca (ej. la 'D'). Se usa en el header y en el footer; mientras no se suba, se muestra el isotipo 'DS'."
              />
            </div>
            <div className={styles.fullField}>
              <FileUploadField
                label="Logo — texto &quot;DevSure&quot; (imagen)"
                folder="site-logo"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                hiddenName="logoWordmark"
                value={profile.logoWordmark}
                helpText="PNG, JPEG, WEBP o SVG, hasta 1 MB. Idealmente con fondo transparente. Va al lado del icono; mientras no se suba, se muestra el texto 'DevSure'."
              />
            </div>
            <div className={styles.fullField}>
              <FileUploadField
                label="Visual del hero (imagen)"
                folder="hero-visual"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                hiddenName="heroVisual"
                value={profile.heroVisual}
                helpText="PNG, JPEG, WEBP o SVG, hasta 4 MB. Ilustración decorativa junto al título de la home; mientras no se suba, se muestra el orbe animado."
              />
            </div>
          </div>
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Contacto (footer)</legend>
          <p className={styles.muted}>
            Teléfono, dirección, horarios y redes que se muestran en la tercera columna del footer.
          </p>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Teléfono</span>
              <input name="phone" defaultValue={profile.phone} maxLength={40} autoComplete="off" />
            </label>
            <label className={styles.field}>
              <span>Dirección</span>
              <input name="address" defaultValue={profile.address} maxLength={255} autoComplete="off" />
            </label>
            <label className={styles.field}>
              <span>Horarios de atención</span>
              <input name="businessHours" defaultValue={profile.businessHours} maxLength={255} autoComplete="off" />
            </label>
            <label className={styles.field}>
              <span>Facebook (URL)</span>
              <input name="facebookUrl" type="url" defaultValue={profile.facebookUrl} maxLength={255} autoComplete="off" />
            </label>
            <label className={styles.field}>
              <span>LinkedIn (URL)</span>
              <input name="linkedinUrl" type="url" defaultValue={profile.linkedinUrl} maxLength={255} autoComplete="off" />
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
          <legend>Currículum (por idioma)</legend>
          <LocaleTabs idPrefix="resume" locales={activeLocales}>
            {(locale) => (
              <FileUploadField
                label={`CV (${LOCALE_LABELS[locale] ?? locale})`}
                folder="resumes"
                accept="application/pdf"
                hiddenName={`resume.${locale}`}
                value={profile.resume[locale]}
                helpText="PDF, hasta 5 MB."
              />
            )}
          </LocaleTabs>
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Métricas (sección "Nosotros")</legend>
          <p className={styles.muted}>
            Franja de números bajo el "Quiénes somos" de la home (ej. años en el mercado, proyectos entregados).
          </p>
          <RepeaterField<ProfileStat>
            items={stats}
            onChange={(next) => { setDirty(true); setStats(next); }}
            createItem={() => ({ value: 0, suffix: '', label: {} })}
            addLabel="Agregar métrica"
            itemLabel={(item) => item.label[defaultLocale] || item.label[activeLocales[0]] || 'Nueva métrica'}
            emptyText="Aún no hay métricas configuradas."
            renderItem={(item, index, update) => (
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Valor <em aria-hidden="true">*</em></span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={item.value}
                    onChange={(event) => update({ value: Number(event.target.value) })}
                  />
                </label>
                <label className={styles.field}>
                  <span>Sufijo</span>
                  <input
                    value={item.suffix ?? ''}
                    maxLength={8}
                    placeholder="+"
                    onChange={(event) => update({ suffix: event.target.value })}
                  />
                </label>
                <div className={styles.fullField}>
                  <LocaleTabs idPrefix={`stat-${index}-label`} locales={activeLocales}>
                    {(locale) => (
                      <label className={styles.field}>
                        <span>Etiqueta ({LOCALE_LABELS[locale] ?? locale})</span>
                        <input
                          value={item.label[locale] ?? ''}
                          maxLength={120}
                          onChange={(event) => update({ label: { ...item.label, [locale]: event.target.value } })}
                        />
                      </label>
                    )}
                  </LocaleTabs>
                </div>
              </div>
            )}
          />
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
  stats: ProfileStat[],
): Partial<UpdateProfileInput> {
  const fullName = String(data.get('fullName') ?? '').trim();
  const avatar = String(data.get('avatar') ?? '').trim();
  const logo = String(data.get('logo') ?? '').trim();
  const logoWordmark = String(data.get('logoWordmark') ?? '').trim();
  const heroVisual = String(data.get('heroVisual') ?? '').trim();
  const phone = String(data.get('phone') ?? '').trim();
  const address = String(data.get('address') ?? '').trim();
  const businessHours = String(data.get('businessHours') ?? '').trim();
  const facebookUrl = String(data.get('facebookUrl') ?? '').trim();
  const linkedinUrl = String(data.get('linkedinUrl') ?? '').trim();

  return {
    email: String(data.get('email') ?? '').trim(),
    name: String(data.get('name') ?? '').trim(),
    ...(fullName ? { fullName } : {}),
    ...(avatar ? { avatar } : {}),
    ...(logo ? { logo } : {}),
    ...(logoWordmark ? { logoWordmark } : {}),
    ...(heroVisual ? { heroVisual } : {}),
    ...(phone ? { phone } : {}),
    ...(address ? { address } : {}),
    ...(businessHours ? { businessHours } : {}),
    ...(facebookUrl ? { facebookUrl } : {}),
    ...(linkedinUrl ? { linkedinUrl } : {}),
    headline: collectTranslatable(data, 'headline', activeLocales),
    bio: collectTranslatable(data, 'bio', activeLocales),
    resume: collectTranslatable(data, 'resume', activeLocales),
    stats: stats
      .map((stat) => ({
        ...stat,
        label: Object.fromEntries(
          Object.entries(stat.label).filter(([, text]) => text?.trim()),
        ),
      }))
      .filter((stat) => Object.keys(stat.label).length > 0),
    activeLocales,
    defaultLocale,
  };
}
