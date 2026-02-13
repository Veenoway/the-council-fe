"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";

export interface TokenTrade {
  id: string;
  botId: string;
  botName: string;
  botColor: string;
  botEmoji: string;
  side: "buy" | "sell";
  amount: number;
  valueMon: number;
  price: number;
  txHash: string;
  timestamp: number; // Unix seconds
  createdAt: string;
}

export function useTokenTrades(tokenAddress: string | null | undefined) {
  const [trades, setTrades] = useState<TokenTrade[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (
      !tokenAddress ||
      tokenAddress === "0x0000000000000000000000000000000000000000"
    ) {
      setTrades([]);
      return;
    }

    let cancelled = false;

    async function fetchTrades() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/trades/${tokenAddress}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setTrades(data.trades || []);
        }
      } catch (err) {
        console.error("Failed to fetch token trades:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTrades();

    return () => {
      cancelled = true;
    };
  }, [tokenAddress]);

  return { trades, loading };
}
