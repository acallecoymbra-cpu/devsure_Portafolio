import type { Metadata } from 'next';
import { ExperienceForm } from '@/features/admin/components/experience-form';

export const metadata: Metadata = {
  title: 'Nueva experiencia · Administración',
};

export default function NewExperiencePage() {
  return <ExperienceForm />;
}
