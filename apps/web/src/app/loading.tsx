import { TechnologiesSkeleton } from '@/features/technologies/components/technologies-skeleton';

export default function Loading() {
  return (
    <>
      <section className="hero hero-loading shell" aria-labelledby="page-loading-title">
        <div className="hero-copy">
          <p className="eyebrow">Software con criterio técnico</p>
          <h1 id="page-loading-title">Preparando la experiencia…</h1>
          <span className="skeleton-copy skeleton-shimmer" aria-hidden="true" />
        </div>
        <div className="hero-proof skeleton-shimmer" aria-hidden="true" />
      </section>
      <TechnologiesSkeleton />
    </>
  );
}
