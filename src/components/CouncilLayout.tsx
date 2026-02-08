// ============================================================
// CouncilLayout — Main page layout
// ============================================================

'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import { Header } from './Header';
import { ChatPanel } from './ChatPanel';
import { BotPanel } from './BotPanel';
import { TokenCard } from './TokenCard';
import { TradeList } from './TradeList';

export function CouncilLayout() {
  // Initialize WebSocket connection
  useWebSocket();

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      
      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left sidebar - Bots */}
          <div className="col-span-3">
            <BotPanel />
          </div>

          {/* Center - Chat */}
          <div className="col-span-6">
            <div className="h-[calc(100vh-120px)]">
              <ChatPanel />
            </div>
          </div>

          {/* Right sidebar - Token & Trades */}
          <div className="col-span-3 space-y-4">
            <TokenCard />
            <TradeList />
          </div>
        </div>
      </main>
    </div>
  );
}
