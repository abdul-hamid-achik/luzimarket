import type { Metadata } from "next";
import { CsrfProvider } from "@/components/providers/csrf-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUZIMARKET - Handpicked extraordinary gifts",
  description: "Experiencias y productos seleccionados a mano para momentos especiales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <CsrfProvider>{null}</CsrfProvider>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
