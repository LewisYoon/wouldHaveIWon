// lotto-project/components/NumberPicker.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { generateQuickPick, compareNumbers, generateRandomDraw, ESTIMATED_PRIZES } from '../lib/lotto-utils';
import LottoLinePicker from './LottoLinePicker';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const MAX_TOTAL_LINES = 1000;
const OZ_REQUIRED = 7;
const PB_REQUIRED = 8; 
const TATTS_REQUIRED = 6;
const TICKET_COST = 1.45;
const MAX_WINNING_FEED_ITEMS = 5000; // 최대 5000개의 당첨 기록만 유지

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
  onModeChange?: (mode: 'classic' | 'auto') => void;
}

const TrashIcon = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);

export default function NumberPicker({ 
  onCheckAllResults, 
  onClearAll, 
  resultsRef, 
  drawResult,
  game = 'Oz Lotto',
  onModeChange
}: NumberPickerProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // Get initial mode from URL if available
  const getInitialMode = useCallback(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('mode');
      if (m === 'classic' || m === 'auto') return m;
    }
    return 'classic';
  }, []);

  const [mode, setMode] = useState<'classic' | 'auto'>(getInitialMode());

  // Sync mode when it's updated elsewhere (like via URL change)
  useEffect(() => {
    const m = getInitialMode();
    if (m !== mode) {
      setMode(m);
    }
  }, [getInitialMode, mode]);

  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'latest' | 'division'>('latest');
  const [lines, setLines] = useState<LottoLine[]>([]);
  const [winningHistory, setWinningHistory] = useState<WinningResult[]>([]);
  const [quickPickQuantity, setQuickPickQuantity] = useState<number>(10);
  const uniqueIdCounter = useRef(Date.now());

  const autoWinnersRef = useRef<WinningResult[]>([]);
  const [autoWinnersStateTrigger, setAutoWinnersStateTrigger] = useState(0);

  const [isRunning, setIsRunning] = useState(false);
  const [ticketsPerSec, setTicketsPerSec] = useState(10); 
  const [stats, setStats] = useState({ draws: 0, spent: 0, won: 0, startTime: 0, elapsedSecs: 0 });
  const [chartData, setChartData] = useState<{spent: number, won: number}[]>([]);
  const [lastWinType, setLastWinType] = useState<string | null>(null);
  const [nearMiss, setNearMiss] = useState<string | null>(null);
  
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
    accent: isOz ? 'accent-emerald-600' : isTatts ? 'accent-red-600' : 'accent-indigo-600',
    border: isOz ? 'border-emerald-500' : isTatts ? 'border-red-500' : 'border-indigo-500',
    shadow: isOz ? 'shadow-emerald-500/20' : isTatts ? 'shadow-red-500/20' : 'shadow-indigo-500/20'
  };

  useEffect(() => {
    stopSimulation();
    autoWinnersRef.current = [];
    setAutoWinnersStateTrigger(prev => prev + 1);
    setStats({ draws: 0, spent: 0, won: 0, startTime: 0, elapsedSecs: 0 });
    setChartData([]);
    totalDrawsRef.current = 0;
    setLastWinType(null);
    setNearMiss(null);
    startTimeRef.current = null;
  }, [game]);

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

  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      if (user) {
        const { data } = await supabase.from('simulator_history').select('*').eq('game', game).order('created_at', { ascending: false });
        if (data) {
          setWinningHistory(data.flatMap(item => (Array.isArray(item.lines) ? item.lines : [item.lines]).map((l: any) => ({ ...l, drawNumbers: l.drawNumbers || [], drawBonus: l.drawBonus || [] }))));
        }
      } else {
        const storedWins = localStorage.getItem(storageHistoryKey);
        if (storedWins) setWinningHistory(JSON.parse(storedWins).map((l: any) => ({ ...l, drawNumbers: l.drawNumbers || [], drawBonus: l.drawBonus || [] })));
      }
      const storedLines = localStorage.getItem(storageCurrentKey);
      if (storedLines) {
        try { setLines(JSON.parse(storedLines).map((l: any) => ({ ...l, id: (uniqueIdCounter.current++).toString() }))); } catch (e) { handleAddLine(); }
      } else { handleAddLine(); }
      setIsDataLoading(false);
    };
    if (!isAuthLoading) loadData();
  }, [user, isAuthLoading, game, handleAddLine, storageCurrentKey, storageHistoryKey]);

  useEffect(() => {
    if (lines.length > 0 && mode === 'classic') localStorage.setItem(storageCurrentKey, JSON.stringify(lines));
  }, [lines, storageCurrentKey, mode]);

  const stopSimulation = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    setIsRunning(false);
    startTimeRef.current = null;
  }, []);

  const startSimulation = useCallback(() => {
    if (!drawResult || drawResult.numbers.length < (game === 'Tatts Lotto' ? 6 : 7)) {
        alert("Please ensure the target winning numbers are set correctly at the top!");
        return;
    }
    startTimeRef.current = performance.now();
    setIsRunning(true);
  }, [drawResult, game]);

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
            if (prize > 1000) setLastWinType(result.prizeTier);
            
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

        if (result.mainMatchesCount >= (game === 'Oz Lotto' ? 6 : game === 'Powerball' ? 6 : 5)) {
          setNearMiss("SO CLOSE!");
          setTimeout(() => setNearMiss(null), 500);
        }
      }

      if (frameDraws > 0) {
        if (newWinners.length > 0) {
          autoWinnersRef.current = [...newWinners, ...autoWinnersRef.current].slice(0, MAX_WINNING_FEED_ITEMS);
          setAutoWinnersStateTrigger(prev => prev + 1);
        }
        
        const totalElapsed = startTimeRef.current ? (currentTime - startTimeRef.current) / 1000 : 0;

        setStats(prev => {
          const newStats = { 
            ...prev,
            draws: prev.draws + frameDraws,
            spent: prev.spent + frameSpent,
            won: prev.won + frameWon,
            elapsedSecs: totalElapsed
          };
          
          // Update chart data every 500 draws
          if (Math.floor(newStats.draws / 500) > Math.floor(prev.draws / 500)) {
            setChartData(prevData => [...prevData, { spent: newStats.spent, won: newStats.won }].slice(-50));
          }
          
          return newStats;
        });
      }
      
      animationFrameIdRef.current = requestAnimationFrame(simulationLoop);
    };

    animationFrameIdRef.current = requestAnimationFrame(simulationLoop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isRunning, drawResult, game, ticketsPerSecRef, autoWinnersRef]);

  const handleManualCheck = async () => {
    const required = game === 'Oz Lotto' ? OZ_REQUIRED : game === 'Powerball' ? PB_REQUIRED : TATTS_REQUIRED;
    const completeLines = lines.filter(line => line.numbers.filter(n => n > 0).length === required);
    if (completeLines.length === 0) { alert(`Complete at least one set.`); return; }

    const currentWinners: WinningResult[] = completeLines
      .map(line => {
        const result = compareNumbers(line.numbers, drawResult.numbers, drawResult.bonus, game);
        if (result.prizeTier !== "No Prize") return { id: Date.now().toString() + Math.random(), numbers: line.numbers, drawNumbers: drawResult.numbers, drawBonus: drawResult.bonus, drawDate: drawResult.drawDate, prizeTier: result.prizeTier, mainMatchesCount: result.mainMatchesCount, bonusMatchesCount: result.bonusMatchesCount, game: game };
        return null;
      })
      .filter((r): r is WinningResult => r !== null);

    if (currentWinners.length > 0) {
      if (user) await supabase.from('simulator_history').insert({ user_id: user.id, lines: currentWinners, game: game });
      const updatedHistory = [...currentWinners, ...winningHistory];
      setWinningHistory(updatedHistory);
      if (!user) localStorage.setItem(storageHistoryKey, JSON.stringify(updatedHistory));
    }
    onCheckAllResults(completeLines.map(line => line.numbers));
    resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Clear all simulation results?")) return;
    autoWinnersRef.current = [];
    setAutoWinnersStateTrigger(prev => prev + 1);
    setStats({ draws: 0, spent: 0, won: 0, startTime: 0, elapsedSecs: 0 });
    setChartData([]);
    totalDrawsRef.current = 0;
  };

  const jackpotOdds = useMemo(() => {
    if (game === 'Oz Lotto') return 45379620;
    if (game === 'Powerball') return 134490400;
    return 8145060; // Tatts Lotto
  }, [game]);

  const timeToJackpot = useMemo(() => {
    if (!isRunning || ticketsPerSec === 0) return null;
    const remainingTickets = jackpotOdds - totalDrawsRef.current;
    if (remainingTickets <= 0) return "Any second now!";
    
    const seconds = remainingTickets / ticketsPerSec;
    const years = Math.floor(seconds / (365 * 24 * 3600));
    const days = Math.floor((seconds % (365 * 24 * 3600)) / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    
    if (years > 1000) return "> 1,000 years";
    if (years > 0) return `${years}y ${days}d`;
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${Math.floor((seconds % 3600) / 60)}m`;
  }, [isRunning, ticketsPerSec, game, stats.draws]);

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
          <polyline points={spentPoints} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]" />
          <polyline points={wonPoints} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
        </svg>
        <div className="absolute top-2 left-3 flex gap-4">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Spent</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Won</span></div>
        </div>
      </div>
    );
  };

  const handleModeToggle = (newMode: 'classic' | 'auto') => {
    setMode(newMode);
    if (newMode === 'classic') stopSimulation();
    if (onModeChange) onModeChange(newMode);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
  
  const { divisionStats, currentFeed } = useMemo(() => {
    const newDivisionStats: Record<string, number> = {};
    for (const winner of autoWinnersRef.current) {
      newDivisionStats[winner.prizeTier] = (newDivisionStats[winner.prizeTier] || 0) + 1;
    }
    
    let sortedFeed = [...autoWinnersRef.current];
    if (sortBy === 'division') {
      sortedFeed.sort((a, b) => {
        const rankA = parseInt(a.prizeTier.replace('Division ', ''), 10);
        const rankB = parseInt(b.prizeTier.replace('Division ', ''), 10);
        if (rankA !== rankB) return rankA - rankB;
        return (b.weekNumber || 0) - (a.weekNumber || 0);
      });
    }

    return { divisionStats: newDivisionStats, currentFeed: sortedFeed };
  }, [autoWinnersRef.current, autoWinnersStateTrigger, sortBy]);

  const getEquivalentItem = (spent: number) => {
    if (spent < 50) return "a Fancy Pizza";
    if (spent < 1000) return `${Math.floor(spent / 5)} Coffees`;
    if (spent < 5000) return "a High-end MacBook Pro";
    if (spent < 60000) return "a Tesla Model 3";
    return "a Decent House Deposit";
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8 pb-48 px-4 relative">
      
      {lastWinType && (
        <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
          <div className={`bg-white dark:bg-gray-900 p-12 rounded-[4rem] shadow-2xl text-center border-4 ${brandStyles.border} animate-bounce pointer-events-auto`}>
            <h2 className="text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic mb-8">{lastWinType}!</h2>
            <button onClick={() => setLastWinType(null)} className={`px-12 py-4 ${brandStyles.bg} text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl ${brandStyles.shadow} hover:brightness-110 transition-all`}>Awesome!</button>
          </div>
        </div>
      )}
      {nearMiss && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[150] pointer-events-none">
          <div className="text-8xl font-black text-orange-500/40 uppercase italic tracking-tighter animate-ping select-none">{nearMiss}</div>
        </div>
      )}

      <div className="flex justify-center mb-8 sm:mb-12">
        <div className="bg-gray-100 dark:bg-white/5 p-1 sm:p-1.5 rounded-2xl sm:rounded-[2rem] flex items-center shadow-inner border border-gray-200 dark:border-white/10">
          <button onClick={() => handleModeToggle('classic')} className={`px-6 sm:px-10 py-2.5 sm:py-3 rounded-xl sm:rounded-full font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${mode === 'classic' ? `bg-white dark:bg-gray-800 ${brandStyles.text} shadow-xl` : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>Classic</button>
          <button onClick={() => handleModeToggle('auto')} className={`px-6 sm:px-10 py-2.5 sm:py-3 rounded-xl sm:rounded-full font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${mode === 'auto' ? `bg-white dark:bg-gray-800 ${brandStyles.text} shadow-xl` : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>Turbo</button>
        </div>
      </div>

      {mode === 'classic' && (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center justify-between px-4 sm:px-6 mb-6 sm:mb-8 text-left">
            <div className="flex flex-col"><h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Lotto Ticket</h3><p className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manual Number Selection</p></div>
            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
              <button onClick={() => setViewMode('detailed')} className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[8px] sm:text-[9px] font-black uppercase transition-all ${viewMode === 'detailed' ? `bg-white dark:bg-gray-800 ${brandStyles.text} shadow-sm` : 'text-gray-400'}`}>List</button>
              <button onClick={() => setViewMode('compact')} className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[8px] sm:text-[9px] font-black uppercase transition-all ${viewMode === 'compact' ? `bg-white dark:bg-gray-800 ${brandStyles.text} shadow-sm` : 'text-gray-400'}`}>Grid</button>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-[2.5rem] sm:rounded-[3.5rem] p-4 sm:p-6 border border-gray-100 dark:border-white/5 min-h-[300px] sm:min-h-[400px] mb-8 sm:mb-10">
            {isDataLoading ? (
              <div className="py-20 sm:py-40 flex flex-col items-center gap-4 animate-pulse"><div className={`w-10 h-10 sm:w-12 sm:h-12 border-4 ${brandStyles.text.replace('text-', 'border-')} border-t-transparent rounded-full animate-spin`} /></div>
            ) : (
              <div className={viewMode === 'detailed' ? "space-y-4 sm:space-y-6" : "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"}>
                {lines.map((line, index) => (
                  viewMode === 'detailed' ? (
                    <LottoLinePicker key={line.id} lineId={line.id} displayIndex={lines.length - index} selectedNumbers={line.numbers} onNumbersChange={handleNumbersChange} onDeleteLine={(id) => setLines(lines.filter(l => l.id !== id))} game={game} />
                  ) : (
                    <div key={line.id} className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-100 dark:bg-white/5 rounded-lg flex items-center justify-center text-[8px] sm:text-[9px] font-black text-gray-400">{lines.length - index}</span>
                        <div className="flex gap-0.5 sm:gap-1">{line.numbers.map((n, ni) => (<div key={ni} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${n > 0 ? (game === 'Powerball' && ni === 7 ? 'bg-amber-400' : brandStyles.ball) : 'bg-gray-200 dark:bg-white/10'}`} />))}</div>
                      </div>
                      <button onClick={() => setLines(lines.filter(l => l.id !== line.id))} className="text-gray-300 hover:text-red-500 transition-all p-1"><TrashIcon size={14} /></button>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
          <div className="fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-2xl z-[90]">
            <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-5 shadow-2xl border border-gray-100 dark:border-white/10 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              <button onClick={() => { handleAddLine(); setViewMode('detailed'); }} className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${brandStyles.bg} text-white hover:brightness-110 shadow-lg transition-all active:scale-95 flex-shrink-0`}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
              <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 dark:bg-white/5 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10">
                <select value={quickPickQuantity} onChange={(e) => setQuickPickQuantity(Number(e.target.value))} className="bg-transparent px-2 sm:px-3 font-black text-xs sm:text-sm outline-none text-gray-700 dark:text-gray-300 cursor-pointer">{[10, 25, 50, 100].map(qty => <option key={qty} value={qty}>x{qty}</option>)}</select>
                <button onClick={() => { const newPicks = Array.from({ length: quickPickQuantity }, () => ({ id: (uniqueIdCounter.current++).toString(), numbers: generateQuickPick(game) })); setLines(prev => [...newPicks, ...prev]); }} className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl ${brandStyles.bg} text-white font-black text-[10px] sm:text-xs uppercase tracking-widest active:scale-95 shadow-sm`}>Burst</button>
              </div>
              <button onClick={() => { if(window.confirm('Clear all?')) { setLines([]); onClearAll(); } }} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 active:scale-95 hover:bg-red-100 transition-colors flex-shrink-0"><TrashIcon size={20} /></button>
              <button onClick={handleManualCheck} className={`flex-1 py-4 sm:py-5 px-6 sm:px-10 rounded-xl sm:rounded-[1.5rem] bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-95 hover:brightness-110 transition-all`}>Check Results</button>
            </div>
          </div>
        </div>
      )}

      {mode === 'auto' && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          {!isRunning && stats.draws > 0 && (
            <div className={`bg-white dark:bg-gray-900 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border-2 ${brandStyles.border} shadow-2xl mb-8 sm:mb-10 animate-in zoom-in-95 duration-500 text-left`}>
                <div className="flex justify-between items-center mb-6 sm:mb-8">
                    <h3 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Simulation Result</h3>
                    <span className={`${brandStyles.bg} text-white text-[8px] sm:text-[10px] font-black px-3 py-1 sm:px-4 py-1.5 rounded-full uppercase tracking-widest`}>Summary</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10">
                    <div className="space-y-3 sm:space-y-4">
                        <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Divisions Won</p>
                        <div className="space-y-1.5 sm:space-y-2">
                            {Object.entries(divisionStats).length > 0 ? (
                                Object.entries(divisionStats)
                                  .sort(([a], [b]) => parseInt(a.replace('Division ', '')) - parseInt(b.replace('Division ', '')))
                                  .map(([tier, count]) => (
                                    <div key={tier} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 px-3 py-1.5 sm:px-4 py-2 rounded-lg sm:rounded-xl">
                                        <span className="text-[10px] sm:text-[10px] font-bold text-gray-600 dark:text-gray-400">{tier}</span>
                                        <span className={`text-[10px] sm:text-sm font-black text-gray-900 dark:text-white`}>{count.toLocaleString()}x</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                  <p className="text-[10px] text-gray-400 font-bold italic">No wins yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={`bg-gray-50 dark:bg-black/20 p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-gray-100 dark:border-white/5 flex flex-col justify-center text-center`}>
                        <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Reality Check</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium leading-relaxed italic">
                            Instead of spending <span className="text-red-500 font-black">{formatCurrency(stats.spent)}</span>, you could have bought <span className={`${brandStyles.text} font-black`}>{getEquivalentItem(stats.spent)}</span>.
                        </p>
                    </div>
                </div>
                <button onClick={() => { 
                  setStats({ draws: 0, spent: 0, won: 0, startTime: 0, elapsedSecs: 0 }); 
                  setChartData([]);
                  autoWinnersRef.current = []; 
                  setAutoWinnersStateTrigger(prev => prev + 1); 
                  totalDrawsRef.current = 0;
                }} className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 font-black uppercase text-[9px] sm:text-[10px] tracking-[0.3em] hover:bg-gray-200 transition-all">Reset Simulation</button>
            </div>
          )}
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border border-gray-100 dark:border-white/5 shadow-xl mb-8 sm:mb-10 space-y-8 sm:space-y-10 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                <div className="space-y-4 sm:space-y-6">
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Simulation Settings</p>
                    <div>
                        <label className="block text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 sm:mb-4">Tickets/Secs: {ticketsPerSec} (Tickets per Second)</label>
                        <input type="range" min="1" max="50" value={ticketsPerSec} onChange={(e) => { setTicketsPerSec(parseInt(e.target.value)); }} className={`w-full accent-emerald-500 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full appearance-none cursor-pointer`} />
                    </div>
                </div>
                <div className="space-y-4 sm:space-y-6">
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Jackpot Prediction</p>
                    <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full -mr-8 -mt-8 animate-pulse" />
                      <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Est. Time to Div 1</p>
                      <p className={`text-sm sm:text-lg font-black tracking-tight relative z-10 ${isRunning ? 'text-amber-500' : 'text-gray-400'}`}>
                        {isRunning ? timeToJackpot : '--'}
                      </p>
                    </div>
                </div>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Trend Analysis</p>
              <SimpleLineChart data={chartData} />
            </div>

            <button onClick={isRunning ? stopSimulation : startSimulation} className={`w-full py-5 sm:py-6 rounded-xl sm:rounded-[2rem] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-sm shadow-2xl transition-all active:scale-95 ${isRunning ? 'bg-red-500 text-white' : `${brandStyles.bg} text-white ${brandStyles.shadow}`}`}>{isRunning ? 'Abort Simulation' : 'Enter Time Machine'}</button>
          </div>
          <div className={`bg-gray-950 rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 text-white shadow-2xl border transition-all duration-500 mb-8 sm:mb-12 relative overflow-hidden ${isRunning ? `${brandStyles.border}/50 ${brandStyles.shadow}` : 'border-white/10'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10 relative z-10 text-center md:text-left">
              <div><p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 sm:mb-2">Time Simulated</p><p className="text-3xl sm:text-5xl font-black tabular-nums">{stats.elapsedSecs.toFixed(1)}<span className="text-lg sm:text-xl text-gray-600 ml-1 font-serif italic lowercase">sec</span></p></div>
              <div><p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 sm:mb-2">Money Spent</p><p className="text-3xl sm:text-5xl font-black text-red-500 tabular-nums tracking-tighter">{formatCurrency(stats.spent)}</p></div>
              <div><p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 sm:mb-2">Total Tickets Gen.</p><p className="text-3xl sm:text-5xl font-black text-indigo-400 tabular-nums tracking-tighter">{stats.draws.toLocaleString()}</p></div>
              <div><p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 sm:mb-2">Total Won</p><p className={`text-3xl sm:text-5xl font-black text-emerald-400 tabular-nums tracking-tighter`}>{formatCurrency(stats.won)}</p></div>
            </div>
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-10 border-t border-white/5 text-center relative z-10">
              <p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-1 sm:mb-2">Balance</p>
              <p className={`text-4xl sm:text-7xl font-black tracking-tighter tabular-nums ${stats.won - stats.spent >= 0 ? 'text-emerald-400' : 'text-red-600'}`}>{formatCurrency(stats.won - stats.spent)}</p>
            </div>
          </div>
          <div className="mt-8 sm:mt-12 space-y-4 sm:space-y-6 text-left">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between px-4 sm:px-6 mb-4 gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Winning Feed</h3>
                <div className="flex gap-3 sm:gap-4 mt-2">
                    <button onClick={() => setSortBy('latest')} className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${sortBy === 'latest' ? `${brandStyles.border} ${brandStyles.text}` : 'border-transparent text-gray-400'}`}>Latest</button>
                    <button onClick={() => setSortBy('division')} className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${sortBy === 'division' ? `${brandStyles.border} ${brandStyles.text}` : 'border-transparent text-gray-400'}`}>Top Divisions</button>
                </div>
              </div>
              <button onClick={handleClearHistory} className="w-fit text-[8px] sm:text-[9px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest border border-red-100 dark:border-red-500/20 px-3 py-1 sm:px-4 py-1.5 rounded-full">Clear History</button>
            </div>
            {currentFeed.length === 0 ? (
              <div className="bg-white dark:bg-gray-900/50 p-20 sm:p-32 rounded-[2.5rem] sm:rounded-[3.5rem] border-2 border-dashed border-gray-100 dark:border-white/5 text-center transition-all"><p className="text-gray-400 font-bold italic uppercase tracking-[0.3em] text-[10px] sm:text-xs">{isRunning ? 'Searching the multi-verse...' : 'Simulation idle.'}</p></div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:gap-4 max-h-[500px] sm:max-h-[800px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                {currentFeed.map((winner) => (
                  <div key={winner.id} className={`bg-white dark:bg-gray-900 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border shadow-sm transition-all duration-500 border-l-4 sm:border-l-8 ${brandStyles.border}`}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 sm:px-3 py-1 rounded-md sm:rounded-lg bg-gray-100 dark:bg-white/10 ${brandStyles.text}`}>
                            Ticket #{winner.weekNumber?.toLocaleString()}
                          </span>
                        </div>
                        <h4 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter mb-3 sm:mb-4">{winner.prizeTier}</h4>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {(winner.numbers || []).slice(0, 7).map((n, i) => {
                                const isMatch = (winner.drawNumbers || []).includes(n);
                                const isBonusMatch = (winner.drawBonus || []).includes(n);
                                return <span key={i} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-[9px] sm:text-[10px] shadow-sm border transition-all ${isMatch ? `${brandStyles.ball} text-white border-transparent scale-110 shadow-md` : isBonusMatch ? 'bg-amber-400 text-amber-950 border-transparent scale-110' : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-300 border-gray-100 dark:border-white/5'}`}>{n}</span>;
                            })}
                            {game === 'Powerball' && (winner.numbers || []).includes((winner.drawBonus || [])[0]) && (winner.numbers || [])[7] && (
                                <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-[9px] sm:text-[10px] shadow-sm border-b-2 transition-all ${(winner.drawBonus || []).includes((winner.numbers || [])[7]) ? 'bg-amber-400 text-amber-950 border-amber-600 scale-110 shadow-md' : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-300 border-gray-100 dark:border-white/5'}`}>{winner.numbers[7]}</span>
                            )}
                        </div>
                      </div>
                      <div className="text-left sm:text-right border-t sm:border-0 pt-3 sm:pt-0 border-gray-100 dark:border-white/5">
                        <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1">Estimated Win</p>
                        <p className={`text-2xl sm:text-3xl font-black tracking-tighter ${brandStyles.text}`}>{winner.prizeValue ? formatCurrency(winner.prizeValue) : 'Calculated'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
