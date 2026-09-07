'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminApiError, deleteWorkStyleItem, listWorkStyleItems } from '../api/admin-api';
import type { PaginationMeta, WorkStyleItem } from '../types';
import styles from '../admin.module.css';

function itemText(item: WorkStyleItem): string {
  const first = Object.values(item.text).find((value) => value?.trim());
  return first ?? item.id;
}

export function WorkStyleItemList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<WorkStyleItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'forbidden'>('loading');
  const [deletingId, setDeletingId] = useState<string>();
  const [notice, setNotice] = useState('');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await listWorkStyleItems(page);
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
      setNotice('Bullet creado correctamente.');
      router.replace('/admin/work-style-items', { scroll: false });
    }
  }, [router, searchParams]);

  async function handleDelete(item: WorkStyleItem) {
    if (!window.confirm(`¿Eliminar “${itemText(item)}”? Esta acción no se puede deshacer.`)) return;

    setDeletingId(item.id);
    setNotice('');
    try {
      await deleteWorkStyleItem(item.id);
      if (items.length === 1 && page > 1) {
        router.replace(`/admin/work-style-items?page=${page - 1}`);
      } else {
        await load();
      }
      setNotice('Bullet eliminado correctamente.');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setNotice(
        error instanceof AdminApiError && error.status === 403
          ? 'No tienes permiso para eliminar este contenido.'
          : 'No pudimos eliminar el bullet.',
      );
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <section aria-labelledby="work-style-items-admin-title">
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Contenido</p>
          <h1 id="work-style-items-admin-title">Estilo de trabajo</h1>
          <p className={styles.muted}>Los bullets numerados de "Cómo trabajamos" en la home pública.</p>
        </div>
        <Link className={styles.primaryButton} href="/admin/work-style-items/new">
          <span aria-hidden="true">＋</span> Nuevo bullet
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
          <h2>No pudimos cargar el contenido</h2>
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
          <h2>Aún no hay bullets</h2>
          <p>Crea el primero para que aparezca en "Cómo trabajamos".</p>
          <Link className={styles.primaryButton} href="/admin/work-style-items/new">
            Crear bullet
          </Link>
        </div>
      ) : null}

      {status === 'ready' && items.length > 0 ? (
        <>
          <div className={styles.tableFrame}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Listado de estilo de trabajo administrable</caption>
              <thead>
                <tr>
                  <th scope="col">Texto</th>
                  <th scope="col">Orden</th>
                  <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Texto">{itemText(item)}</td>
                    <td data-label="Orden">{item.sortOrder}</td>
                    <td className={styles.rowActions}>
                      <Link href={`/admin/work-style-items/${item.id}/edit`}>Editar</Link>
                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={() => void handleDelete(item)}
                      >
                        {deletingId === item.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Paginación de estilo de trabajo">
              <Link
                href={`/admin/work-style-items?page=${page - 1}`}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
              >
                Anterior
              </Link>
              <span>Página {meta.page} de {meta.totalPages}</span>
              <Link
                href={`/admin/work-style-items?page=${page + 1}`}
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
      <span className={styles.srOnly}>Cargando…</span>
      <div />
      <div />
      <div />
    </div>
  );
}
