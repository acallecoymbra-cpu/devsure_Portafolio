'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminApiError, deleteProject, listExperiences, listProjects } from '../api/admin-api';
import type { PaginationMeta, Project } from '../types';
import styles from '../admin.module.css';

function projectTitle(project: Project): string {
  const first = Object.values(project.title).find((value) => value?.trim());
  return first ?? project.slug;
}

export function ProjectList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Project[]>([]);
  const [experienceNames, setExperienceNames] = useState<Record<string, string>>({});
  const [meta, setMeta] = useState<PaginationMeta>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'forbidden'>('loading');
  const [deletingId, setDeletingId] = useState<string>();
  const [notice, setNotice] = useState('');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [response, experiences] = await Promise.all([listProjects(page), listExperiences(1, 50)]);
      setItems(response.items);
      setMeta(response.meta);
      setExperienceNames(Object.fromEntries(experiences.items.map((experience) => [experience.id, experience.company])));
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
      setNotice('Proyecto creado correctamente.');
      router.replace('/admin/projects', { scroll: false });
    }
  }, [router, searchParams]);

  async function handleDelete(project: Project) {
    if (!window.confirm(`¿Eliminar “${projectTitle(project)}”? Esta acción no se puede deshacer.`)) return;

    setDeletingId(project.id);
    setNotice('');
    try {
      await deleteProject(project.id);
      if (items.length === 1 && page > 1) {
        router.replace(`/admin/projects?page=${page - 1}`);
      } else {
        await load();
      }
      setNotice('Proyecto eliminado correctamente.');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setNotice(
        error instanceof AdminApiError && error.status === 403
          ? 'No tienes permiso para eliminar proyectos.'
          : 'No pudimos eliminar el proyecto.',
      );
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <section aria-labelledby="projects-admin-title">
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Contenido</p>
          <h1 id="projects-admin-title">Proyectos</h1>
          <p className={styles.muted}>Portfolio público: proyectos personales y de cada experiencia.</p>
        </div>
        <Link className={styles.primaryButton} href="/admin/projects/new">
          <span aria-hidden="true">＋</span> Nuevo proyecto
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
          <h2>No pudimos cargar los proyectos</h2>
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
          <h2>Aún no hay proyectos</h2>
          <p>Crea el primero para que aparezca en el portfolio.</p>
          <Link className={styles.primaryButton} href="/admin/projects/new">
            Crear proyecto
          </Link>
        </div>
      ) : null}

      {status === 'ready' && items.length > 0 ? (
        <>
          <div className={styles.tableFrame}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Listado de proyectos administrables</caption>
              <thead>
                <tr>
                  <th scope="col">Proyecto</th>
                  <th scope="col">Experiencia</th>
                  <th scope="col">Destacado</th>
                  <th scope="col">Estado</th>
                  <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((project) => (
                  <tr key={project.id}>
                    <td data-label="Proyecto">
                      <strong>{projectTitle(project)}</strong>
                      <small>{project.slug}</small>
                    </td>
                    <td data-label="Experiencia">
                      {project.experienceId ? experienceNames[project.experienceId] ?? '—' : 'Personal'}
                    </td>
                    <td data-label="Destacado">{project.featured ? 'Sí' : 'No'}</td>
                    <td data-label="Estado">
                      <span className={project.publishedAt ? styles.statusPublished : styles.statusDraft}>
                        {project.publishedAt ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className={styles.rowActions}>
                      <Link href={`/admin/projects/${project.id}/edit`}>Editar</Link>
                      <button
                        type="button"
                        disabled={deletingId === project.id}
                        onClick={() => void handleDelete(project)}
                      >
                        {deletingId === project.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Paginación de proyectos">
              <Link
                href={`/admin/projects?page=${page - 1}`}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
              >
                Anterior
              </Link>
              <span>Página {meta.page} de {meta.totalPages}</span>
              <Link
                href={`/admin/projects?page=${page + 1}`}
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
      <span className={styles.srOnly}>Cargando proyectos…</span>
      <div />
      <div />
      <div />
    </div>
  );
}
