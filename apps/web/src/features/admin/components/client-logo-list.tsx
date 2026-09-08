'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminApiError, deleteClientLogo, listClientLogos } from '../api/admin-api';
import type { ClientLogo, PaginationMeta } from '../types';
import styles from '../admin.module.css';

export function ClientLogoList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ClientLogo[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'forbidden'>('loading');
  const [deletingId, setDeletingId] = useState<string>();
  const [notice, setNotice] = useState('');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await listClientLogos(page);
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
      setNotice('Logo de cliente creado correctamente.');
      router.replace('/admin/client-logos', { scroll: false });
    }
  }, [router, searchParams]);

  async function handleDelete(logo: ClientLogo) {
    if (!window.confirm(`¿Eliminar el logo de “${logo.name}”? Esta acción no se puede deshacer.`)) return;

    setDeletingId(logo.id);
    setNotice('');
    try {
      await deleteClientLogo(logo.id);
      if (items.length === 1 && page > 1) {
        router.replace(`/admin/client-logos?page=${page - 1}`);
      } else {
        await load();
      }
      setNotice('Logo eliminado correctamente.');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setNotice(
        error instanceof AdminApiError && error.status === 403
          ? 'No tienes permiso para eliminar logos de clientes.'
          : 'No pudimos eliminar el logo.',
      );
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <section aria-labelledby="client-logos-admin-title">
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Contenido</p>
          <h1 id="client-logos-admin-title">Logos de clientes</h1>
          <p className={styles.muted}>Franja de confianza que aparece bajo el Hero de la home pública.</p>
        </div>
        <Link className={styles.primaryButton} href="/admin/client-logos/new">
          <span aria-hidden="true">＋</span> Nuevo logo
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
          <h2>No pudimos cargar los logos de clientes</h2>
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
          <h2>Aún no hay logos de clientes</h2>
          <p>Crea el primero para que aparezca en la home pública.</p>
          <Link className={styles.primaryButton} href="/admin/client-logos/new">
            Crear logo
          </Link>
        </div>
      ) : null}

      {status === 'ready' && items.length > 0 ? (
        <>
          <div className={styles.tableFrame}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Listado de logos de clientes administrables</caption>
              <thead>
                <tr>
                  <th scope="col">Cliente</th>
                  <th scope="col">Sitio web</th>
                  <th scope="col">Orden</th>
                  <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((logo) => (
                  <tr key={logo.id}>
                    <td data-label="Cliente"><strong>{logo.name}</strong></td>
                    <td data-label="Sitio web">{logo.websiteUrl ?? '—'}</td>
                    <td data-label="Orden">{logo.sortOrder}</td>
                    <td className={styles.rowActions}>
                      <Link href={`/admin/client-logos/${logo.id}/edit`}>Editar</Link>
                      <button
                        type="button"
                        disabled={deletingId === logo.id}
                        onClick={() => void handleDelete(logo)}
                      >
                        {deletingId === logo.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Paginación de logos de clientes">
              <Link
                href={`/admin/client-logos?page=${page - 1}`}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
              >
                Anterior
              </Link>
              <span>Página {meta.page} de {meta.totalPages}</span>
              <Link
                href={`/admin/client-logos?page=${page + 1}`}
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
      <span className={styles.srOnly}>Cargando logos de clientes…</span>
      <div />
      <div />
      <div />
    </div>
  );
}
