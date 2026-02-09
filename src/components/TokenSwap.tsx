// ============================================================
// TOKEN SWAP — Buy the token currently being analyzed
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, usePublicClient, useWalletClient } from 'wagmi';
import { parseEther, formatEther, encodeFunctionData } from 'viem';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  TrendingUp,
  Zap,
} from 'lucide-react';

// Mainnet addresses
const CONFIG = {
  LENS: '0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea' as const,
  BONDING_CURVE_ROUTER: '0x6F6B8F1a20703309951a5127c45B49b1CD981A22' as const,
  DEX_ROUTER: '0x0B79d71AE99528D1dB24A4148b5f4F865cc2b137' as const,
};

// ABIs
const LENS_ABI = [
  {
    name: 'getAmountOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'isBuy', type: 'bool' },
    ],
    outputs: [
      { name: 'router', type: 'address' },
      { name: 'amountOut', type: 'uint256' },
    ],
  },
] as const;

const ROUTER_ABI = [
  {
    name: 'buy',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'amountOutMin', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const;

interface TokenSwapProps {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName?: string;
  tokenImage?: string;
  tokenPrice?: number;
  onSuccess?: (txHash: string, amountOut: string) => void;
  onClose?: () => void;
  compact?: boolean; // Compact mode for sidebar
}

export function TokenSwap({ 
  tokenAddress, 
  tokenSymbol, 
  tokenName,
  tokenImage,
  tokenPrice,
  onSuccess, 
  onClose,
  compact = false,
}: TokenSwapProps) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [amount, setAmount] = useState('1');
  const [estimatedTokens, setEstimatedTokens] = useState<string>('0');
  const [quote, setQuote] = useState<{ router: string; amountOut: bigint } | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  
  // Transaction states
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get quote when amount changes
  useEffect(() => {
    const getQuote = async () => {
      if (!publicClient || !amount || parseFloat(amount) <= 0 || !tokenAddress) {
        setEstimatedTokens('0');
        setQuote(null);
        return;
      }

      setIsLoadingQuote(true);
      try {
        const amountIn = parseEther(amount);
        
        const [router, amountOut] = await publicClient.readContract({
          address: CONFIG.LENS,
          abi: LENS_ABI,
          functionName: 'getAmountOut',
          args: [tokenAddress as `0x${string}`, amountIn, true],
        });

        setQuote({ router, amountOut });
        setEstimatedTokens(formatEther(amountOut));
      } catch (err) {
        console.error('Quote error:', err);
        // Fallback to price-based estimate
        if (tokenPrice && tokenPrice > 0) {
          const est = parseFloat(amount) / tokenPrice;
          setEstimatedTokens(est.toFixed(2));
        } else {
          setEstimatedTokens('0');
        }
        setQuote(null);
      } finally {
        setIsLoadingQuote(false);
      }
    };

    const debounce = setTimeout(getQuote, 300);
    return () => clearTimeout(debounce);
  }, [amount, tokenAddress, publicClient, tokenPrice]);

  const handleBuy = async () => {
    if (!address || !walletClient || !publicClient || !amount || parseFloat(amount) <= 0) {
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const amountIn = parseEther(amount);
      
      // 1. Get fresh quote
      console.log('🔍 Getting quote for', tokenSymbol);
      const [router, amountOut] = await publicClient.readContract({
        address: CONFIG.LENS,
        abi: LENS_ABI,
        functionName: 'getAmountOut',
        args: [tokenAddress as `0x${string}`, amountIn, true],
      });

      console.log('📊 Quote:', { router, amountOut: formatEther(amountOut) });

      // 2. Calculate slippage (2%)
      const amountOutMin = (amountOut * BigInt(98)) / BigInt(100);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 min

      // 3. Encode buy call
      const callData = encodeFunctionData({
        abi: ROUTER_ABI,
        functionName: 'buy',
        args: [{
          amountOutMin,
          token: tokenAddress as `0x${string}`,
          to: address,
          deadline,
        }],
      });

      console.log('🚀 Sending transaction...');
      
      // 4. Send transaction
      const hash = await walletClient.sendTransaction({
        account: address,
        to: router,
        data: callData,
        value: amountIn,
      });

      console.log('📝 TX Hash:', hash);
      setTxHash(hash);
      setIsPending(false);
      setIsConfirming(true);

      // 5. Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      console.log('✅ Confirmed:', receipt);
      
      if (receipt.status === 'success') {
        setIsConfirming(false);
        setIsSuccess(true);
        onSuccess?.(hash, formatEther(amountOut));
      } else {
        throw new Error('Transaction failed');
      }

    } catch (err: any) {
      console.error('❌ Buy error:', err);
      setError(err.shortMessage || err.message || 'Transaction failed');
      setIsPending(false);
      setIsConfirming(false);
    }
  };

  const maxBalance = balance ? parseFloat(formatEther(balance.value)) : 0;


  if (isSuccess && txHash) {
    return (
      <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl ${compact ? 'p-3' : 'p-4'}`}>
        <div className="text-center py-4">
         
          <h3 className="text-sm font-bold text-white mb-1">Purchase Complete!</h3>
          <p className="text-xs text-zinc-400 mb-3">
            You bought ~{parseFloat(estimatedTokens).toLocaleString()} ${tokenSymbol}
          </p>
          <a
            href={`https://monadexplorer.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-white hover:text-white"
          >
            View transaction <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={() => {
              setIsSuccess(false);
              setTxHash(null);
              setAmount('1');
            }}
            className="w-full mt-3 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-700 transition-all"
          >
            Buy More
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
            <span className="text-sm font-bold uppercase text-white">{tokenSymbol}</span>
        </div>
      </div>

      {/* Amount Input */}
      <div className="bg-black/30 border border-zinc-800 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-zinc-500 uppercase">You Pay</span>
          <span className="text-[10px] text-zinc-500">
            Balance: {maxBalance.toFixed(2)} MON
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent text-lg font-bold text-white focus:outline-none max-w-[80%]"
            placeholder="0.0"
            min="0"
            step="0.1"
          />
          <span className="text-sm font-medium text-zinc-400">MON</span>
        </div>
        
        {/* Quick amounts */}
        <div className="flex gap-1.5 mt-2">
          {[1, 5, 10].map((val) => (
            <button
              key={val}
              onClick={() => setAmount(val.toString())}
              className={`flex-1 py-1 rounded text-xs transition-all ${
                amount === val.toString()
                  ? 'bg-white text-black font-medium'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {val}
            </button>
          ))}
          <button
            onClick={() => setAmount(Math.max(0, maxBalance - 0.1).toFixed(2))}
            className="flex-1 py-1 rounded text-xs bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-all"
          >
            MAX
          </button>
        </div>
      </div>

      {/* Estimated Output */}
      <div className="bg-black/30 border border-zinc-800 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-zinc-500 uppercase">You Receive</span>
          {isLoadingQuote ? (
            <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />
          ) : quote ? (
            <span className="text-[10px] text-green-400">Quote ready</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex-1 text-lg font-bold text-white">
            {isLoadingQuote ? '...' : parseFloat(estimatedTokens).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className="text-sm font-medium text-zinc-400">${tokenSymbol}</span>
        </div>
        <p className="text-[10px] text-zinc-600 mt-1">
          2% slippage tolerance • via nad.fun
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-2 mb-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {error}
          </p>
        </div>
      )}

      {/* Buy Button */}
      <button
        onClick={handleBuy}
        disabled={isPending || isConfirming || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxBalance}
        className={`
          w-full py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2
          ${isPending || isConfirming || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxBalance
            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            : 'bg-white hover:bg-zinc-100 text-black'
          }
        `}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Confirm in wallet...
          </>
        ) : isConfirming ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : parseFloat(amount) > maxBalance&& address ? (
          'Insufficient balance'
        ) : !address ? (
            'Connect wallet'
        ):(
          <>
            Buy ${tokenSymbol}
          </>
        )}
      </button>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full mt-2 text-center text-xs text-zinc-500 hover:text-white transition-all"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

// ============================================================
// MINI VERSION — For embedding in chat sidebar
// ============================================================

interface MiniTokenSwapProps {
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenImage?: string;
}

export function MiniTokenSwap({ tokenAddress, tokenSymbol, tokenImage }: MiniTokenSwapProps) {
  const { isConnected } = useAccount();

  if (!tokenAddress || !tokenSymbol) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="text-center py-6">
          <TrendingUp className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">Waiting for token...</p>
          <p className="text-xs text-zinc-600 mt-1">The Council will analyze a token soon</p>
        </div>
      </div>
    );
  }

  return (
    <TokenSwap
      tokenAddress={tokenAddress}
      tokenSymbol={tokenSymbol}
      tokenImage={tokenImage}
      compact={true}
    />
  );
}

export default TokenSwap;