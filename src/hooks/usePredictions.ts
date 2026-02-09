// ============================================================
// PREDICTIONS HOOKS — Contract interaction
// ============================================================

'use client';

import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';

const PREDICTIONS_CONTRACT = '0xf6753299c76E910177696196Cd9A5efDDa6c35C0' as const;
const COUNCIL_TOKEN_ADDRESS = '0xbD489B45f0f978667fBaf373D2cFA133244F7777' as const; // TODO: Remplacer par vraie adresse

export { COUNCIL_TOKEN_ADDRESS };

const PREDICTIONS_ABI = [
  {
    name: 'getLatestPredictions',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_count', type: 'uint256' }],
    outputs: [{
      name: '',
      type: 'tuple[]',
      components: [
        { name: 'id', type: 'uint256' },
        { name: 'tokenAddress', type: 'address' },
        { name: 'question', type: 'string' },
        { name: 'predictionType', type: 'uint8' },
        { name: 'endTime', type: 'uint256' },
        { name: 'resolveTime', type: 'uint256' },
        { name: 'prizePool', type: 'uint256' },
        { name: 'totalBets', type: 'uint256' },
        { name: 'numOptions', type: 'uint8' },
        { name: 'winningOption', type: 'uint8' },
        { name: 'resolved', type: 'bool' },
        { name: 'cancelled', type: 'bool' },
        { name: 'isTie', type: 'bool' },
        { name: 'creator', type: 'address' },
        { name: 'createdAt', type: 'uint256' },
        {
          name: 'options',
          type: 'tuple[]',
          components: [
            { name: 'label', type: 'string' },
            { name: 'totalStaked', type: 'uint256' },
            { name: 'numBettors', type: 'uint256' },
          ]
        }
      ]
    }]
  },
  {
    name: 'placeBet',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_predictionId', type: 'uint256' },
      { name: '_optionId', type: 'uint8' },
    ],
    outputs: []
  },
  {
    name: 'getUserBet',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_user', type: 'address' },
      { name: '_predictionId', type: 'uint256' },
    ],
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'predictionId', type: 'uint256' },
        { name: 'optionId', type: 'uint8' },
        { name: 'amount', type: 'uint256' },
        { name: 'claimed', type: 'bool' },
        { name: 'timestamp', type: 'uint256' },
      ]
    }]
  },
  {
    name: 'claimWinnings',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_predictionId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'getAllOdds',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_predictionId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256[]' }]
  },
  {
    name: 'canBetDetailed',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_user', type: 'address' },
      { name: '_predictionId', type: 'uint256' },
    ],
    outputs: [
      { name: 'canBetResult', type: 'bool' },
      { name: 'reason', type: 'string' },
    ]
  },
  {
    name: 'predictionCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

// Bot ID to option mapping
const BOT_IDS = ['chad', 'quantum', 'sensei', 'sterling', 'oracle'] as const;
const BOT_COLORS: Record<string, string> = {
  chad: '#f59e0b',
  quantum: '#3b82f6',
  sensei: '#ec4899',
  sterling: '#8b5cf6',
  oracle: '#06b6d4',
};

export interface PredictionData {
  id: string;
  onchainId: number;
  tokenAddress: string;
  question: string;
  type: 'price' | 'bot_roi' | 'volume' | 'custom';
  endTime: Date;
  prizePool: number;
  totalBets: number;
  resolved: boolean;
  cancelled: boolean;
  winningOption: number;
  isTie: boolean;
  options: {
    id: string;
    label: string;
    totalStaked: number;
    bettors: number;
    color: string;
    odds: number;
  }[];
}

export function usePredictions() {
  const { data, isLoading, refetch, error } = useReadContract({
    address: PREDICTIONS_CONTRACT,
    abi: PREDICTIONS_ABI,
    functionName: 'getLatestPredictions',
    args: [BigInt(10)],
  });

  const predictions: PredictionData[] = data?.map((p) => {
    const totalStaked = p.options.reduce((sum, o) => sum + Number(formatEther(o.totalStaked)), 0);
    
    return {
      id: p.id.toString(),
      onchainId: Number(p.id),
      tokenAddress: p.tokenAddress,
      question: p.question,
      type: ['price', 'bot_roi', 'volume', 'custom'][p.predictionType] as PredictionData['type'],
      endTime: new Date(Number(p.endTime) * 1000),
      prizePool: Number(formatEther(p.prizePool)),
      totalBets: Number(p.totalBets),
      resolved: p.resolved,
      cancelled: p.cancelled,
      winningOption: p.winningOption,
      isTie: p.isTie,
      options: p.options.map((o, i) => {
        const staked = Number(formatEther(o.totalStaked));
        
        // Calcul des odds réalistes pour un bet de 1 MON
        // odds = profit / mise (pas payout / mise)
        const standardBet = 1;
        const newOptionTotal = staked + standardBet;
        const newPoolTotal = totalStaked + standardBet;
        const poolAfterFee = newPoolTotal * 0.975; // 2.5% fee
        const payout = (standardBet / newOptionTotal) * poolAfterFee;
        const profit = payout - standardBet;
        const profitMultiplier = staked > 0 ? profit / standardBet : (p.options.length - 1) * 0.975;
        
        return {
          id: BOT_IDS[i] || `option_${i + 1}`,
          label: o.label,
          totalStaked: staked,
          bettors: Number(o.numBettors),
          color: BOT_COLORS[BOT_IDS[i]] || '#888',
          odds: Math.round(profitMultiplier * 100) / 100,
        };
      })
    };
  }) || [];

  return { predictions, isLoading, refetch, error };
}

export function useUserBet(predictionId: number) {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: PREDICTIONS_CONTRACT,
    abi: PREDICTIONS_ABI,
    functionName: 'getUserBet',
    args: address ? [address, BigInt(predictionId)] : undefined,
    query: {
      enabled: !!address && predictionId > 0,
    }
  });

  const userBet = data && Number(data.amount) > 0 ? {
    optionId: data.optionId,
    amount: Number(formatEther(data.amount)),
    claimed: data.claimed,
  } : null;

  return { userBet, isLoading, refetch };
}

