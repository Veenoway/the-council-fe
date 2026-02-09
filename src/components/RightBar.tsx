// ============================================================
// RightSidebar — Tabbed sidebar (Market vs Predictions)
// ============================================================

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Brain } from 'lucide-react';

type TabId = 'market' | 'predictions';

interface RightSidebarProps {
  marketContent: React.ReactNode;
  predictionsContent: React.ReactNode;
  className?: string;
}

export function RightSidebar({ marketContent, predictionsContent, className = '' }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId>('market');

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-800 bg-[#0a0a0a] shrink-0">
        <button
          onClick={() => setActiveTab('market')}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3
            text-sm font-medium transition-all relative
            ${activeTab === 'market' 
              ? 'text-white' 
              : 'text-zinc-500 hover:text-zinc-300'
            }
          `}
        >
          <span>Market</span>
          {activeTab === 'market' && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('predictions')}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3
            text-sm font-medium transition-all relative
            ${activeTab === 'predictions' 
              ? 'text-white' 
              : 'text-zinc-500 hover:text-zinc-300'
            }
          `}
        >
          <span>Predictions</span>
          {activeTab === 'predictions' && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'market' ? marketContent : predictionsContent}
      </div>
    </div>
  );
}

export default RightSidebar;