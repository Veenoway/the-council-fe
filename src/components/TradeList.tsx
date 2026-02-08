// ============================================================
// TradeList — Recent trades display
// ============================================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCouncilStore } from '@/store/council';
import { getBotColor, getBotEmoji, getBotName } from '@/lib/bots';
import { formatNumber, formatTxHash, timeAgo } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Loader2, CheckCircle, XCircle } from 'lucide-react';

export function TradeList() {
  const trades = useCouncilStore((s) => s.trades);

  return (
    <div className="bg-bg-secondary rounded-xl border border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-bold text-white">Recent Trades</h2>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {trades.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No trades yet</p>
          </div>
        ) : (
          <AnimatePresence>
            {trades.map((trade) => {
              const color = getBotColor(trade.botId);
              const isBuy = trade.side === 'buy';

              return (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 border-b border-gray-800/50 hover:bg-bg-tertiary/30"
                >
                  {/* Bot avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    {getBotEmoji(trade.botId)}
                  </div>

                  {/* Trade info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color }}>
                        {getBotName(trade.botId)}
                      </span>
                      <span
                        className={`flex items-center gap-1 text-xs font-bold ${
                          isBuy ? 'text-accent-green' : 'text-accent-red'
                        }`}
                      >
                        {isBuy ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {trade.side.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {formatNumber(trade.amountIn)} MON → ${trade.tokenSymbol}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col items-end">
                    {trade.status === 'pending' && (
                      <Loader2 size={16} className="text-yellow-500 animate-spin" />
                    )}
                    {trade.status === 'confirmed' && (
                      <CheckCircle size={16} className="text-accent-green" />
                    )}
                    {trade.status === 'failed' && (
                      <XCircle size={16} className="text-accent-red" />
                    )}
                    <span className="text-xs text-gray-500 mt-1">
                      {timeAgo(new Date(trade.createdAt))}
                    </span>
                  </div>

                  {/* TX link */}
                  {trade.txHash && (
                    <a
                      href={`https://monadvision.com/tx/${trade.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent-blue hover:underline"
                    >
                      {formatTxHash(trade.txHash)}
                    </a>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
