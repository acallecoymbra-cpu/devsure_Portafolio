import type { Post, Translations } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';
import { getStorageUrl } from '@/lib/config';

interface BlogSectionProps {
  posts: Post[];
  translations: Translations;
  locale: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  engineering: 'Ingeniería',
  qa: 'QA',
  'case-studies': 'Casos de éxito',
  'company-news': 'Noticias de la empresa',
};

/** Recent posts only — the aggregate endpoint already caps this at 3 (spec §9). No public post detail page exists yet, so cards are informational, not links. */
export function BlogSection({ posts, translations, locale }: BlogSectionProps) {
  if (posts.length === 0) return null;

  const heading = translateValue(translations.blogHeading, locale) ?? 'Blog';

  return (
    <section className="section" id="blog" aria-labelledby="blog-title">
      <div className="shell">
        <div className="section-heading">
          <p className="eyebrow">Noticias</p>
          <h2 id="blog-title">{heading}</h2>
        </div>

        <ul className="blog-grid">
          {posts.map((post) => {
            const title = translateValue(post.title, locale);
            const excerpt = translateValue(post.excerpt, locale);

            return (
              <li key={post.id} className="blog-card">
                {post.coverImage ? (
                  <span className="blog-card-image">
                    <img src={getStorageUrl(post.coverImage)} alt="" loading="lazy" />
                  </span>
                ) : null}
                <div className="blog-card-content">
                  {post.category ? (
                    <span className="blog-card-tag">{CATEGORY_LABELS[post.category] ?? post.category}</span>
                  ) : null}
                  <h3>{title}</h3>
                  {excerpt ? <p>{excerpt}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
