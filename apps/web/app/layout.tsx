import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Rifácil — Rifas, cobros y WhatsApp para riferos",
  description:
    "Crea rifas, vende números, gestiona clientes y cobra en bolívares o dólares, todo desde el celular.",
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
