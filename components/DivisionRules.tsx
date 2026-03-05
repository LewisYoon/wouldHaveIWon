'use client';

import React from 'react';

interface DivisionRulesProps {
  game: 'Oz Lotto' | 'Powerball' | 'Tatts Lotto';
  isOpen: boolean;
  onClose: () => void;
}

export default function DivisionRules({ game, isOpen, onClose }: DivisionRulesProps) {
  if (!isOpen) return null;

  const rules = {
    'Oz Lotto': [
      { div: '1', matches: '7 Main' },
      { div: '2', matches: '6 Main + 1 Supp' },
      { div: '3', matches: '6 Main' },
      { div: '4', matches: '5 Main + 1 Supp' },
      { div: '5', matches: '5 Main' },
      { div: '6', matches: '4 Main' },
      { div: '7', matches: '3 Main + 1 Supp' },
    ],
    'Powerball': [
      { div: '1', matches: '7 Main + PB' },
      { div: '2', matches: '7 Main' },
      { div: '3', matches: '6 Main + PB' },
      { div: '4', matches: '6 Main' },
      { div: '5', matches: '5 Main + PB' },
      { div: '6', matches: '4 Main + PB' },
      { div: '7', matches: '5 Main' },
      { div: '8', matches: '3 Main + PB' },
      { div: '9', matches: '2 Main + PB' },
    ],
    'Tatts Lotto': [
      { div: '1', matches: '6 Main' },
      { div: '2', matches: '5 Main + 1-2 Supps' },
      { div: '3', matches: '5 Main' },
      { div: '4', matches: '4 Main' },
      { div: '5', matches: '3 Main + 1-2 Supps' },
      { div: '6', matches: '3 Main' },
    ]
  };

  const currentRules = rules[game];
  const brandColor = game === 'Oz Lotto' ? 'text-emerald-600' : game === 'Tatts Lotto' ? 'text-red-600' : 'text-indigo-600';
  const headerBg = game === 'Oz Lotto' ? 'bg-emerald-50 dark:bg-emerald-900' : game === 'Tatts Lotto' ? 'bg-red-50 dark:bg-red-900' : 'bg-indigo-50 dark:bg-indigo-900';

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-50 duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-950 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-white/10 animate-in zoom-in-95 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex justify-between items-center p-6 rounded-t-3xl ${headerBg}`}>
          <h3 className={`text-lg font-black uppercase tracking-widest ${brandColor}`}>{game} Prize Divisions</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
            {currentRules.map((rule) => (
              <div key={rule.div} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Division {rule.div}</span>
                <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{rule.matches}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
