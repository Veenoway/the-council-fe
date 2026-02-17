// ============================================================
// Header — Top navigation with wallet connect
// ============================================================

'use client';

import { useCouncilStore } from '@/store/council';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wifi, WifiOff } from 'lucide-react';

export function Header() {
  const isConnected = useCouncilStore((s) => s.isConnected);

  return (
    <header className="bg-bg-secondary border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏛️</span>
          <div>
            <h1 className="text-xl font-bold text-white">The Council</h1>
            <p className="text-xs text-gray-500">AI Trading Collective on Monad</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* WebSocket status */}
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi size={16} className="text-accent-green" />
                <span className="text-accent-green">Live</span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-red-500" />
                <span className="text-red-500">Offline</span>
              </>
            )}
          </div>

          {/* Wallet connect */}
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    style: {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          className="hidden px-4 py-2 bg-accent-green text-black font-bold rounded-lg hover:bg-accent-green/80 transition-colors"
                        >
                          Connect Wallet
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg"
                        >
                          Wrong Network
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={openChainModal}
                          className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary rounded-lg hover:bg-bg-primary transition-colors"
                        >
                          {chain.hasIcon && chain.iconUrl && (
                            <img
                              src={chain.iconUrl}
                              alt={chain.name ?? 'Chain'}
                              className="w-5 h-5 rounded-full"
                            />
                          )}
                          <span className="text-sm text-white">{chain.name}</span>
                        </button>

                        <button
                          onClick={openAccountModal}
                          className="px-4 py-2 bg-bg-tertiary rounded-lg hover:bg-bg-primary transition-colors"
                        >
                          <span className="text-sm font-poppins text-white">
                            {account.displayName}
                          </span>
                          {account.displayBalance && (
                            <span className="text-sm text-gray-400 ml-2">
                              {account.displayBalance}
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
}
