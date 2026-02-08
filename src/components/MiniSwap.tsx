// ============================================================
// MINI SWAP — Buy tokens via nad.fun bonding curve (Mainnet)
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, usePublicClient, useWalletClient } from 'wagmi';
import { parseEther, formatEther, encodeFunctionData } from 'viem';
import { 
  Coins, 
  ArrowDown, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
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

interface MiniSwapProps {
  tokenAddress: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface TokenInfo {
  symbol: string;
  name: string;
  price: number;
  image?: string;
}

export function MiniSwap({ tokenAddress, onSuccess, onCancel }: MiniSwapProps) {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [amount, setAmount] = useState('1');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [estimatedTokens, setEstimatedTokens] = useState<string>('0');
  const [quote, setQuote] = useState<{ router: string; amountOut: bigint } | null>(null);
  
  // Transaction states
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch token info
  useEffect(() => {
    const fetchToken = async () => {
     

      try {
        const res = await fetch(`https://api.nadapp.net/token/0xbD489B45f0f978667fBaf373D2cFA133244F7777`);
        console.log("res", res);
        if (res.ok) {
          const data = await res.json();
          console.log("data", data);
          const tokenInfo = data.token_info;
          setTokenInfo({
            symbol: tokenInfo.symbol || 'TOKEN',
            name: tokenInfo.name || 'Unknown Token',
            price: tokenInfo.price || 0,
            image: tokenInfo.image_uri 
          });
          setEstimatedTokens(tokenInfo.total_supply);
        }
      } catch (err) {
        console.error('Failed to fetch token:', err);
      } finally {
        setIsLoadingInfo(false);
      }
    };

    fetchToken();
  }, [address]);

  console.log("tokenInfo", tokenInfo);

  // Get quote when amount changes
  useEffect(() => {
    const getQuote = async () => {
      if (!publicClient || !amount || parseFloat(amount) <= 0) {
        setEstimatedTokens('0');
        setQuote(null);
        return;
      }

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
        if (tokenInfo?.price && tokenInfo.price > 0) {
          const est = parseFloat(amount) / tokenInfo.price;
          setEstimatedTokens(est.toFixed(2));
        }
      }
    };

    const debounce = setTimeout(getQuote, 300);
    return () => clearTimeout(debounce);
  }, [amount, tokenAddress, publicClient, tokenInfo?.price]);

  const handleBuy = async () => {
    if (!address || !walletClient || !publicClient || !amount || parseFloat(amount) <= 0) {
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const amountIn = parseEther(amount);
      
      // 1. Get fresh quote
      console.log('🔍 Getting quote...');
      const [router, amountOut] = await publicClient.readContract({
        address: CONFIG.LENS,
        abi: LENS_ABI,
        functionName: 'getAmountOut',
        args: [tokenAddress as `0x${string}`, amountIn, true],
      });

      console.log('📊 Quote:', { router, amountOut: formatEther(amountOut) });

      // 2. Calculate slippage (2%)
      const amountOutMin = (amountOut * 98n) / 100n;
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

  console.log("maxBalance", maxBalance);

  if (isLoadingInfo) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  // Success state
  if (isSuccess && txHash) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Purchase Complete!</h3>
        <p className="text-sm text-zinc-400 mb-4">
          You bought ~{parseFloat(estimatedTokens).toLocaleString()} {tokenInfo?.symbol || 'tokens'}
        </p>
        <a
          href={`https://monadexplorer.com/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
        >
          View transaction <ExternalLink className="w-4 h-4" />
        </a>
        <button
          onClick={onSuccess}
          className="w-full mt-4 py-2.5 bg-white text-black rounded-lg font-bold hover:bg-zinc-100 transition-all"
        >
          Continue to Bet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-white mb-1">
          Buy {tokenInfo?.symbol || 'Token'}
        </h3>
        <p className="text-xs text-zinc-500">
          Purchase tokens to participate in this prediction
        </p>
      </div>

      {/* From: MON */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">You pay</span>
          <span className="text-xs text-zinc-500">
            Balance: {maxBalance.toFixed(4)} MON
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent text-xl font-bold text-white focus:outline-none"
            placeholder="0.0"
            min="0"
            step="0.1"
          />
          <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold">
              M
            </div>
            <span className="text-white font-medium">MON</span>
          </div>
        </div>
        {/* Quick amounts */}
        <div className="flex gap-2 mt-2">
          {[1, 5, 10].map((val) => (
            <button
              key={val}
              onClick={() => setAmount(val.toString())}
              className={`px-3 py-1 rounded text-xs transition-all ${
                amount === val.toString()
                  ? 'bg-purple-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {val} MON
            </button>
          ))}
          <button
            onClick={() => setAmount((maxBalance * 0.5).toFixed(2))}
            className="px-3 py-1 rounded text-xs bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-all"
          >
            50%
          </button>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center">
        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <ArrowDown className="w-4 h-4 text-zinc-400" />
        </div>
      </div>

      {/* To: Token */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">You receive (estimated)</span>
          {quote && (
            <span className="text-[10px] text-green-400">Quote ready ✓</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex-1 text-xl font-bold text-white">
            {parseFloat(estimatedTokens).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
          <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-lg">
            {tokenInfo?.image ? (
              <img src={tokenInfo.image} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                {tokenInfo?.symbol?.charAt(0) || '?'}
              </div>
            )}
            <span className="text-white font-medium">{tokenInfo?.symbol || 'TOKEN'}</span>
          </div>
        </div>
        <p className="text-[10px] text-zinc-600 mt-2">
          2% slippage tolerance included
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </p>
        </div>
      )}

      {/* Buy Button */}
      <button
        onClick={handleBuy}
        disabled={isPending || isConfirming || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxBalance}
        className={`
          w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2
          ${isPending || isConfirming || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxBalance
            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25'
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
        ) : parseFloat(amount) > maxBalance ? (
          'Insufficient balance'
        ) : (
          <>
            <Coins className="w-4 h-4" />
            Buy {tokenInfo?.symbol || 'Token'}
          </>
        )}
      </button>

      {/* Cancel link */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full text-center text-xs text-zinc-500 hover:text-white transition-all"
        >
          Cancel
        </button>
      )}

      {/* Powered by */}
      <p className="text-center text-[10px] text-zinc-600">
        Powered by nad.fun
      </p>
    </div>
  );
}

export default MiniSwap;