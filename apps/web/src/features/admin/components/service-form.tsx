'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AdminApiError, createService, getProfile, getService, updateService } from '../api/admin-api';
import type { ServiceContent, ServiceInput } from '../types';
import { collectTranslatable } from '../lib/translatable-form';
import { LOCALE_LABELS, LocaleTabs } from './locale-tabs';
import styles from '../admin.module.css';

interface ServiceFormProps {
  service?: ServiceContent;
}

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [activeLocales, setActiveLocales] = useState<string[]>(['en']);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();
  const title = service ? 'Editar servicio' : 'Nuevo servicio';

  useEffect(() => {
    let active = true;
    getProfile()
      .then((profile) => {
        if (active) setActiveLocales(profile.activeLocales);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

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
    const input = formDataToInput(new FormData(event.currentTarget), activeLocales);

    try {
      if (service) {
        await updateService(service.id, input);
        setDirty(false);
        setMessage({ kind: 'success', text: 'Cambios guardados correctamente.' });
        router.refresh();
      } else {
        await createService(input);
        setDirty(false);
        router.push('/admin/services?created=1');
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
            ? 'Revisa los campos: falta título/descripción, o el ícono no tiene un formato válido (ej. ti-server).'
            : 'No pudimos guardar los cambios. Inténtalo nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="service-form-title">
      <div className={styles.pageHeading}>
        <div>
          <Link className={styles.backLink} href="/admin/services">
            <span aria-hidden="true">←</span> Servicios
          </Link>
          <h1 id="service-form-title">{title}</h1>
          <p className={styles.muted}>
            {service ? 'Actualiza el texto y el ícono del servicio.' : 'Añade un servicio al grid de la home.'}
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
          <legend>Servicio</legend>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Ícono</span>
              <input name="icon" defaultValue={service?.icon} maxLength={60} placeholder="ti-server" pattern="[a-z][a-z0-9-]*" autoComplete="off" />
              <small>Clase Themify, ej. ti-server. Déjalo vacío si no aplica.</small>
            </label>
            <label className={styles.field}>
              <span>Orden</span>
              <input type="number" name="sortOrder" min={0} step={1} defaultValue={service?.sortOrder ?? 0} />
            </label>
          </div>
          <LocaleTabs idPrefix="title" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Título ({LOCALE_LABELS[locale] ?? locale}) <em aria-hidden="true">*</em></span>
                <input
                  name={`title.${locale}`}
                  defaultValue={service?.title[locale] ?? ''}
                  maxLength={150}
                  required={locale === activeLocales[0]}
                  autoComplete="off"
                />
              </label>
            )}
          </LocaleTabs>
          <LocaleTabs idPrefix="description" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Descripción ({LOCALE_LABELS[locale] ?? locale}) <em aria-hidden="true">*</em></span>
                <textarea
                  name={`description.${locale}`}
                  defaultValue={service?.description[locale] ?? ''}
                  maxLength={2000}
                  rows={4}
                  required={locale === activeLocales[0]}
                />
              </label>
            )}
          </LocaleTabs>
        </fieldset>

        <div className={styles.formActions}>
          <Link className={styles.secondaryButton} href="/admin/services">
            Cancelar
          </Link>
          <button className={styles.primaryButton} type="submit" disabled={submitting || !dirty}>
            {submitting ? 'Guardando…' : service ? 'Guardar cambios' : 'Crear servicio'}
          </button>
        </div>
      </form>
    </section>
  );
}

function formDataToInput(data: FormData, activeLocales: string[]): ServiceInput {
  const icon = String(data.get('icon') ?? '').trim();

  return {
    title: collectTranslatable(data, 'title', activeLocales),
    description: collectTranslatable(data, 'description', activeLocales),
    ...(icon ? { icon } : {}),
    sortOrder: Number(data.get('sortOrder') ?? 0),
  };
}

export function ServiceEditor({ id }: { id: string }) {
  const router = useRouter();
  const [service, setService] = useState<ServiceContent>();
  const [status, setStatus] = useState<'loading' | 'error' | 'forbidden' | 'not-found'>('loading');

  const load = useMemo(
    () => async () => {
      setStatus('loading');
      try {
        setService(await getService(id));
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

  if (service) return <ServiceForm service={service} />;

  if (status === 'loading') {
    return (
      <div className={styles.centerState} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Cargando servicio…</p>
      </div>
    );
  }

  return (
    <div className={styles.stateCard} role={status === 'error' ? 'alert' : undefined}>
      <h1>
        {status === 'not-found'
          ? 'Servicio no encontrado'
          : status === 'forbidden'
            ? 'Acceso restringido'
            : 'No pudimos cargar el servicio'}
      </h1>
      <p>
        {status === 'not-found'
          ? 'Puede que se haya eliminado o que el enlace ya no sea válido.'
          : status === 'forbidden'
            ? 'Tu cuenta no tiene permiso para editar este servicio.'
            : 'Comprueba la conexión con el API e inténtalo nuevamente.'}
      </p>
      {status === 'error' ? (
        <button className={styles.primaryButton} type="button" onClick={() => void load()}>
          Reintentar
        </button>
      ) : (
        <Link className={styles.secondaryButton} href="/admin/services">
          Volver al listado
        </Link>
      )}
    </div>
  );
}
