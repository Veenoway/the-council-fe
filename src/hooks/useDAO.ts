// src/hooks/useDAO.ts
"use client";

import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { formatUnits, parseUnits, erc20Abi } from "viem";
import { useState, useCallback } from "react";
import { THE_COUNCIL_DAO_ABI } from "@/hooks/abi";

const DAO_ADDRESS =
  (process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS as `0x${string}`) ||
  "0xa4bbE2C90f90b2D1cC1CE2F83B9563240349eF3f";
const COUNCIL_TOKEN =
  (process.env.NEXT_PUBLIC_COUNCIL_TOKEN_ADDRESS as `0x${string}`) ||
  "0xbE68317D0003187342eCBE7EECA364E4D09e7777";

// ============================================================
// Read: Pool info
// ============================================================

export function useAvailablePool() {
  const { data, refetch } = useReadContract({
    address: DAO_ADDRESS,
    abi: THE_COUNCIL_DAO_ABI,
    functionName: "availablePool",
  });

  return {
    availablePool: data ? parseFloat(formatUnits(data as bigint, 18)) : 0,
    refetch,
  };
}

export function useTotalRewards() {
  const { data, refetch } = useReadContract({
    address: DAO_ADDRESS,
    abi: THE_COUNCIL_DAO_ABI,
    functionName: "totalReserved",
  });

  return {
    totalRewards: data ? parseFloat(formatUnits(data as bigint, 18)) : 0,
    refetch,
  };
}

// ============================================================
// Read: Proposal count
// ============================================================

export function useProposalCount() {
  const { data, refetch } = useReadContract({
    address: DAO_ADDRESS,
    abi: THE_COUNCIL_DAO_ABI,
    functionName: "proposalCount",
  });

  return {
    count: data ? Number(data) : 0,
    refetch,
  };
}

// ============================================================
// Read: Single proposal
// ============================================================

export function useProposal(proposalId: number) {
  const { data: proposalData, refetch: refetchProposal } = useReadContract({
    address: DAO_ADDRESS,
    abi: THE_COUNCIL_DAO_ABI,
    functionName: "getProposal",
    args: [BigInt(proposalId)],
  });

  const { data: optionsData, refetch: refetchOptions } = useReadContract({
    address: DAO_ADDRESS,
    abi: THE_COUNCIL_DAO_ABI,
    functionName: "getOptions",
    args: [BigInt(proposalId)],
  });

  const refetch = useCallback(() => {
    refetchProposal();
    refetchOptions();
  }, [refetchProposal, refetchOptions]);

  if (!proposalData || !optionsData) return { proposal: null, refetch };

  const [
    title,
    description,
    proposalType,
    optionCount,
    startsAt,
    endsAt,
    createdBy,
    cancelled,
    finalized,
    winningOption,
    rewardAmount,
    totalVotes,
    totalWeight,
    totalClaimed,
    isActive,
  ] = proposalData as any;
  const [labels, voteCounts, weights] = optionsData as [
    string[],
    bigint[],
    bigint[],
  ];

  const totalWeightNum = parseFloat(formatUnits(totalWeight as bigint, 18));

  const options = labels.map((label: string, i: number) => {
    const w = parseFloat(formatUnits(weights[i], 18));
    return {
      index: i,
      label,
      votes: Number(voteCounts[i]),
      weight: w,
      percent:
        totalWeightNum > 0 ? Math.round((w / totalWeightNum) * 1000) / 10 : 0,
    };
  });

  return {
    proposal: {
      id: proposalId,
      title: title as string,
      description: description as string,
      type: proposalType as string,
      options,
      startsAt: Number(startsAt) * 1000,
      endsAt: Number(endsAt) * 1000,
      createdBy: createdBy as string,
      cancelled: cancelled as boolean,
      finalized: finalized as boolean,
      winningOption: Number(winningOption),
      rewardAmount: parseFloat(formatUnits(rewardAmount as bigint, 18)),
      totalVotes: Number(totalVotes),
      totalWeight: totalWeightNum,
      totalClaimed: parseFloat(formatUnits(totalClaimed as bigint, 18)),
      isActive: isActive as boolean,
    },
    refetch,
  };
}

// ============================================================
// Read: User vote for a proposal
// ============================================================

export function useMyVote(proposalId: number) {
  const { address } = useAccount();

  const { data, refetch } = useReadContract({
    address: DAO_ADDRESS,
    abi: THE_COUNCIL_DAO_ABI,
    functionName: "getVote",
    args: address ? [BigInt(proposalId), address] : undefined,
    query: { enabled: !!address },
  });

  if (!data) return { hasVoted: false, optionIndex: 0, weight: 0, refetch };

  const [hasVoted, optionIndex, weight] = data as [boolean, bigint, bigint];

  return {
    hasVoted,
    optionIndex: Number(optionIndex),
    weight: parseFloat(formatUnits(weight, 18)),
    refetch,
  };
}

