import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

const description =
  "Crea rifas, vende números, gestiona clientes y cobra en bolívares o dólares, todo desde el celular.";

export const metadata: Metadata = {
  metadataBase: new URL("https://rifacil.vip"),
  title: "Rifácil — Rifas, cobros y WhatsApp para riferos",
  description,
  applicationName: "Rifácil",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // Instalable como PWA en iOS Safari (Añadir a pantalla de inicio).
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rifácil",
  },
  openGraph: {
    type: "website",
    siteName: "Rifácil",
    title: "Rifácil — Rifas, cobros y WhatsApp para riferos",
    description,
    images: [{ url: "/android-chrome-512x512.png", width: 512, height: 512, alt: "Rifácil" }],
  },
};

// Mobile-first: la base de usuarios opera con el pulgar en iPhone.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
