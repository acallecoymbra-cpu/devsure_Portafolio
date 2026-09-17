import type { Metadata } from 'next';
import Link from 'next/link';
import {
  companyStories,
  culturePrinciples,
  cultureStories,
  teamMembers,
} from '@/features/culture/culture-content';
import { CompanyCarousel } from '@/features/culture/components/culture-carousels';
import { CultureSpineScene } from '@/features/culture/components/culture-spine-scene';
import { CultureWaterSection } from '@/features/culture/components/culture-water-section';
import { TeamRevealSection } from '@/features/culture/components/team-reveal-section';
import { SectionErrorBoundary } from '@/components/section-error-boundary';
import styles from '@/features/culture/culture.module.css';

export const metadata: Metadata = {
  title: 'Cultura',
  description:
    'Conoce cómo colaboramos, qué principios orientan nuestro trabajo y las organizaciones que han confiado en DevSure.',
  alternates: {
    canonical: '/cultura',
  },
  openGraph: {
    title: 'Cultura | DevSure',
    description: 'Personas curiosas, trabajo claro y software preparado para evolucionar.',
    type: 'website',
    url: '/cultura',
  },
};

const cultureJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'Cultura DevSure',
  url: 'https://devsure.example/cultura',
  about: {
    '@type': 'Organization',
    name: 'DevSure',
  },
  description: 'Cómo colaboramos y qué principios orientan el trabajo del equipo de DevSure.',
};

export default function CulturePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(cultureJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <div className={styles.pageBackdrop} aria-hidden="true" />

      {/*
        Restructure (user request): the column is no longer a backdrop from
        the very top of the page — sections 1-2 (hero, statement) are plain
        content above `CultureSpineScene`, not its `header` prop, so the
        pinned canvas only starts appearing once scrolling actually reaches
        it (section 3). That also means `storySpacer` is now the *first*
        thing in the spine's foreground content, so `headerClearAmount` (see
        spine-engine.ts) ramps up almost immediately — the first card shows
        up after only a little scroll, not after clearing a tall header.

        The hero copy below is `CultureWaterSection`'s children (user
        request), but it renders *after* that component's `.frame` (the
        photo + wordmarks), not inside it — the photo's box is pinned to its
        own aspect ratio there specifically so this copy, whatever its
        length, can never stretch it taller and force `object-fit: cover`
        to crop in hard and lose one of the two stones. The manifesto quote
        is its own plain section rather than sharing that image (an earlier
        version stretched the shared photo across both, which relied on
        `cover` cropping to fill the extra height). The old side-by-side
        conference-room photo stays gone; the shared background already
        carries the hero block visually.
      */}
      <CultureWaterSection>
        <div className={`shell ${styles.hero} ${styles.heroLayout}`}>
          <div className={styles.heroCopy}>
            <p className="eyebrow">Cultura DevSure</p>
            <h1 id="culture-title">Personas curiosas. Trabajo claro. Software que se sostiene.</h1>
            <p className={styles.heroLead}>
              Somos un equipo que combina ingeniería, conversación honesta y mejora continua para
              convertir problemas complejos en soluciones que puedan evolucionar.
            </p>
          </div>
        </div>
      </CultureWaterSection>

      <section className={styles.manifestoSection} aria-labelledby="manifesto-title">
        <div className="shell">
          <p className="eyebrow">Nuestra medida</p>
          <blockquote>
            <p id="manifesto-title">
              El mejor trabajo no solo resuelve el presente: deja al equipo listo para tomar la
              siguiente buena decisión.
            </p>
          </blockquote>
        </div>
      </section>

      <CultureSpineScene stories={cultureStories}>
        {/* Placeholder — content to be defined. */}
        <section className={styles.cardSection} aria-labelledby="card-section-title">
          <div className="shell">
            <p className="eyebrow">Próximamente</p>
            <h2 id="card-section-title">Un espacio más para contar quiénes somos.</h2>
            <div className={styles.placeholderCard}>
              <p>Aquí va el contenido que definamos juntos.</p>
            </div>
          </div>
        </section>

        <section className={styles.principlesSection} aria-labelledby="principles-title">
          <div className="shell">
            <div className={styles.principlesIntro}>
              <p className="eyebrow">Valores</p>
              <h2 id="principles-title">Cómo se siente trabajar con nosotros.</h2>
            </div>
            <ol className={styles.principlesGrid}>
              {culturePrinciples.map((principle) => (
                <li key={principle.number}>
                  <span>{principle.number}</span>
                  <h3>{principle.title}</h3>
                  <p>{principle.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/*
          Rendered as CultureSpineScene's `children` (foreground content),
          same as the sections above/below it — the column keeps showing
          (and dimming, see .spineScrim) behind it, per the user's request
          to bring that back. Its own SectionErrorBoundary keeps a crash
          here (this section runs its own GSAP ScrollTrigger pin, on top of
          everything else going on in this scene) from taking out the
          column/cards or the sections around it.
        */}
        <SectionErrorBoundary
          fallback={
            <div className={styles.teamFallback} role="alert">
              <p className="eyebrow">Nuestro equipo</p>
              <p>No pudimos cargar esta sección en tu navegador. Actualiza la página para intentarlo de nuevo.</p>
            </div>
          }
        >
          <TeamRevealSection members={teamMembers} eyebrow="Nuestro equipo" title="Las personas detrás de DevSure" />
        </SectionErrorBoundary>

        <section className={styles.companiesSection} aria-labelledby="companies-title">
          <div className="shell">
            <div className={styles.sectionHeading}>
              <div>
                <p className="eyebrow">Confianza compartida</p>
                <h2 id="companies-title">Empresas para las que trabajamos.</h2>
              </div>
              <p>
                Publicamos únicamente colaboraciones reales. El carrusel crecerá a medida que nuevas
                empresas autoricen su presentación.
              </p>
            </div>
            <CompanyCarousel companies={companyStories} />
          </div>
        </section>
      </CultureSpineScene>

      <section className={styles.closingSection} aria-labelledby="closing-title">
        <div className={`shell ${styles.closingPanel}`}>
          <div>
            <p className="eyebrow">Conoce nuestro trabajo</p>
            <h2 id="closing-title">La cultura también se demuestra construyendo.</h2>
          </div>
          <Link className="button button-primary" href="/#trabajos-realizados">
            Ver trabajos realizados <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
