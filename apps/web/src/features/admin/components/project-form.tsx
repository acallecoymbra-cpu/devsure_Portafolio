'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AdminApiError,
  createProject,
  getProfile,
  getProject,
  listExperiences,
  updateProject,
} from '../api/admin-api';
import type { Experience, Project, ProjectApp, ProjectInput, TranslatableString } from '../types';
import { FileUploadField } from './file-upload-field';
import { GalleryField } from './gallery-field';
import { LOCALE_LABELS, LocaleTabs } from './locale-tabs';
import { RepeaterField } from './repeater-field';
import { TagsInput } from './tags-input';
import styles from '../admin.module.css';

interface LinkDraft {
  key: string;
  value: string;
}

interface AppDraft {
  name: string;
  platform: string;
  description: TranslatableString;
  techStack: string[];
  links: LinkDraft[];
}

interface FormState {
  experienceId: string;
  title: TranslatableString;
  slug: string;
  category: string;
  excerpt: TranslatableString;
  description: TranslatableString;
  coverImage: string;
  gallery: string[];
  techStack: string[];
  apps: AppDraft[];
  url: string;
  repoUrl: string;
  featured: boolean;
  sortOrder: number;
  publishedAt: string;
}

function emptyApp(): AppDraft {
  return { name: '', platform: '', description: {}, techStack: [], links: [] };
}

function linksToDraft(links?: Record<string, string>): LinkDraft[] {
  return Object.entries(links ?? {}).map(([key, value]) => ({ key, value }));
}

function draftToLinks(drafts: LinkDraft[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { key, value } of drafts) {
    const trimmedKey = key.trim();
    const trimmedValue = value.trim();
    if (trimmedKey && trimmedValue) result[trimmedKey] = trimmedValue;
  }
  return result;
}

