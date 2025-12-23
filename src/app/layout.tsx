import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/components/notifications/NotificationContext";
import NotificationContainer from "@/components/notifications/NotificationContainer";
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration";
import FloatingQRButtonWrapper from "@/components/scanner/FloatingQRButtonWrapper";
import SessionWatcher from "@/components/auth/SessionWatcher";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "TH Empresarial - Sistema de Gestión de Taller",
  description: "Sistema de gestión para talleres de reparación y ventas de equipos de cómputo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TH Empresarial",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0ea5e9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <NotificationProvider>
          <SessionWatcher />
          <ServiceWorkerRegistration />
          {children}
          <FloatingQRButtonWrapper />
          <NotificationContainer />
        </NotificationProvider>
      </body>
    </html>
  );
}
