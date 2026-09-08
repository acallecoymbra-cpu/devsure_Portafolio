import type { Metadata } from 'next';
import { PostEditor } from '@/features/admin/components/post-form';

export const metadata: Metadata = {
  title: 'Editar entrada · Administración',
};

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostEditor id={id} />;
}
