import type { Metadata } from 'next';
import { CultureStoryForm } from '@/features/admin/components/culture-story-form';

export const metadata: Metadata = {
  title: 'Nueva card de cultura · Administración',
};

export default function NewCultureStoryPage() {
  return <CultureStoryForm />;
}
