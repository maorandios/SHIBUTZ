import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

const googleSans = localFont({
  src: [
    {
      path: "./fonts/GoogleSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/GoogleSans-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/GoogleSans-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/GoogleSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-google-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "שיבוץ עובדים",
  description: "שיבוץ יומי של עובדי בניין לאתרי עבודה",
  applicationName: "שיבוץ עובדים",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "שיבוץ עובדים",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFDFB",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${googleSans.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground antialiased font-sans">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
