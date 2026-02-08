// ============================================================
// CONNECT WALLET BUTTON
// ============================================================

'use client';

import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { useState } from 'react';
import { Wallet, ChevronDown, LogOut, Copy, Check, ExternalLink } from 'lucide-react';

export function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-3 py-2 transition-all"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-sm text-white font-mono">
            {formatAddress(address)}
          </span>
          {balance && (
            <span className="text-xs text-zinc-500">
              {parseFloat(balance.formatted).toFixed(2)} {balance.symbol}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)} 
            />
            <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden">
              {/* Address */}
              <div className="p-3 border-b border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase mb-1">Connected Wallet</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white font-mono">{formatAddress(address)}</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={copyAddress}
                      className="p-1.5 hover:bg-zinc-800 rounded transition-all"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-zinc-500" />
                      )}
                    </button>
                    <a 
                      href={`https://testnet.monadexplorer.com/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-zinc-800 rounded transition-all"
                    >
                      <ExternalLink className="w-4 h-4 text-zinc-500" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Balance */}
              {balance && (
                <div className="p-3 border-b border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase mb-1">Balance</p>
                  <p className="text-lg text-white font-bold">
                    {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                  </p>
                </div>
              )}

              {/* Disconnect */}
              <button
                onClick={() => {
                  disconnect();
                  setShowDropdown(false);
                }}
                className="w-full p-3 flex items-center gap-2 text-red-400 hover:bg-zinc-800 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Disconnect</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isPending}
        className="flex items-center gap-2 bg-white hover:bg-zinc-100 text-black rounded-lg px-4 py-2 font-medium transition-all disabled:opacity-50"
      >
        {isPending ? (
          <>
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </>
        )}
      </button>

      {showDropdown && !isPending && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)} 
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-2">
              <p className="text-[10px] text-zinc-500 uppercase px-2 py-1">Select Wallet</p>
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector });
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800 rounded-lg transition-all"
                >
                  <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-zinc-400" />
                  </div>
                  <span className="text-sm text-white">{connector.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ConnectWalletButton;