// lotto-project/components/LottoLinePicker.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { generateQuickPick } from '../lib/lotto-utils';

interface LottoLinePickerProps {
  lineId: string;
  displayIndex: number;
  selectedNumbers: number[];
  onNumbersChange: (id: string, numbers: number[]) => void;
  onDeleteLine: (id: string) => void;
  game?: 'Oz Lotto' | 'Powerball' | 'Tatts Lotto';
}

export default function LottoLinePicker({ 
  lineId, 
  displayIndex, 
  selectedNumbers, 
  onNumbersChange, 
  onDeleteLine,
  game = 'Oz Lotto'
}: LottoLinePickerProps) {
  const [activeNumbers, setActiveNumbers] = useState<number[]>([]);
  
  const OZ_MAX = 47;
  const PB_MAX = 35;
  const PB_BALL_MAX = 20;
  const TATTS_MAX = 45;

  useEffect(() => {
    const required = game === 'Oz Lotto' ? 7 : game === 'Powerball' ? 8 : 6;
    if (selectedNumbers.length === required) {
      setActiveNumbers(selectedNumbers);
    } else {
      setActiveNumbers(new Array(required).fill(0));
    }
  }, [selectedNumbers, game]);

  const handleQuickPick = () => {
    const pick = generateQuickPick(game);
    onNumbersChange(lineId, pick);
  };

  const toggleNumber = (idx: number, val: number) => {
    const newNumbers = [...activeNumbers];
    newNumbers[idx] = val;
    onNumbersChange(lineId, newNumbers);
  };

  const isOz = game === 'Oz Lotto';
  const isTatts = game === 'Tatts Lotto';
  const brandColor = isOz ? 'text-emerald-600' : isTatts ? 'text-red-600' : 'text-indigo-600';
  const brandBg = isOz ? 'bg-emerald-50 dark:bg-emerald-500/10' : isTatts ? 'bg-red-50 dark:bg-red-500/10' : 'bg-indigo-50 dark:bg-indigo-500/10';
  const brandBall = isOz ? 'bg-emerald-500' : isTatts ? 'bg-red-500' : 'bg-indigo-600';

  const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
  );

  return (
    <div className="group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 animate-in fade-in zoom-in-95">
      <div className="flex flex-wrap items-center gap-4">
        {/* Index Badge */}
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner ${brandBg} ${brandColor} border border-black/5`}>
          {displayIndex}
        </div>

        {/* Numbers Row */}
        <div className="flex flex-wrap gap-2.5 items-center flex-grow">
          {activeNumbers.map((num, idx) => {
            const isPowerballSlot = game === 'Powerball' && idx === 7;
            const max = isPowerballSlot ? PB_BALL_MAX : (game === 'Oz Lotto' ? OZ_MAX : game === 'Powerball' ? PB_MAX : TATTS_MAX);
            
            return (
              <div key={idx} className="relative group/ball">
                <input
                  type="number"
                  min="1"
                  max={max}
                  value={num || ''}
                  placeholder={isPowerballSlot ? "PB" : "-"}
                  onChange={(e) => {
                    let v = parseInt(e.target.value) || 0;
                    if (v > max) v = max;
                    toggleNumber(idx, v);
                  }}
                  className={`w-11 h-11 rounded-full text-center font-black text-sm transition-all focus:ring-4 focus:outline-none shadow-md border-b-4 border-black/10
                    ${num > 0 
                      ? (isPowerballSlot ? 'bg-amber-400 text-amber-950 border-amber-600 focus:ring-amber-200' : `${brandBall} text-white border-black/20 focus:ring-indigo-200`)
                      : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-white/10 focus:ring-gray-200'
                    }
                  `}
                />
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={handleQuickPick}
            className={`p-2.5 rounded-xl ${brandBg} ${brandColor} hover:brightness-95 transition-all text-[10px] font-black uppercase tracking-widest border border-black/5 shadow-sm`}
          >
            Auto
          </button>
          <button 
            onClick={() => onDeleteLine(lineId)}
            className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 transition-all border border-red-100 dark:border-red-500/20 shadow-sm"
            title="Delete Set"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
