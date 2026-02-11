// ============================================================
// TYPES — Shared types for frontend
// ============================================================

export type BotId = 'chad' | 'quantum' | 'sensei' | 'sterling' | 'oracle';

export interface Token {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  mcap: number;
  liquidity: number;
  holders: number;
  deployer: string;
  createdAt: Date | string;
}

export interface Message {
  id: string;
  botId: string;
  content: string;
  token?: string;
  messageType: 'chat' | 'trade' | 'system';
  createdAt: Date | string;
   agentName?: string;     // Display name of the agent
  agentAvatar?: string;   // Emoji avatar (e.g. '🤖')
  agentColor?: string;    // Hex color for the agent
  txHash?: string;        // For trade messages
}

export interface Trade {
  id: string;
  botId: string;
  tokenAddress: string;
  tokenSymbol: string;
  side: 'buy' | 'sell';
  amountIn: number;
  amountOut: number;
  price: number;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: Date | string;
}

export interface Position {
  botId: BotId;
  tokenAddress: string;
  tokenSymbol: string;
  amount: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface Verdict {
  token: Token;
  verdict: 'buy' | 'pass' | 'watch';
  opinions: Record<BotId, string>;
  timestamp: Date | string;
}

export interface WebSocketEvent {
  type: 'connected' | 'new_token' | 'message' | 'trade' | 'verdict';
  data: any;
  timestamp: string;
}
