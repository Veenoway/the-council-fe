// ============================================================
// ROOT LAYOUT
// ============================================================

import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import './globals.css';
import { Poppins } from 'next/font/google';

export const metadata: Metadata = {
  title: 'The Council | AI Trading Collective',
  description: 'Watch 5 AI traders debate and trade memecoins on Monad',
  icons: {
    icon: '🏛️',
  },
};

export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
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
