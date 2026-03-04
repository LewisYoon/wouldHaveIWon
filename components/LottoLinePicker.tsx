// lotto-project/components/LottoLinePicker.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { generateQuickPick } from '../lib/lotto-utils'; // Use relative import

const NUMBER_RANGE_START = 1;
const NUMBER_RANGE_END = 47
const MAX_SELECTIONS = 7;

interface LottoLinePickerProps {
  lineId: string;
  displayIndex: number; // New prop for display
  selectedNumbers: number[];
  onNumbersChange: (lineId: string, numbers: number[]) => void;
  onDeleteLine: (lineId: string) => void;
}

export default function LottoLinePicker({ lineId, displayIndex, selectedNumbers, onNumbersChange, onDeleteLine }: LottoLinePickerProps) {
  const allNumbers = Array.from({ length: NUMBER_RANGE_END }, (_, i) => i + NUMBER_RANGE_START);

  // Use an internal state for selected numbers to manage clicks before propagating
  const [internalSelectedNumbers, setInternalSelectedNumbers] = useState<number[]>(selectedNumbers);

  // Update internal state when prop changes (e.g., parent quick-picks or edits)
  useEffect(() => {
    setInternalSelectedNumbers([...selectedNumbers].sort((a, b) => a - b));
  }, [selectedNumbers]);

  const handleNumberClick = (num: number) => {
    setInternalSelectedNumbers(prevSelected => {
      let newSelection: number[];
      if (prevSelected.includes(num)) {
        // Deselect number
        newSelection = prevSelected.filter(n => n !== num);
      } else if (prevSelected.length < MAX_SELECTIONS) {
        // Select number
        newSelection = [...prevSelected, num];
      } else {
        // Max selections reached, do nothing
        return prevSelected;
      }
      onNumbersChange(lineId, newSelection); // Propagate change to parent
      return newSelection;
    });
  };

  const handleClear = () => {
    onNumbersChange(lineId, []); // Propagate change to parent
    setInternalSelectedNumbers([]);
  };

  const handleQuickPick = () => {
    const newQuickPick = generateQuickPick();
    onNumbersChange(lineId, newQuickPick); // Propagate change to parent
    setInternalSelectedNumbers(newQuickPick);
  };

  const isSetComplete = internalSelectedNumbers.length === MAX_SELECTIONS;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-md"> {/* Refined card styling */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Set {displayIndex}</h3>
        <button
          onClick={() => onDeleteLine(lineId)}
          className="text-red-500 hover:text-red-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          Delete
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 mb-4">
        {allNumbers.map(num => {
          const isSelected = internalSelectedNumbers.includes(num);
          const isDisabled = !isSelected && internalSelectedNumbers.length >= MAX_SELECTIONS;
          return (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              disabled={isDisabled}
              className={`
                w-9 h-9 rounded-full flex items-center justify-center
                font-semibold text-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
                ${isSelected
                  ? 'bg-blue-600 text-white shadow-md focus:ring-blue-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-blue-100 focus:ring-gray-300' // Softer unselected background
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {num}
            </button>
          );
        })}
      </div>

      <div className="mb-3 text-center">
        <p className="text-gray-700 text-md font-medium">
          Selected: {internalSelectedNumbers.length > 0 ? internalSelectedNumbers.join(', ') : 'None'}
          {isSetComplete && <span className="text-green-600 ml-2">(Complete)</span>}
        </p>
        {!isSetComplete && (
          <p className="text-sm text-gray-500">
            (Pick {MAX_SELECTIONS - internalSelectedNumbers.length} more)
          </p>
        )}
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={handleClear}
          className="px-4 py-1.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-200"
        >
          Clear
        </button>
        <button
          onClick={handleQuickPick}
          className="px-4 py-1.5 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200"
        >
          Quick Pick
        </button>
      </div>
    </div>
  );
}
