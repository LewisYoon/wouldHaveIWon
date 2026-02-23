// lotto-project/components/NumberPicker.tsx (now Multi-Line Manager)
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { generateQuickPick } from '../lib/lotto-utils';
import LottoLinePicker from './LottoLinePicker'; // Import the new child component

const MAX_TOTAL_LINES = 100;
const MAX_SELECTIONS_PER_LINE = 7;

type LottoLine = {
  id: string;
  numbers: number[];
};

interface NumberPickerProps {
  onCheckAllResults: (allLines: number[][]) => void;
  onClearAll: () => void; // New prop
  resultsRef: React.RefObject<HTMLDivElement>; // Ref for scrolling
}

export default function NumberPicker({ onCheckAllResults, onClearAll, resultsRef }: NumberPickerProps) {
  const [lines, setLines] = useState<LottoLine[]>([]);
  const [quickPickQuantity, setQuickPickQuantity] = useState<number>(1);
  const nextLineIdCounter = useRef(0); // Renamed to avoid confusion with `line.id`

  // Add an initial empty line when the component mounts
  useEffect(() => {
    if (lines.length === 0) {
      handleAddLine();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const generateUniqueQuickPickLine = (existingLines: LottoLine[]): number[] => {
    let newPick: number[];
    let isUnique = false;
    const existingPicksSets = existingLines.map(line => new Set(line.numbers));

    // Keep generating until a unique set is found or attempt limit reached
    let attempts = 0;
    while (!isUnique && attempts < 1000) { // Limit attempts to prevent infinite loops
      newPick = generateQuickPick(); // Uses the updated generateQuickPick (1-47, 7 numbers)
      const newPickSet = new Set(newPick);

      isUnique = true;
      for (const existingSet of existingPicksSets) {
        // Compare sorted arrays as sets to check for uniqueness
        if (newPick.every(num => existingSet.has(num)) && existingSet.size === newPick.length) {
          isUnique = false;
          break;
        }
      }
      attempts++;
    }

    if (!isUnique) {
      console.warn("Could not generate a unique Quick Pick line after many attempts. Returning potentially non-unique pick.");
      // Fallback to non-unique if too many attempts, or handle error
    }
    return newPick;
  };

  const handleAddLine = (initialNumbers: number[] = []) => {
    if (lines.length >= MAX_TOTAL_LINES) {
      alert(`Cannot add more than ${MAX_TOTAL_LINES} sets.`);
      return;
    }
    const newId = (nextLineIdCounter.current++).toString(); // Simple unique ID
    setLines(prevLines => [...prevLines, { id: newId, numbers: initialNumbers }]);
  };

  const handleDeleteLine = (idToDelete: string) => {
    setLines(prevLines => {
      const updatedLines = prevLines.filter(line => line.id !== idToDelete);
      // If no lines left and not clearing all, add an empty line
      if (updatedLines.length === 0 && prevLines.length > 0) {
        handleAddLine();
        return []; // Return empty array, handleAddLine will update state
      }
      return updatedLines;
    });
  };

  const handleNumbersChange = (id: string, newNumbers: number[]) => {
    setLines(prevLines =>
      prevLines.map(line => (line.id === id ? { ...line, numbers: newNumbers } : line))
    );
  };

  const handleClearAll = () => {
    setLines([]);
    nextLineIdCounter.current = 0; // Reset ID counter
    handleAddLine(); // Add an empty set after clearing
    onClearAll(); // Call the prop to clear results in parent
  };

  const handleMultiQuickPick = () => {
    if (lines.length + quickPickQuantity > MAX_TOTAL_LINES) {
      alert(`Adding ${quickPickQuantity} Quick Picks would exceed the maximum of ${MAX_TOTAL_LINES} sets.`);
      return;
    }

    const newQuickPicks: LottoLine[] = [];
    // Deep copy current lines for uniqueness check to avoid direct state mutation issues
    const currentAndNewLines: LottoLine[] = JSON.parse(JSON.stringify(lines));

    for (let i = 0; i < quickPickQuantity; i++) {
      const uniquePick = generateUniqueQuickPickLine(currentAndNewLines);
      const newId = (nextLineIdCounter.current++).toString();
      const newLottoLine = { id: newId, numbers: uniquePick };
      newQuickPicks.push(newLottoLine);
      currentAndNewLines.push(newLottoLine); // Add to temp array for uniqueness check
    }

    setLines(prevLines => [...prevLines, ...newQuickPicks]);
  };

  const handleCheckAllResultsClick = () => {
    // Filter out incomplete sets before sending to comparison
    const completeLines = lines.filter(line => line.numbers.length === MAX_SELECTIONS_PER_LINE);
    if (completeLines.length === 0) {
      alert("Please complete at least one set to check results.");
      return;
    }
    onCheckAllResults(completeLines.map(line => line.numbers));
    resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="p-4 bg-gray-50 shadow-lg rounded-lg max-w-2xl mx-auto my-8">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Your Lotto Ticket</h2>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-3">Your Sets ({lines.length}/{MAX_TOTAL_LINES})</h3>
        {lines.length === 0 && (
          <p className="text-gray-500 italic text-center">Click "Add Set" or "Quick Pick" to start.</p>
        )}
        <div className="space-y-4">
          {lines.map((line, index) => (
            <LottoLinePicker
              key={line.id}
              lineId={line.id} // Pass actual line ID
              displayIndex={index + 1} // Pass index for display
              selectedNumbers={line.numbers}
              onNumbersChange={handleNumbersChange}
              onDeleteLine={handleDeleteLine}
            />
          ))}
        </div>
      </div>

      {/* Sticky Footer for Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg border-t border-gray-200 z-50">
        <div className="max-w-2xl mx-auto flex flex-wrap justify-center items-center gap-4">
          <button
            onClick={() => handleAddLine()}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            Add Set
          </button>

          <div className="flex items-center gap-2">
            <select
              value={quickPickQuantity}
              onChange={(e) => setQuickPickQuantity(Number(e.target.value))}
              className="w-24 p-2 border border-gray-300 rounded-lg text-center bg-white text-black"
            >
              {[1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(qty => (
                <option key={qty} value={qty}>x{qty}</option>
              ))}
            </select>
            <button
              onClick={handleMultiQuickPick}
              className="px-6 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors duration-200"
            >
              Quick Pick
            </button>
          </div>

          <button
            onClick={handleClearAll}
            className="px-6 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors duration-200"
          >
            Clear All
          </button>
          <button
            onClick={handleCheckAllResultsClick}
            className="px-8 py-3 rounded-lg bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Check All Results
          </button>
        </div>
      </div>
    </div>
  );
}
