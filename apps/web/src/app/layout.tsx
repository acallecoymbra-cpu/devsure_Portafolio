import type { Metadata, Viewport } from 'next';
import { SiteChrome } from '@/components/site-chrome';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://devsure.example'),
  title: {
    default: 'DevSure | Desarrollo de software confiable',
    template: '%s | DevSure',
  },
  description:
    'Creamos soluciones digitales mantenibles con una base técnica clara y capacidades verificables.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'DevSure | Desarrollo de software confiable',
    description:
      'Creamos soluciones digitales mantenibles con una base técnica clara y capacidades verificables.',
    type: 'website',
    siteName: 'DevSure',
    url: 'https://devsure.example',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#070b14',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
