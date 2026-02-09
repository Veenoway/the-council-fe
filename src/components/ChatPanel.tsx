'use client';

// ============================================================
// CHAT PANEL — Displays bot conversation
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Message, BotId } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatPanelProps {
  messages: Message[];
  botConfig: Record<BotId, { name: string; imgURL: string; color: string }>;
  className?: string;
}

export function ChatPanel({ messages, botConfig, className = '' }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages.length]);

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getBotInfo = (botId: string) => {
    if (botId === 'system') {
      return { name: 'System', imgURL: '/bots/system.png', color: '#888' };
    }
    if (botId.startsWith('human_')) {
      return { name: 'Anon', imgURL: '/bots/anon.jpg', color: '#666' };
    }
    return botConfig[botId as BotId] || { name: botId, imgURL: '/bots/anon.jpg', color: '#666' };
  };

  console.log('ChatPanel render, messages:', messages.length); // Debug log

  return (
    <div className={`bg-[#0a0a0a] border-r border-zinc-800 flex flex-col h-full ${className}`}>
     

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <p>Waiting for discussion...</p>
            <p className="text-xs text-zinc-600 mt-1 text-center">Bots will start chatting when a new token appears</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => {
              const bot = getBotInfo(msg.botId);
              const isSystem = msg.botId === 'system' || msg.messageType === 'system';
              
              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2 group ${isSystem ? 'justify-center' : ''}`}
                >
                  {isSystem ? (
                    <>
                   
                       <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 overflow-hidden"
                        style={{ backgroundColor: `red`, border: `2px solid red` }}
                      >
                        <img 
                          src="/novee.jpg" 
                          alt="Novee System" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span 
                            className="font-medium text-sm text-red-500"
                          >
                            Novee System
                          </span>
                          <span className="text-xs text-zinc-600">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm mt-0.5 break-words text-zinc-300 leading-relaxed">
                          {msg.content}
                        </p>
                      </div> </>
                  ) : (
                    <>
                      {/* Avatar */}
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 overflow-hidden"
                        style={{ backgroundColor: `${bot.color}20`, border: `2px solid ${bot.color}40` }}
                      >
                        <img 
                          src={bot.imgURL} 
                          alt={bot.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
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
                        
                        <p className="text-sm mt-0.5 break-words text-zinc-300 leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Typing indicator */}
      {messages.length > 0 && (
        <div className="px-4 py-2 border-t border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Council is deliberating...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPanel;