'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AdminApiError,
  createExperience,
  getExperience,
  getProfile,
  updateExperience,
} from '../api/admin-api';
import type { Experience, ExperienceInput, ExperienceLevel, TranslatableString } from '../types';
import { FileUploadField } from './file-upload-field';
import { LOCALE_LABELS, LocaleTabs } from './locale-tabs';
import { RepeaterField } from './repeater-field';
import { TagsInput } from './tags-input';
import styles from '../admin.module.css';

interface LevelDraft {
  role: string;
  startDate: string;
  endDate: string;
  inProgress: boolean;
  description: TranslatableString;
  highlights: TranslatableString[];
}

interface FormState {
  company: string;
  slug: string;
  logo: string;
  summary: TranslatableString;
  techStack: string[];
  levels: LevelDraft[];
  sortOrder: number;
}

function emptyLevel(): LevelDraft {
  return { role: '', startDate: '', endDate: '', inProgress: false, description: {}, highlights: [] };
}

function toDraft(level: ExperienceLevel): LevelDraft {
  return {
    role: level.role,
    startDate: level.startDate ?? '',
    endDate: level.endDate ?? '',
    inProgress: level.inProgress ?? false,
    description: level.description ?? {},
    highlights: level.highlights ?? [],
  };
}

function toFormState(experience?: Experience): FormState {
  return {
    company: experience?.company ?? '',
    slug: experience?.slug ?? '',
    logo: experience?.logo ?? '',
    summary: experience?.summary ?? {},
    techStack: experience?.techStack ?? [],
    levels: experience?.levels.map(toDraft) ?? [emptyLevel()],
    sortOrder: experience?.sortOrder ?? 0,
  };
}

function toInput(state: FormState): ExperienceInput {
  return {
    company: state.company.trim(),
    ...(state.slug.trim() ? { slug: state.slug.trim() } : {}),
    ...(state.logo.trim() ? { logo: state.logo.trim() } : {}),
    summary: state.summary,
    techStack: state.techStack,
    levels: state.levels.map((level) => ({
      role: level.role.trim(),
      ...(level.startDate ? { startDate: level.startDate } : {}),
      endDate: level.endDate || null,
      inProgress: level.inProgress,
      description: level.description,
      highlights: level.highlights,
    })),
    sortOrder: state.sortOrder,
  };
}

interface ExperienceFormProps {
  experience?: Experience;
}

export function ExperienceForm({ experience }: ExperienceFormProps) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(() => toFormState(experience));
  const [activeLocales, setActiveLocales] = useState<string[]>(['en']);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();
  const title = experience ? `Editar ${experience.company}` : 'Nueva experiencia';

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

  function patch(update: Partial<FormState>) {
    setDirty(true);
    setState((current) => ({ ...current, ...update }));
  }

  function patchLevels(levels: LevelDraft[]) {
    patch({ levels });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(undefined);
    const input = toInput(state);

    try {
      if (experience) {
        await updateExperience(experience.id, input);
        setDirty(false);
        setMessage({ kind: 'success', text: 'Cambios guardados correctamente.' });
        router.refresh();
      } else {
        await createExperience(input);
        setDirty(false);
        router.push('/admin/experiences?created=1');
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
            ? 'Revisa los campos: falta al menos un nivel o algún dato es inválido.'
            : 'No pudimos guardar los cambios. Inténtalo nuevamente.';
      setMessage({ kind: 'error', text });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="experience-form-title">
      <div className={styles.pageHeading}>
        <div>
          <Link className={styles.backLink} href="/admin/experiences">
            <span aria-hidden="true">←</span> Experiencias
          </Link>
          <h1 id="experience-form-title">{title}</h1>
          <p className={styles.muted}>
            {experience
              ? 'Actualiza la empresa, los niveles y el material asociado.'
              : 'Registra una experiencia laboral y sus niveles/roles.'}
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
          <legend>Empresa</legend>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Empresa <em aria-hidden="true">*</em></span>
              <input
                value={state.company}
                onChange={(event) => patch({ company: event.target.value })}
                maxLength={150}
                required
                autoComplete="off"
              />
            </label>
            <label className={styles.field}>
              <span>Slug</span>
              <input
                value={state.slug}
                onChange={(event) => patch({ slug: event.target.value })}
                maxLength={160}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="auto desde el nombre de la empresa"
                autoComplete="off"
              />
              <small>Déjalo vacío para generarlo automáticamente.</small>
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
            <div className={styles.fullField}>
              <FileUploadField
                label="Logo"
                folder="experiences-logos"
                accept="image/png,image/jpeg,image/webp"
                value={state.logo}
                onUploaded={(path) => patch({ logo: path })}
                helpText="PNG, JPEG o WEBP, hasta 2 MB."
              />
            </div>
            <div className={styles.fullField}>
              <TagsInput
                label="Tecnologías"
                value={state.techStack}
                onChange={(techStack) => patch({ techStack })}
                placeholder="Next.js, NestJS…"
              />
            </div>
          </div>
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Resumen</legend>
          <LocaleTabs idPrefix="summary" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Resumen ({LOCALE_LABELS[locale] ?? locale})</span>
                <textarea
                  value={state.summary[locale] ?? ''}
                  onChange={(event) => patch({ summary: { ...state.summary, [locale]: event.target.value } })}
                  maxLength={2000}
                  rows={4}
                />
              </label>
            )}
          </LocaleTabs>
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Niveles / roles</legend>
          <RepeaterField
            items={state.levels}
            onChange={patchLevels}
            createItem={emptyLevel}
            addLabel="Añadir nivel"
            minItems={1}
            itemLabel={(level, index) => level.role || `Nivel ${index + 1}`}
            renderItem={(level, _index, update) => (
              <LevelEditor level={level} activeLocales={activeLocales} onChange={update} disabled={submitting} />
            )}
          />
        </fieldset>

        <div className={styles.formActions}>
          <Link className={styles.secondaryButton} href="/admin/experiences">
            Cancelar
          </Link>
          <button className={styles.primaryButton} type="submit" disabled={submitting || !dirty}>
            {submitting ? 'Guardando…' : experience ? 'Guardar cambios' : 'Crear experiencia'}
          </button>
        </div>
      </form>
    </section>
  );
}

