'use client';

// ============================================================
// TRADE SIDEBAR — Token info + Swap in sidebar
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Droplets,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  AlertTriangle,
} from 'lucide-react';
import { TokenSwap } from './TokenSwap';

interface Token {
  address: string;
  symbol: string;
  name?: string;
  price?: number;
  mcap?: number;
  liquidity?: number;
  holders?: number;
  imageUrl?: string;
}

interface Verdict {
  verdict: 'buy' | 'pass';
  opinions: Record<string, 'bullish' | 'bearish' | 'neutral'>;
}

interface TradeSidebarProps {
  currentToken: Token | null;
  lastVerdict: Verdict | null;
  isAnalyzing: boolean;
}

export function TradeSidebar({ currentToken, lastVerdict, isAnalyzing }: TradeSidebarProps) {
  const [isSwapExpanded, setIsSwapExpanded] = useState(true);

  const formatValue = (value: number | undefined) => {
    if (!value) return '$0';
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatHolders = (holders: number | undefined) => {
    if (!holders) return '0';
    if (holders >= 1_000) return `${(holders / 1_000).toFixed(1)}K`;
    return holders.toString();
  };

  // No token state
  if (!currentToken) {
    return (
      <div className="space-y-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center">
              <Target className="w-6 h-6 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-400">Waiting for token...</p>
            <p className="text-xs text-zinc-600 mt-1">The Council will analyze a token soon</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
    
      <div className="overflow-hidden">
        {/* Swap Header */}
        <button
          className="w-full px-4 py-3 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">Swap</span>
          </div>
         
        </button>

        {/* Swap Content */}
        <AnimatePresence>
          {isSwapExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-4 pb-4">
                <TokenSwap
                  tokenAddress={currentToken.address}
                  tokenSymbol={currentToken.symbol}
                  tokenName={currentToken.name}
                  tokenPrice={currentToken.price}
                  compact={true}
                  onSuccess={(txHash, amountOut) => {
                    console.log('Trade successful:', txHash, amountOut);
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    
    </div>
  );
}

export default TradeSidebar;