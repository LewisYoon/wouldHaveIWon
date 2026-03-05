// lotto-project/components/LottoLinePicker.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { generateQuickPick } from '../lib/lotto-utils';

const NUMBER_RANGE_START = 1;
const NUMBER_RANGE_END = 47;
const MAX_SELECTIONS = 7;

interface LottoLinePickerProps {
  lineId: string;
  displayIndex: number;
  selectedNumbers: number[];
  onNumbersChange: (lineId: string, numbers: number[]) => void;
  onDeleteLine: (lineId: string) => void;
}

export default function LottoLinePicker({ lineId, displayIndex, selectedNumbers, onNumbersChange, onDeleteLine }: LottoLinePickerProps) {
  const allNumbers = Array.from({ length: NUMBER_RANGE_END }, (_, i) => i + NUMBER_RANGE_START);
  const [internalSelectedNumbers, setInternalSelectedNumbers] = useState<number[]>(selectedNumbers);

  useEffect(() => {
    setInternalSelectedNumbers([...selectedNumbers].sort((a, b) => a - b));
  }, [selectedNumbers]);

  const handleNumberClick = (num: number) => {
    setInternalSelectedNumbers(prevSelected => {
      let newSelection: number[];
      if (prevSelected.includes(num)) {
        newSelection = prevSelected.filter(n => n !== num);
      } else if (prevSelected.length < MAX_SELECTIONS) {
        newSelection = [...prevSelected, num];
      } else {
        return prevSelected;
      }
      onNumbersChange(lineId, newSelection);
      return newSelection;
    });
  };

  const handleClear = () => {
    onNumbersChange(lineId, []);
    setInternalSelectedNumbers([]);
  };

  const handleQuickPick = () => {
    const newQuickPick = generateQuickPick();
    onNumbersChange(lineId, newQuickPick);
    setInternalSelectedNumbers(newQuickPick);
  };

  const isSetComplete = internalSelectedNumbers.length === MAX_SELECTIONS;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-100 italic">#{displayIndex}</span>
          <h3 className="font-black text-gray-900 uppercase tracking-tighter text-sm">Lucky Selection</h3>
        </div>
        <button
          onClick={() => onDeleteLine(lineId)}
          className="text-gray-300 hover:text-red-500 transition-colors p-1"
          title="Clear set"
        >
          🗑️
        </button>
      </div>

      <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5 mb-8">
        {allNumbers.map(num => {
          const isSelected = internalSelectedNumbers.includes(num);
          const isDisabled = !isSelected && internalSelectedNumbers.length >= MAX_SELECTIONS;
          return (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              disabled={isDisabled}
              className={`
                aspect-square rounded-full flex items-center justify-center
                font-black text-[10px] transition-all duration-300 transform active:scale-90
                ${isSelected
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-400 ring-offset-1 scale-110'
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100'
                }
                ${isDisabled ? 'opacity-20 grayscale' : 'cursor-pointer'}
              `}
            >
              {num}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-50">
        <div className="flex items-center gap-2">
          {isSetComplete ? (
            <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase bg-emerald-50 px-3 py-1.5 rounded-full ring-1 ring-emerald-100">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Set Validated
            </span>
          ) : (
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              Pick {MAX_SELECTIONS - internalSelectedNumbers.length} More
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleClear}
            className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest px-4 py-2 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleQuickPick}
            className="text-[10px] font-black bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white uppercase tracking-widest px-6 py-2 rounded-xl transition-all shadow-sm"
          >
            Quick Pick
          </button>
        </div>
      </div>
    </div>
  );
}
