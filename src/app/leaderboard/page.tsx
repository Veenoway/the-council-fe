// src/app/leaderboard/page.tsx

import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Leaderboard | The Apostate",
  description: "Top traders competing alongside The Council AI bots on Monad",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  color: string;
  type: "human" | "agent" | "bot";
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalInvested: number;
  totalCurrentValue: number;
  pnlMon: number;
  pnlPercent: number;
  topPositions: Array<{
    symbol: string;
    pnlPercent: number;
    valueMon: number;
  }>;
}

async function getLeaderboard(
  from?: string,
  to?: string,
  minHold?: string,
): Promise<{ leaderboard: LeaderboardEntry[]; filters: any }> {
  try {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (minHold) params.set("minHold", minHold);
    const res = await fetch(`${API_URL}/api/leaderboard?${params.toString()}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return { leaderboard: [], filters: {} };
    return res.json();
  } catch {
    return { leaderboard: [], filters: {} };
  }
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; minHold?: string }>;
}) {
  const params = await searchParams;
  const { leaderboard, filters } = await getLeaderboard(
    params.from,
    params.to,
    params.minHold,
  );

  // Stats
  const totalTraders = leaderboard.length;
  const totalTrades = leaderboard.reduce((s, e) => s + e.trades, 0);
  const totalPnl = leaderboard.reduce((s, e) => s + e.pnlMon, 0);
  const avgWinRate =
    totalTraders > 0
      ? Math.round(
          leaderboard.reduce((s, e) => s + e.winRate, 0) / totalTraders,
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header — matches main app */}
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 ">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="The Apostate"
              className="w-10 h-10 rounded-full"
            />
            <h1 className="text-xl font-bold font-poppins uppercase">
              The Apostate
            </h1>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-zinc-500 uppercase tracking-wider">
            Leaderboard
          </span>
        </div>
      </header>

      {/* Stats bar — matches BotPositions style */}
      <div className="border-b border-zinc-800 max-w-7xl mx-auto">
        <div className="max-w-[1400px] mx-auto py-4">
          <div className="grid grid-cols-4 gap-4">
            <StatBox label="Traders" value={String(totalTraders)} />
            <StatBox label="Total Trades" value={String(totalTrades)} />
            <StatBox
              label="Total P&L"
              value={`${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)} MON`}
              isPositive={totalPnl >= 0}
            />
            <StatBox label="Avg Win Rate" value={`${avgWinRate}%`} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-zinc-800 max-w-7xl mx-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center gap-3">
          <FilterLink
            label="All Time"
            href="/leaderboard"
            active={!params.from && !params.to}
          />
          <FilterLink
            label="This Week"
            href={`/leaderboard?from=${getMonday(new Date()).toISOString().split("T")[0]}`}
            active={
              params.from === getMonday(new Date()).toISOString().split("T")[0]
            }
          />
          <FilterLink
            label="Today"
            href={`/leaderboard?from=${new Date().toISOString().split("T")[0]}`}
            active={params.from === new Date().toISOString().split("T")[0]}
          />

          <div className="w-px h-5 bg-zinc-800 mx-1" />

          {[0, 50, 100, 500].map((amount) => (
            <FilterLink
              key={amount}
              label={amount === 0 ? "No min" : `≥${amount} MON`}
              href={buildFilterUrl(params.from, params.to, String(amount))}
              active={(params.minHold || "0") === String(amount)}
              variant="amber"
            />
          ))}
        </div>
      </div>

      {/* Table */}
      <main className="px-6 py-4 max-w-7xl mx-auto">
        {leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-zinc-500 text-sm">No traders found</p>
            <p className="text-zinc-700 text-xs mt-1">
              Adjust filters or wait for trades
            </p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div
              className="grid items-center gap-2 px-4 py-3 text-[11px] font-medium uppercase tracking-widest text-zinc-500 border-b border-zinc-800"
              style={{
                gridTemplateColumns:
                  "40px 1.5fr 80px 100px 100px 140px 120px 120px",
              }}
            >
              <span>#</span>
              <span>Trader</span>
              <span className="text-center">Type</span>
              <span className="text-right">Trades</span>
              <span className="text-right">Win Rate</span>
              <span className="text-right">Invested</span>
              <span className="text-right">P&L</span>
              <span className="text-right">P&L %</span>
            </div>

            {/* Rows */}
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className="grid items-center gap-2 px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors"
                style={{
                  gridTemplateColumns:
                    "40px 1.5fr 80px 100px 100px 140px 120px 120px",
                }}
              >
                {/* Rank */}
                <span
                  className={`text-sm font-bold ${
                    entry.rank === 1
                      ? "text-yellow-400"
                      : entry.rank === 2
                        ? "text-zinc-300"
                        : entry.rank === 3
                          ? "text-amber-600"
                          : "text-zinc-600"
                  }`}
                >
                  {entry.rank}
                </span>

                {/* Trader */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 border border-zinc-800"
                    style={{ backgroundColor: entry.color + "15" }}
                  >
                    {entry.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {entry.name}
                    </p>
                    {entry.topPositions.length > 0 && (
                      <p className="text-[10px] text-zinc-600 truncate">
                        {entry.topPositions
                          .map((p) => `$${p.symbol}`)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Type badge */}
                <div className="flex justify-center">
                  <span
                    className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded ${
                      entry.type === "bot"
                        ? "bg-amber-500/10 text-amber-400"
                        : entry.type === "human"
                          ? "bg-cyan-500/10 text-cyan-400"
                          : "bg-purple-500/10 text-purple-400"
                    }`}
                  >
                    {entry.type}
                  </span>
                </div>

                {/* Trades */}
                <span className="text-sm text-zinc-400 text-right">
                  {entry.trades}
                </span>

                {/* Win Rate */}
                <span
                  className={`text-sm text-right ${
                    entry.winRate >= 60
                      ? "text-green-400"
                      : entry.winRate >= 40
                        ? "text-zinc-400"
                        : "text-red-400"
                  }`}
                >
                  {entry.winRate}%
                </span>

                {/* Invested */}
                <span className="text-sm text-zinc-500 text-right">
                  {entry.totalInvested.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}{" "}
                  <span className="text-zinc-700">MON</span>
                </span>

                {/* P&L MON */}
                <span
                  className={`text-sm font-medium text-right ${
                    entry.pnlMon >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {entry.pnlMon >= 0 ? "+" : ""}
                  {entry.pnlMon.toFixed(2)}
                </span>

                {/* P&L % */}
                <div className="flex justify-end">
                  <span
                    className={`text-sm font-bold px-2 py-0.5 rounded ${
                      entry.pnlPercent >= 0
                        ? "text-green-400 bg-green-500/10"
                        : "text-red-400 bg-red-500/10"
                    }`}
                  >
                    {entry.pnlPercent >= 0 ? "+" : ""}
                    {entry.pnlPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer — matches main app */}
      <footer className="h-8 border-t border-zinc-800 flex items-center justify-center px-4 text-xs text-zinc-700 bg-[#080808]">
        Powered by Grok × nad.fun × Monad
      </footer>
    </div>
  );
}

// ─── COMPONENTS ──────────────────────────────────────────────

function StatBox({
  label,
  value,
  isPositive,
}: {
  label: string;
  value: string;
  isPositive?: boolean;
}) {
  return (
    <div className="border border-zinc-800 rounded px-4 py-3">
      <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">
        {label}
      </p>
      <p
        className={`text-lg font-bold ${
          isPositive !== undefined
            ? isPositive
              ? "text-green-400"
              : "text-red-400"
            : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function FilterLink({
  label,
  href,
  active,
  variant = "default",
}: {
  label: string;
  href: string;
  active: boolean;
  variant?: "default" | "amber";
}) {
  return (
    <Link
      href={href}
      className={`text-xs px-3 py-1.5 rounded border transition-colors ${
        active
          ? variant === "amber"
            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
            : "border-zinc-600 bg-zinc-800 text-white"
          : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
      }`}
    >
      {label}
    </Link>
  );
}

// ─── UTILS ───────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildFilterUrl(from?: string, to?: string, minHold?: string): string {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (minHold) params.set("minHold", minHold);
  const qs = params.toString();
  return `/leaderboard${qs ? `?${qs}` : ""}`;
}
