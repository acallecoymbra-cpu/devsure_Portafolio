import type { Metadata } from 'next';
import Link from 'next/link';
import { Bodoni_Moda } from 'next/font/google';
import { translateValue } from '@devsure/contracts';
import type { CulturePillar, CultureStory } from '@/features/culture/culture-content';
import { companyStories } from '@/features/culture/culture-content';
import { CompanyCarousel } from '@/features/culture/components/culture-carousels';
import { CulturePillars } from '@/features/culture/components/culture-pillars';
import { CultureFlowLines } from '@/features/culture/components/culture-flow-lines';
import { CultureSpineScene } from '@/features/culture/components/culture-spine-scene';
import { CultureWaterSection } from '@/features/culture/components/culture-water-section';
import { TeamRevealSection } from '@/features/culture/components/team-reveal-section';
import { SectionErrorBoundary } from '@/components/section-error-boundary';
import { getPortfolio } from '@/features/portfolio/api/get-portfolio';
import { getStorageUrl } from '@/lib/config';
import { getTeamImageUrl } from '@/features/culture/team-image';
import styles from '@/features/culture/culture.module.css';

// Same didone serif already chosen for this page's parked wordmark
// (`culture-kinetic-wordmark.tsx`) — reused here for the "Nuestra medida"
// pull-quote so the page keeps one consistent "editorial" display face
// instead of introducing a second one.
const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['500'],
  style: ['normal'],
  display: 'swap',
});

// Admin-editable via /admin/cultura (Translations.cultureManifesto) — this
// is only the fallback shown when that field is empty.
const DEFAULT_MANIFESTO = 'Creemos en el software honesto, claro hoy y fácil de decidir mañana.';

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

// The 3D column always renders every card at this one fixed aspect ratio
// (see spine-cards.ts's CARD_ASPECT) regardless of the source image's own
// dimensions — these are only here because `CultureStory.image` (the
// view-model the 3D/CSS layers already consume, unchanged by the
// Slice 14 admin migration below) still requires *some* width/height.
const FALLBACK_IMAGE_WIDTH = 1600;
const FALLBACK_IMAGE_HEIGHT = 900;

export default async function CulturePage() {
  const {
    profile,
    translations,
    cultureStories: adminCultureStories,
    cultureTeam,
    culturePillars: adminCulturePillars,
  } = await getPortfolio();
  const teamMembers = cultureTeam.map((member) => ({
    ...member,
    neutralImage: getTeamImageUrl(member.neutralImage),
    smilingImage: getTeamImageUrl(member.smilingImage),
  }));
  // Admin-managed (/admin/cultura → Pilares); the number is just the list position.
  const culturePillars: CulturePillar[] = adminCulturePillars.map((pillar, index) => ({
    id: pillar.id,
    number: String(index + 1).padStart(2, '0'),
    title: pillar.title,
    keywords: pillar.keywords,
    description: pillar.description,
    visual: pillar.visual,
  }));
  const locale = profile.defaultLocale || 'es';
  const manifesto = translateValue(translations.cultureManifesto, locale) ?? DEFAULT_MANIFESTO;

  // Slice 14 (PLAN-CULTURA-SPINE-3D.md): the column's cards used to be a
  // hardcoded array in culture-content.ts — now admin-managed
  // (/admin/culture-stories), same as every other list content on the
  // site. Translated here, once, into the same plain-string `CultureStory`
  // shape the 3D engine and its CSS/JS fallback already expect, so neither
  // of them needed to change for this.
  const cultureStories: CultureStory[] = adminCultureStories.map((story) => ({
    id: story.id,
    kicker: translateValue(story.kicker, locale) ?? '',
    title: translateValue(story.title, locale) ?? '',
    description: translateValue(story.description, locale) ?? '',
    image: {
      // A real bug the user caught: `FileUploadField` returns a path with
      // no leading slash (e.g. `culture/stories/<uuid>.png`, resolved
      // through the API's storage server — see `getStorageUrl`, the same
      // helper every other admin-uploaded image on the site already goes
      // through), which is *not* directly servable the way the 7 seeded
      // rows' literal `/culture/*.png` web-app `/public` paths are. The
      // seed script never has a leading slash on a real upload path, so
      // this check is unambiguous, not a guess.
      src: story.imageSrc.startsWith('/') ? story.imageSrc : getStorageUrl(story.imageSrc),
      alt: story.imageAlt,
      width: FALLBACK_IMAGE_WIDTH,
      height: FALLBACK_IMAGE_HEIGHT,
    },
  }));

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

        User request: the hero no longer carries its own copy block
        ("Cultura DevSure" eyebrow / "Personas curiosas..." h1 / lead
        paragraph) — `CultureWaterSection` renders on its own (just the
        photo + wordmarks), and `.manifestoSection` ("Nuestra medida")
        follows it directly, no `children` in between.
      */}
      <div className={styles.flowScope}>
      <CultureWaterSection />

      {/* Three page-long lines — placed right after the hero on purpose, see CultureFlowLines. */}
      <CultureFlowLines />

      <section className={styles.manifestoSection} aria-labelledby="manifesto-title">
        <div className="shell">
          <p className="eyebrow">Nuestra medida</p>
          <blockquote className={styles.manifestoQuote}>
            <p id="manifesto-title" className={bodoniModa.className}>
              {manifesto}
            </p>
          </blockquote>
        </div>
      </section>

      <CultureSpineScene stories={cultureStories}>
        {culturePillars.length > 0 ? <CulturePillars pillars={culturePillars} /> : null}

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
          {teamMembers.length > 0 ? <TeamRevealSection members={teamMembers} eyebrow="Nuestro equipo" title="Las personas detrás de DevSure" /> : null}
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
      </div>
    </>
  );
}
