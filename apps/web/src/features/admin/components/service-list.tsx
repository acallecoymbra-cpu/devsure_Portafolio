'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminApiError, deleteService, listServices } from '../api/admin-api';
import type { PaginationMeta, ServiceContent } from '../types';
import styles from '../admin.module.css';

function serviceTitle(service: ServiceContent): string {
  const first = Object.values(service.title).find((value) => value?.trim());
  return first ?? service.id;
}

export function ServiceList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ServiceContent[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'forbidden'>('loading');
  const [deletingId, setDeletingId] = useState<string>();
  const [notice, setNotice] = useState('');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await listServices(page);
      setItems(response.items);
      setMeta(response.meta);
      setStatus('ready');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setStatus(error instanceof AdminApiError && error.status === 403 ? 'forbidden' : 'error');
    }
  }, [page, router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get('created') === '1') {
      setNotice('Servicio creado correctamente.');
      router.replace('/admin/services', { scroll: false });
    }
  }, [router, searchParams]);

  async function handleDelete(service: ServiceContent) {
    if (!window.confirm(`¿Eliminar “${serviceTitle(service)}”? Esta acción no se puede deshacer.`)) return;

    setDeletingId(service.id);
    setNotice('');
    try {
      await deleteService(service.id);
      if (items.length === 1 && page > 1) {
        router.replace(`/admin/services?page=${page - 1}`);
      } else {
        await load();
      }
      setNotice('Servicio eliminado correctamente.');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setNotice(
        error instanceof AdminApiError && error.status === 403
          ? 'No tienes permiso para eliminar servicios.'
          : 'No pudimos eliminar el servicio.',
      );
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <section aria-labelledby="services-admin-title">
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Contenido</p>
          <h1 id="services-admin-title">Servicios</h1>
          <p className={styles.muted}>El grid de servicios que aparece en la home pública.</p>
        </div>
        <Link className={styles.primaryButton} href="/admin/services/new">
          <span aria-hidden="true">＋</span> Nuevo servicio
        </Link>
      </div>

      {notice ? (
        <div className={notice.startsWith('No ') ? styles.alertError : styles.alertSuccess} role="status">
          {notice}
        </div>
      ) : null}

      {status === 'loading' ? <ListSkeleton /> : null}
      {status === 'error' ? (
        <div className={styles.stateCard} role="alert">
          <h2>No pudimos cargar los servicios</h2>
          <p>Comprueba la conexión con el API e inténtalo nuevamente.</p>
          <button className={styles.secondaryButton} type="button" onClick={() => void load()}>
            Reintentar
          </button>
        </div>
      ) : null}
      {status === 'forbidden' ? (
        <div className={styles.stateCard} role="alert">
          <h2>Acceso restringido</h2>
          <p>Tu cuenta no tiene permiso para consultar este contenido.</p>
        </div>
      ) : null}

      {status === 'ready' && items.length === 0 ? (
        <div className={styles.stateCard}>
          <span className={styles.emptyIcon} aria-hidden="true">◇</span>
          <h2>Aún no hay servicios</h2>
          <p>Crea el primero para que aparezca en la home.</p>
          <Link className={styles.primaryButton} href="/admin/services/new">
            Crear servicio
          </Link>
        </div>
      ) : null}

      {status === 'ready' && items.length > 0 ? (
        <>
          <div className={styles.tableFrame}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Listado de servicios administrables</caption>
              <thead>
                <tr>
                  <th scope="col">Servicio</th>
                  <th scope="col">Ícono</th>
                  <th scope="col">Orden</th>
                  <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((service) => (
                  <tr key={service.id}>
                    <td data-label="Servicio">
                      <strong>{serviceTitle(service)}</strong>
                    </td>
                    <td data-label="Ícono">{service.icon ?? '—'}</td>
                    <td data-label="Orden">{service.sortOrder}</td>
                    <td className={styles.rowActions}>
                      <Link href={`/admin/services/${service.id}/edit`}>Editar</Link>
                      <button
                        type="button"
                        disabled={deletingId === service.id}
                        onClick={() => void handleDelete(service)}
                      >
                        {deletingId === service.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Paginación de servicios">
              <Link
                href={`/admin/services?page=${page - 1}`}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
              >
                Anterior
              </Link>
              <span>Página {meta.page} de {meta.totalPages}</span>
              <Link
                href={`/admin/services?page=${page + 1}`}
                aria-disabled={page >= meta.totalPages}
                tabIndex={page >= meta.totalPages ? -1 : undefined}
              >
                Siguiente
              </Link>
            </nav>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function ListSkeleton() {
  return (
    <div className={styles.skeletonPanel} role="status" aria-live="polite">
      <span className={styles.srOnly}>Cargando servicios…</span>
      <div />
      <div />
      <div />
    </div>
  );
}
