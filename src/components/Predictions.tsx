// ============================================================
// PREDICTIONS — Prediction Market Component for The Council
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { BotId } from '@/types';
import { 
  Clock, 
  Users, 
  Coins,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { 
  usePredictions, 
  usePlaceBet, 
  useUserBet,
  useClaimWinnings,
  useHoldsToken,
  type PredictionData 
} from '@/hooks/usePredictions';
import { ConnectWalletButton } from './ConnectWalletButton';
import { MiniSwap } from './MiniSwap';

interface PredictionsProps {
  botConfig: Record<BotId, { name: string; imgURL: string; color: string }>;
  className?: string;
}

export function Predictions({ botConfig, className = '' }: PredictionsProps) {
  const { isConnected } = useAccount();
  const { predictions, isLoading, refetch, error } = usePredictions();
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<string>('1');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Refetch every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const getTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} text-center py-12 text-red-400`}>
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p>Failed to load predictions</p>
        <button 
          onClick={() => refetch()}
          className="mt-2 text-sm text-zinc-400 hover:text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={`${className} font-poppins text-sm`}>
      {/* Header with Connect Wallet */}
      <div className="flex items-center justify-between">
    
      </div>

      {/* Predictions List */}
      <div className="space-y-3 -mt-1">
        {predictions?.filter(prediction => prediction.endTime > new Date()).map((prediction) => (
          <PredictionCard
            key={prediction.id}
            prediction={prediction}
            isExpanded={true}
            onToggle={() => setSelectedPrediction(
              selectedPrediction === prediction.id ? null : prediction.id
            )}
            selectedOption={selectedOption}
            onSelectOption={setSelectedOption}
            betAmount={betAmount}
            onBetAmountChange={setBetAmount}
            getTimeRemaining={getTimeRemaining}
            botConfig={botConfig}
            isConnected={isConnected}
            onBetPlaced={() => {
              refetch();
              setSelectedOption(null);
              setBetAmount('1');
            }}
          />
        ))}
      </div>

      {/* Empty State */}
      {predictions.length === 0 && (
        <div className="text-center py-12 text-zinc-600">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No predictions available</p>
          <p className="text-xs mt-1">Check back later for new markets</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PREDICTION CARD
// ============================================================

interface PredictionCardProps {
  prediction: PredictionData;
  isExpanded: boolean;
  onToggle: () => void;
  selectedOption: string | null;
  onSelectOption: (id: string | null) => void;
  betAmount: string;
  onBetAmountChange: (value: string) => void;
  getTimeRemaining: (date: Date) => string;
  botConfig: Record<BotId, { name: string; imgURL: string; color: string }>;
  isConnected: boolean;
  onBetPlaced: () => void;
}

function PredictionCard({
  prediction,
  isExpanded,
  onToggle,
  selectedOption,
  onSelectOption,
  betAmount,
  onBetAmountChange,
  getTimeRemaining,
  botConfig,
  isConnected,
  onBetPlaced,
}: PredictionCardProps) {
  const timeRemaining = getTimeRemaining(prediction.endTime);
  const isEnded = timeRemaining === 'Ended' || prediction.resolved;
  const totalStaked = prediction.options.reduce((sum, o) => sum + o.totalStaked, 0);

  // Hooks for betting
  const { userBet, refetch: refetchBet } = useUserBet(prediction.onchainId);
  const { placeBet, isPending, isConfirming, isSuccess, error, hash, reset } = usePlaceBet();
  const { claim, isPending: isClaiming, isSuccess: claimSuccess } = useClaimWinnings();
  const { holdsToken, isLoading: isCheckingToken } = useHoldsToken(prediction.tokenAddress);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check if user needs to buy token
  const needsToken = isConnected && !holdsToken && !isCheckingToken;

  // Handle successful bet
  useEffect(() => {
    if (isSuccess && hash) {
      console.log('✅ Bet successful! TX:', hash);
      setShowSuccess(true);
      onBetPlaced();
      refetchBet();
      setTimeout(() => {
        setShowSuccess(false);
        reset();
      }, 5000);
    }
  }, [isSuccess, hash, onBetPlaced, refetchBet, reset]);

  // Handle successful claim
  useEffect(() => {
    if (claimSuccess) {
      refetchBet();
    }
  }, [claimSuccess, refetchBet]);

  const handlePlaceBet = async () => {
    if (!selectedOption || !betAmount || parseFloat(betAmount) <= 0) return;
    
    const optionIndex = prediction.options.findIndex(o => o.id === selectedOption) + 1;
    if (optionIndex > 0) {
      await placeBet(prediction.onchainId, optionIndex, betAmount);
    }
  };

  const handleClaim = async () => {
    await claim(prediction.onchainId);
  };

  const isWinner = prediction.resolved && 
    userBet && 
    prediction.options[prediction.winningOption - 1]?.id === prediction.options.find((_, i) => i + 1 === userBet.optionId)?.id;

  // ============================================================
  // RENDER: Token Gate Screen (if user doesn't hold token)
  // ============================================================
  if (needsToken) {
    return (
      <div className="overflow-hidden font-poppins ">
        {/* Blurred Preview Header */}
        <div className="p-4 relative">
          <div className="blur-sm pointer-events-none select-none">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px] uppercase">
                {prediction.type.replace('_', ' ')}
              </span>
              <span className="flex w-fit min-w-[60px] items-center justify-center gap-1 px-1 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400">
                <Clock className="w-3 h-3" />
                {timeRemaining}
              </span>
            </div>
            <h3 className="text-white font-medium mb-2">{prediction.question}</h3>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {prediction.prizePool.toFixed(2)} MON
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {prediction.totalBets} bets
              </span>
            </div>
          </div>
        </div>

        {/* Token Gate Content */}
        <div className="border-t border-zinc-800 p-6">
          {/* Show MiniSwap directly */}
          <div className="max-w-sm mx-auto">
            <div className="text-center mb-6">
              
              <h3 className="text-lg font-bold text-white mb-1">Token-Gated</h3>
              <p className="text-xs text-zinc-500">
                Buy the $COUNCIL token to participate in this prediction
              </p>
            </div>
            
            <MiniSwap 
              tokenAddress={prediction.tokenAddress}
              onSuccess={() => {
                window.location.reload();
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: Loading Token Check
  // ============================================================
  if (isConnected && isCheckingToken) {
    return (
      <div className="overflow-hidden">
        <div className="p-8 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-3" />
          <p className="text-sm text-zinc-500">Checking token balance...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: Normal Prediction Card (user holds token or not connected)
  // ============================================================
  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
             
            
             
             
            </div>
            <div className="flex gap-2"> <h3 className="text-white font-medium mb-2">{prediction.question}</h3>
                  <span className={`flex w-fit min-w-[70px] h-fit items-center justify-center gap-1 px-1 py-0.5 rounded text-[10px] ${
                isEnded 
                  ? 'bg-zinc-700 text-zinc-400' 
                  : 'bg-green-500/20 text-green-400'
              }`}>
                <Clock className="w-3 h-3" />
                {prediction.resolved ? 'Resolved' : timeRemaining}
              </span>
            </div>
           
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {prediction.prizePool.toFixed(2)} MON
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {prediction.totalBets} bets
              </span>
            </div>
          </div>
          
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-zinc-800/50 bg-zinc-950">
          {/* Options */}
          <div className="p-2 space-y-1">
            {prediction.options.map((option, index) => {
              const percentage = totalStaked > 0 ? (option.totalStaked / totalStaked) * 100 : 0;
              const isSelected = selectedOption === option.id;
              const isUserBet = userBet?.optionId === index + 1;
              const isBotOption = !!botConfig[option.id as BotId];
              const isWinningOption = prediction.resolved && prediction.winningOption === index + 1;
              
              return (
                <div
                  key={option.id}
                  onClick={() => !isEnded && !userBet && onSelectOption(isSelected ? null : option.id)}
                  className={`
                    relative rounded-lg px-3 py-2 cursor-pointer transition-all
                    ${isSelected ? 'bg-zinc-800' : ''}
                    ${isUserBet ? 'bg-yellow-500/5 border border-yellow-500/20' : ''}
                    ${isWinningOption ? 'bg-green-500/10 border border-green-500/30' : ''}
                    ${!isEnded && !userBet ? 'hover:bg-zinc-800/50' : ''}
                    ${isEnded || userBet ? 'cursor-default' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isBotOption && (
                        <img 
                          src={botConfig[option.id as BotId].imgURL}
                          alt={option.label}
                          className="w-6 h-6 rounded-md"
                        />
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-300">{option.label}</span>
                        {isUserBet && (
                          <span className="text-[9px] text-yellow-500">• your bet</span>
                        )}
                        {isWinningOption && (
                          <span className="text-[9px] text-green-500 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Winner
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-zinc-600">
                        {option.totalStaked.toFixed(2)} MON
                      </span>
                      <div className="text-right">
                        <span 
                          className="text-xs font-medium min-w-[40px] block"
                          style={{ color: option.color }}
                        >
                          {option.odds.toFixed(2)}x
                        </span>
                        {isSelected && parseFloat(betAmount) > 0 && parseFloat(betAmount) !== 1 && (
                          <span className="text-[9px] text-zinc-500">
                            {(() => {
                              const bet = parseFloat(betAmount);
                              const newOptionTotal = option.totalStaked + bet;
                              const newPoolTotal = totalStaked + bet;
                              const poolAfterFee = newPoolTotal * 0.975;
                              const payout = (bet / newOptionTotal) * poolAfterFee;
                              const profit = payout - bet;
                              const profitMultiplier = profit / bet;
                              return `→ ${profitMultiplier.toFixed(2)}x`;
                            })()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-1.5 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${percentage}%`, 
                        backgroundColor: isWinningOption ? '#22c55e' : `${option.color}60` 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Betting Section */}
          {selectedOption && !isEnded && !userBet && (
            <div className="p-4 border-t border-zinc-800">
              {!isConnected ? (
                <div className="text-center py-4 flex flex-col items-center justify-center">
                  <p className="text-zinc-500 mb-3">Connect wallet to place bet</p>
                </div>
              ) : (
                <>
                  {/* Selected Option */}
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">Betting on:</span>
                      <span 
                        className="text-sm font-medium"
                        style={{ color: prediction.options.find(o => o.id === selectedOption)?.color }}
                      >
                        {prediction.options.find(o => o.id === selectedOption)?.label}
                      </span>
                    </div>
                    <span 
                      className="text-sm font-bold"
                      style={{ color: prediction.options.find(o => o.id === selectedOption)?.color }}
                    >
                      {prediction.options.find(o => o.id === selectedOption)?.odds.toFixed(2)}x
                    </span>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">
                      Amount
                    </label>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        value={betAmount}
                        onChange={(e) => onBetAmountChange(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-zinc-600"
                        placeholder="0.00"
                        min="0.1"
                        step="0.1"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                        MON
                      </span>
                    </div>
                    
                    {/* Quick Amounts */}
                    <div className="flex gap-1.5">
                      {[1, 5, 10, 25].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => onBetAmountChange(amount.toString())}
                          className={`
                            flex-1 py-2 rounded-lg text-xs font-medium transition-all
                            ${betAmount === amount.toString()
                              ? 'bg-zinc-700 text-white'
                              : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                            }
                          `}
                        >
                          {amount} MON
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Potential Win - Calcul réaliste */}
                  {(() => {
                    const selectedOpt = prediction.options.find(o => o.id === selectedOption);
                    const betAmt = parseFloat(betAmount || '0');
                    
                    if (!selectedOpt || betAmt <= 0) {
                      return (
                        <div className="mt-4 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-500">Potential Win</span>
                            <span className="text-base font-bold text-white">0.00 MON</span>
                          </div>
                        </div>
                      );
                    }
                    
                    // Calcul réaliste : après ton bet, les odds changent
                    const newOptionTotal = selectedOpt.totalStaked + betAmt;
                    const newPoolTotal = totalStaked + betAmt;
                    const poolAfterFee = newPoolTotal * 0.975; // 2.5% fee
                    
                    // Ta part = (ton bet / nouveau total option) * pool après fee
                    const yourPayout = (betAmt / newOptionTotal) * poolAfterFee;
                    const profit = yourPayout - betAmt;
                    const profitMultiplier = profit / betAmt;
                    
                    return (
                      <div className="mt-4 p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-500">If you win</span>
                          <span className="text-base font-bold text-green-400">
                            +{profit.toFixed(2)} MON
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-600">
                          <span>You get back</span>
                          <span>{yourPayout.toFixed(2)} MON (your {betAmt} + {profit.toFixed(2)} profit)</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-600">
                          <span>Profit multiplier</span>
                          <span>{profitMultiplier.toFixed(2)}x your bet</span>
                        </div>
                        {profitMultiplier < 1 && (
                          <p className="text-[10px] text-yellow-500 mt-1">
                            ⚠️ Low return. Pool needs more bets on other options.
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Success Message */}
                  {showSuccess && hash && (
                    <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-xs text-green-400 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Bet placed successfully!
                      </p>
                      <a 
                        href={`https://monadexplorer.com/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-green-500 hover:underline mt-1 block"
                      >
                        View transaction →
                      </a>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-xs text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error.message || 'Transaction failed'}
                      </p>
                    </div>
                  )}

                  {/* Place Bet Button */}
                  <button
                    onClick={handlePlaceBet}
                    disabled={isPending || isConfirming || !betAmount || parseFloat(betAmount) < 0.1}
                    className={`
                      w-full mt-4 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2
                      ${isPending || isConfirming || !betAmount || parseFloat(betAmount) < 0.1
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        : 'bg-white hover:bg-zinc-100 text-black'
                      }
                    `}
                  >
                    {isPending || isConfirming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isPending ? 'Confirm in wallet...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        Place Bet
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-zinc-600 text-center mt-2">
                    Min bet: 0.1 MON • 2.5% platform fee
                  </p>
                </>
              )}
            </div>
          )}

          {/* User Bet Display */}
          {userBet && (
            <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
              {/* Current Bet Info */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-zinc-500">Your bet on {prediction.options[userBet.optionId - 1]?.label}</p>
                  <p className="text-lg font-bold text-white">
                    {userBet.amount.toFixed(2)} MON
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Potential win</p>
                  {(() => {
                    const userOption = prediction.options[userBet.optionId - 1];
                    if (!userOption || userOption.totalStaked === 0) return <p className="text-lg font-bold text-green-400">-</p>;
                    
                    const poolAfterFee = totalStaked * 0.975;
                    const yourPayout = (userBet.amount / userOption.totalStaked) * poolAfterFee;
                    const profit = yourPayout - userBet.amount;
                    const profitMultiplier = profit / userBet.amount;
                    
                    return (
                      <>
                        <p className="text-lg font-bold text-green-400">+{profit.toFixed(2)} MON</p>
                        <p className="text-[10px] text-zinc-500">{profitMultiplier.toFixed(2)}x profit</p>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Resolved States */}
              {prediction.resolved && isWinner && !userBet.claimed && (
                <button
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                  {isClaiming ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Claim Winnings'
                  )}
                </button>
              )}
              {prediction.resolved && !isWinner && (
                <div className="text-center py-2 text-red-400 text-sm">Lost</div>
              )}
              {prediction.resolved && userBet.claimed && (
                <div className="text-center py-2 text-green-400 text-sm flex items-center justify-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Claimed
                </div>
              )}

              {/* Add More Bet Section (if not resolved/ended) */}
              {!prediction.resolved && !isEnded && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-2">Add to your bet</p>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        value={betAmount}
                        onChange={(e) => onBetAmountChange(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-600"
                        placeholder="0.00"
                        min="0.1"
                        step="0.1"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
                        MON
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        // Set the selected option to user's existing bet option
                        const optionId = prediction.options[userBet.optionId - 1]?.id;
                        if (optionId) {
                          onSelectOption(optionId);
                          // Trigger bet
                          placeBet(prediction.onchainId, userBet.optionId, betAmount);
                        }
                      }}
                      disabled={isPending || isConfirming || !betAmount || parseFloat(betAmount) < 0.1}
                      className={`
                        px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2
                        ${isPending || isConfirming || !betAmount || parseFloat(betAmount) < 0.1
                          ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                          : 'bg-purple-500 hover:bg-purple-600 text-white'
                        }
                      `}
                    >
                      {isPending || isConfirming ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Quick add buttons */}
                  <div className="flex gap-1.5 mt-2">
                    {[1, 5, 10].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => onBetAmountChange(amount.toString())}
                        className={`
                          flex-1 py-1.5 rounded text-xs font-medium transition-all
                          ${betAmount === amount.toString()
                            ? 'bg-zinc-700 text-white'
                            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                          }
                        `}
                      >
                        +{amount}
                      </button>
                    ))}
                  </div>

                  {/* Preview new potential win */}
                  {parseFloat(betAmount) > 0 && (
                    <div className="mt-2 p-2 bg-zinc-800/50 rounded text-[10px] text-zinc-400">
                      {(() => {
                        const userOption = prediction.options[userBet.optionId - 1];
                        const addAmount = parseFloat(betAmount);
                        const newBetTotal = userBet.amount + addAmount;
                        const newOptionTotal = userOption.totalStaked + addAmount;
                        const newPoolTotal = totalStaked + addAmount;
                        const poolAfterFee = newPoolTotal * 0.975;
                        const newPayout = (newBetTotal / newOptionTotal) * poolAfterFee;
                        const newProfit = newPayout - newBetTotal;
                        const profitMultiplier = newProfit / newBetTotal;
                        
                        return (
                          <span>
                            After adding: <span className="text-green-400">+{newProfit.toFixed(2)} MON</span> profit ({profitMultiplier.toFixed(2)}x)
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Predictions;