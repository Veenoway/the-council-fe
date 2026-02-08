'use client';

// ============================================================
// BOTS PAGE — Leaderboard & Bot Profiles
// ============================================================

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import BotCards from '@/components/BotCard';
import { Trade, BotId } from '@/types';
import Link from 'next/link';

// ============================================================
// BOT CONFIG
// ============================================================

const BOT_CONFIG: Record<BotId, { name: string; imgURL: string; color: string }> = {
  chad: { name: 'James', imgURL: '/bots/james.jpg', color: '#22c55e' },
  quantum: { name: 'Keone Hon', imgURL: '/bots/keone.jpg', color: '#3b82f6' },
  sensei: { name: 'Portdev', imgURL: '/bots/portdev.png', color: '#f59e0b' },
  sterling: { name: 'Harpaljadeja', imgURL: '/bots/harpal.jpg', color: '#8b5cf6' },
  oracle: { name: 'Mikeweb', imgURL: '/bots/mike.jpg', color: '#ec4899' },
};

// ============================================================
// PAGE COMPONENT
// ============================================================

export default function BotsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const [botsData, setBotsData] = useState<any[]>([]);
  // WebSocket connection
  const { isConnected, lastMessage } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'
  );

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    const { type, data } = lastMessage;

    switch (type) {
      case 'connected':
        setConnected(true);
        break;
      case 'trade':
        setTrades(prev => [...prev, data]);
        break;
    }
  }, [lastMessage]);

  useEffect(() => {
    setConnected(isConnected);
  }, [isConnected]);

  const fetchStats = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/api/stats/today`);
    const botsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/api/bots`);
    if (!res.ok || !botsRes.ok) return;
    const statsData = await res.json();
    const botsData = await botsRes.json();
    console.log("botsData =====>", botsData);
    setStats(statsData);
    setBotsData (botsData);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  console.log("stats =====>", stats);
  console.log("botsData =====>", botsData);
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-[#080808]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
              ← Back
            </Link>
            <h1 className="text-xl font-bold flex items-center gap-2">
              🏛️ The Council
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
            <span className="text-xs text-zinc-500">
              {connected ? 'Live' : 'Connecting...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Bot Profiles</h2>
          <p className="text-zinc-500">
            Track performance, holdings, and recent trades for each Council member.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard 
            label="Total Trades" 
            value={trades.length.toString()} 
            icon="📊"
          />
          <StatCard 
            label="Active Bots" 
            value="5" 
            icon="🤖"
          />
          <StatCard 
            label="Open Positions" 
            value="-" 
            icon="💰"
          />
          <StatCard 
            label="Today's PnL" 
            value="-" 
            icon="📈"
          />
        </div>

        {/* Bot Cards */}
        <BotCards 
          trades={trades}
          token={null}
          botConfig={BOT_CONFIG}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-4 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-zinc-600">
          Powered by Grok × nad.fun × Monad
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// STAT CARD COMPONENT
// ============================================================

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="text-xs text-zinc-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}