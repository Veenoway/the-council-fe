'use client';

// ============================================================
// TOKEN SEARCH MODAL — Search and request token analysis
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Loader2, 
  Crown,
  ExternalLink,
  TrendingUp,
  Users,
  Droplets,
  Lock,
  Sparkles,
  Zap
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
const NADFUN_API = 'https://api.nad.fun';

interface TokenResult {
  address: string;
  symbol: string;
  name: string;
  price: number;
  mcap: number;
  liquidity: number;
  holders: number;
  imageUrl?: string;
  createdAt: string;
  // Raw API fields
  token_info?: {
    token_id: string;
    name: string;
    symbol: string;
    image_uri?: string;
  };
  market_info?: {
    holder_count: number;
    price_usd: string;
    token_price: string;
  };
}

interface TokenSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: TokenResult) => void;
  isHolder: boolean; // Does user hold Council token?
  userAddress?: string;
}

export function TokenSearchModal({ 
  isOpen, 
  onClose, 
  onSelectToken,
  isHolder,
  userAddress 
}: TokenSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TokenResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentTokens, setRecentTokens] = useState<TokenResult[]>([]);
  const [requesting, setRequesting] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Fetch recent/trending tokens on open
  useEffect(() => {
    if (isOpen) {
      fetchRecentTokens();
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchTokens(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Transform raw nadfun API response into Token-compatible data
function transformNadfunToken(raw: any): TokenResult & { tokenData: any } {
  const t = raw.token_info || raw;
  const m = raw.market_info || {};

  const address = t.token_id || t.address || raw.address || '';
  const symbol = t.symbol || raw.symbol || 'UNKNOWN';
  const name = t.name || raw.name || 'Unknown';
  const imageUrl = t.image_uri || '';

  const priceUsd = parseFloat(m.price_usd || m.token_price || '0');
  const totalSupply = parseFloat(m.total_supply || '0') / 1e18;
  const mcap = priceUsd * totalSupply;

  const reserveNative = parseFloat(m.reserve_native || '0') / 1e18;
  const nativePrice = parseFloat(m.native_price || '0');
  const liquidity = reserveNative * nativePrice * 2;

  const holders = parseInt(m.holder_count) || 0;
  const createdAt = t.created_at
    ? new Date(t.created_at * 1000).toISOString()
    : new Date().toISOString();
  const deployer = t.creator?.account_id || '';

  return {
    // Display fields
    address,
    symbol,
    name,
    price: priceUsd,
    mcap,
    liquidity,
    holders,
    imageUrl,
    createdAt,
    // Keep raw for UI rendering
    token_info: raw.token_info,
    market_info: raw.market_info,
    // Pre-computed tokenData for backend (same shape as Token type)
    tokenData: {
      address,
      symbol,
      name,
      price: priceUsd,
      mcap,
      liquidity,
      holders,
      deployer,
      createdAt: new Date(createdAt),
      priceChange24h: raw.percent || 0,
      imageUrl,
    },
  };
}

const fetchTokenList = async (limit: number = 10) => {
  const res = await fetch(
    `https://api.nadapp.net/order/market_cap?page=1&limit=${limit}&direction=DESC&is_nsfw=false`
  );
  const data = await res.json();
  setRecentTokens((data.tokens || []).map(transformNadfunToken));
};

const fetchRecentTokens = async () => {
  setLoading(true);
  try {
    const res = await fetch(`${NADFUN_API}/tokens?sort=created&limit=10`);
    if (res.ok) {
      const data = await res.json();
      setRecentTokens((data.tokens || []).map(transformNadfunToken));
    }
  } catch (e) {
    console.error('Failed to fetch recent tokens:', e);
  } finally {
    setLoading(false);
  }
};

const searchTokens = async (searchQuery: string) => {
  setSearching(true);
  setError(null);
  try {
    if (searchQuery.startsWith('0x') && searchQuery.length === 42) {
      const res = await fetch(`${NADFUN_API}/token/${searchQuery}`);
      if (res.ok) {
        const token = await res.json();
        setResults([transformNadfunToken(token)]);
      } else {
        setResults([]);
        setError('Token not found');
      }
    } else {
      const res = await fetch(`${NADFUN_API}/search/${searchQuery}`);
      if (res.ok) {
        const data = await res.json();
        setResults(
          (data?.token_result?.tokens || []).map(transformNadfunToken)
        );
      } else {
        setResults([]);
      }
    }
  } catch (e) {
    console.error('Search failed:', e);
    setError('Search failed');
    setResults([]);
  } finally {
    setSearching(false);
  }
};

const requestAnalysis = async (token: TokenResult & { tokenData?: any }) => {
  if (!isHolder) {
    setError('You need to hold $COUNCIL token to request analysis');
    return;
  }

  const tokenAddress = token.address;
  setRequesting(tokenAddress);
  setError(null);

  try {
    const res = await fetch(`${API_URL}/api/analyze/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenAddress,
        requestedBy: userAddress,
        tokenData: token.tokenData, // Already computed by transformNadfunToken
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to request analysis');

    onSelectToken({ ...token, address: tokenAddress });
    onClose();
  } catch (e: any) {
    setError(e.message || 'Failed to request analysis');
  } finally {
    setRequesting(null);
  }
};

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  

  useEffect(() => {
    if (isOpen && displayTokens.length === 0) {
      fetchTokenList(10)
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const displayTokens = query.length >= 2 ? results : recentTokens;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-[#0a0a0a] rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-900">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search token by name, symbol, or address..."
                  className="w-full bg-zinc-900 border border-zinc-900 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 animate-spin" />
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Holder badge */}
            {isHolder ? (
              <div className="mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-900 rounded-lg">
                <Crown className="w-4 h-4 text-white" />
                <span className="text-xs text-white">
                  Council Holder — Your request will interrupt ongoing analysis
                </span>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg">
                <Lock className="w-4 h-4 text-zinc-500" />
                <span className="text-xs text-zinc-400">
                  Hold $COUNCIL to unlock token requests
                </span>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
                <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-900">
              <p className="text-xs text-zinc-400">{error}</p>
            </div>
          )}

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
              </div>
            ) : displayTokens.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                {query.length >= 2 ? (
                  <p>No tokens found for "{query}"</p>
                ) : (
                  <p>Start typing to search tokens...</p>
                )}
              </div>
            ) : (
              <div className="p-2">
                {query.length < 2 && (
                  <p className="px-3 py-2 text-xs text-zinc-500 uppercase tracking-wider">
                    Recent Tokens
                  </p>
                )}
                {displayTokens.map((token) => (
                  <TokenResultRow
                    key={token?.token_info?.token_id || token.address}
                    token={token}
                    onSelect={() => requestAnalysis(token)}
                    isHolder={isHolder}
                    isRequesting={requesting === (token?.token_info?.token_id || token.address)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
            <p className="text-xs text-zinc-400 text-center">
              {isHolder ? 'Bots will react and switch to your token' : 'Powered by nad.fun'} • Press ESC to close
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TokenResultRow({ 
  token, 
  onSelect, 
  isHolder,
  isRequesting 
}: { 
  token: TokenResult; 
  onSelect: () => void;
  isHolder: boolean;
  isRequesting: boolean;
}) {
  const marketInfo = token?.market_info;
  const tokenInfo = token?.token_info;

  // Format price with very small decimals if price is very small
  const formatPrice = (price: number) => {
    const priceString = price.toString();
    const priceNumber = parseFloat(priceString);
    if (priceNumber < 0.0001) {
      return priceNumber.toExponential(2);
    }
    return priceNumber.toFixed(2);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-900/50 transition-colors group">
      {/* Token image */}
      <div className="w-10 h-10 rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
        {tokenInfo?.image_uri ? (
          <img src={tokenInfo.image_uri} alt={tokenInfo.symbol} className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-zinc-500">
            {tokenInfo?.symbol?.charAt(0) || '?'}
          </span>
        )}
      </div>

      {/* Token info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">${tokenInfo?.symbol}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-400">
          <span className="text-xs text-zinc-500 truncate">{tokenInfo?.name}</span>
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={onSelect}
        disabled={!isHolder || isRequesting}
        className={`
          px-3 py-1 rounded-lg font-medium text-sm flex items-center gap-2 transition-all
          ${isHolder 
            ? 'bg-white hover:bg-white text-black' 
            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }
          ${isRequesting ? 'opacity-50' : ''}
        `}
      >
        {isRequesting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Requesting...
          </>
        ) : (
          <>
            Analyze
          </>
        )}
      </button>
    </div>
  );
}

export default TokenSearchModal;