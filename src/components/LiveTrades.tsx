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

let colorMap: Record<string, string> | null = null;

function getColorMap(): Record<string, string> {
  if (colorMap) return colorMap;
  try {
    const stored = localStorage.getItem('trader-colors');
    colorMap = stored ? JSON.parse(stored) : {};
  } catch {
    colorMap = {};
  }
  return colorMap!;
}

function generateRandomColor(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 60 + Math.floor(Math.random() * 30);
  const l = 55 + Math.floor(Math.random() * 20);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

 function getTraderColor(botId: string, fallbackColor?: string): string {
  if (typeof window === 'undefined') return fallbackColor || '#888';
  
  const map = getColorMap();
  
  if (map[botId]) return map[botId];
  
  // Ignore default agent color — treat as no color
  const DEFAULT_AGENT_COLOR = '#9333ea';
  const hasCustomColor = fallbackColor && fallbackColor !== '#666' && fallbackColor !== DEFAULT_AGENT_COLOR;
  
  if (hasCustomColor) {
    map[botId] = fallbackColor;
  } else {
    map[botId] = generateRandomColor();
  }
  
  try {
    localStorage.setItem('trader-colors', JSON.stringify(map));
  } catch {}
  
  return map[botId];
}
 
console.log('wsTradeswsTrades', wsTrades);
  const wsDisplayTrades: DisplayTrade[] = wsTrades.map((t: any) => ({
    id: t.id || t.txHash || `ws-${Date.now()}`,
    botId: t.botId,
    botName: t.botId?.includes('agent_') ? t.agentName : BOT_CONFIG[t.botId]?.name || t.botName || t.botId,
    botColor: BOT_CONFIG[t.botId]?.color || getTraderColor(t.botId?.includes('agent_') ? t.agentName : BOT_CONFIG[t.botId]?.name || t.botName || t.botId ),
    botEmoji: BOT_CONFIG[t.botId]?.emoji || '🤖',
    tokenAddress: t.tokenAddress,
    tokenSymbol: t.tokenSymbol,
    side: t.side || 'buy',
    amountIn: Number(t.amountIn || t.valueMon || 0),
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
      <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-medium text-sm text-white">Live Trades</h2>
         
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-zinc-500">Live</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[64vh] overflow-y-auto">
      {loading ? (
        <div className="animate-pulse">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 border-b border-zinc-800/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-16 bg-zinc-800 rounded" />
                    <div className="h-3 w-8 bg-zinc-800/60 rounded" />
                    <div className="h-3.5 w-14 bg-zinc-800 rounded" />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="h-2.5 w-12 bg-zinc-800/40 rounded" />
                    <div className="h-2.5 w-1 bg-zinc-800/30 rounded-full" />
                    <div className="h-2.5 w-10 bg-zinc-800/40 rounded" />
                  </div>
                </div>
                <div className="h-3.5 w-3.5 bg-zinc-800/30 rounded" />
              </div>
            ))}
          </div>
        ) : uniqueTrades.length === 0  ? (
          <div className="p-8 text-center text-zinc-500">
            <p>No trades yet</p>
            <p className="text-sm mt-1">Waiting for Council to make moves...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {uniqueTrades.map((trade, index) => (
              <TradeRow key={trade.id} trade={trade} isNew={index < wsTrades.length} isFirst={index < 3}/>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function TradeRow({ trade, isNew, isFirst }: { trade: DisplayTrade; isNew: boolean; isFirst: boolean }) {
  const isProfitable = trade.pnl > 0;
  const isBuy = trade.side === 'buy';


  console.log("trade =====>", trade);
  return (
    <motion.div
    initial={{ 
        opacity: 0, 
        y: 0, 
        scale: 1,
        backgroundColor: isNew && isFirst ? "rgba(34, 197, 94, 0.4)" : "rgba(34, 197, 94, 0)" 
      }}
      // L'animation finale : le bg-color redevient transparent après l'apparition
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        backgroundColor: "rgba(34, 197, 94, 0)" 
      }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ 
        duration: 0.4, // Durée de l'apparition (mouvement)
        backgroundColor: { duration: 3.5, ease: "easeOut" } // Durée du flash vert
      }}
      className={`
        flex items-center gap-3 px-3 py-2 border-b border-zinc-800/50
        hover:bg-zinc-800/30 transition-colors cursor-pointer
      `}
    >
    

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm" style={{ color: trade.botColor }}>
            {trade.botName?.length > 10 ? trade.botName.slice(0, 10) + '...' : trade.botName}
          </span>
          <span className={`flex items-center gap-1 text-xs font-thin ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
            {trade.side.toUpperCase()}
          </span>
          <span className="text-white font-bold text-sm uppercase">
            {trade.tokenSymbol}
          </span>
        </div>
        
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-zinc-400">
            {trade.amountIn.toFixed(2) } MON
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
          <ExternalLink size={14} className="text-zinc-400 hover:text-white transition-colors" />
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