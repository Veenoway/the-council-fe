// ============================================================
// ChatMessage — Individual message in the chat
// ============================================================

'use client';

import { motion } from 'framer-motion';
import { getBotColor, getBotName, getBotEmoji } from '@/lib/bots';
import { timeAgo, formatTxHash } from '@/lib/utils';
import type { Message } from '@/types';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const color = getBotColor(message.botId);
  const name = getBotName(message.botId);
  const emoji = getBotEmoji(message.botId);
  const isSystem = message.botId === 'system';
  const isHuman = message.botId.toString().startsWith('human_');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 p-3 rounded-lg ${
        isSystem ? 'bg-bg-tertiary/50' : 'hover:bg-bg-tertiary/30'
      }`}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
        style={{ backgroundColor: `${color}20`, border: `2px solid ${color}` }}
      >
        {emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold" style={{ color }}>
            {name}
          </span>
          {message.messageType === 'trade' && (
            <span className="text-xs px-2 py-0.5 rounded bg-accent-green/20 text-accent-green">
              TRADE
            </span>
          )}
          {message.messageType === 'verdict' && (
            <span className="text-xs px-2 py-0.5 rounded bg-accent-purple/20 text-accent-purple">
              VERDICT
            </span>
          )}
          <span className="text-xs text-gray-500">
            {timeAgo(new Date(message.createdAt))}
          </span>
        </div>

        {/* Message content */}
        <p className="text-gray-200 break-words whitespace-pre-wrap">
          {message.content}
        </p>

        {/* TX Hash if present */}
        {message.txHash && (
          <a
            href={`https://monadvision.com/tx/${message.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-blue hover:underline mt-1 inline-block"
          >
            TX: {formatTxHash(message.txHash)}
          </a>
        )}
      </div>
    </motion.div>
  );
}
