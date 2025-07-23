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
  title: "LUZIMARKET - Handpicked extraordinary gifts",
  description: "Experiencias y productos seleccionados a mano para momentos especiales",
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
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <CsrfProvider>{null}</CsrfProvider>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
