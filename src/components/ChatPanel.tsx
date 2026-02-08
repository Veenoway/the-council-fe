'use client';

// ============================================================
// CHAT PANEL — Displays bot conversation
// ============================================================

import { useEffect, useRef } from 'react';
import { Message, BotId } from '@/types';

interface ChatPanelProps {
  messages: Message[];
  botConfig: Record<BotId, { name: string; imgURL: string; color: string }>;
  className?: string;
}

export function ChatPanel({ messages, botConfig, className = '' }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getBotInfo = (botId: string) => {
    if (botId.startsWith('human_')) {
      return { name: `Anon`, imgURL: '/bots/anon.jpg', color: '#666' };
    }
    return botConfig[botId as BotId] || { name: botId, imgURL: '/bots/anon.jpg', color: '#666' };
  };

  return (
    <div className={`bg-[#0a0a0a] rounded-lg flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-sm">💬 Council Chat</h3>
        <span className="text-xs text-zinc-500">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-zinc-500 py-8">
            Waiting for discussion...
          </div>
        ) : (
          messages.map((msg) => {
            const bot = getBotInfo(msg.botId);
            const isTransaction = msg.content.includes('tx:') || msg.content.includes('0x');
           
            
            return (
              <div key={msg.id} className="flex gap-2 group">
                {/* Avatar */}
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                  style={{ backgroundColor: `${bot.color}20` }}
                >
                  <img src={bot.imgURL} alt={bot.name} className="w-8 h-8 rounded-full" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span 
                      className="font-medium text-sm"
                      style={{ color: bot.color }}
                    >
                      {bot.name}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  
                  <p className={`text-sm mt-0.5 break-words ${
                    isTransaction ? 'text-green-400 font-mono text-xs' : 'text-zinc-300'
                  }`}>
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input (optional - for human messages) */}
      <div className="p-2 border-t border-zinc-800 shrink-0">
        <input
          type="text"
          placeholder="Type a message... (coming soon)"
          disabled
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-400 placeholder-zinc-600 cursor-not-allowed"
        />
      </div>
    </div>
  );
}

export default ChatPanel;
