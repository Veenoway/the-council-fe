'use client';

// ============================================================
// BOT POSITIONS v4 — Pro Trading Terminal UI + Dialog Modal
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { Token, Trade, BotId, Position } from '@/types';
import { Grid2X2, Table2, X, ExternalLink, TrendingUp, TrendingDown, Wallet, BarChart3, Target, Trophy, Coins } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface BotPositionsProps {
  trades: Trade[];
  token: Token | null;
  botConfig: Record<BotId, { name: string; imgURL: string; color: string }>;
  className?: string;
}

const BOT_PERSONALITIES: Record<BotId, { title: string; description: string }> = {
  chad: { title: "Momentum", description: "Aggressive degen plays, high risk high reward" },
  quantum: { title: "Technical", description: "Data-driven analysis and pattern recognition" },
  sensei: { title: "Community", description: "Social sentiment and community vibes" },
  sterling: { title: "Risk", description: "Conservative plays with strict risk management" },
  oracle: { title: "Alpha", description: "Early trend detection and alpha hunting" },
};

// ============================================================
// TOKEN IMAGE COMPONENT
// ============================================================

const tokenImageCache = new Map<string, string>();

function TokenImage({ 
  address, 
  symbol, 
  image,
  size = 'md' 
}: { 
  address: string; 
  symbol: string; 
  image: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(image ||tokenImageCache.get(address) || null);
  const [error, setError] = useState(false);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  useEffect(() => {
    if (tokenImageCache.has(address)) {
      setImageUrl(tokenImageCache.get(address)!);
      return;
    }

    const fetchImage = async () => {
      try {
        const res = await fetch(`${API_URL}/api/token/${address}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.token_info?.image_uri) {
            tokenImageCache.set(address, data?.token_info?.image_uri);
            setImageUrl(data?.token_info?.image_uri);
          }
        }
      } catch (err) {
        console.error('Error fetching token image:', err);
      }
    };
    
    fetchImage();
  }, [address, API_URL]);

  if (!imageUrl || error) {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const colorIndex = parseInt(address.slice(-2), 16) % colors.length;
    
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold shrink-0 border border-zinc-700`}
        style={{ backgroundColor: colors[colorIndex], fontSize: size === 'sm' ? '6px' : size === 'md' ? '7px' : '9px' }}
      >
        {symbol.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={symbol}
      className={`${sizeClasses[size]} rounded-full object-cover shrink-0 object-center bg-zinc-900`}
      onError={() => setError(true)}
    />
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function BotPositions({ trades, token, botConfig, className = '' }: BotPositionsProps) {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBot, setSelectedBot] = useState<BotId | null>(null);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  
  const allBots: BotId[] = ['chad', 'quantum', 'sensei', 'sterling', 'oracle'];
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/positions`);
      if (res.ok) {
        const data = await res.json();
        setPortfolios(data.portfolios || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const getPortfolio = (botId: BotId) => portfolios.find(p => p.botId === botId);

  // Calculer les totaux depuis les portfolios
  const totalValue = portfolios.reduce((sum, p) => sum + (p.totalCurrentValue || 0) + (p.monBalance || 0), 0);
  const totalPnl = portfolios.reduce((sum, p) => sum + (p.pnlMON || 0), 0);
  const totalInvested = portfolios.reduce((sum, p) => sum + (p.totalInvested || 0), 0);
  const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const totalPositions = portfolios.reduce((sum, p) => sum + (p.openPositions || 0), 0);
  const totalMonBalance = portfolios.reduce((sum, p) => sum + (p.monBalance || 0), 0);

  const formatMON = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(2);
  };

  const formatPnL = (value: number, percent: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)} (${sign}${percent.toFixed(1)}%)`;
  };

  return (
    <div className={`${className} font-poppins text-sm`}>
      {/* Summary Bar */}
      <div className="grid grid-cols-5 divide-x divide-zinc-800 bg-[#0a0a0a] rounded-lg">
        <SummaryCell label="COUNCIL VALUE" value={`${formatMON(totalValue)} MON`} />
        <SummaryCell 
          label="TOTAL P&L" 
          value={formatPnL(totalPnl, totalPnlPercent)}
          color={totalPnl >= 0 ? 'green' : 'red'}
        />
        <SummaryCell label="POSITIONS" value={totalPositions.toString()} />
        <SummaryCell label="LIQUID MON" value={`${formatMON(totalMonBalance)} MON`} />
        <SummaryCell 
          label="STATUS" 
          value={loading ? 'SYNCING...' : 'OPERATIONAL'}
          color={loading ? 'yellow' : 'green'}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0a0a0a] rounded-t-lg mt-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-500 text-xs">LIVE</span>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => setView('grid')}
            className={`px-2 py-1 text-xs rounded ${view === 'grid' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            <Grid2X2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setView('table')}
            className={`px-2 py-1 text-xs rounded ${view === 'table' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            <Table2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[#0a0a0a] rounded-b-lg">
        {view === 'grid' ? (
          <div className="grid grid-cols-5 divide-x divide-zinc-800">
            {allBots.map((botId) => (
              <BotColumn
                key={botId}
                botId={botId}
                config={botConfig[botId]}
                portfolio={getPortfolio(botId)}
                onClick={() => setSelectedBot(botId)}
                token={token}
              />
            ))}
          </div>
        ) : (
          <BotTable 
            bots={allBots}
            botConfig={botConfig}
            portfolios={portfolios}
            token={token}
            onSelectBot={setSelectedBot}
          />
        )}
      </div>

      {/* Bot Detail Dialog */}
      <BotDetailDialog
        botId={selectedBot}
        config={selectedBot ? botConfig[selectedBot] : null}
        portfolio={selectedBot ? getPortfolio(selectedBot) : null}
        token={token}
        open={!!selectedBot}
        onClose={() => setSelectedBot(null)}
      />
    </div>
  );
}

// ============================================================
// SUMMARY CELL
// ============================================================

function SummaryCell({ label, value, color }: { label: string; value: string; color?: 'green' | 'red' | 'yellow' }) {
  const colorClass = color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : color === 'yellow' ? 'text-yellow-400' : 'text-white';
  
  return (
    <div className="px-3 py-2">
      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{label}</p>
      <p className={`font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}

// ============================================================
// BOT COLUMN (Grid View)
// ============================================================

interface BotColumnProps {
  botId: BotId;
  config: { name: string; imgURL: string; color: string };
  portfolio: any | undefined;
  onClick: () => void;
  token: Token | null;
}

// Agrège les positions par token
function aggregatePositions(positions: any[]) {
  if (!positions || positions.length === 0) return [];

  const grouped = positions.reduce((acc: Record<string, any>, pos) => {
    const key = pos.tokenAddress;
    
    if (!acc[key]) {
      acc[key] = {
        tokenAddress: pos.tokenAddress,
        tokenSymbol: pos.tokenSymbol,
        tokenImage: pos.tokenImage,
        totalEntryValueMON: 0,
        totalCurrentValueMON: 0,
        totalAmount: 0,
        count: 0,
      };
    }
    
    acc[key].totalEntryValueMON += pos.entryValueMON || 0;
    acc[key].totalCurrentValueMON += pos.currentValueMON || 0;
    acc[key].totalAmount += pos.amount || 0;
    acc[key].count += 1;
    
    return acc;
  }, {});

  return Object.values(grouped).map((holding: any) => {
    const pnlMON = holding.totalCurrentValueMON - holding.totalEntryValueMON;
    const pnlPercent = holding.totalEntryValueMON > 0 
      ? (pnlMON / holding.totalEntryValueMON) * 100 
      : 0;
    
    return {
      ...holding,
      pnlMON,
      pnlPercent,
      value: holding.totalCurrentValueMON,
    };
  });
}

function BotColumn({ botId, config, portfolio, onClick, token }: BotColumnProps) {
  const holdings = portfolio ? aggregatePositions(portfolio.positions) : [];
  const totalCurrentValue = portfolio?.totalCurrentValue ?? 0;
  const monBalance = portfolio?.monBalance ?? 0;
  const totalValue = totalCurrentValue + monBalance;
  const pnlMON = portfolio?.pnlMON ?? 0;
  const pnlPercent = portfolio?.pnlPercent ?? 0;
  const wins = portfolio?.wins ?? 0;
  const losses = portfolio?.losses ?? 0;
  const winRate = portfolio?.winRate ?? 0;

  return (
    <div 
      onClick={onClick}
      className="cursor-pointer transition-all hover:bg-zinc-900/50 group"
    >
      {/* Bot Header */}
      <div 
        className="px-3 py-2 border-b border-zinc-800"
        style={{ borderTopColor: config.color, borderTopWidth: '2px' }}
      >
        <div className="flex items-center gap-2">
          <img 
            src={config.imgURL} 
            alt={config.name}
            className="w-8 h-8 rounded-lg object-cover group-hover:ring-2 transition-all"
            style={{ '--tw-ring-color': config.color } as any}
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate text-xs">{config.name}</p>
            <p className="text-[10px] text-zinc-500">{BOT_PERSONALITIES[botId].title}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-3 py-2 space-y-2">
        <div>
          <p className="text-[10px] text-zinc-600">TOTAL VALUE</p>
          <p className="text-white font-bold">
            {totalValue.toFixed(2)} <span className="text-zinc-500 text-xs">MON</span>
          </p>
         
        </div>

        <div>
          <p className="text-[10px] text-zinc-600">P&L</p>
          <p className={`font-bold ${pnlMON >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {pnlMON >= 0 ? '+' : ''}{pnlMON.toFixed(2)}
            <span className="text-xs ml-1">({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)</span>
          </p>
        </div>

        <div>
          <p className="text-[10px] text-zinc-600">POSITIONS</p>
          <p className="text-white">{holdings.length}</p>
        </div>

        <div>
          <p className="text-[10px] text-zinc-600">WIN RATE</p>
          <p className="text-white">
            {winRate.toFixed(0)}%
            <span className="text-zinc-500 text-xs ml-1">
              ({wins}W/{losses}L)
            </span>
          </p>
        </div>
      </div>

      {/* Holdings Preview */}
      {holdings.length > 0 ? (
        <div className="px-3 py-2 bg-zinc-900/30">
          <p className="text-[10px] text-zinc-600 mb-1">HOLDINGS</p>
          <div className="flex items-center gap-1">
            <div className="flex items-center -space-x-2">
              {holdings
                .sort((a, b) => b.pnlPercent - a.pnlPercent)
                .slice(0, 4)
                .map((holding, index) => (
                  <div 
                    key={holding.tokenAddress} 
                    className="ring-2 ring-[#0a0a0a] rounded-full"
                    style={{ zIndex: 10 - index }}
                  >
                    <TokenImage 
                      address={holding.tokenAddress} 
                      symbol={holding.tokenSymbol} 
                      image={holding.tokenImage}
                      size="md" 
                    />
                  </div>
                ))}
              {holdings.length > 4 && (
                <span className="text-[10px] text-zinc-500 ml-2">+{holdings.length - 4}</span>
              )}
            </div>
            {holdings.length > 4 && (
              <p className="text-[10px] ml-2 text-zinc-600">+{holdings.length - 4}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="px-3 py-3 bg-zinc-900/30 h-[61px] flex items-center justify-center">
          <p className="text-[10px] text-zinc-600 text-center">NO OPEN POSITIONS</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// BOT TABLE (Table View)
// ============================================================

interface BotTableProps {
  bots: BotId[];
  botConfig: Record<BotId, { name: string; imgURL: string; color: string }>;
  portfolios: any[];
  token: Token | null;
  onSelectBot: (botId: BotId) => void;
}

function BotTable({ bots, botConfig, portfolios, token, onSelectBot }: BotTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-zinc-900/50">
          <tr className="text-left text-zinc-500 uppercase">
            <th className="px-3 py-2">Bot</th>
            <th className="px-3 py-2 text-right">Total Value</th>
            <th className="px-3 py-2 text-right">Holdings</th>
            <th className="px-3 py-2 text-right">Cash</th>
            <th className="px-3 py-2 text-right">P&L</th>
            <th className="px-3 py-2 text-right">Win Rate</th>
            <th className="px-3 py-2">Tokens</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {bots.map((botId) => {
            const config = botConfig[botId];
            const portfolio = portfolios.find(p => p.botId === botId);
            const holdings = portfolio ? aggregatePositions(portfolio.positions) : [];
            
            const totalCurrentValue = portfolio?.totalCurrentValue ?? 0;
            const monBalance = portfolio?.monBalance ?? 0;
            const totalValue = totalCurrentValue + monBalance;
            const pnlMON = portfolio?.pnlMON ?? 0;
            const pnlPercent = portfolio?.pnlPercent ?? 0;
            const winRate = portfolio?.winRate ?? 0;

            return (
              <tr 
                key={botId} 
                className="hover:bg-zinc-900/50 cursor-pointer"
                onClick={() => onSelectBot(botId)}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <img src={config.imgURL} alt="" className="w-6 h-6 rounded" />
                    <div>
                      <p className="font-medium text-white">{config.name}</p>
                      <p className="text-[10px] text-zinc-500">{BOT_PERSONALITIES[botId].title}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-right font-poppins text-white">
                  {totalValue.toFixed(2)} MON
                </td>
                <td className="px-3 py-2 text-right font-poppins text-zinc-400">
                  {totalCurrentValue.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right font-poppins text-zinc-400">
                  {monBalance.toFixed(2)}
                </td>
                <td className={`px-3 py-2 text-right font-poppins ${pnlMON >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pnlMON >= 0 ? '+' : ''}{pnlMON.toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
                </td>
                <td className="px-3 py-2 text-right text-white">
                  {winRate.toFixed(0)}%
                </td>
                <td className="px-3 py-2">
                  <div className="flex -space-x-1.5">
                    {holdings.slice(0, 4).map((h) => (
                      <div key={h.tokenAddress} className="ring-1 ring-zinc-900 rounded-full">
                        <TokenImage address={h.tokenAddress} symbol={h.tokenSymbol} image={h.tokenImage} size="sm" />
                      </div>
                    ))}
                    {holdings.length > 4 && (
                      <span className="text-[10px] text-zinc-500 ml-2">+{holdings.length - 4}</span>
                    )}
                    {holdings.length === 0 && <span className="text-zinc-600">—</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// BOT DETAIL DIALOG
// ============================================================

interface BotDetailDialogProps {
  botId: BotId | null;
  config: { name: string; imgURL: string; color: string } | null;
  portfolio: any | undefined | null;
  token: Token | null;
  open: boolean;
  onClose: () => void;
}

const BOT_WALLETS: Record<BotId, string> = {
  sensei: "0xE4F9910930bE9e9cbe3b635b027197A838899fe4",
  quantum: "0xaC5b2f17569361478729420B5f5e0e504BA095e9",
  chad: "0xE5BDfb5a86C0D59F2711A6475A7bb2aA90f9aeE2",
  sterling: "0xd8778E6D072bE21eB427146002D8107eAAdbcf37",
  oracle: "0xB44510836DED11996F4f26B337Bb2FBDc16321cb",
};

function BotDetailDialog({ botId, config, portfolio, token, open, onClose }: BotDetailDialogProps) {
  if (!botId || !config) return null;

  const walletAddress = BOT_WALLETS[botId];
  const holdings = useMemo(() => portfolio ? aggregatePositions(portfolio.positions) : [], [portfolio]);
  
  const totalCurrentValue = portfolio?.totalCurrentValue ?? 0;
  const monBalance = portfolio?.monBalance ?? 0;
  const totalValue = totalCurrentValue + monBalance;
  const totalInvested = portfolio?.totalInvested ?? 0;
  const pnlMON = portfolio?.pnlMON ?? 0;
  const pnlPercent = portfolio?.pnlPercent ?? 0;
  const wins = portfolio?.wins ?? 0;
  const losses = portfolio?.losses ?? 0;
  const winRate = portfolio?.winRate ?? 0;

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="bg-[#0a0a0a] rounded-lg shadow-2xl overflow-hidden font-poppins">
            {/* Header */}
            <div 
              className="p-4 border-b border-zinc-800 relative"
              style={{ background: `linear-gradient(135deg, ${config.color}15 0%, transparent 50%)` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={config.imgURL} 
                      alt={config.name} 
                      className="w-16 h-16 rounded-xl border-2"
                      style={{ borderColor: config.color }}
                    />
                    <div 
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-zinc-900"
                      style={{ backgroundColor: pnlMON >= 0 ? '#22c55e' : '#ef4444' }}
                    >
                      {pnlMON >= 0 ? '↑' : '↓'}
                    </div>
                  </div>
                  <div>
                    <Dialog.Title className="text-xl font-bold text-white flex items-center gap-2">
                      {config.name}
                      <span 
                        className="text-xs font-normal px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${config.color}30`, color: config.color }}
                      >
                        {BOT_PERSONALITIES[botId].title}
                      </span>
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-zinc-400 mt-1">
                      {BOT_PERSONALITIES[botId].description}
                    </Dialog.Description>
                    <p className="text-xs text-zinc-600 mt-2 font-poppins flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      {walletAddress?.slice(0, 10)}...{walletAddress?.slice(-8)}
                      <a 
                        href={`https://monad.socialscan.io/address/${walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-white ml-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>
                <Dialog.Close asChild>
                  <button className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 divide-x divide-zinc-800 border-b border-zinc-800">
              <StatCard 
                icon={<Wallet className="w-4 h-4" />}
                label="Total Value"
                value={`${totalValue.toFixed(2)} MON`}
                subValue={`Invested: ${totalInvested.toFixed(2)}`}
              />
              <StatCard 
                icon={pnlMON >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                label="P&L"
                value={`${pnlMON >= 0 ? '+' : ''}${pnlMON.toFixed(2)} MON`}
                subValue={`${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%`}
                color={pnlMON >= 0 ? 'green' : 'red'}
              />
              <StatCard 
                icon={<Target className="w-4 h-4" />}
                label="Win Rate"
                value={`${winRate.toFixed(0)}%`}
                subValue={`${wins}W / ${losses}L`}
              />
              <StatCard 
                icon={<Coins className="w-4 h-4" />}
                label="Cash"
                value={`${monBalance.toFixed(2)} MON`}
                subValue="Available"
              />
            </div>

            {/* Value Breakdown */}
            <div className="grid grid-cols-2 divide-x divide-zinc-800 border-b border-zinc-800">
              <div className="p-3">
                <p className="text-xs text-zinc-500 mb-1">Holdings Value</p>
                <p className="text-lg font-bold text-white">
                  {totalCurrentValue.toFixed(2)} MON
                </p>
                <p className="text-xs text-zinc-600">{holdings.length} tokens</p>
              </div>
              <div className="p-3">
                <p className="text-xs text-zinc-500 mb-1">Liquid MON</p>
                <p className="text-lg font-bold text-white">
                  {monBalance.toFixed(2)} MON
                </p>
                <p className="text-xs text-zinc-600">Ready to trade</p>
              </div>
            </div>

            {/* Holdings */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  Open Holdings ({holdings.length})
                </h3>
              </div>
              
              {holdings.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                  {holdings
                    .sort((a, b) => b.pnlPercent - a.pnlPercent)
                    .map((h) => {
                      const isLive = token?.address?.toLowerCase() === h.tokenAddress?.toLowerCase();
                      const isPositive = h.pnlPercent >= 0;
                      
                      return (
                        <div 
                          key={h.tokenAddress}
                          className={`flex items-center gap-2 p-2 rounded-lg transition-all bg-zinc-900/50`}
                        >
                          {/* Token image with PnL ring */}
                          <div className={`relative p-0.5 rounded-full ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            <TokenImage 
                              address={h.tokenAddress} 
                              symbol={h.tokenSymbol} 
                              image={h.tokenImage} 
                              size="lg" 
                            />
                            {isLive && (
                              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border border-zinc-900"></span>
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-white text-xs font-medium truncate">${h.tokenSymbol}</span>
                              <span className={`text-xs font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                {isPositive ? '+' : ''}{h.pnlPercent.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-zinc-500">{h.value.toFixed(2)} MON</span>
                              <span className="text-[10px] text-zinc-600">{h.count}x</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-600">
                  <p>No open positions</p>
                  <p className="text-xs mt-1">Waiting for the right opportunity...</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-600">
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              <a 
                href={`https://monad.socialscan.io/address/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-zinc-500 hover:text-white transition-colors"
              >
                View on Explorer <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  subValue, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number; 
  subValue?: string;
  color?: 'green' | 'red';
}) {
  const colorClass = color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : 'text-white';
  
  return (
    <div className="p-3">
      <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
        {icon}
        <span className="text-[10px] uppercase">{label}</span>
      </div>
      <p className={`text-lg font-bold ${colorClass}`}>{value}</p>
      {subValue && <p className="text-xs text-zinc-500">{subValue}</p>}
    </div>
  );
}

export default BotPositions;