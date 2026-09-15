import type { Metadata, Viewport } from 'next';
import { SiteChrome } from '@/components/site-chrome';
import { getSiteChromeData } from '@/features/portfolio/api/get-portfolio';
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f7fb' },
    { media: '(prefers-color-scheme: dark)', color: '#070b14' },
  ],
  colorScheme: 'dark light',
};

const THEME_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('devsure-theme');
    var theme = stored === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteChrome = await getSiteChromeData();

  return (
    <html lang="es">
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        <SiteChrome
          profile={siteChrome?.profile}
          services={siteChrome?.services}
          translations={siteChrome?.translations}
          socialLinks={siteChrome?.socialLinks}
          locale={siteChrome?.locale}
        >
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
