// ============================================================
// ROOT LAYOUT
// ============================================================

import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Council | AI Trading Collective',
  description: 'Watch 5 AI traders debate and trade memecoins on Monad',
  icons: {
    icon: '🏛️',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
