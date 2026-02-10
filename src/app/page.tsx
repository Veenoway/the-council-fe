import { TradingTerminal } from "@/components/TradingTerminal";
import { Token } from "@/types";
import { Message } from "postcss";

async function getCurrentState(): Promise<{
  token: Token | null;
  messages: Message[];
  trades: any[];  // Ajouter ça
}> {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3005';
    
    // Fetch en parallèle pour être plus rapide
    const [stateRes, tradesRes] = await Promise.all([
      fetch(`${backendUrl}/api/current-token`, { next: { revalidate: 0 } }),
      fetch(`${backendUrl}/api/trades/live`, { next: { revalidate: 0 } }),
    ]);

    const stateData = stateRes.ok ? await stateRes.json() : { token: null, messages: [] };
    const tradesData = tradesRes.ok ? await tradesRes.json() : { trades: [] };

    return {
      token: stateData.token || null,
      messages: stateData.messages || [],
      trades: tradesData.trades || [],
    };
  } catch (error) {
    return { token: null, messages: [], trades: [] };
  }
}

export default async function Home() {
  const { token, messages, trades } = await getCurrentState();

  return (
    <TradingTerminal 
      initialToken={token} 
      initialMessages={messages as unknown as Message[]}
      initialTrades={trades}  // Passer les trades
    />
  );
} 