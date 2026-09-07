import type { UploadFolder } from '@devsure/contracts';

export interface FolderConfig {
  /** Physical subdirectory under the uploads root; may nest (e.g. `projects/covers`). */
  directory: string;
  maxBytes: number;
  mimeTypes: readonly string[];
}

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
const MB = 1024 * 1024;

/** Mirrors the storage table in spec §8. */
export const FOLDER_CONFIG: Readonly<Record<UploadFolder, FolderConfig>> = {
  avatars: { directory: 'avatars', maxBytes: 2 * MB, mimeTypes: IMAGE_TYPES },
  resumes: { directory: 'resumes', maxBytes: 5 * MB, mimeTypes: ['application/pdf'] },
  'experiences-logos': { directory: 'experiences/logos', maxBytes: 2 * MB, mimeTypes: IMAGE_TYPES },
  'projects-covers': { directory: 'projects/covers', maxBytes: 4 * MB, mimeTypes: IMAGE_TYPES },
  'projects-gallery': { directory: 'projects/gallery', maxBytes: 4 * MB, mimeTypes: IMAGE_TYPES },
  'studies-logos': { directory: 'studies/logos', maxBytes: 2 * MB, mimeTypes: IMAGE_TYPES },
  testimonials: { directory: 'testimonials', maxBytes: 1 * MB, mimeTypes: IMAGE_TYPES },
  'posts-covers': { directory: 'posts/covers', maxBytes: 4 * MB, mimeTypes: IMAGE_TYPES },
  'network-icons': { directory: 'network-icons', maxBytes: 512 * 1024, mimeTypes: [...IMAGE_TYPES, 'image/svg+xml'] },
};

export const UPLOAD_FOLDER_KEYS = Object.keys(FOLDER_CONFIG) as UploadFolder[];

/** Largest per-folder limit; used as the multer interceptor's hard ceiling. */
export const MAX_UPLOAD_BYTES = Math.max(...Object.values(FOLDER_CONFIG).map((config) => config.maxBytes));

const EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
};

export function extensionFor(mimeType: string): string {
  return EXTENSION_BY_MIME[mimeType] ?? 'bin';
}
