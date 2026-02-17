// src/components/DAO.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAccount } from "wagmi";
import { ChevronDown, ChevronUp, Shield, Info } from "lucide-react";
import {
  useProposalCount,
  useProposal,
  useMyVote,
  useClaimable,
  useCouncilBalance,
  useVote,
  useClaimReward,
  useCreateProposal,
  useFundPool,
  useFinalize,
  useAvailablePool,
  useTotalRewards,
} from "@/hooks/useDAO";

const ADMIN_WALLETS = (process.env.NEXT_PUBLIC_DAO_ADMIN_WALLETS || "")
  .toLowerCase()
  .split(",")
  .filter(Boolean);

// ============================================================
// INFO TOOLTIP
// ============================================================

function InfoTooltip({
  children,
  position = "top",
}: {
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const update = () => {
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      const gap = 8;
      switch (position) {
        case "bottom":
          setPos({ top: r.bottom + gap, left: r.left + r.width / 2 });
          break;
        case "left":
          setPos({ top: r.top + r.height / 2, left: r.left - gap });
          break;
        case "right":
          setPos({ top: r.top + r.height / 2, left: r.right + gap });
          break;
        default: // top
          setPos({ top: r.top - gap, left: r.left + r.width / 2 });
          break;
      }
    };
    update();

    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        tooltipRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, position]);

  const transformMap = {
    top: "translate(-50%, -100%)",
    bottom: "translate(-50%, 0)",
    left: "translate(-100%, -50%)",
    right: "translate(0, -50%)",
  };

  const arrowMap = {
    top: "absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-zinc-700",
    bottom:
      "absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-zinc-700",
    left: "absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-zinc-700",
    right:
      "absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-zinc-700",
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-zinc-600 hover:text-zinc-400 transition-colors inline-flex"
      >
        <Info size={14} />
      </button>
      {open &&
        mounted &&
        createPortal(
          <div
            ref={tooltipRef}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            className="fixed z-[9999] w-72 p-3 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/40 text-xs text-zinc-400 leading-relaxed"
            style={{
              top: pos.top,
              left: pos.left,
              transform: transformMap[position],
            }}
          >
            {children}
            <div className={arrowMap[position]} />
          </div>,
          document.body,
        )}
    </>
  );
}

// ============================================================
// MAIN CLIENT
// ============================================================

