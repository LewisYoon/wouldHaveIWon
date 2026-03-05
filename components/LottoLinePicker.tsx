// lotto-project/components/LottoLinePicker.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { generateQuickPick } from '../lib/lotto-utils';

interface LottoLinePickerProps {
  lineId: string;
  displayIndex: number;
  selectedNumbers: number[];
  onNumbersChange: (lineId: string, numbers: number[]) => void;
  onDeleteLine: (lineId: string) => void;
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
  
  const isOz = game === 'Oz Lotto';
  const isTatts = game === 'Tatts Lotto';
  const isPowerball = game === 'Powerball';

  const mainMax = isPowerball ? 35 : isTatts ? 45 : 47;
  const mainRequired = isTatts ? 6 : 7;
  const totalRequired = isPowerball ? 8 : mainRequired;

  const [internalSelectedNumbers, setInternalSelectedNumbers] = useState<number[]>(selectedNumbers);

  useEffect(() => {
    setInternalSelectedNumbers(selectedNumbers);
  }, [selectedNumbers, game]);

  const handleMainClick = (num: number) => {
    let newSelection: number[] = [...internalSelectedNumbers];
    const mainNumbers = isPowerball ? internalSelectedNumbers.slice(0, mainRequired) : internalSelectedNumbers;
    const powerball = isPowerball ? internalSelectedNumbers[mainRequired] : undefined;

    if (mainNumbers.includes(num)) {
      newSelection = newSelection.filter((n, i) => isPowerball ? (i < mainRequired ? n !== num : true) : n !== num);
    } else if (mainNumbers.length < mainRequired) {
      if (isPowerball) {
        const updatedMain = [...mainNumbers, num].sort((a,b) => a-b);
        newSelection = powerball !== undefined ? [...updatedMain, powerball] : updatedMain;
      } else {
        newSelection = [...mainNumbers, num].sort((a,b) => a-b);
      }
    } else {
      return;
    }
    onNumbersChange(lineId, newSelection);
  };

  const handlePBClick = (num: number) => {
    if (!isPowerball) return;
    const newSelection = [...internalSelectedNumbers];
    if (newSelection.length < mainRequired) {
      while (newSelection.length < mainRequired) newSelection.push(0);
    }
    newSelection[mainRequired] = num;
    onNumbersChange(lineId, newSelection);
  };

  const handleQuickPick = () => {
    const newQuickPick = generateQuickPick(game);
    onNumbersChange(lineId, newQuickPick);
  };
  
  const brandBg = isOz ? 'bg-emerald-600' : isTatts ? 'bg-red-600' : 'bg-indigo-600';
  const brandText = isOz ? 'text-emerald-600' : isTatts ? 'text-red-600' : 'text-gray-400 dark:text-gray-500';
  const brandHoverBg = isOz ? 'hover:bg-emerald-600' : isTatts ? 'hover:bg-red-600' : 'hover:bg-indigo-600';
  const brandBgLight = isOz ? 'bg-emerald-50 dark:bg-emerald-500/10' : isTatts ? 'bg-red-50 dark:bg-red-500/10' : 'bg-indigo-50 dark:bg-indigo-500/10';
  const brandTextLight = isOz ? 'text-emerald-600 dark:text-emerald-400' : isTatts ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/10 transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className={`w-8 h-8 ${brandBg} text-white rounded-lg flex items-center justify-center font-black text-xs shadow-lg italic`}>#{displayIndex}</span>
          <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter text-sm">{game} Selection</h3>
        </div>
        <button onClick={() => onDeleteLine(lineId)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors p-1">🗑️</button>
      </div>

      <div className="space-y-6">
        <div>
          <p className={`text-[10px] font-black ${brandText} uppercase tracking-widest mb-3`}>Main Numbers (Pick {mainRequired})</p>
          <div className={`grid gap-1.5 ${isTatts ? 'grid-cols-9' : 'grid-cols-7 sm:grid-cols-10'}`}>
            {Array.from({ length: mainMax }, (_, i) => i + 1).map(num => {
              const isSelected = (isPowerball ? internalSelectedNumbers.slice(0, mainRequired) : internalSelectedNumbers).includes(num);
              return (
                <button
                  key={num}
                  onClick={() => handleMainClick(num)}
                  className={`aspect-square rounded-full flex items-center justify-center font-black text-[10px] transition-all duration-300 ${
                    isSelected 
                      ? `${brandBg} text-white shadow-sm` 
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        {isPowerball && (
          <div className="animate-in fade-in slide-in-from-left-2">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Powerball (Pick 1)</p>
            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
              {Array.from({ length: 20 }, (_, i) => i + 1).map(num => {
                const isSelected = internalSelectedNumbers[mainRequired] === num;
                return (
                  <button
                    key={num}
                    onClick={() => handlePBClick(num)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] transition-all duration-300 ${
                      isSelected ? 'bg-amber-400 text-amber-950 shadow-lg ring-2 ring-amber-300 scale-110' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600/40 dark:text-amber-400/40 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-4 border-t border-gray-50 dark:border-white/5">
        <div className="flex items-center gap-2">
          {internalSelectedNumbers.filter(n => n > 0).length === totalRequired ? (
            <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full ring-1 ring-emerald-100 dark:ring-emerald-500/20">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Set Ready
            </span>
          ) : (
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full">
              Complete your set
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={() => onNumbersChange(lineId, [])} className="text-[10px] font-black text-gray-400 dark:text-gray-500 hover:text-red-500 uppercase tracking-widest px-4 py-2">Clear</button>
          <button onClick={handleQuickPick} className={`text-[10px] font-black ${brandBgLight} ${brandTextLight} ${brandHoverBg} hover:text-white uppercase tracking-widest px-6 py-2 rounded-xl transition-all shadow-sm`}>Quick Pick</button>
        </div>
      </div>
    </div>
  );
}
