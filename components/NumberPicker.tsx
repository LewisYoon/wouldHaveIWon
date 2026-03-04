// lotto-project/components/NumberPicker.tsx (Multi-Line Manager with Supabase Support)
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateQuickPick, compareNumbers } from '../lib/lotto-utils';
import LottoLinePicker from './LottoLinePicker';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const MAX_TOTAL_LINES = 100;
const MAX_SELECTIONS_PER_LINE = 7;
const LOCAL_STORAGE_CURRENT_LINES_KEY = 'lottoCurrentLines';
const LOCAL_STORAGE_WINNING_HISTORY_KEY = 'lottoWinningHistory';

type LottoLine = {
  id: string;
  numbers: number[];
};

type WinningResult = {
  id: string;
  numbers: number[];
  drawDate: string;
  prizeTier: string;
  mainMatchesCount: number;
  bonusMatchesCount: number;
  createdAt?: string;
};

interface DrawResult {
  game: string;
  drawDate: string;
  numbers: number[];
  bonus: number[];
  prizes: Record<string, number>;
}

interface NumberPickerProps {
  onCheckAllResults: (allLines: number[][]) => void;
  onClearAll: () => void;
  resultsRef: React.RefObject<HTMLDivElement | null>;
  drawResult: DrawResult | null;
}