export function usePlaceBet() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess, isError: txError } = useWaitForTransactionReceipt({
    hash,
  });

  const placeBet = async (predictionId: number, optionId: number, amount: string) => {
    console.log('🎲 Placing bet:', { predictionId, optionId, amount });
    try {
      writeContract({
        address: PREDICTIONS_CONTRACT,
        abi: PREDICTIONS_ABI,
        functionName: 'placeBet',
        args: [BigInt(predictionId), optionId],
        value: parseEther(amount),
      });
    } catch (e) {
      console.error('❌ Bet error:', e);
    }
  };

  // Log state changes
  console.log('📊 Bet state:', { isPending, isConfirming, isSuccess, hash, error: error?.message });

  return { 
    placeBet, 
    isPending, 
    isConfirming, 
    isSuccess,
    txError,
    error,
    hash,
    reset, // Pour reset le state après succès
  };
}

export function useClaimWinnings() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claim = async (predictionId: number) => {
    writeContract({
      address: PREDICTIONS_CONTRACT,
      abi: PREDICTIONS_ABI,
      functionName: 'claimWinnings',
      args: [BigInt(predictionId)],
    });
  };

  return { claim, isPending, isConfirming, isSuccess, error };
}

export function useCanBet(predictionId: number) {
  const { address } = useAccount();

  const { data, isLoading } = useReadContract({
    address: PREDICTIONS_CONTRACT,
    abi: PREDICTIONS_ABI,
    functionName: 'canBetDetailed',
    args: address ? [address, BigInt(predictionId)] : undefined,
    query: {
      enabled: !!address && predictionId > 0,
    }
  });

  return {
    canBet: data?.[0] ?? false,
    reason: data?.[1] ?? '',
    isLoading,
  };
}

// Hook pour vérifier si l'utilisateur hold le token
export function useHoldsToken(tokenAddress: string) {
  const { address } = useAccount();

  const { data: balance, isLoading } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      }
    ],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000001',
    }
  });

  if (tokenAddress === '0x0000000000000000000000000000000000000001') {
    return { holdsToken: true, isLoading: false, balance: BigInt(0) };
  }

  const holdsToken = balance ? balance > BigInt(0) : false;

  return { holdsToken, isLoading, balance: balance || BigInt(0) };
}