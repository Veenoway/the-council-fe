'use client';

// ============================================================
// BOT CARDS — Full profile cards with stats & holdings
// ============================================================

import { useEffect, useState } from 'react';
import { Token, Trade, BotId,   } from '@/types';

// ============================================================
// TYPES
// ============================================================

interface BotStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  currentStreak: number;
  bestStreak: number;
  avgHoldTime?: number;
  bestTrade?: number;
  worstTrade?: number;
}

interface BotFullData {
  botId: BotId;
  name: string;
  personality: string;
  stats: BotStats | null;
  portfolio: any | null;
  recentTrades: any[];
}

interface BotCardsProps {
  trades: Trade[];
  token: Token | null;
  botConfig: Record<BotId, { name: string; imgURL: string; color: string }>;
  className?: string;
}


const BOT_PERSONALITIES: Record<BotId, string> = {
  chad: "degen energy, apes first asks questions later",
  quantum: "data-driven, trusts the numbers over vibes",
  sensei: "vibes reader, community focused, chill energy",
  sterling: "risk spotter, skeptical, due diligence first",
  oracle: "mysterious, sees patterns others miss",
};


export function BotCards({ trades, token, botConfig, className = '' }: BotCardsProps) {
  const [botsData, setBotsData] = useState<BotFullData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBot, setExpandedBot] = useState<BotId | null>(null);

  const allBots: BotId[] = ['chad', 'quantum', 'sensei', 'sterling', 'oracle'];
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

  const fetchData = async () => {
    try {
      const [positionsRes, botsRes] = await Promise.all([
        fetch(`${API_URL}/api/positions`),
        fetch(`${API_URL}/api/bots`),
      ]);

      const positionsData = positionsRes.ok ? await positionsRes.json() : { portfolios: [] };
      const botsStatsData = botsRes.ok ? await botsRes.json() : { leaderboard: [] };

      // Combine data for each bot
      const combined = allBots.map(botId => {
        const config = botConfig[botId];
        const portfolio = positionsData.portfolios?.find((p: any) => p.botId === botId) || null;
        const statsEntry = botsStatsData.leaderboard?.find((s: any) => s.botId === botId);
        
        // Get recent trades for this bot
        const botTrades = trades
          .filter(t => t.botId === botId)
          .slice(-5)
          .reverse();

        return {
          botId,
          name: config?.name || botId,
          personality: BOT_PERSONALITIES[botId],
          stats: statsEntry ? {
            totalTrades: statsEntry.totalTrades || 0,
            wins: statsEntry.wins || 0,
            losses: statsEntry.losses || 0,
            winRate: statsEntry.winRate || 0,
            totalPnl: statsEntry.totalPnl || 0,
            currentStreak: statsEntry.currentStreak || 0,
            bestStreak: statsEntry.bestStreak || 0,
          } : null,
          portfolio,
          recentTrades: botTrades,
        };
      });

      setBotsData(combined);
    } catch (err) {
      console.error('Error fetching bot data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (trades.length > 0) fetchData();
  }, [trades.length]);

  // --------------------------------------------------------
  // HELPER: Format time ago
  // --------------------------------------------------------
  const timeAgo = (date: Date | string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
          <span>Loading bot profiles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>🤖</span> The Council
        </h2>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-zinc-400">Live Tracking</span>
        </div>
      </div>

      {/* Bot Cards */}
      <div className="grid gap-4">
        {botsData.map((bot) => {
          const config = botConfig[bot.botId];
          const isExpanded = expandedBot === bot.botId;
          const hasPositions = bot.portfolio && bot.portfolio.openPositions > 0;

          return (
            <div
              key={bot.botId}
              className={`
                bg-gradient-to-br from-zinc-900 to-zinc-950 
                rounded-2xl border overflow-hidden
                transition-all duration-300
                ${hasPositions ? 'border-zinc-700' : 'border-zinc-800'}
              `}
            >
              {/* Card Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                onClick={() => setExpandedBot(isExpanded ? null : bot.botId)}
              >
                <div className="flex items-start justify-between">
                  {/* Bot Identity */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={config.imgURL}
                        alt={bot.name}
                        className="w-14 h-14 rounded-xl border-2 object-cover"
                        style={{ borderColor: config.color }}
                      />
                      {hasPositions && (
                        <div 
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 flex items-center justify-center"
                          style={{ backgroundColor: config.color }}
                        >
                          <span className="text-[8px] text-white font-bold">
                            {bot.portfolio?.openPositions}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <span style={{ color: config.color }}>{bot.name}</span>
                        <span className="text-xs text-zinc-600 font-normal">({bot.botId})</span>
                      </h3>
                      <p className="text-sm text-zinc-500 italic">"{bot.personality}"</p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="text-right">
                    {bot.stats ? (
                      <>
                        <div className={`text-lg font-bold ${
                          bot.stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {bot.stats.totalPnl >= 0 ? '+' : ''}{bot.stats.totalPnl.toFixed(2)} MON
                        </div>
                        <div className="text-sm text-zinc-500">
                          {bot.stats.winRate.toFixed(0)}% winrate
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-zinc-600">No trades yet</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-zinc-800">
                  {/* Stats & Holdings Row */}
                  <div className="grid grid-cols-2 divide-x divide-zinc-800">
                    {/* Stats Column */}
                    <div className="p-4">
                      <h4 className="text-xs text-zinc-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                        <span>📊</span> Stats
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Winrate</span>
                          <span className={`font-medium ${
                            (bot.stats?.winRate || 0) >= 50 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {bot.stats?.winRate.toFixed(0) || 0}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Total trades</span>
                          <span className="text-white">{bot.stats?.totalTrades || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">W/L</span>
                          <span className="text-white">
                            <span className="text-green-400">{bot.stats?.wins || 0}</span>
                            <span className="text-zinc-600"> / </span>
                            <span className="text-red-400">{bot.stats?.losses || 0}</span>
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Current streak</span>
                          <span className={`font-medium ${
                            (bot.stats?.currentStreak || 0) > 0 ? 'text-green-400' : 'text-zinc-400'
                          }`}>
                            {bot.stats?.currentStreak || 0} 🔥
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Best streak</span>
                          <span className="text-yellow-400">{bot.stats?.bestStreak || 0} ⭐</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-zinc-800 mt-2">
                          <span className="text-zinc-500">Total PnL</span>
                          <span className={`font-bold ${
                            (bot.stats?.totalPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {(bot.stats?.totalPnl || 0) >= 0 ? '+' : ''}{(bot.stats?.totalPnl || 0).toFixed(2)} MON
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Holdings Column */}
                    <div className="p-4">
                      <h4 className="text-xs text-zinc-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                        <span>💰</span> Holdings
                      </h4>
                      {bot.portfolio && bot.portfolio.positions.filter((p: any) => p.isOpen).length > 0 ? (
                        <div className="space-y-2">
                          {bot.portfolio.positions
                            .filter((p: any) => p.isOpen)
                            .slice(0, 5)
                            .map((pos: any) => (
                              <div key={pos.id} className="flex justify-between items-center text-sm">
                                <span className="text-white font-medium">${pos.tokenSymbol}</span>
                                <span className={`flex items-center gap-1 ${
                                  pos.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(0)}%
                                  <span>{pos.pnlPercent >= 0 ? '🟢' : '🔴'}</span>
                                </span>
                              </div>
                            ))}
                          <div className="pt-2 mt-2 border-t border-zinc-800 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-500">Total Value</span>
                              <span className="text-white font-poppins">
                                {bot.portfolio.totalValue.toFixed(2)} MON
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-500">Unrealized</span>
                              <span className={`font-medium ${
                                bot.portfolio.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {bot.portfolio.totalPnl >= 0 ? '+' : ''}{bot.portfolio.totalPnl.toFixed(2)} MON
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-zinc-600 italic">No open positions</div>
                      )}
                    </div>
                  </div>

                  {/* Recent Trades */}
                  <div className="p-4 border-t border-zinc-800">
                    <h4 className="text-xs text-zinc-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                      <span>📈</span> Recent Trades
                    </h4>
                    {bot.recentTrades.length > 0 ? (
                      <div className="space-y-2">
                        {bot.recentTrades.map((trade) => (
                          <div 
                            key={trade.id} 
                            className="flex items-center justify-between text-sm bg-zinc-800/30 rounded-lg p-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`
                                px-1.5 py-0.5 rounded text-xs font-medium
                                ${trade.side === 'buy' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                                }
                              `}>
                                {trade.side.toUpperCase()}
                              </span>
                              <span className="text-white font-medium">${trade.tokenSymbol}</span>
                              <span className="text-zinc-500">{trade.amountIn.toFixed(2)} MON</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {trade.pnl !== undefined && trade.pnl !== null ? (
                                <span className={`font-medium ${
                                  trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(0)}%
                                  {trade.pnl >= 0 ? ' ✅' : ' ❌'}
                                </span>
                              ) : (
                                <span className="text-yellow-400">📉 HOLDING</span>
                              )}
                              <span className="text-zinc-600 text-xs">
                                {timeAgo(trade.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-600 italic">No recent trades</div>
                    )}
                  </div>
                </div>
              )}

              {/* Expand Indicator */}
              <div 
                className="py-2 text-center text-xs text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors border-t border-zinc-800/50"
                onClick={() => setExpandedBot(isExpanded ? null : bot.botId)}
              >
                {isExpanded ? '▲ Collapse' : '▼ Expand Details'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BotCards;