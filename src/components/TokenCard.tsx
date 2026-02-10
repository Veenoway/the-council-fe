// ============================================================
// TokenCard — Current token being analyzed
// ============================================================

'use client';

import { motion } from 'framer-motion';
import { useCouncilStore } from '@/store/council';
import { formatNumber, formatPrice, formatPercent, formatAddress } from '@/lib/utils';
import { ExternalLink, Users, Droplets, TrendingUp } from 'lucide-react';

export function TokenCard() {
  const token = useCouncilStore((s) => s.currentToken);
  const verdict = useCouncilStore((s) => s.verdict);

  if (!token) {
    return (
      <div className="bg-bg-secondary rounded-xl border border-gray-800 p-6">
        <div className="flex flex-col items-center justify-center text-gray-500 py-8">
          <p className="text-4xl mb-4">🔍</p>
          <p>Scanning for new tokens...</p>
        </div>
      </div>
    );
  }

  const verdictColor = {
    buy: '#00ff88',
    pass: '#ff4444',
    watch: '#ffcc00',
  }[verdict?.verdict || 'watch'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-bg-secondary rounded-xl border border-gray-800 p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">${token.symbol}</h2>
            <a
              href={`https://nad.fun/token/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-accent-blue transition-colors"
            >
              <ExternalLink size={16} />
            </a>
          </div>
          <p className="text-gray-400">{token.name}</p>
        </div>

        {/* Verdict badge */}
        {verdict && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-4 py-2 rounded-lg font-bold text-lg"
            style={{ 
              backgroundColor: `${verdictColor}20`,
              color: verdictColor,
              border: `2px solid ${verdictColor}`
            }}
          >
            {verdict.verdict.toUpperCase()}
          </motion.div>
        )}
      </div>

      {/* Price */}
      <div className="mb-4">
        <p className="text-3xl font-poppins font-bold text-white">
          ${formatPrice(token.price)}
        </p>
        <p className={`text-sm ${token.priceChange24h >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
          {formatPercent(token.priceChange24h)} (24h)
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-primary rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <TrendingUp size={14} />
            <span>MCap</span>
          </div>
          <p className="font-poppins font-bold text-white">
            ${formatNumber(token.mcap)}
          </p>
        </div>
        <div className="bg-bg-primary rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Droplets size={14} />
            <span>Liquidity</span>
          </div>
          <p className="font-poppins font-bold text-white">
            ${formatNumber(token.liquidity)}
          </p>
        </div>
        <div className="bg-bg-primary rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Users size={14} />
            <span>Holders</span>
          </div>
          <p className="font-poppins font-bold text-white">
            {token.holders}
          </p>
        </div>
      </div>

      {/* Deployer */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">
          Deployer: {' '}
          <a
            href={`https://monadvision.com/address/${token.deployer}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-blue hover:underline font-poppins"
          >
            {formatAddress(token.deployer)}
          </a>
        </p>
      </div>
    </motion.div>
  );
}
