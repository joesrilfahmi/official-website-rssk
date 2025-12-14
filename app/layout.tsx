// ============================================
// FILE: src/app/layout.tsx
// Root layout with complete configuration
// ============================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { Profile } from '@/config/profile';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: `${Profile.shortName} | Official`,
    template: `%s | ${Profile.shortName}`,
  },
  description: Profile.description,
  keywords: [
    'rumah sakit',
    'RS Siti Khodijah',
    'layanan kesehatan',
    'Muhammadiyah',
    'Sepanjang',
    'Sidoarjo',
    'Jawa Timur',
    'hospital',
    'healthcare',
  ],
  authors: [
    {
      name: Profile.name,
      url: 'https://www.sitikhodijah.com',
    },
  ],
  creator: Profile.name,
  publisher: Profile.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: Profile.logo, sizes: 'any' },
      { url: Profile.logo, sizes: '16x16', type: 'image/webp' },
      { url: Profile.logo, sizes: '32x32', type: 'image/webp' },
    ],
    shortcut: Profile.logo,
    apple: [
      { url: Profile.logo },
      { url: Profile.logo, sizes: '180x180', type: 'image/webp' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://www.sitikhodijah.com',
    title: `${Profile.shortName} | Official`,
    description: Profile.description,
    siteName: Profile.name,
    images: [
      {
        url: Profile.logo,
        width: 1200,
        height: 630,
        alt: Profile.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${Profile.shortName} | Official`,
    description: Profile.description,
    images: [Profile.logo],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Additional meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={Profile.shortName} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />

        {/* Contact information */}
        <meta property="business:contact_data:street_address" content={Profile.address} />
        <meta property="business:contact_data:locality" content="Sidoarjo" />
        <meta property="business:contact_data:region" content="Jawa Timur" />
        <meta property="business:contact_data:postal_code" content="61257" />
        <meta property="business:contact_data:country_name" content="Indonesia" />
        <meta property="business:contact_data:email" content={Profile.email} />
        <meta property="business:contact_data:phone_number" content={Profile.phone} />
        <meta property="business:contact_data:website" content="https://www.sitikhodijah.com" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="hospital-theme"
        >
          {/* Skip to main content for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
          >
            Skip to main content
          </a>

          <div className="relative flex min-h-screen flex-col">
            <main id="main-content" className="flex-1">
              {children}
            </main>
          </div>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </ThemeProvider>

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Hospital',
              name: Profile.name,
              alternateName: Profile.shortName,
              url: 'https://www.sitikhodijah.com',
              logo: Profile.logo,
              description: Profile.description,
              telephone: Profile.phone,
              email: Profile.email,
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Jl. Raya Bebekan, RT.02/ RW.01, Bebekan',
                addressLocality: 'Sidoarjo',
                addressRegion: 'Jawa Timur',
                postalCode: '61257',
                addressCountry: 'ID',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: -7.3486,
                longitude: 112.7294,
              },
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday',
                ],
                opens: '00:00',
                closes: '23:59',
              },
              medicalSpecialty: [
                'Emergency Medicine',
                'Internal Medicine',
                'Pediatrics',
                'Surgery',
                'Obstetrics and Gynecology',
              ],
              availableService: [
                {
                  '@type': 'MedicalProcedure',
                  name: 'Emergency Care',
                },
                {
                  '@type': 'MedicalProcedure',
                  name: 'Inpatient Care',
                },
                {
                  '@type': 'MedicalProcedure',
                  name: 'Outpatient Care',
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}