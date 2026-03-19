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
  maxSlots?: number;
  minRange?: number;
  maxRange?: number;
}

export default function LottoLinePicker({ 
  lineId, 
  displayIndex, 
  selectedNumbers, 
  onNumbersChange, 
  onDeleteLine,
  game = 'Oz Lotto',
  maxSlots,
  minRange = 1,
  maxRange
}: LottoLinePickerProps) {
  const OZ_MAX = 47;
  const PB_MAX = 35;
  const TATTS_MAX = 45;

  const isPB = game === 'Powerball';
  const mainRequired = maxSlots || (isPB ? 7 : (game === 'Oz Lotto' ? 7 : 6));
  const effectiveMax = maxRange || (isPB ? PB_MAX : (game === 'Oz Lotto' ? OZ_MAX : TATTS_MAX));

  // 항상 mainNumbers를 정의
  const mainNumbers = Array.from({ length: effectiveMax }, (_, i) => i + minRange);

  const isOz = game === 'Oz Lotto';
  const isTatts = game === 'Tatts Lotto';
  const brandColor = isOz ? 'text-emerald-600' : isTatts ? 'text-red-600' : 'text-indigo-600';
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
      } else if (mainPart.length < mainRequired) {
        mainPart = [...mainPart, n].sort((a, b) => a - b);
      }
      onNumbersChange(lineId, mainPart);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
        {mainNumbers.map(n => {
          const isSelected = selectedNumbers.includes(n);
          return (
            <button key={n} type="button" onClick={() => handleMainToggle(n)} className={`aspect-square rounded-xl text-[10px] sm:text-xs font-black transition-all transform active:scale-90 border-b-[3px] ${isSelected ? `${brandBall} text-white border-black/20 scale-110 shadow-lg` : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-white/5 hover:bg-gray-50'}`}>
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
