'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AdminApiError, createClientLogo, getClientLogo, updateClientLogo } from '../api/admin-api';
import type { ClientLogo, ClientLogoInput } from '../types';
import { FileUploadField } from './file-upload-field';
import styles from '../admin.module.css';

interface ClientLogoFormProps {
  clientLogo?: ClientLogo;
}

export function ClientLogoForm({ clientLogo }: ClientLogoFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();
  const title = clientLogo ? `Editar logo de ${clientLogo.name}` : 'Nuevo logo de cliente';

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
      if (clientLogo) {
        await updateClientLogo(clientLogo.id, input);
        setDirty(false);
        setMessage({ kind: 'success', text: 'Cambios guardados correctamente.' });
        router.refresh();
      } else {
        await createClientLogo(input);
        setDirty(false);
        router.push('/admin/client-logos?created=1');
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
            ? 'Revisa los campos: falta el nombre/el logo o algún dato es inválido.'
            : 'No pudimos guardar los cambios. Inténtalo nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="client-logo-form-title">
      <div className={styles.pageHeading}>
        <div>
          <Link className={styles.backLink} href="/admin/client-logos">
            <span aria-hidden="true">←</span> Logos de clientes
          </Link>
          <h1 id="client-logo-form-title">{title}</h1>
          <p className={styles.muted}>
            {clientLogo ? 'Actualiza este logo.' : 'Agrega un cliente a la franja de confianza de la home.'}
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
          <legend>Cliente</legend>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Nombre <em aria-hidden="true">*</em></span>
              <input name="name" defaultValue={clientLogo?.name} maxLength={150} required autoComplete="off" />
            </label>
            <label className={styles.field}>
              <span>Sitio web</span>
              <input
                type="url"
                name="websiteUrl"
                defaultValue={clientLogo?.websiteUrl}
                maxLength={500}
                placeholder="https://cliente.example.com"
                autoComplete="off"
              />
            </label>
            <label className={styles.field}>
              <span>Orden</span>
              <input type="number" name="sortOrder" min={0} step={1} defaultValue={clientLogo?.sortOrder ?? 0} />
            </label>
            <div className={styles.fullField}>
              <FileUploadField
                label="Logo"
                folder="client-logos"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                hiddenName="logo"
                value={clientLogo?.logo}
                helpText="PNG, JPEG, WEBP o SVG, hasta 512 KB."
              />
            </div>
          </div>
        </fieldset>

        <div className={styles.formActions}>
          <Link className={styles.secondaryButton} href="/admin/client-logos">
            Cancelar
          </Link>
          <button className={styles.primaryButton} type="submit" disabled={submitting || !dirty}>
            {submitting ? 'Guardando…' : clientLogo ? 'Guardar cambios' : 'Crear logo'}
          </button>
        </div>
      </form>
    </section>
  );
}

function formDataToInput(data: FormData): ClientLogoInput {
  const websiteUrl = String(data.get('websiteUrl') ?? '').trim();

  return {
    name: String(data.get('name') ?? '').trim(),
    logo: String(data.get('logo') ?? '').trim(),
    ...(websiteUrl ? { websiteUrl } : {}),
    sortOrder: Number(data.get('sortOrder') ?? 0),
  };
}

export function ClientLogoEditor({ id }: { id: string }) {
  const router = useRouter();
  const [clientLogo, setClientLogo] = useState<ClientLogo>();
  const [status, setStatus] = useState<'loading' | 'error' | 'forbidden' | 'not-found'>('loading');

  const load = useMemo(
    () => async () => {
      setStatus('loading');
      try {
        setClientLogo(await getClientLogo(id));
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

  if (clientLogo) return <ClientLogoForm clientLogo={clientLogo} />;

  if (status === 'loading') {
    return (
      <div className={styles.centerState} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Cargando logo…</p>
      </div>
    );
  }

  return (
    <div className={styles.stateCard} role={status === 'error' ? 'alert' : undefined}>
      <h1>
        {status === 'not-found'
          ? 'Logo no encontrado'
          : status === 'forbidden'
            ? 'Acceso restringido'
            : 'No pudimos cargar el logo'}
      </h1>
      <p>
        {status === 'not-found'
          ? 'Puede que se haya eliminado o que el enlace ya no sea válido.'
          : status === 'forbidden'
            ? 'Tu cuenta no tiene permiso para editar este logo.'
            : 'Comprueba la conexión con el API e inténtalo nuevamente.'}
      </p>
      {status === 'error' ? (
        <button className={styles.primaryButton} type="button" onClick={() => void load()}>
          Reintentar
        </button>
      ) : (
        <Link className={styles.secondaryButton} href="/admin/client-logos">
          Volver al listado
        </Link>
      )}
    </div>
  );
}
