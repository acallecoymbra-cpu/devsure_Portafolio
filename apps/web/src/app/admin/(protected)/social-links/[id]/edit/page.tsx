import type { Metadata } from 'next';
import { SocialLinkEditor } from '@/features/admin/components/social-link-form';

export const metadata: Metadata = {
  title: 'Editar red social · Administración',
};

export default async function EditSocialLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SocialLinkEditor id={id} />;
}