function toAppDraft(app: ProjectApp): AppDraft {
  return {
    name: app.name,
    platform: app.platform ?? '',
    description: app.description ?? {},
    techStack: app.techStack ?? [],
    links: linksToDraft(app.links),
  };
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toFormState(project?: Project): FormState {
  return {
    experienceId: project?.experienceId ?? '',
    title: project?.title ?? {},
    slug: project?.slug ?? '',
    category: project?.category ?? '',
    excerpt: project?.excerpt ?? {},
    description: project?.description ?? {},
    coverImage: project?.coverImage ?? '',
    gallery: project?.gallery ?? [],
    techStack: project?.techStack ?? [],
    apps: project?.apps.map(toAppDraft) ?? [],
    url: project?.url ?? '',
    repoUrl: project?.repoUrl ?? '',
    featured: project?.featured ?? false,
    sortOrder: project?.sortOrder ?? 0,
    publishedAt: toDatetimeLocal(project?.publishedAt ?? null),
  };
}

function toInput(state: FormState): ProjectInput {
  return {
    experienceId: state.experienceId || null,
    title: state.title,
    ...(state.slug.trim() ? { slug: state.slug.trim() } : {}),
    ...(state.category.trim() ? { category: state.category.trim() } : {}),
    excerpt: state.excerpt,
    description: state.description,
    ...(state.coverImage.trim() ? { coverImage: state.coverImage.trim() } : {}),
    gallery: state.gallery,
    techStack: state.techStack,
    apps: state.apps.map((app) => ({
      name: app.name.trim(),
      ...(app.platform.trim() ? { platform: app.platform.trim() } : {}),
      description: app.description,
      techStack: app.techStack,
      links: draftToLinks(app.links),
    })),
    ...(state.url.trim() ? { url: state.url.trim() } : {}),
    ...(state.repoUrl.trim() ? { repoUrl: state.repoUrl.trim() } : {}),
    featured: state.featured,
    sortOrder: state.sortOrder,
    publishedAt: state.publishedAt ? new Date(state.publishedAt).toISOString() : null,
  };
}

interface ProjectFormProps {
  project?: Project;
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(() => toFormState(project));
  const [activeLocales, setActiveLocales] = useState<string[]>(['en']);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();
  const title = project ? 'Editar proyecto' : 'Nuevo proyecto';

  useEffect(() => {
    let active = true;
    Promise.all([getProfile(), listExperiences(1, 50)])
      .then(([profile, page]) => {
        if (!active) return;
        setActiveLocales(profile.activeLocales);
        setExperiences(page.items);
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

  function patch(update: Partial<FormState>) {
    setDirty(true);
    setState((current) => ({ ...current, ...update }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(undefined);
    const input = toInput(state);

    try {
      if (project) {
        await updateProject(project.id, input);
        setDirty(false);
        setMessage({ kind: 'success', text: 'Cambios guardados correctamente.' });
        router.refresh();
      } else {
        await createProject(input);
        setDirty(false);
        router.push('/admin/projects?created=1');
      }
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      const text =
        error instanceof AdminApiError && error.status === 409
          ? 'El slug ya está en uso. Elige uno diferente.'
          : error instanceof AdminApiError && error.status === 400
            ? 'Revisa los campos: falta el título, una URL es inválida, o la experiencia elegida no es tuya.'
            : 'No pudimos guardar los cambios. Inténtalo nuevamente.';
      setMessage({ kind: 'error', text });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="project-form-title">
      <div className={styles.pageHeading}>
        <div>
          <Link className={styles.backLink} href="/admin/projects">
            <span aria-hidden="true">←</span> Proyectos
          </Link>
          <h1 id="project-form-title">{title}</h1>
          <p className={styles.muted}>
            {project ? 'Actualiza el contenido y el estado de publicación.' : 'Registra un proyecto para el portfolio.'}
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

      <form className={styles.editorCard} onSubmit={handleSubmit}>
        <fieldset disabled={submitting}>
          <legend>Identidad</legend>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Experiencia</span>
              <select value={state.experienceId} onChange={(event) => patch({ experienceId: event.target.value })}>
                <option value="">— Personal —</option>
                {experiences.map((experience) => (
                  <option key={experience.id} value={experience.id}>
                    {experience.company}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Slug</span>
              <input
                value={state.slug}
                onChange={(event) => patch({ slug: event.target.value })}
                maxLength={160}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="auto desde el título"
                autoComplete="off"
              />
              <small>Déjalo vacío para generarlo automáticamente.</small>
            </label>
            <label className={styles.field}>
              <span>Categoría</span>
              <input
                value={state.category}
                onChange={(event) => patch({ category: event.target.value })}
                maxLength={60}
                placeholder="Aplicaciones web, Automatización…"
                autoComplete="off"
              />
              <small>Se usa como filtro en /casos-de-exito. Déjalo vacío si no aplica.</small>
            </label>
            <label className={styles.field}>
              <span>Orden</span>
              <input
                type="number"
                min={0}
                step={1}
                value={state.sortOrder}
                onChange={(event) => patch({ sortOrder: Number(event.target.value) || 0 })}
              />
            </label>
          </div>
          <LocaleTabs idPrefix="title" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Título ({LOCALE_LABELS[locale] ?? locale}) <em aria-hidden="true">*</em></span>
                <input
                  value={state.title[locale] ?? ''}
                  onChange={(event) => patch({ title: { ...state.title, [locale]: event.target.value } })}
                  maxLength={150}
                  required={locale === activeLocales[0]}
                />
              </label>
            )}
          </LocaleTabs>
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Contenido</legend>
          <LocaleTabs idPrefix="excerpt" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Extracto ({LOCALE_LABELS[locale] ?? locale})</span>
                <input
                  value={state.excerpt[locale] ?? ''}
                  onChange={(event) => patch({ excerpt: { ...state.excerpt, [locale]: event.target.value } })}
                  maxLength={300}
                />
              </label>
            )}
          </LocaleTabs>
          <LocaleTabs idPrefix="description" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Descripción ({LOCALE_LABELS[locale] ?? locale})</span>
                <textarea
                  value={state.description[locale] ?? ''}
                  onChange={(event) => patch({ description: { ...state.description, [locale]: event.target.value } })}
                  maxLength={5000}
                  rows={6}
                />
              </label>
            )}
          </LocaleTabs>
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Media</legend>
          <div className={styles.formGrid}>
            <FileUploadField
              label="Portada"
              folder="projects-covers"
              accept="image/png,image/jpeg,image/webp"
              value={state.coverImage}
              onUploaded={(path) => patch({ coverImage: path })}
              helpText="PNG, JPEG o WEBP, hasta 4 MB."
            />
            <label className={styles.field}>
              <span>URL en vivo</span>
              <input
                type="url"
                value={state.url}
                onChange={(event) => patch({ url: event.target.value })}
                placeholder="https://…"
              />
            </label>
            <label className={styles.field}>
              <span>Repositorio</span>
              <input
                type="url"
                value={state.repoUrl}
                onChange={(event) => patch({ repoUrl: event.target.value })}
                placeholder="https://github.com/…"
              />
            </label>
          </div>
          <GalleryField
            label="Galería"
            folder="projects-gallery"
            accept="image/png,image/jpeg,image/webp"
            value={state.gallery}
            onChange={(gallery) => patch({ gallery })}
            helpText="PNG, JPEG o WEBP, hasta 4 MB cada una. Usa las flechas para reordenar."
          />
          <TagsInput label="Tecnologías" value={state.techStack} onChange={(techStack) => patch({ techStack })} placeholder="Next.js, NestJS…" />
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Apps</legend>
          <RepeaterField
            items={state.apps}
            onChange={(apps) => patch({ apps })}
            createItem={emptyApp}
            addLabel="Añadir app"
            emptyText="Solo necesario para proyectos con más de una app/plataforma."
            itemLabel={(app, index) => app.name || `App ${index + 1}`}
            renderItem={(app, _index, update) => (
              <AppEditor app={app} activeLocales={activeLocales} onChange={update} disabled={submitting} />
            )}
          />
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Publicación</legend>
          <div className={styles.formGrid}>
            <label className={styles.checkField}>
              <input type="checkbox" checked={state.featured} onChange={(event) => patch({ featured: event.target.checked })} />
              <span>
                <strong>Destacado</strong>
                <small>Máximo 3 proyectos destacados por cuenta.</small>
              </span>
            </label>
            <label className={styles.field}>
              <span>Publicado</span>
              <input
                type="datetime-local"
                value={state.publishedAt}
                onChange={(event) => patch({ publishedAt: event.target.value })}
              />
              <small>Vacío = borrador (no visible en el sitio).</small>
            </label>
          </div>
        </fieldset>

        <div className={styles.formActions}>
          <Link className={styles.secondaryButton} href="/admin/projects">
            Cancelar
          </Link>
          <button className={styles.primaryButton} type="submit" disabled={submitting || !dirty}>
            {submitting ? 'Guardando…' : project ? 'Guardar cambios' : 'Crear proyecto'}
          </button>
        </div>
      </form>
    </section>
  );
}

function AppEditor({
  app,
  activeLocales,
  onChange,
  disabled,
}: {
  app: AppDraft;
  activeLocales: string[];
  onChange: (patch: Partial<AppDraft>) => void;
  disabled: boolean;
}) {
  return (
    <div className={styles.formGrid}>
      <label className={styles.field}>
        <span>Nombre <em aria-hidden="true">*</em></span>
        <input value={app.name} onChange={(event) => onChange({ name: event.target.value })} maxLength={150} required disabled={disabled} />
      </label>
      <label className={styles.field}>
        <span>Plataforma</span>
        <input value={app.platform} onChange={(event) => onChange({ platform: event.target.value })} maxLength={60} placeholder="Web, iOS…" disabled={disabled} />
      </label>
      <div className={styles.fullField}>
        <LocaleTabs idPrefix={`app-description-${app.name || 'nueva'}`} locales={activeLocales}>
          {(locale) => (
            <label className={styles.field}>
              <span>Descripción ({LOCALE_LABELS[locale] ?? locale})</span>
              <textarea
                value={app.description[locale] ?? ''}
                onChange={(event) => onChange({ description: { ...app.description, [locale]: event.target.value } })}
                maxLength={1000}
                rows={3}
                disabled={disabled}
              />
            </label>
          )}
        </LocaleTabs>
      </div>
      <div className={styles.fullField}>
        <TagsInput label="Tecnologías" value={app.techStack} onChange={(techStack) => onChange({ techStack })} placeholder="Next.js…" />
      </div>
      <div className={styles.fullField}>
        <span className={styles.highlightsLabel}>Enlaces</span>
        <RepeaterField
          items={app.links}
          onChange={(links) => onChange({ links })}
          createItem={() => ({ key: '', value: '' })}
          addLabel="Añadir enlace"
          emptyText="Sin enlaces todavía."
          itemLabel={(link, index) => link.key || `Enlace ${index + 1}`}
          renderItem={(link, _index, updateLink) => (
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Etiqueta</span>
                <input value={link.key} onChange={(event) => updateLink({ key: event.target.value })} maxLength={30} placeholder="Live, Code…" disabled={disabled} />
              </label>
              <label className={styles.field}>
                <span>URL</span>
                <input
                  type="url"
                  value={link.value}
                  onChange={(event) => updateLink({ value: event.target.value })}
                  maxLength={500}
                  placeholder="https://…"
                  disabled={disabled}
                />
              </label>
            </div>
          )}
        />
      </div>
    </div>
  );
}

export function ProjectEditor({ id }: { id: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project>();
  const [status, setStatus] = useState<'loading' | 'error' | 'forbidden' | 'not-found'>('loading');

  const load = useMemo(
    () => async () => {
      setStatus('loading');
      try {
        setProject(await getProject(id));
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

  if (project) return <ProjectForm project={project} />;

  if (status === 'loading') {
    return (
      <div className={styles.centerState} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Cargando proyecto…</p>
      </div>
    );
  }

  return (
    <div className={styles.stateCard} role={status === 'error' ? 'alert' : undefined}>
      <h1>
        {status === 'not-found'
          ? 'Proyecto no encontrado'
          : status === 'forbidden'
            ? 'Acceso restringido'
            : 'No pudimos cargar el proyecto'}
      </h1>
      <p>
        {status === 'not-found'
          ? 'Puede que se haya eliminado o que el enlace ya no sea válido.'
          : status === 'forbidden'
            ? 'Tu cuenta no tiene permiso para editar este proyecto.'
            : 'Comprueba la conexión con el API e inténtalo nuevamente.'}
      </p>
      {status === 'error' ? (
        <button className={styles.primaryButton} type="button" onClick={() => void load()}>
          Reintentar
        </button>
      ) : (
        <Link className={styles.secondaryButton} href="/admin/projects">
          Volver al listado
        </Link>
      )}
    </div>
  );
}
