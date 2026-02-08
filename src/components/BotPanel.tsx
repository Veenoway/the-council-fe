// ============================================================
// BotPanel — Grid of all bot cards
// ============================================================

'use client';

import { BOT_IDS } from '@/lib/bots';
import { BotCard } from './BotCard';

export function BotPanel() {
  return (
    <div className="bg-bg-secondary rounded-xl border border-gray-800 p-4">
      <h2 className="text-lg font-bold text-white mb-4">The Council</h2>
      <div className="grid grid-cols-1 gap-3">
        {BOT_IDS.map((botId) => (
          <BotCard key={botId} botId={botId} />
        ))}
      </div>
    </div>
  );
}
