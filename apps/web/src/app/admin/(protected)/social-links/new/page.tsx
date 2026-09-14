import type { Metadata } from 'next';
import { SocialLinkForm } from '@/features/admin/components/social-link-form';

export const metadata: Metadata = {
  title: 'Nueva red social · Administración',
};

export default function NewSocialLinkPage() {
  return <SocialLinkForm />;
}
