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
  const [showGrid, setShowGrid] = useState(false);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  
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

  const updateNumberAt = (idx: number, val: number) => {
    const newNumbers = [...activeNumbers];
    const mainNumbers = game === 'Powerball' ? newNumbers.slice(0, 7) : newNumbers;
    
    // Prevent duplicate in main numbers
    if (val !== 0 && mainNumbers.includes(val) && mainNumbers.indexOf(val) !== idx) {
      setErrorIndex(idx);
      setTimeout(() => setErrorIndex(null), 500);
      return; // Abort update
    }

    newNumbers[idx] = val;
    onNumbersChange(lineId, newNumbers);
  };

  const handleGridClick = (val: number) => {
    const mainNumbers = game === 'Powerball' ? activeNumbers.slice(0, 7) : activeNumbers;
    const existingIdx = mainNumbers.indexOf(val);
    
    if (existingIdx !== -1) {
      updateNumberAt(existingIdx, 0);
      return;
    }

    const firstEmpty = mainNumbers.findIndex(n => n === 0);
    if (firstEmpty !== -1) {
      updateNumberAt(firstEmpty, val);
    }
  };

  const isOz = game === 'Oz Lotto';
  const isTatts = game === 'Tatts Lotto';
  const brandColor = isOz ? 'text-emerald-600' : isTatts ? 'text-red-600' : 'text-indigo-600';
  const brandBg = isOz ? 'bg-emerald-50 dark:bg-emerald-500/10' : isTatts ? 'bg-red-50 dark:bg-red-500/10' : 'bg-indigo-50 dark:bg-indigo-500/10';
  const brandBall = isOz ? 'bg-emerald-500' : isTatts ? 'bg-red-500' : 'bg-indigo-600';
  const brandBorder = isOz ? 'border-emerald-200' : isTatts ? 'border-red-200' : 'border-indigo-200';

  const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
  );

  const mainMax = game === 'Oz Lotto' ? OZ_MAX : game === 'Powerball' ? PB_MAX : TATTS_MAX;
  const gridNumbers = Array.from({ length: mainMax }, (_, i) => i + 1);
  const pbNumbers = Array.from({ length: PB_BALL_MAX }, (_, i) => i + 1);

  return (
    <div className="group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 animate-in fade-in zoom-in-95">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-[10px] sm:text-xs shadow-inner ${brandBg} ${brandColor} border border-black/5`}>
            {displayIndex}
          </div>
          <div className="flex sm:hidden items-center gap-2">
            <button onClick={() => setShowGrid(!showGrid)} className={`p-2 rounded-lg border font-black text-[9px] uppercase tracking-widest transition-all ${showGrid ? `${brandBall} text-white border-transparent shadow-lg` : 'bg-gray-50 dark:bg-white/5 text-gray-400 border-gray-100 dark:border-white/10'}`}>
              {showGrid ? 'Close' : 'Pick'}
            </button>
            <button onClick={handleQuickPick} className={`p-2 rounded-lg ${brandBg} ${brandColor} transition-all text-[9px] font-black uppercase tracking-widest border border-black/5`}>Auto</button>
            <button onClick={() => onDeleteLine(lineId)} className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-100 dark:border-red-500/20"><TrashIcon /></button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center flex-grow justify-center sm:justify-start">
          {activeNumbers.map((num, idx) => {
            const isPowerballSlot = game === 'Powerball' && idx === 7;
            const max = isPowerballSlot ? PB_BALL_MAX : mainMax;
            
            return (
              <div key={idx} className="relative group/ball">
                <input
                  type="number"
                  min="1"
                  max={max}
                  value={num || ''}
                  placeholder={isPowerballSlot ? "PB" : "-"}
                  onBlur={(e) => {
                    let v = parseInt(e.target.value) || 0;
                    if (v > max) v = max;
                    updateNumberAt(idx, v);
                  }}
                  onChange={(e) => {
                    let v = parseInt(e.target.value) || 0;
                    if (v > max) v = max;
                    updateNumberAt(idx, v);
                  }}
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full text-center font-black text-xs sm:text-sm transition-all focus:ring-4 focus:outline-none shadow-md border-b-4 border-black/10
                    ${num > 0 
                      ? (isPowerballSlot ? 'bg-amber-400 text-amber-950 border-amber-600 focus:ring-amber-200' : `${brandBall} text-white border-black/20 focus:ring-indigo-200`)
                      : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-white/10 focus:ring-gray-200'
                    }
                    ${errorIndex === idx ? 'animate-bounce !bg-red-500' : ''}
                  `}
                />
              </div>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => setShowGrid(!showGrid)} className={`p-2.5 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${showGrid ? `${brandBall} text-white border-transparent shadow-lg` : 'bg-gray-50 dark:bg-white/5 text-gray-400 border-gray-100 dark:border-white/10 hover:bg-gray-100'}`}>
            {showGrid ? 'Close' : 'Pick'}
          </button>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button onClick={handleQuickPick} className={`p-2.5 rounded-xl ${brandBg} ${brandColor} hover:brightness-95 transition-all text-[10px] font-black uppercase tracking-widest border border-black/5 shadow-sm`}>Auto</button>
            <button onClick={() => onDeleteLine(lineId)} className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 transition-all border border-red-100 dark:border-red-500/20 shadow-sm" title="Delete Set"><TrashIcon /></button>
          </div>
        </div>
      </div>

      {showGrid && (
        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5 animate-in slide-in-from-top-4 duration-300">
          <div className="mb-4 flex justify-between items-center px-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Select Numbers</p>
            <button onClick={() => onNumbersChange(lineId, new Array(activeNumbers.length).fill(0))} className="text-[9px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest">Clear</button>
          </div>
          <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
            {gridNumbers.map(n => {
              const isSelected = activeNumbers.slice(0, game === 'Powerball' ? 7 : undefined).includes(n);
              return <button key={n} onClick={() => handleGridClick(n)} className={`aspect-square rounded-xl text-xs font-black transition-all transform active:scale-90 shadow-sm border-b-2 ${isSelected ? `${brandBall} text-white border-black/20 scale-105 shadow-md` : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10'}`}>{n}</button>;
            })}
          </div>
          {game === 'Powerball' && (
            <div className="mt-8">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-4 px-2">Select Powerball</p>
              <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
                {pbNumbers.map(n => {
                  const isSelected = activeNumbers[7] === n;
                  return <button key={`pb-${n}`} onClick={() => updateNumberAt(7, n)} className={`aspect-square rounded-xl text-xs font-black transition-all transform active:scale-90 shadow-sm border-b-2 ${isSelected ? 'bg-amber-400 text-amber-950 border-amber-600 scale-105 shadow-md' : 'bg-amber-50/50 dark:bg-amber-500/5 text-amber-600/40 dark:text-amber-400/40 border-amber-100/50 dark:border-white/5 hover:bg-amber-100/50'}`}>{n}</button>;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
