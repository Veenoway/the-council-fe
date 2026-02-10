'use client';

// ============================================================
// BUY COUNCIL MODAL — Prompt non-holders to buy $COUNCIL
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Zap, Search, TrendingUp } from 'lucide-react';
import { TokenSwap } from './TokenSwap';
import MiniSwap from './MiniSwap';

// Council token address on Monad
const COUNCIL_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_COUNCIL_TOKEN || '0xbD489B45f0f978667fBaf373D2cFA133244F7777';
const COUNCIL_SYMBOL = 'COUNCIL';
const COUNCIL_NAME = 'The Council';

interface BuyCouncilModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BuyCouncilModal({ isOpen, onClose, onSuccess }: BuyCouncilModalProps) {
  const [showSwap, setShowSwap] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md bg-[#0a0a0a] rounded-lg overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-[#0a0a0a] hover:bg-zinc-700 transition-colors z-10"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>

           <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
              
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">Buy $COUNCIL</h2>
                  <p className="text-xs text-zinc-500">Unlock holder benefits</p>
                </div>
              </div>

              <MiniSwap
                tokenAddress={COUNCIL_TOKEN_ADDRESS}
                onSuccess={() => setShowSwap(false)}
              />
            </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default BuyCouncilModal;