// ============================================================
// LiveTrades — Real-time trades feed with API + WebSocket
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trade, BotId } from '@/types';
import { 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp, 
  TrendingDown, 
  ExternalLink,
  Loader2,
  Zap
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

// Bot config for display
const BOT_CONFIG: Record<string, { name: string; color: string; emoji: string }> = {
  chad: { name: 'James', color: '#22c55e', emoji: '🦍' },
  quantum: { name: 'Keone', color: '#3b82f6', emoji: '🤓' },
  sensei: { name: 'Portdev', color: '#f59e0b', emoji: '🎌' },
  sterling: { name: 'Harpal', color: '#8b5cf6', emoji: '💼' },
  oracle: { name: 'Mike', color: '#ec4899', emoji: '🔮' },
};

interface DisplayTrade {
  id: string;
  botId: string;
  botName: string;
  botColor: string;
  botEmoji: string;
  tokenAddress: string;
  tokenSymbol: string;
  side: 'buy' | 'sell';
  amountIn: number;
  amountOut: number;
  pnl: any;
  pnlPercent: number;
  isOpen: boolean;
  createdAt: string;
  txHash: string | null;
}

interface LiveTradesProps {
  // Optional: receive trades from parent (WebSocket)
  wsTrades?: Trade[];
}

export function LiveTrades({ wsTrades = [] }: LiveTradesProps) {
  const [apiTrades, setApiTrades] = useState<DisplayTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial trades from API
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await fetch(`${API_URL}/api/trades?limit=20`);
        if (!res.ok) throw new Error('Failed to fetch trades');
        const data = await res.json();
        
        // Transform API trades to display format
        const transformed = (data.trades || []).map((t: any) => ({
          id: t.id,
          botId: t.botId,
          botName: BOT_CONFIG[t.botId]?.name || t.botName || t.botId,
          botColor: BOT_CONFIG[t.botId]?.color || t.botColor || '#666',
          botEmoji: BOT_CONFIG[t.botId]?.emoji || '🤖',
          tokenAddress: t.tokenAddress,
          tokenSymbol: t.tokenSymbol,
          side: t.side || 'buy',
          amountIn: Number(t.entryValue || t.amountIn || 0),
          amountOut: Number(t.amount || t.amountOut || 0),
          pnl: Number(t.pnl || 0),
          pnlPercent: Number(t.pnlPercent || 0),
          isOpen: t.isOpen !== false,
          createdAt: t.createdAt,
          txHash: t.txHash,
        }));
        
        setApiTrades(transformed);
        setError(null);
      } catch (e) {
        console.error('Failed to fetch trades:', e);
        setError('Failed to load trades');
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
    const interval = setInterval(fetchTrades, 30000);
    return () => clearInterval(interval);
  }, []);

  // Transform WebSocket trades to display format
  const wsDisplayTrades: DisplayTrade[] = wsTrades.map((t: any) => ({
    id: t.id || t.txHash || `ws-${Date.now()}`,
    botId: t.botId,
    botName: BOT_CONFIG[t.botId]?.name || t.botId,
    botColor: BOT_CONFIG[t.botId]?.color || '#666',
    botEmoji: BOT_CONFIG[t.botId]?.emoji || '🤖',
    tokenAddress: t.tokenAddress,
    tokenSymbol: t.tokenSymbol,
    side: t.side || 'buy',
    amountIn: Number(t.amountIn || 0),
    amountOut: Number(t.amountOut || 0),
    pnl: Number(t.pnl || 0),
    pnlPercent: 0,
    isOpen: true,
    createdAt: typeof t.createdAt === 'string' ? t.createdAt : t.createdAt?.toISOString() || new Date().toISOString(),
    txHash: t.txHash,
  }));

  // Merge: WS trades first (newest), then API trades
  const allTrades = [...wsDisplayTrades, ...apiTrades];
  
  // Remove duplicates by id or txHash
  const uniqueTrades = allTrades.filter((trade, index, self) => 
    index === self.findIndex(t => 
      t.id === trade.id || (t.txHash && t.txHash === trade.txHash)
    )
  ).slice(0, 30);

  console.log('LiveTrades render:', { wsCount: wsTrades.length, apiCount: apiTrades.length, total: uniqueTrades.length });

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-medium text-sm text-white">Live Trades</h2>
          {wsTrades.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-bold">
              +{wsTrades.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-zinc-500">Live</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[64vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
          </div>
        ) :uniqueTrades.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            <p>No trades yet</p>
            <p className="text-sm mt-1">Waiting for Council to make moves...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {uniqueTrades.map((trade, index) => (
              <TradeRow key={trade.id} trade={trade} isNew={index < wsTrades.length} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function TradeRow({ trade, isNew }: { trade: DisplayTrade; isNew: boolean }) {
  const isProfitable = trade.pnl > 0;
  const isBuy = trade.side === 'buy';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className={`
        flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50
        hover:bg-zinc-800/30 transition-colors cursor-pointer
      
      `}
    >
    

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm" style={{ color: trade.botColor }}>
            {trade.botName}
          </span>
          <span className={`flex items-center gap-1 text-xs font-bold ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
            {isBuy ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trade.side.toUpperCase()}
          </span>
          <span className="text-white font-bold text-sm">
            ${trade.tokenSymbol}
          </span>
        </div>
        
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-zinc-400">
            {trade.amountIn.toFixed(2)} MON
          </span>
          <span className="text-xs text-zinc-600">•</span>
          <span className="text-xs text-zinc-500">
            {timeAgo(new Date(trade.createdAt))}
          </span>
        </div>
      </div>

 
     

      {/* TX Link */}
      {trade.txHash && (
        <a
          href={`https://monad.socialscan.io/tx/${trade.txHash}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={14} className="text-zinc-400" />
        </a>
      )}
    </motion.div>
  );
}

// Helper function
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default LiveTrades;