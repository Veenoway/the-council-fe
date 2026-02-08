'use client';

// ============================================================
// TRADE PANEL — Buy/Sell interface
// ============================================================

import { useState } from 'react';
import { Token } from '@/types';

interface TradePanelProps {
  token: Token | null;
  className?: string;
}

export function TradePanel({ token, className = '' }: TradePanelProps) {
  const [amount, setAmount] = useState('0.5');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [isLoading, setIsLoading] = useState(false);

  const presetAmounts = ['0.1', '0.5', '1', '2', '5'];

  const handleTrade = async () => {
    if (!token) return;
    
    setIsLoading(true);
    
    try {
      // TODO: Connect to wallet and execute trade
      console.log(`${side.toUpperCase()} ${amount} MON of ${token.symbol}`);
      
      // Simulate delay
      await new Promise(r => setTimeout(r, 1000));
      
      alert(`Trade executed! ${side.toUpperCase()} ${amount} MON`);
    } catch (error) {
      console.error('Trade error:', error);
      alert('Trade failed');
    } finally {
      setIsLoading(false);
    }
  };

  const estimatedTokens = token && amount 
    ? (parseFloat(amount) / token.price).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : '0';

  return (
    <div className={className}>
      <h3 className="font-semibold text-sm mb-3">Trade</h3>

      {!token ? (
        <div className="text-zinc-500 text-sm">No token selected</div>
      ) : (
        <div className="space-y-3">
          {/* Buy/Sell toggle */}
          <div className="flex gap-1 p-1 bg-zinc-900 rounded">
            <button
              onClick={() => setSide('buy')}
              className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${
                side === 'buy'
                  ? 'bg-green-500 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide('sell')}
              className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${
                side === 'sell'
                  ? 'bg-red-500 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Amount (MON)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-green-500 focus:outline-none"
              placeholder="0.00"
              step="0.1"
              min="0"
            />
          </div>

          {/* Preset amounts */}
          <div className="flex gap-1">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className={`flex-1 py-1 text-xs rounded transition-colors ${
                  amount === preset
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Estimate */}
          <div className="text-xs text-zinc-500">
            ≈ {estimatedTokens} {token.symbol}
          </div>

          {/* Execute button */}
          <button
            onClick={handleTrade}
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
            className={`w-full py-2.5 rounded font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              side === 'buy'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              `${side === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`
            )}
          </button>

        
        </div>
      )}
    </div>
  );
}

export default TradePanel;
