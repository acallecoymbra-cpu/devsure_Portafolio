import type { Metadata } from 'next';
import { CultureStoryEditor } from '@/features/admin/components/culture-story-form';

export const metadata: Metadata = {
  title: 'Editar card de cultura · Administración',
};

export default async function EditCultureStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CultureStoryEditor id={id} />;
}
