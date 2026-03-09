// lotto-project/components/NumberPicker.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateQuickPick, compareNumbers, generateRandomDraw, ESTIMATED_PRIZES } from '../lib/lotto-utils';
import LottoLinePicker from './LottoLinePicker';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const MAX_TOTAL_LINES = 1000;
const OZ_REQUIRED = 7;
const PB_REQUIRED = 8; 
const TATTS_REQUIRED = 6;
const TICKET_COST = 1.45;

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
  prizeValue?: number;
  weekNumber?: number;
  isSimulated?: boolean;
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
  game?: 'Oz Lotto' | 'Powerball' | 'Tatts Lotto';
}

const TrashIcon = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);

export default function NumberPicker({ 
  onCheckAllResults, 
  onClearAll, 
  resultsRef, 
  drawResult,
  game = 'Oz Lotto'
}: NumberPickerProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // View States
  const [mode, setMode] = useState<'classic' | 'auto'>('classic');
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Classic State
  const [lines, setLines] = useState<LottoLine[]>([]);
  const [winningHistory, setWinningHistory] = useState<WinningResult[]>([]);
  const [quickPickQuantity, setQuickPickQuantity] = useState<number>(10);
  const uniqueIdCounter = useRef(Date.now());

  // Auto/Turbo State
  const [isRunning, setIsRunning] = useState(false);
  const [ticketsPerDraw, setTicketsPerDraw] = useState(12);
  const [drawsPerSec, setDrawsPerSec] = useState(10);
  const [autoWinners, setAutoWinners] = useState<WinningResult[]>([]);
  const [stats, setStats] = useState({ draws: 0, spent: 0, won: 0 });
  const [lastWinType, setLastWinType] = useState<string | null>(null);
  const [nearMiss, setNearMiss] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const storageCurrentKey = `lottoLines_${game.replace(/\s/g, '')}`;
  const storageHistoryKey = `lottoWins_${game.replace(/\s/g, '')}`;

  const handleAddLine = useCallback((initialNumbers: number[] = []) => {
    setLines(prevLines => {
      if (prevLines.length >= MAX_TOTAL_LINES) return prevLines;
      const newId = (uniqueIdCounter.current++).toString();
      return [{ id: newId, numbers: initialNumbers }, ...prevLines];
    });
  }, []);

  const handleNumbersChange = useCallback((id: string, newNumbers: number[]) => {
    setLines(prevLines => prevLines.map(line => (line.id === id ? { ...line, numbers: newNumbers } : line)));
  }, []);

  // Load Classic Data
  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      if (user) {
        const { data } = await supabase.from('simulator_history').select('*').eq('game', game).order('created_at', { ascending: false });
        if (data) setWinningHistory(data.flatMap(item => Array.isArray(item.lines) ? item.lines : [item.lines]));
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

  // Sync Classic Lines
  useEffect(() => {
    if (lines.length > 0 && mode === 'classic') localStorage.setItem(storageCurrentKey, JSON.stringify(lines));
  }, [lines, storageCurrentKey, mode]);

  const stopSimulation = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsRunning(false);
  };

  const startSimulation = () => {
    setIsRunning(true);
    const interval = 1000 / drawsPerSec;
    timerRef.current = setInterval(() => {
      const currentTickets = Array.from({ length: ticketsPerDraw }, () => generateQuickPick(game));
      const draw = generateRandomDraw(game);
      const newWinners: WinningResult[] = [];
      let weeklyWinTotal = 0;
      let highestMainMatches = 0;

      currentTickets.forEach(ticketNumbers => {
        const result = compareNumbers(ticketNumbers, draw.numbers, draw.bonus, game);
        if (result.mainMatchesCount > highestMainMatches) highestMainMatches = result.mainMatchesCount;
        if (result.prizeTier !== "No Prize") {
          const prize = ESTIMATED_PRIZES[game][result.prizeTier] || 0;
          weeklyWinTotal += prize;
          if (prize > 1000) setLastWinType(result.prizeTier);
          newWinners.push({
            id: Math.random().toString(36).substr(2, 9),
            numbers: ticketNumbers,
            drawDate: 'Simulated',
            prizeTier: result.prizeTier,
            mainMatchesCount: result.mainMatchesCount,
            bonusMatchesCount: result.bonusMatchesCount,
            game: game,
            prizeValue: prize,
            weekNumber: stats.draws + 1,
            isSimulated: true
          });
        }
      });

      if (highestMainMatches >= (game === 'Oz Lotto' ? 6 : game === 'Powerball' ? 6 : 5)) {
        setNearMiss("SO CLOSE!");
        setTimeout(() => setNearMiss(null), 500);
      }

      setStats(prev => ({
        draws: prev.draws + 1,
        spent: prev.spent + (ticketsPerDraw * TICKET_COST),
        won: prev.won + weeklyWinTotal
      }));

      if (newWinners.length > 0) setAutoWinners(prev => [...newWinners, ...prev].slice(0, 50));
    }, interval);
  };

  const handleManualCheck = async () => {
    const required = game === 'Oz Lotto' ? OZ_REQUIRED : game === 'Powerball' ? PB_REQUIRED : TATTS_REQUIRED;
    const completeLines = lines.filter(line => line.numbers.filter(n => n > 0).length === required);
    if (completeLines.length === 0) { alert(`Complete at least one set.`); return; }

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
        if (user) await supabase.from('simulator_history').insert({ user_id: user.id, lines: currentWinners, game: game });
        const updatedHistory = [...currentWinners, ...winningHistory];
        setWinningHistory(updatedHistory);
        if (!user) localStorage.setItem(storageHistoryKey, JSON.stringify(updatedHistory));
      }
    }
    onCheckAllResults(completeLines.map(line => line.numbers));
    resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Clear all history for this game?")) return;
    if (user) await supabase.from('simulator_history').delete().eq('user_id', user.id).eq('game', game);
    setWinningHistory([]);
    setAutoWinners([]);
    localStorage.removeItem(storageHistoryKey);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
  const getEquivalentItem = (spent: number) => {
    if (spent < 50) return "a Fancy Pizza";
    if (spent < 1000) return `${Math.floor(spent / 5)} Coffees`;
    if (spent < 5000) return "a High-end MacBook Pro";
    if (spent < 60000) return "a Tesla Model 3";
    return "a Decent House Deposit";
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8 pb-48 px-4 relative">
      
      {/* Mode Toggle */}
      <div className="flex justify-center mb-12">
        <div className="bg-gray-100 dark:bg-white/5 p-1.5 rounded-[2rem] flex items-center shadow-inner border border-gray-200 dark:border-white/10">
          <button 
            onClick={() => { setMode('classic'); stopSimulation(); }}
            className={`px-10 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${mode === 'classic' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-xl' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
          >
            Classic
          </button>
          <button 
            onClick={() => setMode('auto')}
            className={`px-10 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${mode === 'auto' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-xl' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
          >
            Turbo
          </button>
        </div>
      </div>

      {/* Classic Mode Content */}
      {mode === 'classic' && (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center justify-between px-6 mb-8">
            <div className="flex flex-col">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Lotto Ticket</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manual Number Selection</p>
            </div>
            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
              <button onClick={() => setViewMode('detailed')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${viewMode === 'detailed' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-400'}`}>List</button>
              <button onClick={() => setViewMode('compact')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${viewMode === 'compact' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Grid</button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-[3.5rem] p-6 border border-gray-100 dark:border-white/5 min-h-[400px] mb-10">
            {isDataLoading ? (
              <div className="py-40 flex flex-col items-center gap-4 animate-pulse"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className={viewMode === 'detailed' ? "space-y-6" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
                {lines.map((line, index) => (
                  viewMode === 'detailed' ? (
                    <LottoLinePicker key={line.id} lineId={line.id} displayIndex={lines.length - index} selectedNumbers={line.numbers} onNumbersChange={handleNumbersChange} onDeleteLine={(id) => setLines(lines.filter(l => l.id !== id))} game={game} />
                  ) : (
                    <div key={line.id} className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-gray-100 dark:bg-white/5 rounded-lg flex items-center justify-center text-[9px] font-black text-gray-400">{lines.length - index}</span>
                        <div className="flex gap-1">{line.numbers.map((n, ni) => (<div key={ni} className={`w-2 h-2 rounded-full ${n > 0 ? (game === 'Powerball' && ni === 7 ? 'bg-amber-400' : 'bg-indigo-500') : 'bg-gray-200 dark:bg-white/10'}`} />))}</div>
                      </div>
                      <button onClick={() => setLines(lines.filter(l => l.id !== line.id))} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"><TrashIcon size={14} /></button>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl z-[90]">
            <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl rounded-[2.5rem] p-5 shadow-2xl border border-gray-100 dark:border-white/10 flex flex-wrap items-center justify-center gap-4">
              <button onClick={() => { handleAddLine(); setViewMode('detailed'); }} className="p-4 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg transition-all active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl border border-gray-200 dark:border-white/10">
                <select value={quickPickQuantity} onChange={(e) => setQuickPickQuantity(Number(e.target.value))} className="bg-transparent px-3 font-black text-sm outline-none text-gray-700 dark:text-gray-300 cursor-pointer">{[10, 25, 50, 100].map(qty => <option key={qty} value={qty}>x{qty}</option>)}</select>
                <button onClick={() => { const newPicks = Array.from({ length: quickPickQuantity }, () => ({ id: (uniqueIdCounter.current++).toString(), numbers: generateQuickPick(game) })); setLines(prev => [...newPicks, ...prev]); }} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest active:scale-95">Burst</button>
              </div>
              <button onClick={() => { if(window.confirm('Clear all?')) { setLines([]); onClearAll(); } }} className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 active:scale-95"><TrashIcon size={24} /></button>
              <button onClick={handleManualCheck} className="flex-1 py-5 px-10 rounded-[1.5rem] bg-emerald-500 text-white font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-95">Check Result</button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Mode Content */}
      {mode === 'auto' && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-10 border border-gray-100 dark:border-white/5 shadow-xl mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Tickets/Week</label>
                <input type="range" min="1" max="100" value={ticketsPerDraw} onChange={(e) => setTicketsPerDraw(parseInt(e.target.value))} className="w-full accent-indigo-600 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full appearance-none cursor-pointer" />
                <div className="flex justify-between mt-3 px-1"><span className="text-lg font-black text-indigo-600">{ticketsPerDraw}</span></div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Warp Speed (Draws/Sec)</label>
                <input type="range" min="1" max="50" value={drawsPerSec} onChange={(e) => { setDrawsPerSec(parseInt(e.target.value)); if (isRunning) stopSimulation(); }} className="w-full accent-emerald-500 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full appearance-none cursor-pointer" />
                <div className="flex justify-between mt-3 px-1"><span className="text-lg font-black text-emerald-500">{drawsPerSec}</span></div>
              </div>
            </div>
            <button onClick={isRunning ? stopSimulation : startSimulation} className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl transition-all active:scale-95 ${isRunning ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'}`}>{isRunning ? 'Abort' : 'Start Time Machine'}</button>
          </div>

          <div className={`bg-gray-950 rounded-[3.5rem] p-10 text-white shadow-2xl border transition-all duration-500 mb-12 relative overflow-hidden ${isRunning ? 'border-indigo-500/50 shadow-indigo-500/20' : 'border-white/10'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10 text-center md:text-left">
              <div><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Years</p><p className="text-5xl font-black tabular-nums">{(stats.draws / 52).toFixed(1)}</p></div>
              <div><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Spent</p><p className="text-5xl font-black text-red-500 tabular-nums tracking-tighter">{formatCurrency(stats.spent)}</p><p className="text-[9px] font-bold text-gray-600 mt-2 uppercase italic">Enough for {getEquivalentItem(stats.spent)}</p></div>
              <div><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Won</p><p className="text-5xl font-black text-emerald-400 tabular-nums tracking-tighter">{formatCurrency(stats.won)}</p></div>
            </div>
            <div className="mt-12 pt-10 border-t border-white/5 text-center relative z-10">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-2">Balance</p>
              <p className={`text-7xl font-black tracking-tighter tabular-nums ${stats.won - stats.spent >= 0 ? 'text-emerald-400' : 'text-red-600'}`}>{formatCurrency(stats.won - stats.spent)}</p>
            </div>
          </div>
        </div>
      )}

      {/* History/Wins UI (Unified) */}
      <div className="mt-12 space-y-6">
        <div className="flex justify-between items-center px-6">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Winning Feed</h3>
          <button onClick={handleClearHistory} className="text-[9px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest border border-red-100 dark:border-red-500/20 px-4 py-1.5 rounded-full">Clear History</button>
        </div>
        
        {((mode === 'classic' ? winningHistory : autoWinners).length === 0) ? (
          <div className="bg-white dark:bg-gray-900/50 p-32 rounded-[3.5rem] border-2 border-dashed border-gray-100 dark:border-white/5 text-center"><p className="text-gray-400 font-bold italic uppercase tracking-[0.3em] text-xs">No records found.</p></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {(mode === 'classic' ? winningHistory : autoWinners).map((winner) => (
              <div key={winner.id} className={`bg-white dark:bg-gray-900 p-8 rounded-[3rem] border shadow-sm transition-all duration-500 border-l-8 ${winner.isSimulated ? 'border-l-indigo-500' : 'border-l-emerald-500'}`}>
                <div className="flex flex-wrap justify-between items-center gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${winner.isSimulated ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'}`}>{winner.drawDate} {winner.weekNumber && `• Week ${winner.weekNumber}`}</span>
                    </div>
                    <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{winner.prizeTier}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{winner.isSimulated ? 'Estimated Win' : 'Official Prize'}</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{winner.prizeValue ? formatCurrency(winner.prizeValue) : 'Calculated in Results'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Alerts */}
      {lastWinType && (
        <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center bg-emerald-500/20 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
          <div className="bg-white dark:bg-gray-900 p-12 rounded-[4rem] shadow-2xl text-center border-4 border-emerald-500 animate-bounce">
            <h2 className="text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">{lastWinType}!</h2>
            <button onClick={() => setLastWinType(null)} className="mt-8 px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest pointer-events-auto">Awesome!</button>
          </div>
        </div>
      )}
      {nearMiss && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[150] pointer-events-none">
          <div className="text-8xl font-black text-orange-500/40 uppercase italic tracking-tighter animate-ping select-none">{nearMiss}</div>
        </div>
      )}
    </div>
  );
}