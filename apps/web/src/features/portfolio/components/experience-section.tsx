import type { Experience, Translations } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';
import { ParallaxBackground } from '@/components/parallax-background';
import { Reveal } from '@/components/reveal';
import { getStorageUrl } from '@/lib/config';
import { formatDateRange } from '../lib/format-date-range';

interface ExperienceSectionProps {
  experiences: Experience[];
  translations: Translations;
  locale: string;
}

export function ExperienceSection({ experiences, translations, locale }: ExperienceSectionProps) {
  if (experiences.length === 0) return null;

  const heading = translateValue(translations.experienceHeading, locale) ?? 'Trayectoria';
  const intro = translateValue(translations.experienceIntro, locale);

  return (
    <section className="section experience-section" id="experiencia" aria-labelledby="experience-title">
      <ParallaxBackground src="/photos/trajectory.webp" />
      <div className="shell">
        <div className="section-heading section-heading-wide">
          <div>
            <p className="eyebrow">Trayectoria</p>
            <h2 id="experience-title">{heading}</h2>
          </div>
          {intro ? <p>{intro}</p> : null}
        </div>

        <ul className="experience-list">
          {experiences.map((experience) => {
            const summary = translateValue(experience.summary, locale);

            return (
              <Reveal as="li" key={experience.id} className="experience-card">
                <div className="experience-card-header">
                  {experience.logo ? (
                    <img className="experience-logo" src={getStorageUrl(experience.logo)} alt="" loading="lazy" />
                  ) : null}
                  <div>
                    <h3>{experience.company}</h3>
                    {summary ? <p>{summary}</p> : null}
                  </div>
                </div>

                {experience.levels.length > 0 ? (
                  <ol className="experience-levels">
                    {experience.levels.map((level, index) => {
                      const description = translateValue(level.description, locale);
                      return (
                        <li key={index}>
                          <div className="experience-level-heading">
                            <strong>{level.role}</strong>
                            <span>{formatDateRange(level.startDate, level.endDate, level.inProgress)}</span>
                          </div>
                          {description ? <p>{description}</p> : null}
                        </li>
                      );
                    })}
                  </ol>
                ) : null}

                {experience.techStack.length > 0 ? (
                  <ul className="tag-row">
                    {experience.techStack.map((tech) => (
                      <li key={tech} className="tag-pill">
                        {tech}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
