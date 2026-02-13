"use client";

// ============================================================
// TRADING TERMINAL — Main layout with SSR support
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { Token, Message, Trade, BotId, Verdict } from "@/types";
import { useWebSocket } from "@/hooks/useWebSocket";
import Chart from "./Chart";
import ChatPanel from "./ChatPanel";
import TokenInfo from "./TokenInfo";
import TradePanel from "./TradePanel";
import BotPositions from "./BotPositions";
import Predictions from "./Predictions";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { useAccount } from "wagmi";
import { TokenHistory } from "./TokenHistory";
import { LiveTrades } from "./LiveTrades";
import RightSidebar from "./RightBar";
import { TokenSearchModal } from "./TokenSearchModal";
import { BuyCouncilModal } from "./BuyCouncilModal";
import { Search, Crown, TwitterIcon, X, Twitter } from "lucide-react";
import TradeSidebar from "./TradeSidebar";
import { COUNCIL_TOKEN_ADDRESS, useHoldsToken } from "@/hooks/usePredictions";
import Link from "next/link";
import { FaXTwitter } from "react-icons/fa6";
import { LiaTelegram } from "react-icons/lia";

// ============================================================
// BOT CONFIG
// ============================================================

const BOT_CONFIG: Record<
  BotId,
  { name: string; imgURL: string; color: string }
