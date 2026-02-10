'use client';

// ============================================================
// TOKEN INFO — Displays token statistics
// ============================================================

import { Token } from '@/types';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface TokenInfoProps {
  token: Token | null;
  isActive?: boolean;
  className?: string;
}

export function TokenInfo({ token, isActive = true, className = '' }: TokenInfoProps) {
  const [copied, setCopied] = useState(false);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!token) {
    return (
      <div className={className}>
        <h3 className="font-semibold text-sm mb-3">Token Info</h3>
        <div className="text-zinc-500 text-sm">No token selected</div>
      </div>
    );
  }

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(decimals)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(decimals)}K`;
    return `$${num.toFixed(decimals)}`;
  };

  const formatAge = (date: Date | string) => {
    const created = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
    return `${diffMins}m`;
  };

  const stats = [
    { label: 'Market Cap', value: formatNumber(token.mcap) },
    { label: 'Liquidity', value: formatNumber(token.liquidity) },
    { label: 'Holders', value: token.holders.toLocaleString() },
    { label: 'Age', value: formatAge(token.createdAt) },
  ];

  // Calculate some derived metrics
  const liqRatio = token.liquidity / token.mcap;
  const isHealthyLiq = liqRatio > 0.1;


  return (
    <div className={className}>
    


      {/* Main stats */}
      <div className="space-y-2">
        {stats.map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-zinc-500">{label}</span>
            <span className="text-white font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* Divider */}

      {/* Health indicators */}
      <div className="space-y-2 mt-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Liq/MCap Ratio</span>
          <span className={isHealthyLiq ? 'text-green-400' : 'text-yellow-400'}>
            {(liqRatio * 100).toFixed(1)}%
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Price</span>
          <span className="text-white font-poppins text-xs">
            ${token.price.toFixed(10)}
          </span>
        </div>
      </div>

      {/* Contract address */}
      <div className="mt-3 pt-3 border-t border-zinc-800">
        <div className="text-xs text-zinc-500 mb-1">Contract</div>
        <div className="flex items-center gap-2">
          <code className="text-xs text-zinc-400 truncate flex-1">
            {token.address}
          </code>
          <button
            onClick={() => copyToClipboard(token.address)}
            className="text-zinc-500 hover:text-white transition-colors"
            title="Copy address"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-500 hover:text-white transition-colors" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TokenInfo;