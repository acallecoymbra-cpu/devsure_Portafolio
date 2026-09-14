'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AdminApiError, createSocialLink, getSocialLink, updateSocialLink } from '../api/admin-api';
import type { SocialLink, SocialLinkInput } from '../types';
import { FileUploadField } from './file-upload-field';
import styles from '../admin.module.css';

interface SocialLinkFormProps {
  socialLink?: SocialLink;
}

/** Known platforms with a bundled glyph (see `SocialIconGlyph`) — anything else still works, it just falls back to a generic glyph until an icon is uploaded below. */
const KNOWN_ICON_KEYS = ['facebook', 'linkedin', 'instagram', 'x', 'youtube', 'tiktok', 'github', 'whatsapp'];

export function SocialLinkForm({ socialLink }: SocialLinkFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();
  const title = socialLink ? `Editar red ${socialLink.name}` : 'Nueva red social';

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(undefined);
    const input = formDataToInput(new FormData(event.currentTarget));

    try {
      if (socialLink) {
        await updateSocialLink(socialLink.id, input);
        setDirty(false);
        setMessage({ kind: 'success', text: 'Cambios guardados correctamente.' });
        router.refresh();
      } else {
        await createSocialLink(input);
        setDirty(false);
        router.push('/admin/social-links?created=1');
      }
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setMessage({
        kind: 'error',
        text:
          error instanceof AdminApiError && error.status === 400
            ? 'Revisa los campos: falta el nombre/la url o algún dato es inválido.'
            : 'No pudimos guardar los cambios. Inténtalo nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="social-link-form-title">
      <div className={styles.pageHeading}>
        <div>
          <Link className={styles.backLink} href="/admin/social-links">
            <span aria-hidden="true">←</span> Redes sociales
          </Link>
          <h1 id="social-link-form-title">{title}</h1>
          <p className={styles.muted}>
            {socialLink
              ? 'Actualiza esta red social.'
              : 'Agrega una red al menú fijo que aparece en el borde derecho del sitio.'}
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
          <legend>Red social</legend>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Nombre <em aria-hidden="true">*</em></span>
              <input name="name" defaultValue={socialLink?.name} maxLength={100} required autoComplete="off" />
              <small>Ej. “LinkedIn”, “Instagram”. Se usa como texto alternativo del icono.</small>
            </label>
            <label className={styles.field}>
              <span>URL <em aria-hidden="true">*</em></span>
              <input
                type="url"
                name="url"
                defaultValue={socialLink?.url}
                maxLength={500}
                placeholder="https://www.linkedin.com/company/devsure"
                required
                autoComplete="off"
              />
            </label>
            <label className={styles.field}>
              <span>Icono predefinido <em aria-hidden="true">*</em></span>
              <input
                name="iconKey"
                list="social-link-icon-keys"
                defaultValue={socialLink?.iconKey ?? 'generic'}
                maxLength={32}
                required
                autoComplete="off"
              />
              <datalist id="social-link-icon-keys">
                {KNOWN_ICON_KEYS.map((key) => (
                  <option key={key} value={key} />
                ))}
              </datalist>
              <small>Usa uno de la lista para un icono reconocible al instante, o cualquier otro texto si vas a subir tu propio icono abajo.</small>
            </label>
            <label className={styles.field}>
              <span>Orden</span>
              <input type="number" name="sortOrder" min={0} step={1} defaultValue={socialLink?.sortOrder ?? 0} />
            </label>
            <div className={styles.fullField}>
              <FileUploadField
                label="Icono personalizado (opcional)"
                folder="network-icons"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                hiddenName="icon"
                value={socialLink?.icon}
                helpText="PNG, JPEG, WebP o SVG, hasta 512 KB. Si no subes nada, se usa el icono predefinido de arriba."
              />
            </div>
          </div>
        </fieldset>

        <div className={styles.formActions}>
          <Link className={styles.secondaryButton} href="/admin/social-links">
            Cancelar
          </Link>
          <button className={styles.primaryButton} type="submit" disabled={submitting || !dirty}>
            {submitting ? 'Guardando…' : socialLink ? 'Guardar cambios' : 'Crear red social'}
          </button>
        </div>
      </form>
    </section>
  );
}

function formDataToInput(data: FormData): SocialLinkInput {
  const icon = String(data.get('icon') ?? '').trim();

  return {
    name: String(data.get('name') ?? '').trim(),
    url: String(data.get('url') ?? '').trim(),
    iconKey: String(data.get('iconKey') ?? '').trim() || 'generic',
    ...(icon ? { icon } : {}),
    sortOrder: Number(data.get('sortOrder') ?? 0),
  };
}

export function SocialLinkEditor({ id }: { id: string }) {
  const router = useRouter();
  const [socialLink, setSocialLink] = useState<SocialLink>();
  const [status, setStatus] = useState<'loading' | 'error' | 'forbidden' | 'not-found'>('loading');

  const load = useMemo(
    () => async () => {
      setStatus('loading');
      try {
        setSocialLink(await getSocialLink(id));
      } catch (error) {
        if (error instanceof AdminApiError && error.status === 401) {
          router.replace('/admin/login');
          return;
        }
        if (error instanceof AdminApiError && error.status === 403) setStatus('forbidden');
        else if (error instanceof AdminApiError && error.status === 404) setStatus('not-found');
        else setStatus('error');
      }
    },
    [id, router],
  );

  useEffect(() => {
    void load();
  }, [load]);

  if (socialLink) return <SocialLinkForm socialLink={socialLink} />;

  if (status === 'loading') {
    return (
      <div className={styles.centerState} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Cargando red social…</p>
      </div>
    );
  }

  return (
    <div className={styles.stateCard} role={status === 'error' ? 'alert' : undefined}>
      <h1>
        {status === 'not-found'
          ? 'Red social no encontrada'
          : status === 'forbidden'
            ? 'Acceso restringido'
            : 'No pudimos cargar la red social'}
      </h1>
      <p>
        {status === 'not-found'
          ? 'Puede que se haya eliminado o que el enlace ya no sea válido.'
          : status === 'forbidden'
            ? 'Tu cuenta no tiene permiso para editar esta red social.'
            : 'Comprueba la conexión con el API e inténtalo nuevamente.'}
      </p>
      {status === 'error' ? (
        <button className={styles.primaryButton} type="button" onClick={() => void load()}>
          Reintentar
        </button>
      ) : (
        <Link className={styles.secondaryButton} href="/admin/social-links">
          Volver al listado
        </Link>
      )}
    </div>
  );
}
