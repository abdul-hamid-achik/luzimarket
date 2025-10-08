/*
 * LUZIMARKET - Modern E-commerce Platform
 * Built by Abdul-Hamid Achik - https://abdulachik.dev
 * 
 * A curated marketplace for extraordinary gifts and unique experiences in Mexico
 */

import type { Metadata } from "next";
import { CsrfProvider } from "@/components/providers/csrf-provider";
import "./globals.css";
import "./leaflet-custom.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://luzimarket.shop'),
  title: {
    default: "LUZIMARKET - Regalos Extraordinarios y Experiencias Únicas en México",
    template: "%s | Luzimarket"
  },
  description: "Marketplace curado de regalos excepcionales, flores, chocolates, joyería y experiencias únicas. Vendedores seleccionados de todo México. Envío a domicilio.",
  keywords: [
    "regalos México",
    "marketplace regalos",
    "flores a domicilio",
    "chocolates artesanales",
    "regalos personalizados",
    "e-commerce México",
    "tienda online regalos",
    "envío CDMX",
    "regalos únicos"
  ],
  authors: [{ name: "Luzimarket" }],
  creator: "Luzimarket",
  publisher: "Luzimarket",
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
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    alternateLocale: ['en_US'],
    url: 'https://luzimarket.shop',
    siteName: 'Luzimarket',
    title: 'LUZIMARKET - Regalos Extraordinarios en México',
    description: 'Marketplace curado de regalos excepcionales y experiencias únicas. Vendedores seleccionados de todo México.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Luzimarket - Regalos Extraordinarios',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LUZIMARKET - Regalos Extraordinarios',
    description: 'Marketplace curado de regalos excepcionales en México',
    creator: '@luzimarket',
    images: ['/images/og-image.jpg'],
  },
  verification: {
    google: 'google-site-verification-code', // Add your verification code
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Organization structured data for Google
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Luzimarket",
    "url": "https://luzimarket.shop",
    "logo": "https://luzimarket.shop/images/logos/logo-simple.png",
    "description": "Marketplace curado de regalos excepcionales y experiencias únicas en México",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "MX",
      "addressLocality": "Ciudad de México"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "support@luzimarket.com"
    },
    "sameAs": [
      "https://instagram.com/luzimarket",
      "https://facebook.com/luzimarket",
      "https://tiktok.com/@luzimarket",
      "https://twitter.com/luzimarket"
    ]
  };

  return (
    <>
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <CsrfProvider>{null}</CsrfProvider>
      </head>
      {children}
    </>
  );
}
