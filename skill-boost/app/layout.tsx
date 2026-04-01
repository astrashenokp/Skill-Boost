import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNavWrapper from "@/components/bottom-nav-wrapper";
import PWAInstallPrompt from "@/components/pwa-install-prompt";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Skill Boost — Персоналізоване навчання",
    template: "%s | Skill Boost",
  },
  description:
    "EdTech PWA для персоналізованого навчання та розвитку кар'єри. Курси, квізи, сертифікати.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Skill Boost",
    startupImage: [
      {
        url: "https://placehold.co/1125x2436/0D1B3E/F97316?text=Skill+Boost",
        media:
          "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "Skill Boost",
    title: "Skill Boost — Персоналізоване навчання",
    description: "Розвивайте навички та будуйте кар'єру разом із Skill Boost.",
  },
  icons: {
    icon: [
      { url: "https://placehold.co/32x32/F97316/FFFFFF?text=SB", sizes: "32x32" },
      { url: "https://placehold.co/192x192/F97316/FFFFFF?text=SB", sizes: "192x192" },
    ],
    apple: [
      { url: "https://placehold.co/180x180/F97316/FFFFFF?text=SB", sizes: "180x180" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#0D1B3E" },
    { media: "(prefers-color-scheme: light)", color: "#0D1B3E" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" className={`${inter.variable} dark`} suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Skill Boost" />
        <meta name="application-name" content="Skill Boost" />
        {/* MS Tiles */}
        <meta name="msapplication-TileColor" content="#0D1B3E" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="font-sans antialiased">
        {/* Main content */}
        <main>{children}</main>

        {/* Bottom navigation — hidden on auth pages */}
        <BottomNavWrapper />

        {/* PWA install banner — shown when browser fires beforeinstallprompt */}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
