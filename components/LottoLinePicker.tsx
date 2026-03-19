// lotto-project/components/LottoLinePicker.tsx
'use client';

import React from 'react';

interface LottoLinePickerProps {
  lineId: string;
  displayIndex: number;
  selectedNumbers: number[];
  onNumbersChange: (id: string, numbers: number[]) => void;
  onDeleteLine?: (id: string) => void;
  game?: 'Oz Lotto' | 'Powerball' | 'Tatts Lotto';
  isBonus?: boolean;
  maxSlots?: number;
}

const TrashIcon = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);

export default function LottoLinePicker({ 
  lineId, 
  displayIndex, 
  selectedNumbers, 
  onNumbersChange, 
  onDeleteLine,
  game = 'Oz Lotto',
  isBonus = false,
  maxSlots
}: LottoLinePickerProps) {
  const OZ_MAX = 47;
  const PB_MAX = 35;
  const PB_BALL_MAX = 20;
  const TATTS_MAX = 45;

  const isPB = game === 'Powerball';
  
  // Selection limit logic
  let limit = 7;
  if (game === 'Tatts Lotto') limit = 6;
  
  if (isBonus) {
    if (game === 'Powerball') limit = 1;
    else if (game === 'Oz Lotto') limit = 3;
    else if (game === 'Tatts Lotto') limit = 2;
  }
  
  // Override with maxSlots if provided
  if (maxSlots !== undefined) limit = maxSlots;

  const mainMax = isPB ? PB_MAX : (game === 'Oz Lotto' ? OZ_MAX : TATTS_MAX);
  const mainNumbers = Array.from({ length: mainMax }, (_, i) => i + 1);
  const pbNumbers = Array.from({ length: PB_BALL_MAX }, (_, i) => i + 1);

  const isOz = game === 'Oz Lotto';
  const isTatts = game === 'Tatts Lotto';
  const brandBall = isOz ? 'bg-emerald-500' : isTatts ? 'bg-red-500' : 'bg-indigo-600';

  const handleMainToggle = (n: number) => {
    let next = [...selectedNumbers];
    if (isPB) {
      let mainPart = next.slice(0, 7).filter(x => x > 0);
      const pbPart = next[7] || 0;
      if (mainPart.includes(n)) {
        mainPart = mainPart.filter(num => num !== n);
      } else if (mainPart.length < 7) {
        mainPart = [...mainPart, n].sort((a, b) => a - b);
      }
      const result = [...mainPart];
      while (result.length < 7) result.push(0);
      result[7] = pbPart;
      onNumbersChange(lineId, result);
    } else {
      let mainPart = next.filter(x => x > 0);
      if (mainPart.includes(n)) {
        mainPart = mainPart.filter(num => num !== n);
      } else if (mainPart.length < limit) {
        mainPart = [...mainPart, n].sort((a, b) => a - b);
      }
      onNumbersChange(lineId, mainPart);
    }
  };

  const handlePBToggle = (n: number) => {
    let next = [...selectedNumbers];
    const mainPart = next.slice(0, 7);
    const result = [...mainPart, n];
    onNumbersChange(lineId, result);
  };

  if (isBonus) {
    const bonusMax = isPB ? PB_BALL_MAX : mainMax;
    const bonusRange = Array.from({ length: bonusMax }, (_, i) => i + 1);
    const bonusBallColor = 'bg-amber-400';

    return (
      <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
        {bonusRange.map(n => {
          const isSelected = selectedNumbers.includes(n);
          return (
            <button 
              key={n} 
              type="button" 
              onClick={() => {
                let next = [...selectedNumbers].filter(x => x > 0);
                if (next.includes(n)) next = next.filter(x => x !== n);
                else if (next.length < limit) next = [...next, n].sort((a, b) => a - b);
                onNumbersChange(lineId, next);
              }}
              className={`aspect-square rounded-xl text-[10px] sm:text-xs font-black transition-all transform active:scale-90 border-b-[3px] ${isSelected ? `${bonusBallColor} text-amber-950 border-black/20 scale-110 shadow-lg` : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-white/5 hover:bg-gray-50'}`}
            >
              {n}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all group relative">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-black text-gray-400 shadow-inner">{displayIndex}</span>
          <div className="flex gap-1.5 sm:gap-2">
            {(isPB ? selectedNumbers.slice(0, 7) : selectedNumbers).map((n, i) => (
              <div key={i} className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-500 ${n > 0 ? brandBall : 'bg-gray-200 dark:bg-white/10'}`} />
            ))}
            {isPB && (
              <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-500 ${selectedNumbers[7] > 0 ? 'bg-amber-400' : 'bg-gray-200 dark:bg-white/10'}`} />
            )}
          </div>
        </div>
        {onDeleteLine && (
          <button onClick={() => onDeleteLine(lineId)} className="text-gray-300 hover:text-red-500 transition-all p-2 opacity-0 group-hover:opacity-100"><TrashIcon size={16} /></button>
        )}
      </div>

      <div className="space-y-6 sm:space-y-8">
        <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5 sm:gap-2">
          {mainNumbers.map(n => {
            const isSelected = (isPB ? selectedNumbers.slice(0, 7) : selectedNumbers).includes(n);
            return (
              <button 
                key={n} 
                type="button" 
                onClick={() => handleMainToggle(n)} 
                className={`aspect-square rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all transform active:scale-90 border-b-[3px] ${isSelected ? `${brandBall} text-white border-black/20 scale-110 shadow-lg` : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-white/5 hover:bg-gray-50'}`}
              >
                {n}
              </button>
            );
          })}
        </div>

        {isPB && (
          <div className="pt-4 sm:pt-6 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
              <span className="text-[9px] sm:text-[10px] font-black text-amber-500 uppercase tracking-widest">Powerball</span>
              <span className="text-[8px] font-bold text-gray-400 uppercase">Select 1</span>
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5 sm:gap-2">
              {pbNumbers.map(n => {
                const isSelected = selectedNumbers[7] === n;
                return (
                  <button 
                    key={`pb-${n}`} 
                    type="button" 
                    onClick={() => handlePBToggle(n)} 
                    className={`aspect-square rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all transform active:scale-90 border-b-[3px] ${isSelected ? `bg-amber-400 text-amber-950 border-black/20 scale-110 shadow-lg` : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-white/5 hover:bg-gray-50'}`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
