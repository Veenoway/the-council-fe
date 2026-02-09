// ============================================================
// TRADE HISTORY — All bot trades with details
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ExternalLink, 
  TrendingUp,
  TrendingDown,
  Loader2,
  Filter,
  Clock,
  Coins,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { BotId } from '@/types';

interface Trade {
  id: string;
  botId: BotId;
  botName: string;
  tokenAddress: string;
  tokenSymbol: string;
  type: 'buy' | 'sell';
  amountMon: number;
  amountToken: number;
  price: number;
  txHash: string;
  timestamp: Date;
  pnl?: number;
  status: string;
}

interface TradeHistoryProps {
  botConfig: Record<BotId, { name: string; imgURL: string; color: string }>;
  className?: string;
  limit?: number;
  showFilters?: boolean;
  compact?: boolean;
}

export function TradeHistory({ 
  botConfig, 
  className = '',
  limit = 50,
  showFilters = true,
  compact = false,
}: TradeHistoryProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | BotId>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [filter, typeFilter]);

  const fetchTrades = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (filter !== 'all') params.append('botId', filter);
      if (typeFilter !== 'all') params.append('side', typeFilter);
      
      const res = await fetch(`/api/trades?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTrades(data.trades.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp),
        })));
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'just now';
  };

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.0001) return `$${price.toFixed(6)}`;
    return `$${price.toExponential(2)}`;
  };

  // Stats
  const totalTrades = trades.length;
  const totalVolume = trades.reduce((sum, t) => sum + t.amountMon, 0);
  const tradesWithPnl = trades.filter(t => t.pnl !== undefined && t.pnl !== null);
  const profitableTrades = tradesWithPnl.filter(t => (t.pnl || 0) > 0).length;
  const winRate = tradesWithPnl.length > 0 ? (profitableTrades / tradesWithPnl.length) * 100 : 0;
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className={`${className} font-mono text-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Trade History
        </h2>
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={() => fetchTrades(true)}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          {showFilters && (
            <>
              {/* Bot Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | BotId)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none"
              >
                <option value="all">All Bots</option>
                {Object.entries(botConfig).map(([id, config]) => (
                  <option key={id} value={id}>{config.name}</option>
                ))}
              </select>
              
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'buy' | 'sell')}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="buy">Buys</option>
                <option value="sell">Sells</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      {!compact && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
            <p className="text-[10px] text-zinc-500 uppercase">Trades</p>
            <p className="text-lg font-bold text-white">{totalTrades}</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
            <p className="text-[10px] text-zinc-500 uppercase">Volume</p>
            <p className="text-lg font-bold text-white">{totalVolume.toFixed(1)} MON</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
            <p className="text-[10px] text-zinc-500 uppercase">Win Rate</p>
            <p className={`text-lg font-bold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
              {winRate.toFixed(0)}%
            </p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
            <p className="text-[10px] text-zinc-500 uppercase">Total P&L</p>
            <p className={`text-lg font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Trades List */}
      <div className={`space-y-2 ${compact ? 'max-h-[300px]' : 'max-h-[500px]'} overflow-y-auto`}>
        {trades.length === 0 ? (
          <div className="text-center py-12 text-zinc-600">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No trades yet</p>
            <p className="text-xs mt-1">Bots are analyzing the market...</p>
          </div>
        ) : (
          trades.map((trade) => (
            <TradeRow 
              key={trade.id} 
              trade={trade} 
              botConfig={botConfig}
              formatTime={formatTime}
              formatPrice={formatPrice}
              compact={compact}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// TRADE ROW
// ============================================================

interface TradeRowProps {
  trade: Trade;
  botConfig: Record<BotId, { name: string; imgURL: string; color: string }>;
  formatTime: (date: Date) => string;
  formatPrice: (price: number) => string;
  compact?: boolean;
}

function TradeRow({ trade, botConfig, formatTime, formatPrice, compact }: TradeRowProps) {
  const bot = botConfig[trade.botId];
  const isBuy = trade.type === 'buy';

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2 px-3 bg-zinc-900/30 rounded-lg">
        <div className="flex items-center gap-2">
          <img src={bot?.imgURL} alt={bot?.name} className="w-6 h-6 rounded" />
          <span className={`text-xs font-medium ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
            {isBuy ? 'BUY' : 'SELL'}
          </span>
          <span className="text-xs text-zinc-400">${trade.tokenSymbol}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white">{trade.amountMon.toFixed(2)} MON</span>
          {trade.pnl !== undefined && trade.pnl !== null && (
            <span className={`text-xs ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
            </span>
          )}
          <span className="text-[10px] text-zinc-600">{formatTime(trade.timestamp)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-3 hover:bg-zinc-900/50 transition-all">
      <div className="flex items-center justify-between">
        {/* Left: Bot + Type */}
        <div className="flex items-center gap-3">
          {/* Bot Avatar */}
          <div className="relative">
            <img 
              src={bot?.imgURL} 
              alt={bot?.name}
              className="w-10 h-10 rounded-lg"
            />
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
              isBuy ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {isBuy ? (
                <ArrowUpRight className="w-3 h-3 text-white" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-white" />
              )}
            </div>
          </div>

          {/* Trade Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{bot?.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {isBuy ? 'BUY' : 'SELL'}
              </span>
              {trade.status === 'pending' && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                  PENDING
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>${trade.tokenSymbol}</span>
              <span>•</span>
              <span>{formatTime(trade.timestamp)}</span>
              <span>•</span>
              <span>{formatPrice(trade.price)}</span>
            </div>
          </div>
        </div>

        {/* Right: Amount + P&L */}
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-white font-medium">
              {trade.amountMon.toFixed(2)} MON
            </span>
            {trade.pnl !== undefined && trade.pnl !== null && (
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                trade.pnl >= 0 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)} MON
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-500">
            {trade.amountToken.toLocaleString(undefined, { maximumFractionDigits: 0 })} tokens
          </div>
        </div>
      </div>

      {/* TX Link */}
      <div className="mt-2 pt-2 border-t border-zinc-800/50 flex items-center justify-between">
        <span className="text-[10px] text-zinc-600 font-mono">
          {trade.txHash.slice(0, 10)}...{trade.txHash.slice(-6)}
        </span>
        <a
          href={`https://monadexplorer.com/tx/${trade.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
        >
          View TX <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

export default TradeHistory;