> = {
  chad: { name: "James", imgURL: "/bots/james.jpg", color: "#22c55e" },
  quantum: { name: "Keone Hon", imgURL: "/bots/keone.jpg", color: "#3b82f6" },
  sensei: { name: "Portdev", imgURL: "/bots/portdev.png", color: "#f59e0b" },
  sterling: {
    name: "Harpaljadeja",
    imgURL: "/bots/harpal.jpg",
    color: "#8b5cf6",
  },
  oracle: { name: "Mikeweb", imgURL: "/bots/mike.jpg", color: "#ec4899" },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";

// ============================================================
// PROPS
// ============================================================

interface TradingTerminalProps {
  initialToken?: Token | null;
  initialMessages?: Message[] | any;
  initialTrades?: Trade[];
}

// ============================================================
// TERMINAL COMPONENT
// ============================================================

export function TradingTerminal({
  initialToken = null,
  initialMessages = [],
  initialTrades = [],
}: TradingTerminalProps) {
  // Initialize with SSR data
  const { holdsToken, isLoading: isCheckingToken } = useHoldsToken(
    COUNCIL_TOKEN_ADDRESS,
  );
  const [currentToken, setCurrentToken] = useState<Token | null>(initialToken);
  const [previousToken, setPreviousToken] = useState<Token | null>(
    initialToken,
  );
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const { address } = useAccount();
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  // Modal states
  const [searchOpen, setSearchOpen] = useState(false);
  const [buyCouncilOpen, setBuyCouncilOpen] = useState(false);

  // WebSocket connection
  const { isConnected, lastMessage } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001",
  );

  // Handle Search button click - different behavior based on holder status
  const handleSearchClick = () => {
    if (!address) {
      return;
    }
    if (holdsToken) {
      setSearchOpen(true);
    } else {
      setBuyCouncilOpen(true);
    }
  };

  // Handle token selection from search modal
  const handleTokenSelect = (token: any) => {
    console.log("🎯 Token selected for analysis:", token.symbol);
  };

  // Handle successful COUNCIL purchase
  const handleCouncilPurchaseSuccess = () => {
    setBuyCouncilOpen(false);
    setTimeout(() => {
      setSearchOpen(true);
    }, 500);
  };

  // --------------------------------------------------------
  // HANDLE WEBSOCKET MESSAGES
  // --------------------------------------------------------
  useEffect(() => {
    if (!lastMessage) return;

    const { type, data } = lastMessage;

    switch (type) {
      case "connected":
        setConnected(true);
        break;

      case "new_token":
        if (currentToken) {
          setPreviousToken(currentToken);
          setMessages((prev) => {
            const separatorId = `separator-${data.address}`;
            if (prev.some((m) => m.id === separatorId)) {
              return prev; // Skip duplicate separator
            }
            return [
              ...prev,
              {
                id: separatorId,
                botId: "system",
                content: `── New token: $${data.symbol} ──`,
                messageType: "system",
                createdAt: new Date(),
              },
            ];
          });
        }
        setCurrentToken(data);
        setVerdict(null);
        break;

      case "message":
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) {
            return prev;
          }
          return [...prev, data];
        });
        break;

      case "trade":
        setTrades((prev) => {
          if (prev.some((t) => t.id === data.id || t.txHash === data.txHash)) {
            console.log("⏭️ Duplicate trade, skipping");
            return prev;
          }
          const newTrades = [...prev, data];
          console.log("📊 Updated trades:", newTrades.length);
          return newTrades.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        });
        break;

      case "verdict":
        setVerdict(data.verdict);
        if (data.token) {
          setCurrentToken(data.token);
        }
        break;
    }
  }, [lastMessage, currentToken]);

  useEffect(() => {
    setConnected(isConnected);
  }, [isConnected]);

  const chartToken = currentToken || previousToken;

  return (
    <div className="h-screen w-screen bg-[#050505] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 bg-[#080808]">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="The Apostate"
            className="w-10 h-10 rounded-full"
          />
          <h1 className="text-xl font-bold font-poppins uppercase mr-4">
            The Apostate
          </h1>
          <ul className="flex items-center gap-4 border-l-2 border-zinc-600 pl-5">
            <li className="text-sm flex items-center gap-1">
              <Link
                href="https://t.me/TheApostateLive"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <LiaTelegram size={16} />
                Telegram
              </Link>
            </li>
            <li className="text-sm flex items-center gap-1">
              <Link
                href="https://x.com/the_apostate_"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <FaXTwitter size={14} />
                Twitter
              </Link>
            </li>
          </ul>
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
            <span className="text-zinc-400 font-poppins text-sm">
              ${chartToken.price?.toFixed(10)}
            </span>
            {chartToken.priceChange24h !== undefined &&
              chartToken.priceChange24h !== 0 && (
                <span
                  className={`text-sm font-medium ${chartToken.priceChange24h >= 0 ? "text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded" : "text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded"}`}
                >
                  {chartToken.priceChange24h >= 0 ? "+" : ""}
                  {chartToken.priceChange24h?.toFixed(2)}%
                </span>
              )}
          </div>
        )}

        {/* Search Token Button / Connect Wallet */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full transition-colors ${connected ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}
            />
            <span className="text-xs text-zinc-500">
              {connected ? "Live" : "Connecting..."}
            </span>
          </div>
          {address ? (
            <button
              onClick={handleSearchClick}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                ${
                  holdsToken
                    ? "bg-white hover:bg-zinc-100 text-black"
                    : "bg-white text-black"
                }
              `}
            >
              <Search size={14} />
              <span>Search Token</span>
            </button>
          ) : (
            <ConnectWalletButton />
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden w-full">
        {/* Left side - Chat */}
        <ChatPanel
          messages={messages}
          botConfig={BOT_CONFIG}
          className="w-80 shrink-0"
        />

        {/* Center - Chart + Positions */}
        <div className="flex flex-col p-2 gap-2 min-w-0 w-full">
          <Chart token={chartToken} className=" min-h-[calc(100vh - 486px)]" />
          <BotPositions
            trades={trades}
            token={currentToken}
            botConfig={BOT_CONFIG}
            className="flex-1 overflow-auto"
          />
        </div>

        {/* Right sidebar */}
        <RightSidebar
          marketContent={
            <>
              <TokenInfo
                token={chartToken}
                isActive={!!currentToken}
                className="p-4 border-b border-zinc-800"
              />
              <LiveTrades wsTrades={trades} />
            </>
          }
          predictionsContent={
            <Predictions botConfig={BOT_CONFIG} className="" />
          }
          swapContent={
            <TradeSidebar
              currentToken={currentToken}
              lastVerdict={verdict as any | null}
              isAnalyzing={!!currentToken}
            />
          }
          className="w-72 border-l border-zinc-800 flex flex-col shrink-0 bg-[#080808]"
        />
      </div>

      {/* Status bar */}
      <footer className="h-8 border-t border-zinc-800 flex items-center justify-between px-4 text-xs text-zinc-600 bg-[#080808] shrink-0">
        <div className="flex items-center gap-4">
          <span>💬 {messages.length}</span>
          <span>📈 {trades.length} trades</span>
          {holdsToken && (
            <span className="flex items-center gap-1 text-yellow-500">
              <Crown size={12} />
              Council Holder
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-700">
            Powered by Grok × nad.fun × Monad
          </span>
        </div>
      </footer>

      {/* Token Search Modal - Only for holders */}
      <TokenSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectToken={handleTokenSelect}
        isHolder={holdsToken}
        userAddress={address}
      />

      {/* Buy Council Modal - For non-holders */}
      {!holdsToken ? (
        <BuyCouncilModal
          isOpen={buyCouncilOpen}
          onClose={() => setBuyCouncilOpen(false)}
          onSuccess={handleCouncilPurchaseSuccess}
        />
      ) : null}
    </div>
  );
}

export default TradingTerminal;
