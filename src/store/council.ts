// ============================================================
// STORE — Zustand global state
// ============================================================

import { create } from 'zustand';
import type { Message, Trade, Token, BotStats, Verdict, BotId } from '@/types';

interface CouncilState {
  // Connection
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // Messages
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;

  // Current token being analyzed
  currentToken: Token | null;
  setCurrentToken: (token: Token | null) => void;

  // Last verdict
  verdict: Verdict | null;
  setVerdict: (verdict: Verdict | null) => void;

  // Trades
  trades: Trade[];
  addTrade: (trade: Trade) => void;
  updateTrade: (id: string, updates: Partial<Trade>) => void;

  // Bot stats
  botStats: Record<BotId, BotStats>;
  setBotStats: (stats: BotStats[]) => void;

  // UI state
  selectedBot: BotId | null;
  setSelectedBot: (bot: BotId | null) => void;
}

export const useCouncilStore = create<CouncilState>((set) => ({
  // Connection
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),

  // Messages
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages.slice(-100), message], // Keep last 100
    })),
  clearMessages: () => set({ messages: [] }),

  // Current token
  currentToken: null,
  setCurrentToken: (token) => set({ currentToken: token }),

  // Verdict
  verdict: null,
  setVerdict: (verdict) => set({ verdict }),

  // Trades
  trades: [],
  addTrade: (trade) =>
    set((state) => {
      // Check if trade already exists
      const existingIndex = state.trades.findIndex(t => t.id === trade.id);
      if (existingIndex >= 0) {
        // Update existing trade
        const newTrades = [...state.trades];
        newTrades[existingIndex] = trade;
        return { trades: newTrades };
      }
      // Add new trade at the beginning
      return { trades: [trade, ...state.trades.slice(0, 49)] };
    }),
  updateTrade: (id, updates) =>
    set((state) => ({
      trades: state.trades.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  // Bot stats
  botStats: {} as Record<BotId, BotStats>,
  setBotStats: (stats) =>
    set({
      botStats: stats.reduce(
        (acc, s) => ({ ...acc, [s.botId]: s }),
        {} as Record<BotId, BotStats>
      ),
    }),

  // UI
  selectedBot: null,
  setSelectedBot: (bot) => set({ selectedBot: bot }),
}));