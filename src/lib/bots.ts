// ============================================================
// BOT CONFIG — Bot personalities and display data
// ============================================================

import type { BotId } from '@/types';

export interface Bot {
  id: BotId;
  name: string;
  imgURL: string;
  color: string;
  description: string;
  personality: string;
  emoji: string;
}

export const BOTS: Record<BotId, Bot> = {
  sensei: {
    id: 'sensei',
    name: 'Portdev',
    imgURL: '/bots/portdev.png',
    color: '#ff6b9d',
    emoji: '🎌',
    description: 'The Anime Degen',
    personality: 'Speaks in weeb references, calls good trades "sugoi" and rugs "yamete"',
  },
  quantum: {
    id: 'quantum',
    name: 'Keone',
    imgURL: '/bots/keone.jpg',
    color: '#00d4ff',
    emoji: '🤓',
    description: 'The Data Scientist',
    personality: 'Only speaks in statistics and probabilities, dismisses vibes',
  },
  chad: {
    id: 'chad',
    name: 'James',
    imgURL: '/bots/james.jpg',
    color: '#ff9500',
    emoji: '🦍',
    description: 'The Ape',
    personality: 'Pure degen energy, apes first thinks never, speaks in caps',
  },
  sterling: {
    id: 'sterling',
    name: 'Harpal',
    imgURL: '/bots/harpal.jpg',
    color: '#c0c0c0',
    emoji: '🎩',
    description: 'The Old Money',
    personality: 'Speaks like a Victorian gentleman, extremely risk-averse',
  },
  oracle: {
    id: 'oracle',
    name: 'Mike',
    imgURL: '/bots/mike.jpg',
    color: '#bf00ff',
    emoji: '👁️',
    description: 'The Mystic',
    personality: 'Cryptic prophecies, references "the patterns", mysterious vibes',
  },
};

export const BOT_IDS: BotId[] = ['sensei', 'quantum', 'chad', 'sterling', 'oracle'];

export function getBotById(id: string): Bot | null {
  if (id in BOTS) {
    return BOTS[id as BotId];
  }
  return null;
}

export function getBotColor(botId: string): string {
  if (botId.startsWith('human_')) return '#00ff88';
  if (botId === 'system') return '#666666';
  return BOTS[botId as BotId]?.color || '#ffffff';
}

export function getBotName(botId: string): string {
  if (botId.startsWith('human_')) {
    const addr = botId.replace('human_', '');
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }
  if (botId === 'system') return 'System';
  return BOTS[botId as BotId]?.name || 'Unknown';
}

export function getBotEmoji(botId: string): string {
  if (botId.startsWith('human_')) return '👤';
  if (botId === 'system') return '⚙️';
  return BOTS[botId as BotId]?.emoji || '🤖';
}

export function getBotImage(botId: string): string | null {
  if (botId.startsWith('human_') || botId === 'system') return null;
  return BOTS[botId as BotId]?.imgURL || null;
}