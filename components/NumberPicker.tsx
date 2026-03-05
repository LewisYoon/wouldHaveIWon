// lotto-project/components/NumberPicker.tsx
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
    <div className="w-full max-w-2xl mx-auto my-8 pb-32">
      
      {/* Header Info */}
      <div className="flex items-center justify-between px-6 mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Your {game} Ticket</h3>
          <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full">{lines.length} Sets</span>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${showHistory ? 'bg-gray-900 dark:bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10'}`}>
          {showHistory ? 'Hide Wins' : `View Wins (${winningHistory.length})`}
        </button>
      </div>

      {/* Ticket List Section */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-[3rem] p-4 border border-gray-100 dark:border-white/5 min-h-[400px]">
        {isDataLoading ? (
          <p className="text-center text-gray-400 py-24 animate-pulse font-bold italic">Loading your ticket...</p>
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
              <button onClick={() => setShowAllDetails(!showAllDetails)} className="w-full py-6 text-gray-400 dark:text-gray-500 font-black text-[10px] uppercase tracking-[0.2em] hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                {showAllDetails ? '↑ Collapse List' : `↓ Expand all ${lines.length} sets`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Sticky Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl z-[90]">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-[2rem] p-4 shadow-xl border border-gray-100 dark:border-white/10 flex flex-wrap items-center justify-center gap-3">
          
          <button onClick={() => { handleAddLine(); setShowAllDetails(true); }} className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-transparent dark:border-white/10" title="Add Set">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
            <select value={quickPickQuantity} onChange={(e) => setQuickPickQuantity(Number(e.target.value))} className="bg-transparent px-2 font-black text-xs outline-none text-gray-700 dark:text-gray-300">
              {[10, 25, 50, 100].map(qty => <option key={qty} value={qty}>x{qty}</option>)}
            </select>
            <button onClick={handleMultiQuickPick} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all">Quick Burst</button>
          </div>

          <button onClick={() => { if(window.confirm('Clear all current sets?')) { setLines([]); handleAddLine(); onClearAll(); } }} className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-100 dark:border-red-500/20 hover:bg-red-100 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>

          <button onClick={handleCheckAllResultsClick} className="flex-1 py-4 px-8 rounded-2xl bg-emerald-500 text-white font-black text-sm hover:bg-emerald-600 transition-all uppercase tracking-widest">Check Results</button>
        </div>
      </div>

      {/* Winning History UI */}
      {showHistory && (
        <div className="mt-8 p-8 bg-white dark:bg-gray-900 shadow-xl rounded-[3rem] border border-gray-100 dark:border-white/5 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">{game} Wins</h3>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Your successful simulations</p>
            </div>
            <button onClick={handleClearAllHistory} className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-full border border-red-100 dark:border-red-500/20">Clear All</button>
          </div>
          
          {winningHistory.length === 0 ? (
            <div className="py-20 text-center text-gray-400 font-bold italic">No winning sets found in this simulation.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {winningHistory.map((item, idx) => (
                <div key={item.id || idx} className="border border-gray-100 dark:border-white/10 rounded-[2rem] p-6 bg-gray-50 dark:bg-white/5 relative group border-l-8 border-l-emerald-500 transition-transform hover:scale-[1.01]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Draw Date: {item.drawDate}</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">{item.prizeTier}</p>
                    </div>
                    <button onClick={() => setWinningHistory(winningHistory.filter(w => w.id !== item.id))} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">🗑️</button>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex flex-wrap gap-2">
                      {item.numbers.slice(0, 7).map(n => <span key={n} className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 text-xs font-black text-gray-700 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-white/5">{n}</span>)}
                      {game === 'Powerball' && item.numbers[7] && (
                        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-400 text-amber-950 text-xs font-black shadow-lg ring-2 ring-amber-200 dark:ring-amber-400/20">{item.numbers[7]}</span>
                      )}
                    </div>
                    <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase italic">
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
