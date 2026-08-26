import { Suspense } from 'react';
import { CaseStudiesSection } from '@/features/case-studies/components/case-studies-section';
import { TechnologiesSection } from '@/features/technologies/components/technologies-section';
import { TechnologiesSkeleton } from '@/features/technologies/components/technologies-skeleton';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'DevSure',
  url: 'https://devsure.example',
  description:
    'Equipo de desarrollo de software enfocado en crear soluciones digitales confiables.',
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero-background" aria-hidden="true">
          <video autoPlay muted loop playsInline poster="/hero/hero-poster.jpg">
            <source src="/hero/tron-ares.mkv" type="video/x-matroska" />
          </video>
        </div>
        <div className="hero-copy">
          <p className="eyebrow">Software con criterio técnico</p>
          <h1 id="hero-title">Construimos soluciones digitales preparadas para avanzar.</h1>
          <p className="hero-description">
            Convertimos necesidades de negocio en productos claros, mantenibles y listos para
            evolucionar junto a tu operación.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#tecnologias">
              Explorar tecnologías
            </a>
            <a className="button button-secondary" href="#enfoque">
              Conocer el enfoque
            </a>
          </div>
        </div>

        <div className="hero-proof" aria-labelledby="hero-proof-title">
          <p className="hero-proof-label">Una base técnica visible</p>
          <h2 id="hero-proof-title">Capacidad para construir, automatizar y mejorar.</h2>
          <p>
            Nuestro catálogo publicado reúne las herramientas y prácticas que respaldan cada
            decisión de implementación.
          </p>
          <a href="#tecnologias">
            Ver catálogo completo <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <CaseStudiesSection />

      <Suspense fallback={<TechnologiesSkeleton />}>
        <TechnologiesSection />
      </Suspense>

      <section className="section approach-section" id="enfoque" aria-labelledby="approach-title">
        <div className="shell approach-layout">
          <div>
            <p className="eyebrow">Cómo trabajamos</p>
            <h2 id="approach-title">
              Decisiones que siguen siendo útiles después del lanzamiento.
            </h2>
          </div>
          <p>
            Priorizamos claridad, calidad verificable y una arquitectura proporcional al problema.
            Así cada entrega puede mantenerse, probarse y crecer sin perder de vista el objetivo.
          </p>
        </div>
      </section>
    </>
  );
}
