// ============================================================
// WAGMI CONFIG — Wallet connection setup
// ============================================================

'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { type Chain } from 'viem';
import { monad } from 'viem/chains';

export const config = getDefaultConfig({
  appName: 'The Council',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || 'demo',
  chains: [monad],
  transports: {
  [monad.id]: http('https://rpc.monad.xyz')
  },
  ssr: true,
});
