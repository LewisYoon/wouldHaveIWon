// lotto-project/components/NumberPicker.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { generateQuickPick, compareNumbers, ESTIMATED_PRIZES } from '../lib/lotto-utils';
import LottoLinePicker from './LottoLinePicker';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const MAX_TOTAL_LINES = 1000;
const OZ_REQUIRED = 7;
const PB_REQUIRED = 8; 
const TATTS_REQUIRED = 6;
const TICKET_COST = 1.45;
const MAX_WINNING_FEED_ITEMS = 1000;

type LottoLine = {
  id: string;
  numbers: number[];
};

type WinningResult = {
  id: string;
  numbers: number[];
  drawNumbers: number[];
  drawBonus: number[];
  drawDate: string;
  prizeTier: string;
  mainMatchesCount: number;
  bonusMatchesCount: number;
  game: 'Oz Lotto' | 'Powerball' | 'Tatts Lotto';
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
  onModeChange?: (mode: 'classic' | 'auto') => void;
  mode?: 'classic' | 'auto';
}

const TrashIcon = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);

export default function NumberPicker({ 
  onCheckAllResults, 
  onClearAll, 
  resultsRef, 
  drawResult,
  game = 'Oz Lotto',
  onModeChange,
  mode: externalMode
}: NumberPickerProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [mode, setMode] = useState<'classic' | 'auto'>(externalMode || 'classic');

  useEffect(() => {
    if (externalMode && externalMode !== mode) setMode(externalMode);
  }, [externalMode, mode]);

  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [lines, setLines] = useState<LottoLine[]>([]);
  const [winningHistory, setWinningHistory] = useState<WinningResult[]>([]);
  const [quickPickQuantity, setQuickPickQuantity] = useState<number>(10);
  const [sortBy, setSortBy] = useState<'latest' | 'division'>('latest');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const uniqueIdCounter = useRef(Date.now());

  const autoWinnersRef = useRef<WinningResult[]>([]);
  const [autoWinnersStateTrigger, setAutoWinnersStateTrigger] = useState(0);

  const [isRunning, setIsRunning] = useState(false);
  const [ticketsPerSec, setTicketsPerSec] = useState(10); 
  const [stats, setStats] = useState({ draws: 0, spent: 0, won: 0, startTime: 0, elapsedSecs: 0 });
  const [chartData, setChartData] = useState<{spent: number, won: number}[]>([]);
  
  const animationFrameIdRef = useRef<number | null>(null);
  const ticketsPerSecRef = useRef(ticketsPerSec);
  const startTimeRef = useRef<number | null>(null);
  const totalDrawsRef = useRef(0);

  useEffect(() => { ticketsPerSecRef.current = ticketsPerSec; }, [ticketsPerSec]);

  const storageCurrentKey = `lottoLines_${game.replace(/\s/g, '')}`;
  const storageHistoryKey = `lottoWins_${game.replace(/\s/g, '')}`;

  const isOz = game === 'Oz Lotto';
  const isTatts = game === 'Tatts Lotto';
  const brandStyles = {
    text: isOz ? 'text-emerald-600 dark:text-emerald-400' : isTatts ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400',
    bg: isOz ? 'bg-emerald-600' : isTatts ? 'bg-red-600' : 'bg-indigo-600',
    ball: isOz ? 'bg-emerald-500' : isTatts ? 'bg-red-500' : 'bg-indigo-600',
    border: isOz ? 'border-emerald-500' : isTatts ? 'border-red-500' : 'border-indigo-500',
    shadow: isOz ? 'shadow-emerald-500/20' : isTatts ? 'shadow-red-500/20' : 'shadow-indigo-500/20'
  };

  const stopSimulation = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    setIsRunning(false);
    startTimeRef.current = null;
  }, []);

  const resetSimulation = useCallback(() => {
    stopSimulation();
    autoWinnersRef.current = [];
    setAutoWinnersStateTrigger(prev => prev + 1);
    setStats({ draws: 0, spent: 0, won: 0, startTime: 0, elapsedSecs: 0 });
    setChartData([]);
    totalDrawsRef.current = 0;
  }, [stopSimulation]);

  useEffect(() => {
    resetSimulation();
  }, [game, resetSimulation]);

  const handleAddLine = useCallback((initialNumbers: number[] = []) => {
    setLines(prevLines => {
      if (prevLines.length >= MAX_TOTAL_LINES) return prevLines;
      const newId = (uniqueIdCounter.current++).toString();
      const emptyArray = Array(game === 'Powerball' ? 8 : (game === 'Tatts Lotto' ? 6 : 7)).fill(0);
      return [{ id: newId, numbers: initialNumbers.length > 0 ? initialNumbers : emptyArray }, ...prevLines];
    });
  }, [game]);

  const handleNumbersChange = useCallback((id: string, newNumbers: number[]) => {
    setLines(prevLines => prevLines.map(line => (line.id === id ? { ...line, numbers: newNumbers } : line)));
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      if (user) {
        const { data } = await supabase.from('simulator_history').select('*').eq('game', game).order('created_at', { ascending: false });
        if (data) {
          setWinningHistory(data.flatMap(item => (Array.isArray(item.lines) ? item.lines : [item.lines])));
        }
      } else {
        const storedWins = localStorage.getItem(storageHistoryKey);
        if (storedWins) setWinningHistory(JSON.parse(storedWins));
      }
      const storedLines = localStorage.getItem(storageCurrentKey);
      if (storedLines) {
        try { setLines(JSON.parse(storedLines)); } catch (e) { handleAddLine(); }
      } else { handleAddLine(); }
      setIsDataLoading(false);
    };
    if (!isAuthLoading) loadData();
  }, [user, isAuthLoading, game, storageCurrentKey, storageHistoryKey, handleAddLine]);

  useEffect(() => {
    if (lines.length > 0 && mode === 'classic') localStorage.setItem(storageCurrentKey, JSON.stringify(lines));
  }, [lines, storageCurrentKey, mode]);

  const startSimulation = useCallback(() => {
    if (!drawResult) { alert("Please set target winning numbers first!"); return; }
    startTimeRef.current = performance.now();
    setIsRunning(true);
  }, [drawResult]);

  useEffect(() => {
    if (!isRunning || !drawResult) return;

    let lastFrameTime = performance.now();
    let accumulatedTime = 0;

    const simulationLoop = (currentTime: DOMHighResTimeStamp) => {
      const deltaTime = currentTime - lastFrameTime;
      lastFrameTime = currentTime;
      accumulatedTime += deltaTime;

      const targetMsPerTicket = 1000 / Math.max(1, ticketsPerSecRef.current);
      
      let frameDraws = 0;
      let frameWon = 0;
      let frameSpent = 0;
      const newWinners: WinningResult[] = [];

      while (accumulatedTime >= targetMsPerTicket) {
        accumulatedTime -= targetMsPerTicket;
        const ticketNumbers = generateQuickPick(game);
        const result = compareNumbers(ticketNumbers, drawResult.numbers, drawResult.bonus, game);
        
        frameDraws++;
        totalDrawsRef.current++;
        frameSpent += TICKET_COST;

        if (result.prizeTier !== "No Prize") {
            const prize = ESTIMATED_PRIZES[game][result.prizeTier] || 0;
            frameWon += prize;
            newWinners.push({ 
              id: Math.random().toString(36).substr(2, 9), 
              numbers: ticketNumbers, 
              drawNumbers: drawResult.numbers, 
              drawBonus: drawResult.bonus, 
              drawDate: drawResult.drawDate, 
              prizeTier: result.prizeTier, 
              mainMatchesCount: result.mainMatchesCount, 
              bonusMatchesCount: result.bonusMatchesCount, 
              game: game, 
              prizeValue: prize, 
              weekNumber: totalDrawsRef.current,
              isSimulated: true 
            });
        }
      }

      if (frameDraws > 0) {
        if (newWinners.length > 0) {
          autoWinnersRef.current = [...newWinners, ...autoWinnersRef.current].slice(0, MAX_WINNING_FEED_ITEMS);
          setAutoWinnersStateTrigger(prev => prev + 1);
        }
        setStats(prev => {
          const newStats = {
            ...prev,
            draws: prev.draws + frameDraws,
            spent: prev.spent + frameSpent,
            won: prev.won + frameWon,
            elapsedSecs: startTimeRef.current ? (currentTime - startTimeRef.current) / 1000 : 0
          };
          if (Math.floor(newStats.draws / 500) > Math.floor(prev.draws / 500)) {
            setChartData(prevData => [...prevData, { spent: newStats.spent, won: newStats.won }].slice(-50));
          }
          return newStats;
        });
      }
      animationFrameIdRef.current = requestAnimationFrame(simulationLoop);
    };

    animationFrameIdRef.current = requestAnimationFrame(simulationLoop);
    return () => { if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); };
  }, [isRunning, drawResult, game]);

  const handleManualCheck = async () => {
    if (!drawResult) return;
    const completeLines = lines.filter(line => line.numbers.filter(n => n > 0).length === (game === 'Powerball' ? 8 : (game === 'Oz Lotto' ? 7 : 6)));
    if (completeLines.length === 0) { alert(`Complete at least one ticket first.`); return; }
    onCheckAllResults(completeLines.map(line => line.numbers));
    resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Clear all simulation results?")) return;
    resetSimulation();
  };

  const jackpotOdds = useMemo(() => {
    if (game === 'Oz Lotto') return 45379620;
    if (game === 'Powerball') return 134490400;
    return 8145060;
  }, [game]);

  const timeToJackpot = useMemo(() => {
    if (!isRunning || ticketsPerSec === 0) return null;
    const remainingTickets = jackpotOdds - totalDrawsRef.current;
    if (remainingTickets <= 0) return "Any second now!";
    const seconds = remainingTickets / ticketsPerSec;
    const years = Math.floor(seconds / (365 * 24 * 3600));
    const days = Math.floor((seconds % (365 * 24 * 3600)) / (24 * 3600));
    if (years > 1000) return "> 1,000 years";
    if (years > 0) return `${years}y ${days}d`;
    return `${days}d`;
  }, [isRunning, ticketsPerSec, jackpotOdds, stats.draws]);

  const SimpleLineChart = ({ data }: { data: {spent: number, won: number}[] }) => {
    if (data.length < 2) return <div className="h-32 flex items-center justify-center text-[10px] font-black text-gray-500 uppercase tracking-widest italic opacity-50">Generating Trend Data...</div>;
    const width = 400;
    const height = 120;
    const padding = 10;
    const maxVal = Math.max(...data.map(d => Math.max(d.spent, d.won)), 1);
    const getX = (i: number) => (i / (data.length - 1)) * (width - 2 * padding) + padding;
    const getY = (val: number) => height - ((val / maxVal) * (height - 2 * padding) + padding);
    const spentPoints = data.map((d, i) => `${getX(i)},${getY(d.spent)}`).join(' ');
    const wonPoints = data.map((d, i) => `${getX(i)},${getY(d.won)}`).join(' ');
    return (
      <div className="relative w-full h-32 bg-gray-50 dark:bg-black/20 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-inner">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full preserve-3d">
          <polyline points={spentPoints} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={wonPoints} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  };

  const handleModeToggle = (newMode: 'classic' | 'auto') => {
    setMode(newMode);
    if (newMode === 'classic') stopSimulation();
    if (onModeChange) onModeChange(newMode);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
  
  const currentFeed = useMemo(() => {
    let feed = [...autoWinnersRef.current];
    if (sortBy === 'division') {
      feed.sort((a, b) => {
        const rankA = parseInt(a.prizeTier.replace('Division ', ''), 10);
        const rankB = parseInt(b.prizeTier.replace('Division ', ''), 10);
        if (rankA !== rankB) return rankA - rankB;
        return (b.weekNumber || 0) - (a.weekNumber || 0);
      });
    }
    return feed;
  }, [autoWinnersStateTrigger, sortBy]);

  const getEquivalentItem = (spent: number) => {
    if (spent < 50) return "a Fancy Pizza";
    if (spent < 1000) return `${Math.floor(spent / 5)} Coffees`;
    if (spent < 5000) return "a High-end MacBook Pro";
    if (spent < 60000) return "a Tesla Model 3";
    return "a Decent House Deposit";
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8 pb-48 px-4 relative">
      <div className="flex justify-center mb-12">
        <div className="bg-gray-100 dark:bg-white/5 p-1.5 rounded-[2rem] flex items-center shadow-inner border border-gray-200 dark:border-white/10">
          <button onClick={() => handleModeToggle('classic')} className={`px-10 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${mode === 'classic' ? `bg-white dark:bg-gray-800 ${brandStyles.text} shadow-xl` : 'text-gray-400 hover:text-gray-600'}`}>Classic</button>
          <button onClick={() => handleModeToggle('auto')} className={`px-10 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${mode === 'auto' ? `bg-white dark:bg-gray-800 ${brandStyles.text} shadow-xl` : 'text-gray-400 hover:text-gray-600'}`}>Turbo</button>
        </div>
      </div>

      {mode === 'classic' && (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center justify-between px-6 mb-8 text-left">
            <div className="flex flex-col"><h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Lotto Tickets</h3><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manual Selection</p></div>
            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
              <button onClick={() => setViewMode('detailed')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${viewMode === 'detailed' ? `bg-white dark:bg-gray-800 ${brandStyles.text} shadow-sm` : 'text-gray-400'}`}>List</button>
              <button onClick={() => setViewMode('compact')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${viewMode === 'compact' ? `bg-white dark:bg-gray-800 ${brandStyles.text} shadow-sm` : 'text-gray-400'}`}>Grid</button>
            </div>
          </div>
          
          <div className="space-y-6 mb-10">
            {isDataLoading ? (
              <div className="py-20 flex flex-col items-center gap-4 animate-pulse"><div className={`w-10 h-10 border-4 ${brandStyles.text.replace('text-', 'border-')} border-t-transparent rounded-full animate-spin`} /></div>
            ) : (
              lines.map((line, index) => (
                viewMode === 'detailed' ? (
                  <LottoLinePicker key={line.id} lineId={line.id} displayIndex={lines.length - index} selectedNumbers={line.numbers} onNumbersChange={handleNumbersChange} onDeleteLine={(id) => setLines(lines.filter(l => l.id !== id))} game={game} />
                ) : (
                  <div key={line.id} className="bg-white dark:bg-gray-900 p-4 rounded-[2rem] border border-gray-100 dark:border-white/5 flex items-center justify-between group shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-[10px] font-black text-gray-400">{lines.length - index}</span>
                      <div className="flex gap-1">
                        {line.numbers.map((n, ni) => (<div key={ni} className={`w-2 h-2 rounded-full ${n > 0 ? (game === 'Powerball' && ni === 7 ? 'bg-amber-400' : brandStyles.ball) : 'bg-gray-200 dark:bg-white/10'}`} />))}
                      </div>
                    </div>
                    <button onClick={() => setLines(lines.filter(l => l.id !== line.id))} className="text-gray-300 hover:text-red-500 transition-all p-2 opacity-0 group-hover:opacity-100"><TrashIcon size={16} /></button>
                  </div>
                )
              ))
            )}
          </div>

          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl z-[90]">
            <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl rounded-[2.5rem] p-5 shadow-2xl border border-gray-100 dark:border-white/10 flex items-center justify-center gap-4">
              <button onClick={() => handleAddLine()} className={`p-4 rounded-2xl ${brandStyles.bg} text-white hover:brightness-110 shadow-lg active:scale-95 transition-all`}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl border border-gray-200 dark:border-white/10">
                <select value={quickPickQuantity} onChange={(e) => setQuickPickQuantity(Number(e.target.value))} className="bg-transparent px-3 font-black text-sm outline-none text-gray-700 dark:text-gray-300 cursor-pointer">{[10, 25, 50, 100].map(qty => <option key={qty} value={qty}>x{qty}</option>)}</select>
                <button onClick={() => { const newPicks = Array.from({ length: quickPickQuantity }, () => ({ id: (uniqueIdCounter.current++).toString(), numbers: generateQuickPick(game) })); setLines(prev => [...newPicks, ...prev]); }} className={`px-6 py-3 rounded-xl ${brandStyles.bg} text-white font-black text-xs uppercase tracking-widest active:scale-95 shadow-sm`}>Burst</button>
              </div>
              <button onClick={() => { if(window.confirm('Clear all tickets?')) { setLines([]); localStorage.removeItem(storageCurrentKey); onClearAll(); } }} className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 active:scale-95 hover:bg-red-100 transition-colors"><TrashIcon size={24} /></button>
              <button onClick={handleManualCheck} className={`flex-1 py-5 px-10 rounded-[1.5rem] bg-emerald-500 text-white font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-95 hover:brightness-110 transition-all`}>Check Results</button>
            </div>
          </div>
        </div>
      )}

      {mode === 'auto' && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-left">
          <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-10 border border-gray-100 dark:border-white/5 shadow-xl mb-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Simulation Settings</p>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Speed: {ticketsPerSec} Tickets / sec</label>
                        <input type="range" min="1" max="100" value={ticketsPerSec} onChange={(e) => setTicketsPerSec(parseInt(e.target.value))} className={`w-full accent-emerald-500 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full appearance-none cursor-pointer`} />
                    </div>
                    <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-xl relative overflow-hidden">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Time to Jackpot</p>
                      <p className={`text-lg font-black tracking-tight ${isRunning ? 'text-amber-500' : 'text-gray-400'}`}>{isRunning ? timeToJackpot : '--'}</p>
                    </div>
                </div>
                <div className="space-y-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Trend Analysis</p>
                    <SimpleLineChart data={chartData} />
                    <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">Reality Check</p>
                        <p className="text-gray-500 dark:text-gray-400 text-[11px] font-medium italic text-center leading-relaxed">Instead of spending <span className="text-red-500 font-black">{formatCurrency(stats.spent)}</span>, you could have bought <span className={`${brandStyles.text} font-black`}>{getEquivalentItem(stats.spent)}</span>.</p>
                    </div>
                </div>
            </div>
            <button onClick={isRunning ? stopSimulation : startSimulation} className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl transition-all active:scale-95 ${isRunning ? 'bg-red-500 text-white' : `${brandStyles.bg} text-white ${brandStyles.shadow}`}`}>{isRunning ? 'Abort Simulation' : 'Run Turbo Simulation'}</button>
          </div>

          <div className={`bg-gray-950 rounded-[3.5rem] p-10 text-white shadow-2xl border transition-all duration-500 mb-12 relative overflow-hidden ${isRunning ? `${brandStyles.border}/50 ${brandStyles.shadow}` : 'border-white/10'}`}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 relative z-10">
              <div><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Spent</p><p className="text-3xl font-black text-red-500 tabular-nums">{formatCurrency(stats.spent)}</p></div>
              <div><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Tickets</p><p className="text-3xl font-black text-indigo-400 tabular-nums">{stats.draws.toLocaleString()}</p></div>
              <div><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Won</p><p className={`text-3xl font-black text-emerald-400 tabular-nums`}>{formatCurrency(stats.won)}</p></div>
              <div><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Net</p><p className={`text-3xl font-black tabular-nums ${stats.won - stats.spent >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>{formatCurrency(stats.won - stats.spent)}</p></div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-end justify-between px-6 mb-4">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Turbo Results</h3>
              <div className="flex gap-4">
                  <button onClick={() => setSortBy('latest')} className={`text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${sortBy === 'latest' ? `${brandStyles.border} ${brandStyles.text}` : 'border-transparent text-gray-400'}`}>Latest</button>
                  <button onClick={() => setSortBy('division')} className={`text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${sortBy === 'division' ? `${brandStyles.border} ${brandStyles.text}` : 'border-transparent text-gray-400'}`}>Top Wins</button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              {currentFeed.length === 0 ? (
                <div className="bg-white dark:bg-gray-900/50 p-20 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-white/5 text-center transition-all"><p className="text-gray-400 font-bold italic uppercase tracking-[0.3em] text-xs">{isRunning ? 'Searching the multi-verse...' : 'Simulation idle.'}</p></div>
              ) : (
                currentFeed.map((winner) => (
                  <div key={winner.id} className={`bg-white dark:bg-gray-900 p-8 rounded-[3rem] border-l-8 ${brandStyles.border} shadow-sm transition-all`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/10 ${brandStyles.text}`}>Ticket #{winner.weekNumber?.toLocaleString()}</span>
                          <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{winner.prizeTier}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {winner.numbers.map((n, i) => {
                            const isMainMatch = winner.drawNumbers.includes(n);
                            const isBonusMatch = winner.drawBonus.includes(n);
                            return <span key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-sm border transition-all ${isMainMatch ? `${brandStyles.ball} text-white border-transparent scale-110 shadow-md` : isBonusMatch ? 'bg-amber-400 text-amber-950 border-transparent scale-110 shadow-md' : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-300 border-gray-100 dark:border-white/5'}`}>{n}</span>;
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Win Amount</p>
                        <p className={`text-3xl font-black tracking-tighter ${brandStyles.text}`}>{winner.prizeValue ? formatCurrency(winner.prizeValue) : 'Calculated'}</p>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
