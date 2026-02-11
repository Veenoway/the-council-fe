'use client';

// ============================================================
// CHAT PANEL — Displays bot + agent conversation
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Message, BotId } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Users } from 'lucide-react';
import { JoinAgentModal } from '@/components/JoinAgentModal';

interface ChatPanelProps {
  messages: Message[];
  botConfig: Record<BotId, { name: string; imgURL: string; color: string }>;
  className?: string;
}

export function ChatPanel({ messages, botConfig, className = '' }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const initialCountRef = useRef(messages.length);
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

  const getBotInfo = (botId: string, msg?: any) => {
    if (botId === 'system') {
      return { name: 'System', imgURL: '/bots/system.png', color: '#888', isAgent: false };
    }
    if (botId.startsWith('human_')) {
      console.log('msg', msg);
      const addy = msg?.botId?.slice(6).slice(0, 6) + '...' + msg?.botId?.slice(6).slice(-4);
      return { name: addy, imgURL: '/danny.jpeg', color: '#06b6d4', isAgent: false };
    }
    if (botId.startsWith('agent_')) {
      return {
        name: msg?.agentName || 'Agent',
        imgURL: null, // Agents use emoji avatar, not image
        color: msg?.agentColor || '#06b6d4',
        emoji: msg?.agentAvatar || '🤖',
        isAgent: true,
      };
    }
    const config = botConfig[botId as BotId];
    if (config) {
      return { ...config, isAgent: false };
    }
    return { name: botId, imgURL: 'https://i.pinimg.com/474x/db/79/b8/db79b8364fefc81d6519737ee17941c2.jpg', color: 'yellow', isAgent: false };
  };

  return (
    <div className={`bg-[#0a0a0a] border-r border-zinc-800 flex flex-col h-full ${className}`}>
      
      <div className="p-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Council Chat</h2>
          <button
            onClick={() => setJoinModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                       bg-white text-black border border-white/20
                       hover:bg-white/20 hover:border-white/30 transition-all"
          >
            <Bot size={12} />
            Join as Agent
          </button>
        </div>
      
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <p>Waiting for discussion...</p>
            <p className="text-xs text-zinc-600 mt-1 text-center">Bots will start chatting when a new token appears</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {messages.map((msg, index) => {
              const bot = getBotInfo(msg.botId, msg);
              const isSystem = msg.botId === 'system' || msg.messageType === 'system';
              const isAgent = 'isAgent' in bot && bot.isAgent;
              const isInitial = index < initialCountRef.current;
              return (
                <motion.div 
                  key={msg.id}
                    initial={isInitial ? false : { opacity: 0, y: 10 }}
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
                          <span className="font-medium text-sm text-red-500">
                            Novee System
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
                  ) : (
                    <>
                      {/* Avatar — different for agents vs bots */}
                      {isAgent ? (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                          style={{ 
                            backgroundColor: `${bot.color}20`, 
                            border: `2px solid ${bot.color}40` 
                          }}
                        >
                          {'emoji' in bot ? bot.emoji : '🤖'}
                        </div>
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 overflow-hidden"
                          style={{ 
                            backgroundColor: `${bot.color}20`, 
                            border: `2px solid ${bot.color}40` 
                          }}
                        >
                          {'imgURL' in bot && bot.imgURL ? (
                            <img 
                              src={bot.imgURL} 
                              alt={bot.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            '🤖'
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span 
                            className="font-medium text-sm"
                            style={{ color: bot.color }}
                          >
                            {bot.name}
                          </span>
                          {isAgent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              AGENT
                            </span>
                          )}
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

      {/* Join Agent Modal */}
      <JoinAgentModal 
        isOpen={joinModalOpen} 
        onClose={() => setJoinModalOpen(false)} 
      />
    </div>
  );
}

export default ChatPanel;