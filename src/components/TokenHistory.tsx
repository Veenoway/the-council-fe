// ============================================================
// TokenHistory — Recently analyzed tokens with verdicts
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatNumber, timeAgo } from '@/lib/utils';
import { 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Users,
  Droplets,
  ExternalLink,
  Loader2,
  History
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

interface AnalyzedToken {
  address: string;
  symbol: string;
  name: string;
  price: number | null;
  mcap: number | null;
  liquidity: number | null;
  holders: number | null;
  verdict: 'buy' | 'pass' | null;
  riskScore: number | null;
  riskFlags: string[] | null;
  opinions: Record<string, string> | null;
  analyzedAt: string;
}

export function TokenHistory() {
  const [tokens, setTokens] = useState<AnalyzedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'buy' | 'pass'>('all');

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tokens?limit=30`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setTokens(data.tokens);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
    const interval = setInterval(fetchTokens, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredTokens = tokens.filter(t => {
    if (filter === 'all') return true;
    return t.verdict === filter;
  });

  const stats = {
    total: tokens.length,
    buys: tokens.filter(t => t.verdict === 'buy').length,
    passes: tokens.filter(t => t.verdict === 'pass').length,
  };

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            <h2 className="font-bold text-white">Analyzed Tokens</h2>
          </div>
          <div className="text-xs text-gray-400">
            {stats.buys}/{stats.total} bought ({stats.total > 0 ? Math.round((stats.buys/stats.total)*100) : 0}%)
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {(['all', 'buy', 'pass'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-3 py-1 rounded-lg text-xs font-medium transition-colors
                ${filter === f 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              {f === 'all' ? 'All' : f === 'buy' ? '✅ Bought' : '❌ Passed'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No tokens analyzed yet</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredTokens.map((token) => (
              <TokenRow key={token.address} token={token} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function TokenRow({ token }: { token: AnalyzedToken }) {
  const isBuy = token.verdict === 'buy';
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="border-b border-white/5"
    >
      <div 
        className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Verdict icon */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center shrink-0
          ${isBuy ? 'bg-green-500/20' : 'bg-red-500/20'}
        `}>
          {isBuy ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
        </div>

        {/* Token info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">
              ${token.symbol}
            </span>
            {token.riskScore !== null && (
              <span className={`
                text-xs px-1.5 py-0.5 rounded
                ${token.riskScore >= 70 ? 'bg-green-500/20 text-green-400' :
                  token.riskScore >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'}
              `}>
                {token.riskScore}/100
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
            {token.mcap && (
              <span className="flex items-center gap-1">
                <TrendingUp size={10} />
                {formatMcap(token.mcap)}
              </span>
            )}
            {token.holders && (
              <span className="flex items-center gap-1">
                <Users size={10} />
                {formatNumber(token.holders)}
              </span>
            )}
            {token.liquidity && (
              <span className="flex items-center gap-1">
                <Droplets size={10} />
                ${formatNumber(token.liquidity)}
              </span>
            )}
          </div>
        </div>

        {/* Time */}
        <span className="text-xs text-gray-500">
          {timeAgo(new Date(token.analyzedAt))}
        </span>

        {/* Link */}
        <a
          href={`https://nad.fun/token/${token.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={14} className="text-gray-400" />
        </a>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1">
              {/* Risk flags */}
              {token.riskFlags && token.riskFlags.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs text-gray-500">Risk Flags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {token.riskFlags.map((flag, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Opinions */}
              {token.opinions && (
                <div>
                  <span className="text-xs text-gray-500">Council Opinions:</span>
                  <div className="grid grid-cols-5 gap-1 mt-1">
                    {Object.entries(token.opinions).map(([botId, opinion]) => (
                      <div 
                        key={botId}
                        className={`
                          text-center px-1 py-0.5 rounded text-xs
                          ${opinion === 'bullish' ? 'bg-green-500/20 text-green-400' :
                            opinion === 'bearish' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'}
                        `}
                      >
                        {opinion === 'bullish' ? '🟢' : opinion === 'bearish' ? '🔴' : '⚪'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function formatMcap(mcap: number): string {
  if (mcap >= 1_000_000) return `${(mcap / 1_000_000).toFixed(1)}M`;
  if (mcap >= 1_000) return `${(mcap / 1_000).toFixed(0)}K`;
  return mcap.toFixed(0);
}

// Summary card for dashboard
export function TokenVerdictsSummary() {
  const [stats, setStats] = useState<{
    total: number;
    buys: number;
    passes: number;
    buyRate: number;
  } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tokens/verdicts`);
        if (!res.ok) return;
        const data = await res.json();
        setStats(data.summary);
      } catch (e) {
        console.error(e);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-white/5 rounded-xl p-3 text-center">
        <div className="text-2xl font-bold text-white">{stats.total}</div>
        <div className="text-xs text-gray-400">Analyzed</div>
      </div>
      <div className="bg-green-500/10 rounded-xl p-3 text-center">
        <div className="text-2xl font-bold text-green-400">{stats.buys}</div>
        <div className="text-xs text-gray-400">Bought</div>
      </div>
      <div className="bg-red-500/10 rounded-xl p-3 text-center">
        <div className="text-2xl font-bold text-red-400">{stats.passes}</div>
        <div className="text-xs text-gray-400">Passed</div>
      </div>
    </div>
  );
}