import type { Metadata } from 'next';
import { TestimonialEditor } from '@/features/admin/components/testimonial-form';

export const metadata: Metadata = {
  title: 'Editar testimonio · Administración',
};

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TestimonialEditor id={id} />;
}
