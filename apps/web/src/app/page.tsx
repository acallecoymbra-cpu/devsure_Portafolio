import { Suspense } from 'react';
import { CaseStudiesSection } from '@/features/case-studies/components/case-studies-section';
import { HomeHero } from '@/features/home/components/home-hero';
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

      <HomeHero />

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
