'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminApiError, deleteCultureStory, listCultureStories } from '../api/admin-api';
import type { CultureStory, PaginationMeta } from '../types';
import styles from '../admin.module.css';

function storyTitle(story: CultureStory): string {
  const first = Object.values(story.title).find((value) => value?.trim());
  return first ?? story.imageAlt;
}

export function CultureStoryList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CultureStory[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'forbidden'>('loading');
  const [deletingId, setDeletingId] = useState<string>();
  const [notice, setNotice] = useState('');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await listCultureStories(page);
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
      setNotice('Card creada correctamente.');
      router.replace('/admin/culture-stories', { scroll: false });
    }
  }, [router, searchParams]);

  async function handleDelete(story: CultureStory) {
    if (!window.confirm(`¿Eliminar “${storyTitle(story)}”? Esta acción no se puede deshacer.`)) return;

    setDeletingId(story.id);
    setNotice('');
    try {
      await deleteCultureStory(story.id);
      if (items.length === 1 && page > 1) {
        router.replace(`/admin/culture-stories?page=${page - 1}`);
      } else {
        await load();
      }
      setNotice('Card eliminada correctamente.');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setNotice(
        error instanceof AdminApiError && error.status === 403
          ? 'No tienes permiso para eliminar este contenido.'
          : 'No pudimos eliminar el registro.',
      );
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <section aria-labelledby="culture-stories-admin-title">
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Contenido</p>
          <h1 id="culture-stories-admin-title">Cards de la columna de Cultura</h1>
          <p className={styles.muted}>
            Las historias que orbitan la columna 3D en <code>/cultura</code>. El orden (menor a mayor) decide qué
            estación queda arriba de todo — la de menor orden aparece primero al bajar.
          </p>
        </div>
        <Link className={styles.primaryButton} href="/admin/culture-stories/new">
          <span aria-hidden="true">＋</span> Nueva card
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
          <h2>No pudimos cargar las cards</h2>
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
          <h2>Aún no hay cards registradas</h2>
          <p>Sin ninguna card, la columna de <code>/cultura</code> se muestra vacía. Crea la primera.</p>
          <Link className={styles.primaryButton} href="/admin/culture-stories/new">
            Crear card
          </Link>
        </div>
      ) : null}

      {status === 'ready' && items.length > 0 ? (
        <>
          <div className={styles.tableFrame}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Listado de cards de cultura administrable</caption>
              <thead>
                <tr>
                  <th scope="col">Título</th>
                  <th scope="col">Kicker</th>
                  <th scope="col">Orden</th>
                  <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((story) => (
                  <tr key={story.id}>
                    <td data-label="Título">
                      <strong>{storyTitle(story)}</strong>
                    </td>
                    <td data-label="Kicker">{Object.values(story.kicker).find((value) => value?.trim()) ?? '—'}</td>
                    <td data-label="Orden">{story.sortOrder}</td>
                    <td className={styles.rowActions}>
                      <Link href={`/admin/culture-stories/${story.id}/edit`}>Editar</Link>
                      <button
                        type="button"
                        disabled={deletingId === story.id}
                        onClick={() => void handleDelete(story)}
                      >
                        {deletingId === story.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Paginación de cards de cultura">
              <Link
                href={`/admin/culture-stories?page=${page - 1}`}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
              >
                Anterior
              </Link>
              <span>Página {meta.page} de {meta.totalPages}</span>
              <Link
                href={`/admin/culture-stories?page=${page + 1}`}
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
      <span className={styles.srOnly}>Cargando cards…</span>
      <div />
      <div />
      <div />
    </div>
  );
}
