import { Suspense } from 'react';
import { CaseStudiesSection } from '@/features/case-studies/components/case-studies-section';
import { HomeHero } from '@/features/home/components/home-hero';
import { AboutSection } from '@/features/portfolio/components/about-section';
import { BlogSection } from '@/features/portfolio/components/blog-section';
import { ClientLogosSection } from '@/features/portfolio/components/client-logos-section';
import { ContactSection } from '@/features/portfolio/components/contact-section';
import { ExperienceSection } from '@/features/portfolio/components/experience-section';
import { FaqSection } from '@/features/portfolio/components/faq-section';
import { ProcessSection } from '@/features/portfolio/components/process-section';
import { ServicesSection } from '@/features/portfolio/components/services-section';
import { StrengthsSection } from '@/features/portfolio/components/strengths-section';
import { StudiesSection } from '@/features/portfolio/components/studies-section';
import { TestimonialsSection } from '@/features/portfolio/components/testimonials-section';
import { getPortfolio } from '@/features/portfolio/api/get-portfolio';
import { TechnologiesSection } from '@/features/technologies/components/technologies-section';
import { TechnologiesSkeleton } from '@/features/technologies/components/technologies-skeleton';

export default async function HomePage() {
  const portfolio = await getPortfolio();
  const { profile, translations } = portfolio;
  const locale = profile.defaultLocale || 'es';

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: profile.name,
    url: 'https://devsure.example',
    description:
      'Equipo de desarrollo de software enfocado en crear soluciones digitales confiables.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <HomeHero profile={profile} translations={translations} locale={locale} />

      <ClientLogosSection clientLogos={portfolio.clientLogos} />

      <AboutSection profile={profile} translations={translations} locale={locale} />

      <ServicesSection services={portfolio.services} translations={translations} locale={locale} />

      <Suspense fallback={<TechnologiesSkeleton />}>
        <TechnologiesSection />
      </Suspense>

      <ExperienceSection experiences={portfolio.experiences} translations={translations} locale={locale} />

      <StudiesSection studies={portfolio.studies} translations={translations} locale={locale} />

      <StrengthsSection strengths={portfolio.strengths} translations={translations} locale={locale} />

      <CaseStudiesSection projects={portfolio.projects} translations={translations} locale={locale} />

      <BlogSection posts={portfolio.posts} translations={translations} locale={locale} />

      <TestimonialsSection testimonials={portfolio.testimonials} translations={translations} locale={locale} />

      <ProcessSection workStyleItems={portfolio.workStyleItems} translations={translations} locale={locale} />

      <FaqSection faqs={portfolio.faqs} translations={translations} locale={locale} />

      <ContactSection profile={profile} translations={translations} locale={locale} />
    </>
  );
}
