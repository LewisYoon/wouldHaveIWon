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
  game?: 'Oz Lotto' | 'Powerball';
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
  const mainMax = isOz ? 47 : 35;
  const totalRequired = isOz ? 7 : 8; // 7 main + 1 powerball for PB

  // Dynamic colors based on game
  const primaryColor = isOz ? 'bg-emerald-600' : 'bg-indigo-600';
  const ringColor = isOz ? 'ring-emerald-400' : 'ring-indigo-400';
  const shadowColor = isOz ? 'shadow-emerald-100' : 'shadow-indigo-100';
  const hoverBg = isOz ? 'hover:bg-emerald-600' : 'hover:bg-indigo-600';
  const lightBg = isOz ? 'bg-emerald-50' : 'bg-indigo-50';
  const textColor = isOz ? 'text-emerald-600' : 'text-indigo-600';

  const [internalSelectedNumbers, setInternalSelectedNumbers] = useState<number[]>(selectedNumbers);

  useEffect(() => {
    // If game changes and current numbers are invalid for new game, clear them
    setInternalSelectedNumbers(selectedNumbers);
  }, [selectedNumbers, game]);

  const handleMainClick = (num: number) => {
    let newSelection: number[] = [...internalSelectedNumbers];
    const mainNumbers = isOz ? internalSelectedNumbers : internalSelectedNumbers.slice(0, 7);
    const powerball = isOz ? undefined : internalSelectedNumbers[7];

    if (mainNumbers.includes(num)) {
      newSelection = newSelection.filter((n, i) => isOz ? n !== num : (i < 7 ? n !== num : true));
    } else if (mainNumbers.length < 7) {
      if (isOz) {
        newSelection = [...mainNumbers, num].sort((a,b) => a-b);
      } else {
        const updatedMain = [...mainNumbers, num].sort((a,b) => a-b);
        newSelection = powerball !== undefined ? [...updatedMain, powerball] : updatedMain;
      }
    } else {
      return;
    }
    onNumbersChange(lineId, newSelection);
  };

  const handlePBClick = (num: number) => {
    if (isOz) return;
    const newSelection = [...internalSelectedNumbers];
    if (newSelection.length < 7) {
      // Fill empty mains first if needed, or just append to end
      while (newSelection.length < 7) newSelection.push(0);
    }
    newSelection[7] = num;
    onNumbersChange(lineId, newSelection);
  };

  const handleQuickPick = () => {
    const newQuickPick = generateQuickPick(game);
    onNumbersChange(lineId, newQuickPick);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className={`w-8 h-8 ${primaryColor} text-white rounded-lg flex items-center justify-center font-black text-xs shadow-lg ${shadowColor} italic`}>#{displayIndex}</span>
          <h3 className="font-black text-gray-900 uppercase tracking-tighter text-sm">{game} Selection</h3>
        </div>
        <button onClick={() => onDeleteLine(lineId)} className="text-gray-300 hover:text-red-500 transition-colors p-1">🗑️</button>
      </div>

      {/* Main Grid */}
      <div className="space-y-6">
        <div>
          <p className={`text-[10px] font-black ${isOz ? 'text-emerald-600' : 'text-gray-400'} uppercase tracking-widest mb-3`}>Main Numbers (Pick 7)</p>
          <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
            {Array.from({ length: mainMax }, (_, i) => i + 1).map(num => {
              const isSelected = (isOz ? internalSelectedNumbers : internalSelectedNumbers.slice(0, 7)).includes(num);
              return (
                <button
                  key={num}
                  onClick={() => handleMainClick(num)}
                  className={`aspect-square rounded-full flex items-center justify-center font-black text-[10px] transition-all duration-300 ${
                    isSelected ? `${primaryColor} text-white shadow-lg ring-2 ${ringColor} scale-110` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        {!isOz && (
          <div className="animate-in fade-in slide-in-from-left-2">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Powerball (Pick 1)</p>
            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
              {Array.from({ length: 20 }, (_, i) => i + 1).map(num => {
                const isSelected = internalSelectedNumbers[7] === num;
                return (
                  <button
                    key={num}
                    onClick={() => handlePBClick(num)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] transition-all duration-300 ${
                      isSelected ? 'bg-amber-400 text-amber-950 shadow-lg ring-2 ring-amber-300 scale-110' : 'bg-amber-50 text-amber-600/40 hover:bg-amber-100'
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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-4 border-t border-gray-50">
        <div className="flex items-center gap-2">
          {internalSelectedNumbers.filter(n => n > 0).length === totalRequired ? (
            <span className={`flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase bg-emerald-50 px-3 py-1.5 rounded-full ring-1 ring-emerald-100`}>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Set Ready
            </span>
          ) : (
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full">
              Complete your set
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={() => onNumbersChange(lineId, [])} className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest px-4 py-2">Clear</button>
          <button onClick={handleQuickPick} className={`text-[10px] font-black ${lightBg} ${textColor} ${hoverBg} hover:text-white uppercase tracking-widest px-6 py-2 rounded-xl transition-all shadow-sm`}>Quick Pick</button>
        </div>
      </div>
    </div>
  );
}