export function DaoClient() {
  const { address } = useAccount();
  const { count, refetch: refetchCount } = useProposalCount();
  const { balance } = useCouncilBalance();
  const { totalRewards } = useTotalRewards();
  const [showAdmin, setShowAdmin] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");

  const isAdmin = address
    ? ADMIN_WALLETS.includes(address.toLowerCase())
    : false;
  const canVote = balance >= 1;

  return (
    <>
      {/* Title + stats */}
      <div className="max-w-[900px] mx-auto px-6 pt-6 pb-1">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">
              Governance
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              $COUNCIL holders shape the future
            </p>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <span className="text-zinc-500">
              <span className="text-green-500 font-medium">{count}</span> Active
            </span>
            <span className="text-zinc-500">
              <span className="text-white font-medium">
                {totalRewards.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>{" "}
              Total power
            </span>
          </div>
        </div>
      </div>

      {/* ── HERO: Reward Pool ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4">
        <div className="relative rounded-md border border-zinc-800 bg-zinc-900/60">
          {/* Amber accent line top */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-white/0 via-white to-white/0 rounded-t-xl" />

          <div className="px-6 py-5 flex items-center justify-between">
            {/* Left: pool */}
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] uppercase tracking-widest text-zinc-500">
                  Reward Pool
                </p>
                <InfoTooltip position="right">
                  <p className="text-zinc-300 font-medium mb-1.5">
                    How it works
                  </p>
                  <p>
                    The reward pool is split among voters who pick the{" "}
                    <span className="text-white">winning option</span>.
                  </p>
                  <p className="mt-1.5">
                    Your share is proportional to your{" "}
                    <span className="text-white">voting power</span> relative to
                    other winning voters.
                  </p>
                  <p className="mt-1.5 text-zinc-500">
                    share = (your weight ÷ total winning weight) × reward
                  </p>
                  <p className="mt-1.5">
                    Percentages shown on options are based on the{" "}
                    <span className="text-white">total $COUNCIL weight</span> of
                    all votes, not the number of voters.
                  </p>
                  <p className="mt-1.5">
                    All votes are <span className="text-white">onchain</span> —
                    your $COUNCIL stays in your wallet, you only pay gas.
                  </p>
                </InfoTooltip>
              </div>
              <div className="flex items-baseline gap-3 mt-2">
                <p className="text-4xl font-black text-white tracking-tight tabular-nums">
                  {totalRewards.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
                <span className="text-sm text-zinc-500 font-medium">
                  $COUNCIL
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 mt-2">
                Vote for the winning option to earn your share
              </p>
            </div>

            {/* Right: your power */}
            <div className="text-right">
              {address ? (
                canVote ? (
                  <>
                    <p className="text-[11px] uppercase tracking-widest text-zinc-500">
                      Your Power
                    </p>
                    <p className="text-3xl font-black text-white mt-1 tabular-nums">
                      {balance.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-1">$COUNCIL</p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] uppercase tracking-widest text-zinc-500">
                      Your Power
                    </p>
                    <p className="text-2xl font-bold text-zinc-600 mt-1">0</p>
                    <a
                      href="https://nad.fun/tokens/0xbE68317D0003187342eCBE7EECA364E4D09e7777"
                      target="_blank"
                      className="text-[11px] text-white underline hover:text-white/50 transition-colors mt-1 inline-block"
                    >
                      Buy $COUNCIL
                    </a>
                  </>
                )
              ) : (
                <>
                  <p className="text-[11px] uppercase tracking-widest text-zinc-500">
                    Your Power
                  </p>
                  <p className="text-2xl font-bold text-zinc-700 mt-1">—</p>
                  <p className="text-[11px] text-zinc-600 mt-1">
                    Connect wallet
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs + balance */}
      <div className="max-w-[900px] mx-auto px-6 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {(["all", "active", "closed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded capitalize transition-colors ${
                filter === f
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {address && canVote && (
          <div className="flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-zinc-400">
              Voting power:{" "}
              <span className="text-white font-medium">
                {balance.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>{" "}
              $COUNCIL
            </span>
          </div>
        )}
      </div>

      {/* Admin toggle */}
      {isAdmin && (
        <div className="max-w-[900px] mx-auto px-6 pt-2">
          <button
            onClick={() => setShowAdmin(!showAdmin)}
            className="flex items-center gap-1.5 text-[11px] text-amber-500/70 hover:text-amber-400 transition-colors"
          >
            <Shield size={12} />
            {showAdmin ? "Hide Admin" : "Admin Panel"}
          </button>
        </div>
      )}

      {showAdmin && isAdmin && <AdminPanel onRefresh={refetchCount} />}

      {/* Proposals */}
      <main className="max-w-[900px] mx-auto px-6 py-4 space-y-4">
        {count === 0 ? (
          <div className="py-20 text-center">
            <p className="text-zinc-500 text-sm">No proposals found</p>
            <p className="text-zinc-700 text-xs mt-1">
              {filter === "closed"
                ? "No closed proposals yet"
                : "Create one to get started"}
            </p>
          </div>
        ) : (
          Array.from({ length: count })
            .map((_, i) => count - 1 - i)
            ?.filter((id) => id === 2)
            .map((id) => (
              <ProposalCard
                key={id}
                proposalId={id}
                canVote={canVote}
                isAdmin={isAdmin}
                filter={filter}
              />
            ))
        )}
      </main>
    </>
  );
}

// ============================================================
// ADMIN PANEL
// ============================================================

function AdminPanel({ onRefresh }: { onRefresh: () => void }) {
  const { availablePool, refetch: refetchPool } = useAvailablePool();
  const { fund, isPending: isFunding, error: fundError } = useFundPool();
  const {
    create,
    isPending: isCreating,
    error: createError,
  } = useCreateProposal();
  const {
    finalize,
    isPending: isFinalizing,
    error: finalizeError,
  } = useFinalize();

  const [fundAmount, setFundAmount] = useState("");
  const [finalizeId, setFinalizeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("feature");
  const [options, setOptions] = useState(["", ""]);
  const [durationHours, setDurationHours] = useState(72);
  const [rewardAmount, setRewardAmount] = useState("");

  const handleFund = async () => {
    if (!fundAmount) return;
    try {
      await fund(parseFloat(fundAmount));
      setFundAmount("");
      refetchPool();
    } catch {}
  };

  const handleCreate = async () => {
    const cleanOptions = options.filter((o) => o.trim());
    if (!title.trim() || cleanOptions.length < 2) return;
    try {
      await create(
        title.trim(),
        description.trim(),
        type,
        cleanOptions,
        durationHours * 3600,
        parseFloat(rewardAmount || "0"),
      );
      setTitle("");
      setDescription("");
      setOptions(["", ""]);
      setRewardAmount("");
      onRefresh();
    } catch {}
  };

  const handleFinalize = async () => {
    if (!finalizeId) return;
    try {
      await finalize(parseInt(finalizeId));
      setFinalizeId("");
    } catch {}
  };

  return (
    <div className="max-w-[900px] mx-auto px-6 pt-3">
      <div className="border border-amber-500/20 rounded-md bg-amber-500/5 p-5 space-y-5">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest">
          Admin Panel
        </h3>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">
              Pool Balance
            </p>
            <p className="text-lg font-bold">
              {availablePool.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{" "}
              $COUNCIL
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              placeholder="Amount"
              className="w-32 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
            />
            <button
              onClick={handleFund}
              disabled={isFunding || !fundAmount}
              className="px-4 py-2 bg-amber-500 text-black text-sm font-medium rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {isFunding ? "..." : "Fund"}
            </button>
          </div>
        </div>
        {fundError && <p className="text-xs text-red-400">{fundError}</p>}

        <div className="border-t border-zinc-800" />

        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-zinc-500">
            Create Proposal
          </p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none"
          />

          <div className="flex gap-2">
            {["naming", "skill", "feature", "custom"].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`text-xs px-3 py-1.5 rounded border capitalize transition-colors ${type === t ? "border-amber-500/50 bg-amber-500/10 text-amber-400" : "border-zinc-800 text-zinc-500 hover:border-zinc-700"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const u = [...options];
                    u[i] = e.target.value;
                    setOptions(u);
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                />
                {options.length > 2 && (
                  <button
                    onClick={() =>
                      setOptions(options.filter((_, j) => j !== i))
                    }
                    className="text-zinc-600 hover:text-red-400 px-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <button
                onClick={() => setOptions([...options, ""])}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                + Add option
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] text-zinc-600 mb-1">Duration</p>
              <div className="flex gap-1">
                {[
                  { label: "10m", value: 0.167 },
                  { label: "6h", value: 6 },
                  { label: "24h", value: 24 },
                  { label: "72h", value: 72 },
                  { label: "7d", value: 168 },
                ].map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDurationHours(d.value)}
                    className={`text-[11px] px-2 py-1 rounded border transition-colors ${durationHours === d.value ? "border-amber-500/50 bg-amber-500/10 text-amber-400" : "border-zinc-800 text-zinc-500"}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-zinc-600 mb-1">
                Reward ($COUNCIL)
              </p>
              <input
                type="number"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                placeholder="0 = no reward"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full px-4 py-2.5 bg-amber-500 text-black text-sm font-bold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {isCreating ? "Creating onchain..." : "Create Proposal"}
          </button>
          {createError && <p className="text-xs text-red-400">{createError}</p>}
        </div>

        <div className="border-t border-zinc-800" />

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">
              Finalize Proposal
            </p>
            <input
              type="number"
              value={finalizeId}
              onChange={(e) => setFinalizeId(e.target.value)}
              placeholder="Proposal ID (0, 1, ...)"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <button
            onClick={handleFinalize}
            disabled={isFinalizing || !finalizeId}
            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-400 transition-colors disabled:opacity-50"
          >
            {isFinalizing ? "..." : "Finalize"}
          </button>
        </div>
        {finalizeError && (
          <p className="text-xs text-red-400">{finalizeError}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// PROPOSAL CARD (original style)
// ============================================================

function ProposalCard({
  proposalId,
  canVote,
  isAdmin,
  filter,
}: {
  proposalId: number;
  canVote: boolean;
  isAdmin: boolean;
  filter: "all" | "active" | "closed";
}) {
  const { address } = useAccount();
  const { proposal, refetch: refetchProposal } = useProposal(proposalId);
  const {
    hasVoted,
    optionIndex: myVoteIndex,
    weight: myWeight,
    refetch: refetchVote,
  } = useMyVote(proposalId);
  const {
    claimable,
    hasClaimed,
    isWinner,
    refetch: refetchClaim,
  } = useClaimable(proposalId);
  const { vote, isPending: isVoting, error: voteError } = useVote();
  const { claim, isPending: isClaiming, error: claimError } = useClaimReward();

  const [expanded, setExpanded] = useState(false);

  if (!proposal) return null;
  if (proposal.cancelled) return null;

  const { isActive, finalized } = proposal;

  if (filter === "active" && !isActive) return null;
  if (filter === "closed" && isActive) return null;

  const timeLeft = getTimeLeft(proposal.endsAt);
  const leading = [...proposal.options].sort((a, b) => b.weight - a.weight)[0];

  const handleVote = async (optionIndex: number) => {
    try {
      await vote(proposalId, optionIndex);
      refetchProposal();
      refetchVote();
    } catch {}
  };

  const handleClaim = async () => {
    try {
      await claim(proposalId);
      refetchClaim();
      refetchProposal();
    } catch {}
  };

  return (
    <div className="border border-zinc-800 rounded-md bg-zinc-900/50 overflow-hidden">
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 text-left hover:bg-zinc-900/30 transition-colors"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-green-500" : "bg-zinc-600"}`}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">
                  {proposal.title}
                </h3>
                <span className="text-[10px] uppercase text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded shrink-0">
                  {proposal.type}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[11px] text-zinc-600">
                  {proposal.totalVotes} vote
                  {proposal.totalVotes !== 1 ? "s" : ""}
                </span>
                <span className="text-[11px] text-zinc-700">·</span>
                <span className="text-[11px] text-zinc-600">
                  {proposal.totalWeight.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}{" "}
                  power
                </span>
                {proposal.rewardAmount > 0 && (
                  <>
                    <span className="text-[11px] text-zinc-700">·</span>
                    <span className="text-[11px] text-zinc-600">
                      {proposal.rewardAmount.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}{" "}
                      $COUNCIL prize
                    </span>
                  </>
                )}
                {leading && leading.weight > 0 && (
                  <>
                    <span className="text-[11px] text-zinc-700">·</span>
                    <span className="text-[11px] text-zinc-400">
                      Leading:{" "}
                      <span className="text-white font-medium">
                        {leading.label}
                      </span>{" "}
                      ({leading.percent}%)
                    </span>
                  </>
                )}
                {hasVoted && (
                  <>
                    <span className="text-[11px] text-zinc-700">·</span>
                    <span className="text-[11px] text-green-500">✓ Voted</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {finalized && isWinner && !hasClaimed && claimable > 0 ? (
              <span className="text-xs font-medium bg-white text-black px-2 py-1 rounded">
                Claimable
              </span>
            ) : isActive ? (
              <span className="text-xs text-zinc-400 bg-zinc-900 px-2 py-1 rounded">
                {timeLeft}
              </span>
            ) : (
              <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-1 rounded">
                Ended
              </span>
            )}
            {expanded ? (
              <ChevronUp size={16} className="text-zinc-500" />
            ) : (
              <ChevronDown size={16} className="text-zinc-500" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-zinc-800/50">
          {proposal.description && (
            <div className="px-5 py-4 border-b border-zinc-800/30">
              <div className="text-sm text-zinc-500 space-y-1">
                {proposal.description
                  .replace(/\\n/g, "\n")
                  .split("\n")
                  .map((line, i) => {
                    if (line.startsWith("━"))
                      return <div key={i} className="h-0" />;
                    const names = [
                      "Donald Trump",
                      "Andrew Tate",
                      "Grandma",
                      "Bill Monday",
                      "Warren Buffett",
                      "Gordon Ramsay",
                      "Snoop Dogg",
                    ];
                    if (names.some((name) => line.trim() === name))
                      return (
                        <p
                          key={i}
                          className="text-white font-bold text-base mt-3"
                        >
                          {line}
                        </p>
                      );
                    if (line.startsWith("Skills:"))
                      return (
                        <p key={i}>
                          <span className="text-zinc-300 font-semibold">
                            Skills:{" "}
                          </span>
                          <span className="text-zinc-400">
                            {line.replace("Skills: ", "")}
                          </span>
                        </p>
                      );
                    if (line.startsWith("Personality:"))
                      return (
                        <p key={i}>
                          <span className="text-zinc-300 font-semibold">
                            Personality:{" "}
                          </span>
                          <span className="text-zinc-400">
                            {line.replace("Personality: ", "")}
                          </span>
                        </p>
                      );
                    if (!line.trim()) return <div key={i} className="h-1" />;
                    return <p key={i}>{line}</p>;
                  })}
              </div>
            </div>
          )}

          <div className="px-5 py-4 space-y-2">
            {proposal.options.map((option) => {
              const isMyVote = hasVoted && myVoteIndex === option.index;
              const isWinnerOption =
                finalized && proposal.winningOption === option.index;
              const canClick =
                isActive && !!address && canVote && !isVoting && !hasVoted;

              return (
                <div
                  key={option.index}
                  onClick={() => {
                    if (canClick) handleVote(option.index);
                  }}
                  className={`relative overflow-hidden rounded-lg border transition-all ${canClick ? "cursor-pointer" : "cursor-default"} ${
                    isMyVote
                      ? "border-green-500/40"
                      : isWinnerOption
                        ? "border-amber-500/40"
                        : canClick
                          ? "border-zinc-800 hover:border-zinc-600"
                          : "border-zinc-800/50"
                  }`}
                >
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${isMyVote ? "bg-green-500/8" : isWinnerOption ? "bg-amber-500/8" : "bg-zinc-800/20"}`}
                    style={{ width: `${option.percent}%` }}
                  />
                  <div className="relative flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      {isMyVote ? (
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                          >
                            <path
                              d="M2 5L4 7L8 3"
                              stroke="black"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      ) : isWinnerOption ? (
                        <span className="text-amber-400 text-sm shrink-0">
                          🏆
                        </span>
                      ) : canClick ? (
                        <div className="w-4 h-4 rounded-full border border-zinc-700 shrink-0" />
                      ) : null}
                      <span
                        className={`text-sm ${isMyVote ? "text-green-400 font-medium" : isWinnerOption ? "text-amber-400 font-medium" : "text-zinc-300"}`}
                      >
                        {option.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] text-zinc-600">
                        {option.votes}
                      </span>
                      <span
                        className={`text-sm font-bold min-w-[44px] text-right ${isMyVote ? "text-green-400" : isWinnerOption ? "text-amber-400" : option.percent > 0 ? "text-zinc-300" : "text-zinc-600"}`}
                      >
                        {option.percent}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {isActive && !address && (
              <p className="text-xs text-zinc-600 text-center pt-2">
                Connect wallet to vote
              </p>
            )}
            {isActive && address && !canVote && (
              <p className="text-xs text-zinc-600 text-center pt-2">
                Hold $COUNCIL to vote ·{" "}
                <a
                  href="https://nad.fun/tokens/0xbE68317D0003187342eCBE7EECA364E4D09e7777"
                  target="_blank"
                  className="text-white underline"
                >
                  Buy
                </a>
              </p>
            )}
            {isVoting && (
              <div className="flex items-center justify-center gap-2 pt-2 text-xs text-zinc-500 animate-pulse">
                <div className="w-3 h-3 border border-zinc-500 border-t-transparent rounded-full animate-spin" />
                Confirming vote onchain...
              </div>
            )}
            {voteError && (
              <p className="text-xs text-red-400 text-center pt-2">
                {voteError}
              </p>
            )}

            {finalized && isWinner && !hasClaimed && claimable > 0 && (
              <button
                onClick={handleClaim}
                disabled={isClaiming}
                className="w-full mt-2 px-4 py-3 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {isClaiming
                  ? "Claiming..."
                  : `Claim ${claimable.toLocaleString(undefined, { maximumFractionDigits: 0 })} $COUNCIL`}
              </button>
            )}
            {hasClaimed && (
              <p className="text-[11px] text-white text-center pt-2">
                ✓ Reward claimed
              </p>
            )}
            {claimError && (
              <p className="text-xs text-red-400 text-center pt-2">
                {claimError}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// UTILS
// ============================================================

function getTimeLeft(endsAt: number): string {
  const diff = endsAt - Date.now();
  if (diff <= 0) return "Ended";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}
