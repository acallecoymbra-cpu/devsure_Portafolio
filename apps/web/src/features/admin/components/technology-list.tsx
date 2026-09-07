'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminApiError, deleteTechnology, listTechnologies } from '../api/admin-api';
import type { AdminTechnology, PaginationMeta } from '../types';
import styles from '../admin.module.css';

export function TechnologyList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<AdminTechnology[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'forbidden'>('loading');
  const [deletingId, setDeletingId] = useState<string>();
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await listTechnologies(page);
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
      setNotice('Tecnología creada correctamente.');
      router.replace('/admin/technologies', { scroll: false });
    }
  }, [router, searchParams]);

  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const filteredItems = normalizedQuery
    ? items.filter((item) =>
        [item.name, item.slug, item.category].some((value) =>
          value.toLocaleLowerCase('es').includes(normalizedQuery),
        ),
      )
    : items;

  async function handleDelete(technology: AdminTechnology) {
    if (!window.confirm(`¿Eliminar “${technology.name}”? Esta acción no se puede deshacer.`)) return;

    setDeletingId(technology.id);
    setNotice('');
    try {
      await deleteTechnology(technology.id);
      if (items.length === 1 && page > 1) {
        router.replace(`/admin/technologies?page=${page - 1}`);
      } else {
        await load();
      }
      setNotice('Tecnología eliminada correctamente.');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setNotice(
        error instanceof AdminApiError && error.status === 403
          ? 'No tienes permiso para eliminar tecnologías.'
          : 'No pudimos eliminar la tecnología.',
      );
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <section aria-labelledby="technologies-admin-title">
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Contenido</p>
          <h1 id="technologies-admin-title">Tecnologías</h1>
          <p className={styles.muted}>Edita la información y el estado de publicación del catálogo.</p>
        </div>
        <Link className={styles.primaryButton} href="/admin/technologies/new">
          <span aria-hidden="true">＋</span> Nueva tecnología
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
          <h2>No pudimos cargar las tecnologías</h2>
          <p>Comprueba la conexión con el API e inténtalo nuevamente.</p>
          <button className={styles.secondaryButton} type="button" onClick={() => void load()}>
            Reintentar
          </button>
        </div>
      ) : null}
      {status === 'forbidden' ? (
        <div className={styles.stateCard} role="alert">
          <h2>Acceso restringido</h2>
          <p>Tu cuenta no tiene permiso para consultar este catálogo.</p>
        </div>
      ) : null}

      {status === 'ready' && items.length === 0 ? (
        <div className={styles.stateCard}>
          <span className={styles.emptyIcon} aria-hidden="true">◇</span>
          <h2>Aún no hay tecnologías</h2>
          <p>Crea la primera entrada para empezar a construir el catálogo.</p>
          <Link className={styles.primaryButton} href="/admin/technologies/new">
            Crear tecnología
          </Link>
        </div>
      ) : null}

      {status === 'ready' && items.length > 0 ? (
        <>
          <div className={styles.toolbar}>
            <label className={styles.searchField}>
              <span className={styles.srOnly}>Buscar tecnologías en esta página</span>
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar en esta página"
              />
            </label>
            <p aria-live="polite">
              {filteredItems.length} {filteredItems.length === 1 ? 'resultado' : 'resultados'}
            </p>
          </div>

          {filteredItems.length === 0 ? (
            <div className={styles.stateCard}>
              <h2>No hay coincidencias</h2>
              <p>Prueba con otro nombre, slug o categoría.</p>
              <button className={styles.secondaryButton} type="button" onClick={() => setQuery('')}>
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className={styles.tableFrame}>
              <table className={styles.table}>
                <caption className={styles.srOnly}>Listado de tecnologías administrables</caption>
                <thead>
                  <tr>
                    <th scope="col">Tecnología</th>
                    <th scope="col">Categoría</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Orden</th>
                    <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((technology) => (
                    <tr key={technology.id}>
                      <td data-label="Tecnología">
                        <strong>{technology.name}</strong>
                        <small>{technology.slug}</small>
                      </td>
                      <td data-label="Categoría">{technology.category}</td>
                      <td data-label="Estado">
                        <span
                          className={
                            technology.publicationStatus === 'published'
                              ? styles.statusPublished
                              : styles.statusDraft
                          }
                        >
                          {technology.publicationStatus === 'published' ? 'Publicada' : 'Borrador'}
                        </span>
                      </td>
                      <td data-label="Orden">{technology.sortOrder}</td>
                      <td className={styles.rowActions}>
                        <Link href={`/admin/technologies/${technology.id}/edit`}>Editar</Link>
                        <button
                          type="button"
                          disabled={deletingId === technology.id}
                          onClick={() => void handleDelete(technology)}
                        >
                          {deletingId === technology.id ? 'Eliminando…' : 'Eliminar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {meta && meta.totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Paginación de tecnologías">
              <Link
                href={`/admin/technologies?page=${page - 1}`}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
              >
                Anterior
              </Link>
              <span>Página {meta.page} de {meta.totalPages}</span>
              <Link
                href={`/admin/technologies?page=${page + 1}`}
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
      <span className={styles.srOnly}>Cargando tecnologías…</span>
      <div />
      <div />
      <div />
      <div />
    </div>
  );
}
