// lotto-project/components/NumberPicker.tsx (Multi-Game & Volume Optimized)
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateQuickPick, compareNumbers } from '../lib/lotto-utils';
import LottoLinePicker from './LottoLinePicker';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const MAX_TOTAL_LINES = 1000;
const OZ_REQUIRED = 7;
const PB_REQUIRED = 8; // 7 main + 1 powerball

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
  game: string;
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
  game?: 'Oz Lotto' | 'Powerball';
}

export default function NumberPicker({ 
  onCheckAllResults, 
  onClearAll, 
  resultsRef, 
  drawResult,
  game = 'Oz Lotto'
}: NumberPickerProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [lines, setLines] = useState<LottoLine[]>([]);
  const [winningHistory, setWinningHistory] = useState<WinningResult[]>([]);
  const [quickPickQuantity, setQuickPickQuantity] = useState<number>(10);
  const [showHistory, setShowHistory] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const uniqueIdCounter = useRef(0);

  const storageCurrentKey = `lottoLines_${game.replace(/\s/g, '')}`;
  const storageHistoryKey = `lottoWins_${game.replace(/\s/g, '')}`;

  const handleAddLine = useCallback((initialNumbers: number[] = []) => {
    setLines(prevLines => {
      if (prevLines.length >= MAX_TOTAL_LINES) {
        alert(`Limit reached (${MAX_TOTAL_LINES} sets).`);
        return prevLines;
      }
      const newId = (uniqueIdCounter.current++).toString();
      return [...prevLines, { id: newId, numbers: initialNumbers }];
    });
  }, []);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      if (user) {
        const { data } = await supabase
          .from('simulator_history')
          .select('*')
          .eq('game', game)
          .order('created_at', { ascending: false });
        
        if (data) {
          setWinningHistory(data.flatMap(item => Array.isArray(item.lines) ? item.lines : [item.lines]));
        }
      } else {
        const storedWins = localStorage.getItem(storageHistoryKey);
        if (storedWins) setWinningHistory(JSON.parse(storedWins));
      }

      const storedLines = localStorage.getItem(storageCurrentKey);
      if (storedLines) {
        try {
          const loaded = JSON.parse(storedLines);
          setLines(loaded.map((l: any) => ({ ...l, id: (uniqueIdCounter.current++).toString() })));
        } catch (e) { handleAddLine(); }
      } else {
        setLines([]);
        handleAddLine();
      }
      setIsDataLoading(false);
    };

    if (!isAuthLoading) loadData();
  }, [user, isAuthLoading, game, handleAddLine, storageCurrentKey, storageHistoryKey]);

  // Sync current lines to local storage
  useEffect(() => {
    if (lines.length > 0) {
      localStorage.setItem(storageCurrentKey, JSON.stringify(lines));
    }
  }, [lines, storageCurrentKey]);

  const handleNumbersChange = (id: string, newNumbers: number[]) => {
    setLines(prevLines => prevLines.map(line => (line.id === id ? { ...line, numbers: newNumbers } : line)));
  };

  const handleMultiQuickPick = () => {
    setLines(prevLines => {
      if (prevLines.length + quickPickQuantity > MAX_TOTAL_LINES) return prevLines;
      const newPicks = Array.from({ length: quickPickQuantity }, () => ({
        id: (uniqueIdCounter.current++).toString(),
        numbers: generateQuickPick(game)
      }));
      if (newPicks.length > 5) setShowAllDetails(false);
      return [...prevLines, ...newPicks];
    });
  };

  const handleCheckAllResultsClick = async () => {
    const required = game === 'Oz Lotto' ? OZ_REQUIRED : PB_REQUIRED;
    const completeLines = lines.filter(line => line.numbers.filter(n => n > 0).length === required);
    
    if (completeLines.length === 0) {
      alert(`Please complete at least one set.`);
      return;
    }

    if (drawResult) {
      const currentWinners: WinningResult[] = [];
      completeLines.forEach(line => {
        const result = compareNumbers(line.numbers, drawResult.numbers, drawResult.bonus, game);
        if (result.prizeTier !== "No Prize") {
          currentWinners.push({
            id: Date.now().toString() + Math.random(),
            numbers: line.numbers,
            drawDate: drawResult.drawDate,
            prizeTier: result.prizeTier,
            mainMatchesCount: result.mainMatchesCount,
            bonusMatchesCount: result.bonusMatchesCount,
            game: game
          });
        }
      });

      if (currentWinners.length > 0) {
        if (user) {
          await supabase.from('simulator_history').insert({ user_id: user.id, lines: currentWinners, game: game });
        }
        const updatedHistory = [...currentWinners, ...winningHistory];
        setWinningHistory(updatedHistory);
        if (!user) localStorage.setItem(storageHistoryKey, JSON.stringify(updatedHistory));
      }
    }

    onCheckAllResults(completeLines.map(line => line.numbers));
    resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClearAllHistory = async () => {
    if (!window.confirm("Clear all history for this game?")) return;
    if (user) await supabase.from('simulator_history').delete().eq('user_id', user.id).eq('game', game);
    setWinningHistory([]);
    localStorage.removeItem(storageHistoryKey);
    setShowHistory(false);
  };

  const displayLines = showAllDetails ? lines : lines.slice(0, 5);

  return (
    <div className="p-4 bg-gray-50 shadow-lg rounded-[2rem] max-w-2xl mx-auto my-8 pb-24 border border-gray-100">
      <div className="mb-6 px-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Your {game} Ticket</h3>
          <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-full">{lines.length} Sets</span>
        </div>

        {isDataLoading ? (
          <p className="text-center text-gray-400 py-4 animate-pulse font-bold italic">Loading sets...</p>
        ) : (
          <div className="space-y-4">
            {displayLines.map((line, index) => (
              <LottoLinePicker
                key={line.id}
                lineId={line.id}
                displayIndex={index + 1}
                selectedNumbers={line.numbers}
                onNumbersChange={handleNumbersChange}
                onDeleteLine={(id) => setLines(lines.filter(l => l.id !== id))}
                game={game}
              />
            ))}
            
            {lines.length > 5 && (
              <button onClick={() => setShowAllDetails(!showAllDetails)} className="w-full py-3 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-600 transition-colors">
                {showAllDetails ? '↑ Collapse list' : `↓ Show all ${lines.length} sets`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md p-4 shadow-lg border-t border-gray-100 z-50">
        <div className="max-w-2xl mx-auto flex flex-wrap justify-center items-center gap-3">
          <button onClick={() => { handleAddLine(); setShowAllDetails(true); }} className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all">+ Add Set</button>
          
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
            <select value={quickPickQuantity} onChange={(e) => setQuickPickQuantity(Number(e.target.value))} className="bg-transparent px-2 font-bold text-sm outline-none text-gray-700">
              {[10, 25, 50, 100].map(qty => <option key={qty} value={qty}>x{qty}</option>)}
            </select>
            <button onClick={handleMultiQuickPick} className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-black text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md">Quick Pick</button>
          </div>

          <button onClick={() => setShowHistory(!showHistory)} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${showHistory ? 'bg-gray-900 text-white' : 'bg-green-100 text-green-700 border border-green-200'}`}>
            {showHistory ? 'Close History' : `Wins (${winningHistory.length})`}
          </button>

          <button onClick={() => { setLines([]); handleAddLine(); onClearAll(); }} className="p-2.5 rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-all" title="Clear current tickets">🗑️</button>
          
          <button onClick={handleCheckAllResultsClick} className="px-8 py-3 rounded-2xl bg-indigo-600 text-white font-black text-lg hover:bg-indigo-700 transition-all shadow-lg hover:scale-105 active:scale-95">Check Results</button>
        </div>
      </div>

      {/* Winning History UI */}
      {showHistory && (
        <div className="mt-8 p-6 bg-white shadow-2xl rounded-[2.5rem] border border-green-100 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">{game} Winning History</h3>
            <button onClick={handleClearAllHistory} className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">Clear History</button>
          </div>
          
          {winningHistory.length === 0 ? (
            <div className="py-12 text-center text-gray-400 font-bold italic">No {game} wins recorded yet.</div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {winningHistory.map((item, idx) => (
                <div key={item.id || idx} className="border border-green-100 rounded-2xl p-4 bg-green-50/50 relative group border-l-4 border-l-green-500">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">Draw Date: {item.drawDate}</p>
                      <p className="text-lg font-black text-gray-800">{item.prizeTier}</p>
                    </div>
                    <button onClick={() => setWinningHistory(winningHistory.filter(w => w.id !== item.id))} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">🗑️</button>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex flex-wrap gap-1">
                      {item.numbers.slice(0, 7).map(n => <span key={n} className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-[10px] font-black text-gray-700 shadow-sm border border-gray-100">{n}</span>)}
                      {game === 'Powerball' && item.numbers[7] && (
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-400 text-amber-950 text-[10px] font-black shadow-sm ring-2 ring-amber-200">{item.numbers[7]}</span>
                      )}
                    </div>
                    <div className="text-[10px] font-black text-gray-400 uppercase italic">
                      {item.mainMatchesCount}M + {game === 'Powerball' ? (item.bonusMatchesCount > 0 ? 'PB' : 'No PB') : `${item.bonusMatchesCount}S`}
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
