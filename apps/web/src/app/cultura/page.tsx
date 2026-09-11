import type { Metadata } from 'next';
import Link from 'next/link';
import {
  companyStories,
  culturePrinciples,
  cultureStories,
} from '@/features/culture/culture-content';
import { CompanyCarousel } from '@/features/culture/components/culture-carousels';
import { CultureSpineScene } from '@/features/culture/components/culture-spine-scene';
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

      {/*
        Slice 9.6: the user asked for the column to show as a backdrop even
        further up, starting from the hero ("Cultura DevSure") — so the hero
        and the "Quiénes somos" heading move from being plain sections before
        CultureSpineScene to its `header` prop, making them foreground
        content that scrolls over the pinned column too, same mechanism
        Slice 9.3 already uses for "Lo que cuidamos"/"Nuestra
        medida"/"Confianza compartida" below (falls back to a plain,
        non-overlapping stack when the CSS spine is in play).
      */}
      <CultureSpineScene
        stories={cultureStories}
        header={
          <>
            <section className={styles.hero} aria-labelledby="culture-title">
              <div className="shell">
                <p className="eyebrow">Cultura DevSure</p>
                <h1 id="culture-title">Personas curiosas. Trabajo claro. Software que se sostiene.</h1>
                <div className={styles.heroFooter}>
                  <p>
                    Somos un equipo que combina ingeniería, conversación honesta y mejora continua
                    para convertir problemas complejos en soluciones que puedan evolucionar.
                  </p>
                  <a href="#nuestra-forma-de-trabajar">
                    Conocer quiénes somos <span aria-hidden="true">↓</span>
                  </a>
                </div>
              </div>
            </section>

            <section
              className={styles.storiesSection}
              id="nuestra-forma-de-trabajar"
              aria-labelledby="stories-title"
            >
              <div className="shell">
                <div className={styles.sectionHeading}>
                  <div>
                    <p className="eyebrow">Quiénes somos</p>
                    <h2 id="stories-title">Una forma de trabajar que se nota en cada entrega.</h2>
                  </div>
                  <p>
                    La cultura no es una frase en la pared. Es cómo escuchamos, decidimos,
                    verificamos y avanzamos juntos.
                  </p>
                </div>
              </div>
            </section>
          </>
        }
      >
        <section className={styles.principlesSection} aria-labelledby="principles-title">
          <div className="shell">
            <div className={styles.principlesIntro}>
              <p className="eyebrow">Lo que cuidamos</p>
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
