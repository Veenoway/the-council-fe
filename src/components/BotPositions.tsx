'use client';

// ============================================================
// BOT POSITIONS v3 — Pro Trading Terminal UI + Dialog Modal
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { Token, Trade, BotId, Position } from '@/types';
import { Grid2X2, Table2, X, ExternalLink, TrendingUp, TrendingDown, Wallet, BarChart3, Target, Trophy } from 'lucide-react';
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
  size = 'md' 
}: { 
  address: string; 
  symbol: string; 
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(tokenImageCache.get(address) || null);
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
        console.log("res", res);
        if (res.ok) {
          const data = await res.json();
          console.log("datadddd", data);
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

  // Fallback
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
      className={`${sizeClasses[size]} rounded-full object-cover shrink-0 border border-zinc-800 object-center bg-zinc-900`}
      onError={() => setError(true)}
    />
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function BotPositions({ trades, token, botConfig, className = '' }: BotPositionsProps) {
  const [portfolios, setPortfolios] = useState<Position[]>([]);
  const [botsData, setBotsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBot, setSelectedBot] = useState<BotId | null>(null);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  
  const allBots: BotId[] = ['chad', 'quantum', 'sensei', 'sterling', 'oracle'];
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

  const fetchData = async () => {
    try {
      const [posRes, botsRes] = await Promise.all([
        fetch(`${API_URL}/api/positions`),
        fetch(`${API_URL}/api/bots`),
      ]);
      
      if (posRes.ok) {
        const posData = await posRes.json();
        setPortfolios(posData.portfolios || []);
      }
      
      if (botsRes.ok) {
        const botsData = await botsRes.json();
        setBotsData(botsData.bots || []);
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

  const getBotData = (botId: BotId) => botsData.find(b => b.botId === botId);
  const getPortfolio = (botId: BotId) => portfolios.find(p => p.botId === botId);

  const formatMON = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(2);
  };

  const formatPnL = (value: number, percent: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)} (${sign}${percent.toFixed(1)}%)`;
  };

  const totalValue = botsData.reduce((sum, b) => sum + (b.totalValue || 0), 0);
  const totalPnl = botsData.reduce((sum, b) => sum + (b.totalPnl || 0), 0);
  const totalOpenPositions = botsData.reduce((sum, b) => sum + (b.openPositions || 0), 0);
  const totalTrades = botsData.reduce((sum, b) => sum + (b.totalTrades || 0), 0);

  return (
    <div className={`${className} font-mono text-sm`}>
      {/* Summary Bar */}
      <div className="grid grid-cols-5 divide-x divide-zinc-800 bg-[#0a0a0a] rounded-lg ">
        <SummaryCell label="COUNCIL VALUE" value={`${formatMON(totalValue)} MON`} />
        <SummaryCell 
          label="TOTAL P&L" 
          value={formatPnL(totalPnl, totalValue > 0 ? (totalPnl / totalValue) * 100 : 0)}
          color={totalPnl >= 0 ? 'green' : 'red'}
        />
        <SummaryCell label="POSITIONS" value={totalOpenPositions.toString()} />
        <SummaryCell label="TRADES" value={totalTrades.toString()} />
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
                data={getBotData(botId)}
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
            botsData={botsData}
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
        data={selectedBot ? getBotData(selectedBot) : null}
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
  data: any;
  portfolio: any | undefined;
  onClick: () => void;
  token: Token | null;
}

function BotColumn({ botId, config, data, portfolio, onClick, token }: BotColumnProps) {
  const pnl = data?.totalPnl || 0;
  const pnlPercent = data?.unrealizedPnlPercent || 0;
  const value = data?.totalValue || 0;
  const openPos = data?.openPositions || 0;
  
  const holdings = portfolio ? aggregatePositions(portfolio.positions.filter((p: any) => p.isOpen)) : [];

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
          <p className="text-[10px] text-zinc-600">VALUE</p>
          <p className="text-white font-bold">{value.toFixed(2)} <span className="text-zinc-500 text-xs">MON</span></p>
        </div>

        <div>
          <p className="text-[10px] text-zinc-600">P&L</p>
          <p className={`font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {pnl >= 0 ? '+' : ''}{pnl.toFixed(3)}
            <span className="text-xs ml-1">({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)</span>
          </p>
        </div>

        <div>
          <p className="text-[10px] text-zinc-600">POSITIONS</p>
          <p className="text-white">{openPos}</p>
        </div>

        <div>
          <p className="text-[10px] text-zinc-600">WIN RATE</p>
          <p className="text-white">
            {data?.winRate?.toFixed(0) || 0}%
            <span className="text-zinc-500 text-xs ml-1">
              ({data?.wins || 0}W/{data?.losses || 0}L)
            </span>
          </p>
        </div>
      </div>

      {/* Holdings Preview */}
      {holdings.length > 0 ? (
        <div className="px-3 py-2 bg-zinc-900/30">
          <p className="text-[10px] text-zinc-600 mb-1">HOLDINGS</p>
          <div className="flex items-center gap-1">
            {holdings.slice(0, 4).map((holding) => (
              <TokenImage 
                key={holding.tokenAddress}
                address={holding.tokenAddress} 
                symbol={holding.tokenSymbol} 
                size="md" 
              />
            ))}
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
  botsData: any[];
  portfolios: any[];
  token: Token | null;
  onSelectBot: (botId: BotId) => void;
}

function BotTable({ bots, botConfig, botsData, portfolios, token, onSelectBot }: BotTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-zinc-900/50">
          <tr className="text-left text-zinc-500 uppercase">
            <th className="px-3 py-2">Bot</th>
            <th className="px-3 py-2 text-right">Value</th>
            <th className="px-3 py-2 text-right">P&L</th>
            <th className="px-3 py-2 text-right">P&L %</th>
            <th className="px-3 py-2 text-right">Positions</th>
            <th className="px-3 py-2 text-right">Win Rate</th>
            <th className="px-3 py-2">Holdings</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {bots.map((botId) => {
            const config = botConfig[botId];
            const data = botsData.find(b => b.botId === botId);
            const portfolio = portfolios.find(p => p.botId === botId);
            const holdings = portfolio ? aggregatePositions(portfolio.positions.filter((p: any) => p.isOpen)) : [];

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
                <td className="px-3 py-2 text-right font-mono text-white">
                  {(data?.totalValue || 0).toFixed(2)} MON
                </td>
                <td className={`px-3 py-2 text-right font-mono ${(data?.totalPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(data?.totalPnl || 0) >= 0 ? '+' : ''}{(data?.totalPnl || 0).toFixed(3)}
                </td>
                <td className={`px-3 py-2 text-right font-mono ${(data?.unrealizedPnlPercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(data?.unrealizedPnlPercent || 0) >= 0 ? '+' : ''}{(data?.unrealizedPnlPercent || 0).toFixed(1)}%
                </td>
                <td className="px-3 py-2 text-right text-white">
                  {data?.openPositions || 0}
                </td>
                <td className="px-3 py-2 text-right text-white">
                  {(data?.winRate || 0).toFixed(0)}%
                </td>
                <td className="px-3 py-2">
                  <div className="flex -space-x-1.5">
                    {holdings.slice(0, 4).map((h) => (
                      <div key={h.tokenAddress} className="ring-1 ring-zinc-900 rounded-full">
                        <TokenImage address={h.tokenAddress} symbol={h.tokenSymbol} size="sm" />
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
  data: any;
  portfolio: any | undefined | null;
  token: Token | null;
  open: boolean;
  onClose: () => void;
}

function BotDetailDialog({ botId, config, data: dataBuffer, portfolio, token, open, onClose }: BotDetailDialogProps) {
  if (!botId || !config) return null;

  const data = useMemo(() => ({
    ...dataBuffer,
    walletAddress: dataBuffer?.botId === "sensei" ? "0xE4F9910930bE9e9cbe3b635b027197A838899fe4" : dataBuffer?.walletAddress
  }), [dataBuffer]);

  const holdings = useMemo(() => portfolio ? aggregatePositions(portfolio.positions.filter((p: any) => p.isOpen)) : [], [portfolio]);
  const pnl = data?.totalPnl || 0;
  const pnlPercent = data?.unrealizedPnlPercent || 0;
  console.log("data =====>", data);

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="bg-[#0a0a0a] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden font-mono">
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
                      style={{ backgroundColor: pnl >= 0 ? '#22c55e' : '#ef4444' }}
                    >
                      {pnl >= 0 ? '↑' : '↓'}
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
                    <p className="text-xs text-zinc-600 mt-2 font-mono flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      {data?.walletAddress?.slice(0, 10)}...{data?.walletAddress?.slice(-8)}
                      <a 
                        href={`https://monad.socialscan.io/address/${data?.walletAddress}`}
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
                value={`${(data?.totalValue || 0).toFixed(2)} MON`}
              />
              <StatCard 
                icon={pnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                label="Total P&L"
                value={`${pnl >= 0 ? '+' : ''}${pnl.toFixed(3)} MON`}
                subValue={`${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%`}
                color={pnl >= 0 ? 'green' : 'red'}
              />
              <StatCard 
                icon={<Target className="w-4 h-4" />}
                label="Win Rate"
                value={`${(data?.winRate || 0).toFixed(0)}%`}
                subValue={`${data?.wins || 0}W / ${data?.losses || 0}L`}
              />
              <StatCard 
                icon={<BarChart3 className="w-4 h-4" />}
                label="Positions"
                value={data?.openPositions || 0}
                subValue={`${data?.closedTrades || 0} closed`}
              />
            </div>

            {/* P&L Breakdown */}
            <div className="grid grid-cols-2 divide-x divide-zinc-800 border-b border-zinc-800">
              <div className="p-4">
                <p className="text-xs text-zinc-500 uppercase mb-2">Realized P&L</p>
                <p className={`text-lg font-bold ${(data?.realizedPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(data?.realizedPnl || 0) >= 0 ? '+' : ''}{(data?.realizedPnl || 0).toFixed(4)} MON
                </p>
              </div>
              <div className="p-4">
                <p className="text-xs text-zinc-500 uppercase mb-2">Unrealized P&L</p>
                <p className={`text-lg font-bold ${(data?.unrealizedPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(data?.unrealizedPnl || 0) >= 0 ? '+' : ''}{(data?.unrealizedPnl || 0).toFixed(4)} MON
                </p>
              </div>
            </div>

            {/* Holdings */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Open Holdings ({holdings.length})
                </h3>
              </div>
              
              {holdings.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {holdings.map((h) => {
                    const isLive = token?.address === h.tokenAddress;
                    return (
                      <div 
                        key={h.tokenAddress}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isLive 
                            ? 'bg-green-500/10 border border-green-500/30' 
                            : 'bg-zinc-800/50 border border-zinc-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <TokenImage address={h.tokenAddress} symbol={h.tokenSymbol} size="xl" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-white font-medium">${h.tokenSymbol}</span>
                              {isLive && (
                                <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                  LIVE
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500">
                              {h.totalAmount.toFixed(2)} tokens · {h.count} pos
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${h.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {h.pnlPercent >= 0 ? '+' : ''}{h.pnlPercent.toFixed(1)}%
                          </p>
                          <p className="text-[11px] text-zinc-500">{h.value.toFixed(4)} MON</p>
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
                href={`https://testnet.monadexplorer.com/address/${data?.walletAddress}`}
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
    <div className="p-4">
      <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
        {icon}
        <span className="text-[10px] uppercase">{label}</span>
      </div>
      <p className={`text-lg font-bold ${colorClass}`}>{value}</p>
      {subValue && <p className="text-xs text-zinc-500">{subValue}</p>}
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

interface AggregatedHolding {
  tokenAddress: string;
  tokenSymbol: string;
  totalAmount: number;
  value: number;
  pnlPercent: number;
  count: number;
}

function aggregatePositions(positions: any[]): AggregatedHolding[] {
  const byToken: Record<string, AggregatedHolding> = {};
  
  for (const pos of positions) {
    const addr = pos.tokenAddress;
    if (!byToken[addr]) {
      byToken[addr] = {
        tokenAddress: addr,
        tokenSymbol: pos.tokenSymbol,
        totalAmount: 0,
        value: 0,
        pnlPercent: 0,
        count: 0,
      };
    }
    byToken[addr].totalAmount += pos.amount;
    byToken[addr].value += pos.currentValueMON || 0;
    byToken[addr].count += 1;
  }
  
  for (const holding of Object.values(byToken)) {
    const positions_for_token = positions.filter(p => p.tokenAddress === holding.tokenAddress);
    const totalEntry = positions_for_token.reduce((sum, p) => sum + (p.entryValueMON || 0), 0);
    if (totalEntry > 0) {
      holding.pnlPercent = ((holding.value - totalEntry) / totalEntry) * 100;
    }
  }
  
  return Object.values(byToken).sort((a, b) => b.value - a.value);
}

export default BotPositions;