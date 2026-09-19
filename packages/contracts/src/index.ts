export interface HealthResponse {
  status: 'ok';
  service: 'devsure-api';
  timestamp: string;
}

export interface PublicErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  requestId?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface TechnologyCard {
  id: string;
  name: string;
  slug: string;
  category: string;
  summary?: string;
  iconKey: string;
  /** Admin-uploaded PNG icon; falls back to the bundled/SVG icon while unset. */
  icon?: string;
  featured: boolean;
  sortOrder: number;
}

export type AdminRole = 'ADMIN';

export interface AdminIdentity {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  mustChangePassword: boolean;
}

export interface AuthResponse {
  user: AdminIdentity;
  csrfToken: string;
}

/** Locales supported by the platform; an owner activates a subset via `activeLocales`. */
export const SUPPORTED_LOCALES = [
  'en',
  'es',
  'pt',
  'fr',
  'de',
  'it',
  'nl',
  'ja',
  'zh',
  'ko',
  'ru',
  'ar',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Editorial field stored as JSON in the database, one value per locale. */
export type TranslatableString = Partial<Record<string, string>>;

/**
 * Resolves an editorial value for a locale: current locale, then "en", then
 * the first non-empty value. Mirrors the fallback rule content editors rely on.
 */
export function translateValue(
  value: TranslatableString | string | null | undefined,
  locale: string,
): string | null {
  if (value == null || typeof value === 'string') return value ?? null;
  const direct = value[locale];
  if (direct?.trim()) return direct;
  const english = value.en;
  if (english?.trim()) return english;
  const fallback = Object.values(value).find((entry) => entry?.trim());
  return fallback ?? null;
}

/** One entry in the "Nosotros" metrics strip (e.g. 8 years / 40+ projects). */
export interface ProfileStat {
  value: number;
  suffix?: string;
  label: TranslatableString;
}

export interface Profile {
  id: string;
  username: string;
  email: string;
  name: string;
  fullName?: string;
  headline: TranslatableString;
  bio: TranslatableString;
  avatar?: string;
  resume: TranslatableString;
  stats: ProfileStat[];
  activeLocales: string[];
  defaultLocale: string;
  /** Site-wide icon mark (header + footer); falls back to the "DS" badge while unset. */
  logo?: string;
  /** Site-wide "DevSure" wordmark image, shown beside `logo`; falls back to plain text while unset. */
  logoWordmark?: string;
  /** Decorative hero visual (home page); falls back to the procedural orb while unset. */
  heroVisual?: string;
  phone?: string;
  address?: string;
  businessHours?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
}

export interface UpdateProfileInput {
  email?: string;
  name?: string;
  fullName?: string;
  headline?: TranslatableString;
  bio?: TranslatableString;
  avatar?: string;
  resume?: TranslatableString;
  stats?: ProfileStat[];
  activeLocales?: string[];
  defaultLocale?: string;
  logo?: string;
  logoWordmark?: string;
  heroVisual?: string;
  phone?: string;
  address?: string;
  businessHours?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
}

export interface Translations {
  heroTag?: string;
  heroTitle: TranslatableString;
  heroCopy: TranslatableString;
  heroNote: TranslatableString;
  aboutHeading: TranslatableString;
  aboutBody: TranslatableString;
  strengthsHeading: TranslatableString;
  strengthsIntro: TranslatableString;
  experienceHeading: TranslatableString;
  experienceIntro: TranslatableString;
  educationHeading: TranslatableString;
  portfolioHeading: TranslatableString;
  portfolioIntro: TranslatableString;
  skillsHeading: TranslatableString;
  skillsIntro: TranslatableString;
  workstyleHeading: TranslatableString;
  workstyleIntro: TranslatableString;
  testimonialsHeading: TranslatableString;
  faqHeading: TranslatableString;
  blogHeading: TranslatableString;
  contactHeading: TranslatableString;
  contactIntro: TranslatableString;
  /** Two-paragraph "about" copy under the footer logo. */
  footerAboutPrimary: TranslatableString;
  footerAboutSecondary: TranslatableString;
  /** Centered pull-quote in the "Nuestra medida" section of `/cultura`. */
  cultureManifesto: TranslatableString;
}

export type UpdateTranslationsInput = Partial<Translations>;

/**
 * Storage folders from spec §8, one per uploadable field. Kept as a
 * type-only union (no runtime array) so the API — which is CommonJS and
 * cannot `require()` a value export from this ESM-only package (see the
 * `SUPPORTED_LOCALES` note above) — never needs to import it as a value.
 */
export type UploadFolder =
  | 'avatars'
  | 'resumes'
  | 'experiences-logos'
  | 'projects-covers'
  | 'projects-gallery'
  | 'studies-logos'
  | 'culture-stories'
  | 'culture-team'
  | 'testimonials'
  | 'posts-covers'
  | 'network-icons'
  | 'client-logos'
  | 'site-logo'
  | 'hero-visual'
  | 'technology-icons';

export interface UploadResult {
  path: string;
  url: string;
}

/** One role held at a company; `experiences.levels[]` in spec §5.3. */
export interface ExperienceLevel {
  role: string;
  startDate?: string;
  endDate?: string | null;
  inProgress?: boolean;
  description?: TranslatableString;
  highlights?: TranslatableString[];
}

export interface Experience {
  id: string;
  company: string;
  slug: string;
  logo?: string;
  summary: TranslatableString;
  techStack: string[];
  levels: ExperienceLevel[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExperienceInput {
  company: string;
  slug?: string;
  logo?: string;
  summary?: TranslatableString;
  techStack?: string[];
  levels: ExperienceLevel[];
  sortOrder?: number;
}

/** One app/platform within a multi-app project; `projects.apps[]` in spec §5.4. */
export interface ProjectApp {
  name: string;
  platform?: string;
  description?: TranslatableString;
  techStack?: string[];
  links?: Record<string, string>;
}

export interface Project {
  id: string;
  experienceId?: string;
  title: TranslatableString;
  slug: string;
  category?: string;
  excerpt: TranslatableString;
  description: TranslatableString;
  coverImage?: string;
  gallery: string[];
  techStack: string[];
  apps: ProjectApp[];
  url?: string;
  repoUrl?: string;
  featured: boolean;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInput {
  experienceId?: string | null;
  title: TranslatableString;
  slug?: string;
  category?: string;
  excerpt?: TranslatableString;
  description?: TranslatableString;
  coverImage?: string;
  gallery?: string[];
  techStack?: string[];
  apps?: ProjectApp[];
  url?: string;
  repoUrl?: string;
  featured?: boolean;
  sortOrder?: number;
  publishedAt?: string | null;
}

export interface Study {
  id: string;
  institution: string;
  title: TranslatableString;
  field?: string;
  description: TranslatableString;
  startDate?: string;
  endDate?: string | null;
  inProgress: boolean;
  logo?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudyInput {
  institution: string;
  title: TranslatableString;
  field?: string;
  description?: TranslatableString;
  startDate?: string;
  endDate?: string | null;
  inProgress?: boolean;
  logo?: string;
  sortOrder?: number;
}

/**
 * One card of the `/cultura` narrative 3D column (see
 * apps/web/PLAN-CULTURA-SPINE-3D.md) — `kicker`/`title`/`description` are
 * the same narrative copy the column's cards and the accessible story list
 * both read from; `imageSrc`/`imageAlt` back the card's texture and the
 * CSS/JS fallback's `<Image>`. No `width`/`height`: the 3D layer renders
 * every card at one fixed aspect ratio regardless of the source image's
 * own dimensions, so they'd be unused metadata.
 */
export interface CultureStory {
  id: string;
  kicker: TranslatableString;
  title: TranslatableString;
  description: TranslatableString;
  imageSrc: string;
  imageAlt: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CultureStoryInput {
  kicker: TranslatableString;
  title: TranslatableString;
  description: TranslatableString;
  imageSrc: string;
  imageAlt: string;
  sortOrder?: number;
}

/**
 * One person in the "Nuestro equipo" grayscale-to-color reveal on
 * `/cultura` (`TeamRevealSection`). `name`/`role` are plain strings, not
 * `TranslatableString`, matching the rest of this content today. Two
 * portraits, same person/framing/aspect ratio: `neutralImage` renders in
 * grayscale until revealed, `smilingImage` is the color reveal.
 */
export interface CultureTeamMember {
  id: string;
  name: string;
  role: string;
  neutralImage: string;
  smilingImage: string;
  alt?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CultureTeamMemberInput {
  name: string;
  role: string;
  neutralImage: string;
  smilingImage: string;
  alt?: string;
  sortOrder?: number;
}

/**
 * Which of the six hand-built blueprint scenes (and matching icon) a pillar
 * shows on `/cultura`'s "What we value" showcase. Decoupled from `sortOrder`
 * so re-ordering or renaming a pillar never swaps its artwork.
 */
export type CulturePillarVisual =
  | 'integrity'
  | 'honesty'
  | 'respect'
  | 'teamwork'
  | 'humility'
  | 'commitment';

/**
 * One value of the "What we value" showcase on `/cultura` (`CulturePillars`).
 * Plain strings, not `TranslatableString`, matching `CultureTeamMember` and
 * the rest of this page's Spanish-only content today.
 */
export interface CulturePillar {
  id: string;
  title: string;
  /** Short "A · B" keyword line shown under the title in the list. */
  keywords: string;
  description: string;
  visual: CulturePillarVisual;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CulturePillarInput {
  title: string;
  keywords?: string;
  description: string;
  visual: CulturePillarVisual;
  sortOrder?: number;
}

export interface Service {
  id: string;
  title: TranslatableString;
  description: TranslatableString;
  icon?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceInput {
  title: TranslatableString;
  description: TranslatableString;
  icon?: string;
  sortOrder?: number;
}

export interface Strength {
  id: string;
  label: TranslatableString;
  title: TranslatableString;
  body: TranslatableString;
  techStack: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface StrengthInput {
  label: TranslatableString;
  title: TranslatableString;
  body: TranslatableString;
  techStack?: string[];
  sortOrder?: number;
}

export interface WorkStyleItem {
  id: string;
  text: TranslatableString;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkStyleItemInput {
  text: TranslatableString;
  sortOrder?: number;
}

export interface Faq {
  id: string;
  question: TranslatableString;
  answer: TranslatableString;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FaqInput {
  question: TranslatableString;
  answer: TranslatableString;
  sortOrder?: number;
}

export const TESTIMONIAL_SOURCES = ['workana', 'linkedin', 'upwork', 'email', 'other'] as const;
export type TestimonialSource = (typeof TESTIMONIAL_SOURCES)[number];

/** Backs the colored result badge on the public testimonial card (icon + label pair chosen in admin). */
export const TESTIMONIAL_HIGHLIGHT_ICONS = ['delivery', 'quality', 'infrastructure', 'support'] as const;
export type TestimonialHighlightIcon = (typeof TESTIMONIAL_HIGHLIGHT_ICONS)[number];

export interface Testimonial {
  id: string;
  author: string;
  role?: string;
  company?: string;
  quote: string;
  avatar?: string;
  rating: number;
  highlightText?: string;
  highlightIcon?: TestimonialHighlightIcon;
  source?: TestimonialSource;
  sourceUrl?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TestimonialInput {
  author: string;
  role?: string;
  company?: string;
  quote: string;
  avatar?: string;
  rating?: number;
  highlightText?: string;
  highlightIcon?: TestimonialHighlightIcon;
  source?: TestimonialSource;
  sourceUrl?: string;
  sortOrder?: number;
}

/**
 * Company-level adaptation of spec §5.12's blog `category`: DevSure is a
 * company portfolio (not a personal one), so posts are grouped by the kind
 * of company content rather than left uncategorized.
 */
export const POST_CATEGORIES = ['engineering', 'qa', 'case-studies', 'company-news'] as const;
export type PostCategory = (typeof POST_CATEGORIES)[number];

export interface Post {
  id: string;
  title: TranslatableString;
  slug: string;
  excerpt: TranslatableString;
  content: TranslatableString;
  category?: PostCategory;
  coverImage?: string;
  publishedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostInput {
  title: TranslatableString;
  slug?: string;
  excerpt?: TranslatableString;
  content: TranslatableString;
  category?: PostCategory;
  coverImage?: string;
  publishedAt?: string | null;
  sortOrder?: number;
}

export interface TechnologyInput {
  name: string;
  slug: string;
  category: string;
  summary?: string;
  iconKey: string;
  icon?: string;
  featured: boolean;
  sortOrder: number;
  publicationStatus: TechnologyPublicationStatus;
}

export type TechnologyPublicationStatus = 'draft' | 'published';

export interface AdminTechnology extends TechnologyCard {
  publicationStatus: TechnologyPublicationStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Trust-strip logo shown under the Hero (sinaloanube-master's `clientes`). */
export interface ClientLogo {
  id: string;
  name: string;
  logo: string;
  websiteUrl?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientLogoInput {
  name: string;
  logo: string;
  websiteUrl?: string;
  sortOrder?: number;
}

/** Fixed vertical menu on the far right edge of every page (spec follow-up). */
export interface SocialLink {
  id: string;
  name: string;
  url: string;
  /** Selects the bundled glyph (e.g. 'facebook', 'linkedin') shown until `icon` is set. */
  iconKey: string;
  /** Admin-uploaded PNG/SVG icon; overrides the bundled glyph when set. */
  icon?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLinkInput {
  name: string;
  url: string;
  iconKey: string;
  icon?: string;
  sortOrder?: number;
}

/**
 * Single aggregate read for the public home page (spec §10.7, §12): every
 * section the home renders in one request, in the order the page shows them
 * (see `sinaloanube-master/resources/views/landing.blade.php`). Editorial
 * fields stay as `TranslatableString` — the caller resolves the locale with
 * `translateValue()` at render time instead of baking one locale into the
 * response.
 */
export interface PublicPortfolio {
  profile: Profile;
  translations: Translations;
  clientLogos: ClientLogo[];
  socialLinks: SocialLink[];
  experiences: Experience[];
  projects: Project[];
  studies: Study[];
  cultureStories: CultureStory[];
  cultureTeam: CultureTeamMember[];
  culturePillars: CulturePillar[];
  services: Service[];
  strengths: Strength[];
  workStyleItems: WorkStyleItem[];
  faqs: Faq[];
  testimonials: Testimonial[];
  posts: Post[];
}
