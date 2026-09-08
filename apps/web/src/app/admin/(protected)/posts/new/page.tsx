import type { Metadata } from 'next';
import { PostForm } from '@/features/admin/components/post-form';

export const metadata: Metadata = {
  title: 'Nueva entrada · Administración',
};

export default function NewPostPage() {
  return <PostForm />;
}