// ============================================================
// Read: Claimable reward
// ============================================================

export function useClaimable(proposalId: number) {
  const { address } = useAccount();

  const { data, refetch } = useReadContract({
    address: DAO_ADDRESS,
    abi: THE_COUNCIL_DAO_ABI,
    functionName: "getClaimable",
    args: address ? [BigInt(proposalId), address] : undefined,
    query: { enabled: !!address },
  });

  if (!data)
    return { claimable: 0, hasClaimed: false, isWinner: false, refetch };

  const [claimable, hasClaimed, isWinner] = data as [bigint, boolean, boolean];

  return {
    claimable: parseFloat(formatUnits(claimable, 18)),
    hasClaimed,
    isWinner,
    refetch,
  };
}

// ============================================================
// Read: $COUNCIL balance
// ============================================================

export function useCouncilBalance() {
  const { address } = useAccount();

  const { data, refetch } = useReadContract({
    address: COUNCIL_TOKEN,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    balance: data ? parseFloat(formatUnits(data, 18)) : 0,
    refetch,
  };
}

// ============================================================
// Write: Vote
// ============================================================

export function useVote() {
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  const vote = useCallback(
    async (proposalId: number, optionIndex: number) => {
      setIsPending(true);
      setError(null);
      try {
        const hash = await writeContractAsync({
          address: DAO_ADDRESS,
          abi: THE_COUNCIL_DAO_ABI,
          functionName: "vote",
          args: [BigInt(proposalId), BigInt(optionIndex)],
        });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }

        return hash;
      } catch (e: any) {
        const msg = e?.shortMessage || e?.message || "Vote failed";
        setError(msg);
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [writeContractAsync, publicClient],
  );

  return { vote, isPending, error };
}

// ============================================================
// Write: Claim reward
// ============================================================

export function useClaimReward() {
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  const claim = useCallback(
    async (proposalId: number) => {
      setIsPending(true);
      setError(null);
      try {
        const hash = await writeContractAsync({
          address: DAO_ADDRESS,
          abi: THE_COUNCIL_DAO_ABI,
          functionName: "claimReward",
          args: [BigInt(proposalId)],
        });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }

        return hash;
      } catch (e: any) {
        const msg = e?.shortMessage || e?.message || "Claim failed";
        setError(msg);
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [writeContractAsync, publicClient],
  );

  return { claim, isPending, error };
}

// ============================================================
// Write: Create proposal (admin)
// ============================================================

export function useCreateProposal() {
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  const create = useCallback(
    async (
      title: string,
      description: string,
      type: string,
      options: string[],
      durationSeconds: number,
      rewardAmount: number,
    ) => {
      setIsPending(true);
      setError(null);
      try {
        const hash = await writeContractAsync({
          address: DAO_ADDRESS,
          abi: THE_COUNCIL_DAO_ABI,
          functionName: "createProposal",
          args: [
            title,
            description,
            type,
            options,
            BigInt(durationSeconds),
            parseUnits(rewardAmount.toString(), 18),
          ],
        });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }

        return hash;
      } catch (e: any) {
        const msg = e?.shortMessage || e?.message || "Create failed";
        setError(msg);
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [writeContractAsync, publicClient],
  );

  return { create, isPending, error };
}

// ============================================================
// Write: Fund pool (approve + fund)
// ============================================================

export function useFundPool() {
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  const fund = useCallback(
    async (amount: number) => {
      setIsPending(true);
      setError(null);
      try {
        const amountWei = parseUnits(amount.toString(), 18);

        // 1. Approve
        const approveHash = await writeContractAsync({
          address: COUNCIL_TOKEN,
          abi: erc20Abi,
          functionName: "approve",
          args: [DAO_ADDRESS, amountWei],
        });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        // 2. Fund
        const fundHash = await writeContractAsync({
          address: DAO_ADDRESS,
          abi: THE_COUNCIL_DAO_ABI,
          functionName: "fundPool",
          args: [amountWei],
        });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: fundHash });
        }

        return fundHash;
      } catch (e: any) {
        const msg = e?.shortMessage || e?.message || "Fund failed";
        setError(msg);
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [writeContractAsync, publicClient],
  );

  return { fund, isPending, error };
}

// ============================================================
// Write: Finalize (admin)
// ============================================================

export function useFinalize() {
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  const finalize = useCallback(
    async (proposalId: number) => {
      setIsPending(true);
      setError(null);
      try {
        const hash = await writeContractAsync({
          address: DAO_ADDRESS,
          abi: THE_COUNCIL_DAO_ABI,
          functionName: "finalize",
          args: [BigInt(proposalId)],
        });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }

        return hash;
      } catch (e: any) {
        const msg = e?.shortMessage || e?.message || "Finalize failed";
        setError(msg);
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [writeContractAsync, publicClient],
  );

  return { finalize, isPending, error };
}
