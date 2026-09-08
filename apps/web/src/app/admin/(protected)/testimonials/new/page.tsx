import type { Metadata } from 'next';
import { TestimonialForm } from '@/features/admin/components/testimonial-form';

export const metadata: Metadata = {
  title: 'Nuevo testimonio · Administración',
};

export default function NewTestimonialPage() {
  return <TestimonialForm />;
}