function LevelEditor({
  level,
  activeLocales,
  onChange,
  disabled,
}: {
  level: LevelDraft;
  activeLocales: string[];
  onChange: (patch: Partial<LevelDraft>) => void;
  disabled: boolean;
}) {
  return (
    <div className={styles.formGrid}>
      <label className={styles.field}>
        <span>Rol <em aria-hidden="true">*</em></span>
        <input value={level.role} onChange={(event) => onChange({ role: event.target.value })} maxLength={150} required disabled={disabled} />
      </label>
      <label className={styles.field}>
        <span>Fecha de inicio</span>
        <input type="date" value={level.startDate} onChange={(event) => onChange({ startDate: event.target.value })} disabled={disabled} />
      </label>
      <label className={styles.field}>
        <span>Fecha de fin</span>
        <input
          type="date"
          value={level.endDate}
          onChange={(event) => onChange({ endDate: event.target.value })}
          disabled={disabled || level.inProgress}
        />
      </label>
      <label className={styles.checkField}>
        <input
          type="checkbox"
          checked={level.inProgress}
          onChange={(event) => onChange({ inProgress: event.target.checked, endDate: event.target.checked ? '' : level.endDate })}
          disabled={disabled}
        />
        <span>
          <strong>En curso</strong>
        </span>
      </label>
      <div className={styles.fullField}>
        <LocaleTabs idPrefix={`level-description-${level.role || 'nuevo'}`} locales={activeLocales}>
          {(locale) => (
            <label className={styles.field}>
              <span>Descripción ({LOCALE_LABELS[locale] ?? locale})</span>
              <textarea
                value={level.description[locale] ?? ''}
                onChange={(event) => onChange({ description: { ...level.description, [locale]: event.target.value } })}
                maxLength={2000}
                rows={3}
                disabled={disabled}
              />
            </label>
          )}
        </LocaleTabs>
      </div>
      <div className={styles.fullField}>
        <span className={styles.highlightsLabel}>Highlights</span>
        <RepeaterField
          items={level.highlights}
          onChange={(highlights) => onChange({ highlights })}
          createItem={() => ({}) as TranslatableString}
          addLabel="Añadir highlight"
          emptyText="Sin highlights todavía."
          itemLabel={(_highlight, index) => `Highlight ${index + 1}`}
          renderItem={(highlight, _index, updateHighlight) => (
            <LocaleTabs idPrefix={`highlight-${level.role || 'nuevo'}`} locales={activeLocales}>
              {(locale) => (
                <label className={styles.field}>
                  <span>{LOCALE_LABELS[locale] ?? locale}</span>
                  <input
                    value={highlight[locale] ?? ''}
                    onChange={(event) => updateHighlight({ [locale]: event.target.value })}
                    maxLength={300}
                    disabled={disabled}
                  />
                </label>
              )}
            </LocaleTabs>
          )}
        />
      </div>
    </div>
  );
}

export function ExperienceEditor({ id }: { id: string }) {
  const router = useRouter();
  const [experience, setExperience] = useState<Experience>();
  const [status, setStatus] = useState<'loading' | 'error' | 'forbidden' | 'not-found'>('loading');

  const load = useMemo(
    () => async () => {
      setStatus('loading');
      try {
        setExperience(await getExperience(id));
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

  if (experience) return <ExperienceForm experience={experience} />;

  if (status === 'loading') {
    return (
      <div className={styles.centerState} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Cargando experiencia…</p>
      </div>
    );
  }

  return (
    <div className={styles.stateCard} role={status === 'error' ? 'alert' : undefined}>
      <h1>
        {status === 'not-found'
          ? 'Experiencia no encontrada'
          : status === 'forbidden'
            ? 'Acceso restringido'
            : 'No pudimos cargar la experiencia'}
      </h1>
      <p>
        {status === 'not-found'
          ? 'Puede que se haya eliminado o que el enlace ya no sea válido.'
          : status === 'forbidden'
            ? 'Tu cuenta no tiene permiso para editar esta experiencia.'
            : 'Comprueba la conexión con el API e inténtalo nuevamente.'}
      </p>
      {status === 'error' ? (
        <button className={styles.primaryButton} type="button" onClick={() => void load()}>
          Reintentar
        </button>
      ) : (
        <Link className={styles.secondaryButton} href="/admin/experiences">
          Volver al listado
        </Link>
      )}
    </div>
  );
}