export default function NumberPicker({ onCheckAllResults, onClearAll, resultsRef, drawResult }: NumberPickerProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [lines, setLines] = useState<LottoLine[]>([]);
  const [winningHistory, setWinningHistory] = useState<WinningResult[]>([]);
  const [quickPickQuantity, setQuickPickQuantity] = useState<number>(1);
  const [showHistory, setShowHistory] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const uniqueIdCounter = useRef(0);

  const handleAddLine = useCallback((initialNumbers: number[] = []) => {
    setLines(prevLines => {
      if (prevLines.length >= MAX_TOTAL_LINES) {
        alert(`Cannot add more than ${MAX_TOTAL_LINES} sets.`);
        return prevLines;
      }
      const newId = (uniqueIdCounter.current++).toString();
      return [...prevLines, { id: newId, numbers: initialNumbers }];
    });
  }, []);

  // Load data from Supabase or LocalStorage
  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      if (user) {
        // Load winning history from Supabase
        const { data, error } = await supabase
          .from('simulator_history')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching winning history:", error);
        } else if (data) {
          const history = data.flatMap(item => Array.isArray(item.lines) ? item.lines : [item.lines]);
          setWinningHistory(history);
        }
        
        const storedCurrentLines = localStorage.getItem(LOCAL_STORAGE_CURRENT_LINES_KEY);
        if (storedCurrentLines) {
          try {
            const loadedLines: LottoLine[] = JSON.parse(storedCurrentLines);
            setLines(loadedLines.map(l => ({ ...l, id: (uniqueIdCounter.current++).toString() })));
          } catch (e) {
            handleAddLine();
          }
        } else {
          handleAddLine();
        }
      } else {
        const storedCurrentLines = localStorage.getItem(LOCAL_STORAGE_CURRENT_LINES_KEY);
        if (storedCurrentLines) {
          try {
            const loadedLines: LottoLine[] = JSON.parse(storedCurrentLines);
            setLines(loadedLines.map(l => ({ ...l, id: (uniqueIdCounter.current++).toString() })));
          } catch (e) {
            handleAddLine();
          }
        } else {
          handleAddLine();
        }

        const storedWinningHistory = localStorage.getItem(LOCAL_STORAGE_WINNING_HISTORY_KEY);
        if (storedWinningHistory) {
          try {
            setWinningHistory(JSON.parse(storedWinningHistory));
          } catch (e) {}
        }
      }
      setIsDataLoading(false);
    };

    if (!isAuthLoading) {
      loadData();
    }
  }, [user, isAuthLoading, handleAddLine]);

  // Persist current lines to LocalStorage
  useEffect(() => {
    if (lines.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_CURRENT_LINES_KEY, JSON.stringify(lines));
    }
  }, [lines]);

  const handleDeleteLine = (idToDelete: string) => {
    setLines(prevLines => {
      const updatedLines = prevLines.filter(line => line.id !== idToDelete);
      if (updatedLines.length === 0) {
        setTimeout(() => handleAddLine(), 0);
        return [];
      }
      return updatedLines;
    });
  };

  const handleNumbersChange = (id: string, newNumbers: number[]) => {
    setLines(prevLines =>
      prevLines.map(line => (line.id === id ? { ...line, numbers: newNumbers } : line))
    );
  };

  const handleClearAllCurrentLines = () => {
    setLines([]);
    uniqueIdCounter.current = 0;
    handleAddLine();
    onClearAll();
  };

  const handleMultiQuickPick = () => {
    setLines(prevLines => {
      if (prevLines.length + quickPickQuantity > MAX_TOTAL_LINES) {
        alert(`Adding ${quickPickQuantity} Quick Picks would exceed the maximum of ${MAX_TOTAL_LINES} sets.`);
        return prevLines;
      }

      const newQuickPicks: LottoLine[] = [];
      for (let i = 0; i < quickPickQuantity; i++) {
        const uniquePick = generateQuickPick();
        const newId = (uniqueIdCounter.current++).toString();
        newQuickPicks.push({ id: newId, numbers: uniquePick });
      }
      return [...prevLines, ...newQuickPicks];
    });
  };

  const handleCheckAllResultsClick = async () => {
    const completeLines = lines.filter(line => line.numbers.length === MAX_SELECTIONS_PER_LINE);
    if (completeLines.length === 0) {
      alert("Please complete at least one set to check results.");
      return;
    }

    // Automatically find and save winners
    if (drawResult) {
      const currentWinners: WinningResult[] = [];
      completeLines.forEach(line => {
        const result = compareNumbers(line.numbers, drawResult.numbers, drawResult.bonus);
        if (result.prizeTier !== "No Prize") {
          currentWinners.push({
            id: Date.now().toString() + Math.random(),
            numbers: line.numbers,
            drawDate: drawResult.drawDate,
            prizeTier: result.prizeTier,
            mainMatchesCount: result.mainMatchesCount,
            bonusMatchesCount: result.bonusMatchesCount
          });
        }
      });

      if (currentWinners.length > 0) {
        if (user) {
          await supabase.from('simulator_history').insert({ user_id: user.id, lines: currentWinners });
        }
        const updatedHistory = [...currentWinners, ...winningHistory];
        setWinningHistory(updatedHistory);
        if (!user) {
          localStorage.setItem(LOCAL_STORAGE_WINNING_HISTORY_KEY, JSON.stringify(updatedHistory));
        }
      }
    }

    onCheckAllResults(completeLines.map(line => line.numbers));
    resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteHistoryItem = async (idToDelete: string) => {
    const updated = winningHistory.filter(item => item.id !== idToDelete);
    setWinningHistory(updated);
    if (!user) {
      localStorage.setItem(LOCAL_STORAGE_WINNING_HISTORY_KEY, JSON.stringify(updated));
    }
  };

  const handleClearAllHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all winning history? This cannot be undone.")) return;

    if (user) {
      await supabase.from('simulator_history').delete().eq('user_id', user.id);
    }

    setWinningHistory([]);
    localStorage.removeItem(LOCAL_STORAGE_WINNING_HISTORY_KEY);
    setShowHistory(false);
  };

  return (
    <div className="p-4 bg-gray-50 shadow-lg rounded-lg max-w-2xl mx-auto my-8 pb-24">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Your Lotto Ticket</h2>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-3">Your Sets ({lines.length}/{MAX_TOTAL_LINES})</h3>
        {isDataLoading ? (
          <p className="text-center text-gray-400 py-4">Loading sets...</p>
        ) : lines.length === 0 && (
          <p className="text-gray-500 italic text-center">Click &quot;Add Set&quot; or &quot;Quick Pick&quot; to start.</p>
        )}
        <div className="space-y-4">
          {lines.map((line, index) => (
            <LottoLinePicker
              key={line.id}
              lineId={line.id}
              displayIndex={index + 1}
              selectedNumbers={line.numbers}
              onNumbersChange={handleNumbersChange}
              onDeleteLine={handleDeleteLine}
            />
          ))}
        </div>
      </div>

      {/* Sticky Footer */}
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
            onClick={() => setShowHistory(!showHistory)}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors duration-200 ${showHistory ? 'bg-gray-700 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
          >
            {showHistory ? 'Close History' : `Wins (${winningHistory.length})`}
          </button>

          <button
            onClick={handleClearAllCurrentLines}
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

      {/* History UI */}
      {showHistory && (
        <div className="mt-8 p-4 bg-white shadow-lg rounded-lg border border-teal-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-800 text-left">Winning History</h3>
            {winningHistory.length > 0 && (
              <button
                onClick={handleClearAllHistory}
                className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-tighter"
              >
                Clear All
              </button>
            )}
          </div>
          
          {winningHistory.length === 0 ? (
            <p className="text-gray-500 italic text-center py-8">No winning results recorded yet.</p>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {winningHistory.map((item, idx) => (
                <div key={item.id || idx} className="border border-green-200 rounded-lg p-4 bg-green-50 relative group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Draw: {item.drawDate}</p>
                      <p className="text-lg font-black text-gray-800">{item.prizeTier}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteHistoryItem(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete entry"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="flex flex-wrap gap-1">
                      {item.numbers.map(n => (
                        <span key={n} className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-green-200 text-[10px] font-bold text-gray-700">
                          {n}
                        </span>
                      ))}
                    </div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase">
                      {item.mainMatchesCount}M + {item.bonusMatchesCount}S
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
