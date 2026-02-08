// ============================================================
// PAGE — Main trading terminal with SSR data
// ============================================================

import { Suspense } from 'react';
import TradingTerminal from '@/components/TradingTerminal';
import { Token, Message } from '@/types';

// ============================================================
// FETCH CURRENT STATE FROM BACKEND (SSR)
// ============================================================

async function getCurrentState(): Promise<{
  token: Token | null;
  messages: Message[];
}> {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3005';
    
    const response = await fetch(`${backendUrl}/api/current-token`, {
      next: { revalidate: 0 }, // Don't cache - always fresh
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch current state:', response.status);
      return { token: null, messages: [] };
    }

    const data = await response.json();
    return {
      token: data.token || null,
      messages: data.messages || [],
    };
  } catch (error) {
    console.error('Error fetching current state:', error);
    
    // Fallback: try to get trending token from nad.fun
    try {
      const nadResponse = await fetch(
        'https://api.nadapp.net/token/top?offset=0&limit=1&sort=trending&order=desc',
        { next: { revalidate: 60 } } // Cache for 1 minute
      );
      
      if (nadResponse.ok) {
        const data = await nadResponse.json();
        if (data && data.length > 0) {
          const t = data[0];
          return {
            token: {
              address: t.address || t.token_address,
              symbol: t.symbol,
              name: t.name,
              price: parseFloat(t.price || t.current_price || 0),
              priceChange24h: parseFloat(t.price_change_24h || 0),
              mcap: parseFloat(t.market_cap || t.mcap || 0),
              liquidity: parseFloat(t.liquidity || 0),
              holders: parseInt(t.holders || t.holder_count || 0),
              deployer: t.deployer || t.creator || '',
              createdAt: t.created_at || new Date().toISOString(),
            },
            messages: [],
          };
        }
      }
    } catch (e) {
      console.error('Fallback fetch failed:', e);
    }
    
    return { token: null, messages: [] };
  }
}

// ============================================================
// PAGE COMPONENT (Server Component)
// ============================================================

export default async function Home() {
  const { token, messages } = await getCurrentState();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <TradingTerminal 
        initialToken={token} 
        initialMessages={messages}
      />
    </Suspense>
  );
}

// ============================================================
// LOADING SCREEN
// ============================================================

function LoadingScreen() {
  return (
    <div className="h-screen w-screen bg-[#050505] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🏛️</div>
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
        <div className="text-zinc-500">Loading The Council...</div>
      </div>
    </div>
  );
}

// ============================================================
// METADATA
// ============================================================

export const metadata = {
  title: 'The Council | AI Trading Terminal',
  description: 'Watch AI agents debate and trade memecoins on Monad',
};