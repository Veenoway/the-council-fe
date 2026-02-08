'use client';

// ============================================================
// TRADING TERMINAL — Main layout with SSR support
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { Token, Message, Trade, BotId } from '@/types';
import { useWebSocket } from '@/hooks/useWebSocket';
import Chart from './Chart';
import ChatPanel from './ChatPanel';
import TokenInfo from './TokenInfo';
import TradePanel from './TradePanel';
import BotPositions from './BotPositions';
import Predictions from './Predictions';

// ============================================================
// BOT CONFIG
// ============================================================

const BOT_CONFIG: Record<BotId, { name: string; imgURL: string; color: string }> = {
  chad: { name: 'James', imgURL: '/bots/james.jpg', color: '#22c55e' },
  quantum: { name: 'Keone Hon', imgURL: '/bots/keone.jpg', color: '#3b82f6' },
  sensei: { name: 'Portdev', imgURL: '/bots/portdev.png', color: '#f59e0b' },
  sterling: { name: 'Harpaljadeja', imgURL: '/bots/harpal.jpg', color: '#8b5cf6' },
  oracle: { name: 'Mikeweb', imgURL: '/bots/mike.jpg', color: '#ec4899' },
};

// ============================================================
// PROPS
// ============================================================

interface TradingTerminalProps {
  initialToken?: Token | null;
  initialMessages?: Message[];
}

// ============================================================
// TERMINAL COMPONENT
// ============================================================

export function TradingTerminal({ 
  initialToken = null, 
  initialMessages = [] 
}: TradingTerminalProps) {
  // Initialize with SSR data
  const [currentToken, setCurrentToken] = useState<Token | null>(initialToken);
  const [previousToken, setPreviousToken] = useState<Token | null>(initialToken);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  // WebSocket connection
  const { isConnected, lastMessage } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
  );
  
  // --------------------------------------------------------
  // HANDLE WEBSOCKET MESSAGES
  // --------------------------------------------------------
  useEffect(() => {
    if (!lastMessage) return;

    const { type, data } = lastMessage;

    switch (type) {
      case 'connected':
        setConnected(true);
        break;

      case 'new_token':
        // Save current as previous before switching
        if (currentToken) {
          setPreviousToken(currentToken);
        }
        setCurrentToken(data);
        setMessages([]);
        setTrades([]);
        setVerdict(null);
        break;

      case 'message':
        setMessages(prev => [...prev, data]);
        break;

      case 'trade':
        setTrades(prev => [...prev, data]);
        break;

      case 'verdict':
        setVerdict(data.verdict);
        if (data.token) {
          setCurrentToken(data.token);
        }
        break;
    }
  }, [lastMessage, currentToken]);

  // Update connected state
  useEffect(() => {
    setConnected(isConnected);
  }, [isConnected]);

  // Token to display on chart - current, or previous if none
  const chartToken = currentToken || previousToken;

  return (
    <div className="h-screen w-screen bg-[#050505] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 bg-[#080808]">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">The Council</h1>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full transition-colors ${connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
            <span className="text-xs text-zinc-500">
              {connected ? 'Live' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Current token info */}
        {chartToken && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white uppercase">
                ${chartToken.symbol}
              </span>
              {!currentToken && previousToken && (
                <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
                  Previous
                </span>
              )}
            </div>
            <span className="text-zinc-400 font-mono text-sm">
              ${chartToken.price?.toFixed(10)}
            </span>
            {chartToken.priceChange24h !== undefined && chartToken.priceChange24h !== 0 && (
              <span className={`text-sm font-medium ${chartToken.priceChange24h >= 0 ? 'text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded' : 'text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded'}`}>
                {chartToken.priceChange24h >= 0 ? '+' : ''}{chartToken.priceChange24h?.toFixed(2)}%
              </span>
            )}
            {verdict && currentToken && (
              <span className={`px-3 py-1 rounded text-sm font-bold uppercase ${
                verdict === 'buy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                verdict === 'pass' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                {verdict}
              </span>
            )}
          </div>
        )}

        {/* Links */}
        <div className="flex items-center gap-3">
          {chartToken && (
            <a
              href={`https://nad.fun/token/${chartToken.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-green-400 transition-colors text-sm flex items-center gap-1"
            >
              nad.fun <span className="text-xs">↗</span>
            </a>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left side - Chart + Chat */} 
        <ChatPanel 
            messages={messages} 
            botConfig={BOT_CONFIG}
            className="w-80 shrink-0"
          />
        <div className="flex-1 flex flex-col p-2 gap-2 min-w-0">
          {/* Chart - shows immediately with SSR token */}
          <Chart 
            token={chartToken} 
            className="flex-1 min-h-0" 
          />

          {/* Chat below chart */}
           <BotPositions 
            trades={trades} 
            token={currentToken}
            botConfig={BOT_CONFIG}
            className="flex-1 overflow-auto"
          />
        </div>

        {/* Right sidebar */}
        <div className="w-80 border-l border-zinc-800 flex flex-col shrink-0 bg-[#080808]">
          {/* Token Info */}
          {/* <TokenInfo 
            token={chartToken} 
            isActive={!!currentToken}
            className="p-4 border-b border-zinc-800" 
          /> */}

          {/* Trade Panel */}
          {/* <TradePanel 
            token={currentToken} 
            className="p-4 border-b border-zinc-800" 
          /> */}

          {/* Bot Positions */}
        <Predictions 
          token={currentToken}
          botConfig={BOT_CONFIG}
          className=""
        />
        </div>
      </div>

      {/* Status bar */}
      <footer className="h-8 border-t border-zinc-800 flex items-center justify-between px-4 text-xs text-zinc-600 bg-[#080808] shrink-0">
        <div className="flex items-center gap-4">
          <span>💬 {messages.length}</span>
          <span>📈 {trades.length} trades</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-700">Powered by Grok × nad.fun × Monad</span>
        </div>
      </footer>
    </div>
  );
}

export default TradingTerminal;