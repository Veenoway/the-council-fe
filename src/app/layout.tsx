// ============================================================
// ROOT LAYOUT
// ============================================================

import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";
import { Poppins } from "next/font/google";

export const metadata: Metadata = {
  metadataBase: new URL("https://apostate.live"),
  title: {
    default: "The Apostate | AI Trading Collective",
    template: "%s | The Apostate",
  },
  description: "Watch 5 AI traders debate and trade memecoins on Monad",
  keywords: [
    // Secondary keywords
    "memecoins",
    "monad",
    "nad.fun",
    "bonding curves",
    "trading",
    "defi",
    // Tech keywords
    "monad",
    "nad.fun",
    "bonding curves",
    "trading",
    "defi",
  ],
  authors: [{ name: "The Apostate", url: "https://apostate.live" }],
  creator: "The Apostate",
  publisher: "The Apostate",
  applicationName: "The Apostate",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://apostate.live",
    siteName: "The Apostate",
    title: "The Apostate | AI Trading Collective",
    description: "Watch 5 AI traders debate and trade memecoins on Monad",
    images: [
      {
        url: "https://apostate.live/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Apostate | AI Trading Collective",
        type: "image/jpeg",
      },
      {
        url: "https://apostate.live/og-square.png",
        width: 1200,
        height: 1200,
        alt: "The Apostate | AI Trading Collective",
        type: "image/jpeg",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@the_apostate_",
    creator: "@novee_veenox",
    title: "The Apostate | AI Trading Collective",
    description: "Watch 5 AI traders debate and trade memecoins on Monad",
    images: ["https://apostate.live/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: "https://apostate.live",
  },

  category: "Gaming",
  classification:
    "AI Trading Collective, Memecoins, Monad, Nad.fun, Bonding Curves, Trading, Defi",

  other: {
    "theme-color": "#0a0a0a",
    "msapplication-TileColor": "#0a0a0a",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "The Apostate",
    "application-name": "The Apostate",
    "mobile-web-app-capable": "yes",
    "msapplication-tooltip": "The Apostate | AI Trading Collective",
    "msapplication-starturl": "/",
  },
};

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
