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
  
  const [mode, setMode] = useState<'classic' | 'auto'>('classic');
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
  const [ticketsPerSec, setTicketsPerSec] = useState(10); // 슬라이더가 tickets/sec를 제어
  const [stats, setStats] = useState({ draws: 0, spent: 0, won: 0 });
  const [lastWinType, setLastWinType] = useState<string | null>(null);
  const [nearMiss, setNearMiss] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // [추가] ticketsPerSec의 최신 값을 참조하기 위한 Ref
  const ticketsPerSecRef = useRef(ticketsPerSec);

  // [수정] ticketsPerSec 상태가 변경될 때마다 Ref 업데이트
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
    setStats({ draws: 0, spent: 0, won: 0 });
    setLastWinType(null);
    setNearMiss(null);
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

  const stopSimulation = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsRunning(false);
  };

  const startSimulation = useCallback(() => {
    if (!drawResult || drawResult.numbers.length < (game === 'Tatts Lotto' ? 6 : 7)) {
        alert("Please ensure the target winning numbers are set correctly at the top!");
        return;
    }
    setIsRunning(true);
    const interval = 1000; // 1초 간격으로 실행

    timerRef.current = setInterval(() => {
      setStats(prevStats => {
        // [수정] interval마다 생성될 티켓 수 결정
        const ticketsToProcess = ticketsPerSecRef.current;
        const newWinners: WinningResult[] = [];
        let weeklyWinTotal = 0;
        let highestMainMatches = 0;
        
        for (let i = 0; i < ticketsToProcess; i++) {
          const ticketNumbers = generateQuickPick(game);
          const result = compareNumbers(ticketNumbers, drawResult.numbers, drawResult.bonus, game);
          if (result.mainMatchesCount > highestMainMatches) highestMainMatches = result.mainMatchesCount;
          if (result.prizeTier !== "No Prize") {
            const prize = ESTIMATED_PRIZES[game][result.prizeTier] || 0;
            weeklyWinTotal += prize;
            if (prize > 1000) setLastWinType(result.prizeTier);
            // weekNumber를 총 티켓 수에 맞춰 업데이트 (interval count가 아닌)
            newWinners.push({ id: Math.random().toString(36).substr(2, 9), numbers: ticketNumbers, drawNumbers: drawResult.numbers, drawBonus: drawResult.bonus, drawDate: drawResult.drawDate, prizeTier: result.prizeTier, mainMatchesCount: result.mainMatchesCount, bonusMatchesCount: result.bonusMatchesCount, game: game, prizeValue: prize, weekNumber: prevStats.draws + i + 1, isSimulated: true });
          }
        }
        if (highestMainMatches >= (game === 'Oz Lotto' ? 6 : game === 'Powerball' ? 6 : 5)) {
          setNearMiss("SO CLOSE!");
          setTimeout(() => setNearMiss(null), 500);
        }

        if (newWinners.length > 0) {
          autoWinnersRef.current = [...newWinners, ...autoWinnersRef.current].slice(0, MAX_WINNING_FEED_ITEMS);
          setAutoWinnersStateTrigger(prev => prev + 1);
        }
        
        // [수정] stats.draws는 총 생성된 티켓 수를 나타냄
        return { draws: prevStats.draws + ticketsToProcess, spent: prevStats.spent + (ticketsToProcess * TICKET_COST), won: prevStats.won + weeklyWinTotal };
      });
    }, 1000); // interval을 1000ms (1초)로 고정
  }, [drawResult, game, ticketsPerSecRef, autoWinnersRef, setLastWinType, setNearMiss, setAutoWinnersStateTrigger]); // 의존성에서 drawsPerSec 제거

  const handleManualCheck = async () => {
    const required = game === 'Oz Lotto' ? OZ_REQUIRED : game === 'Powerball' ? PB_REQUIRED : TATTS_REQUIRED;
    const completeLines = lines.filter(line => line.numbers.filter(n => n > 0).length === required);
    if (completeLines.length === 0) { alert(`Complete at least one set.`); return; }

    if (drawResult) {
      const currentWinners: WinningResult[] = completeLines.map(line => {
        const result = compareNumbers(line.numbers, drawResult.numbers, drawResult.bonus, game);
        if (result.prizeTier !== "No Prize") return { id: Date.now().toString() + Math.random(), numbers: line.numbers, drawNumbers: drawResult.numbers, drawBonus: drawResult.bonus, drawDate: drawResult.drawDate, prizeTier: result.prizeTier, mainMatchesCount: result.mainMatchesCount, bonusMatchesCount: result.bonusMatchesCount, game: game };
        return null;
      }).filter((r): r is WinningResult => r !== null);
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
    if (!window.confirm("Clear all simulation results?")) return;
    autoWinnersRef.current = [];
    setAutoWinnersStateTrigger(prev => prev + 1);
    setStats({ draws: 0, spent: 0, won: 0 });
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
                <button onClick={() => { setStats({ draws: 0, spent: 0, won: 0 }); autoWinnersRef.current = []; setAutoWinnersStateTrigger(prev => prev + 1); }} className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 font-black uppercase text-[9px] sm:text-[10px] tracking-[0.3em] hover:bg-gray-200 transition-all">Reset Simulation</button>
            </div>
          )}
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border border-gray-100 dark:border-white/5 shadow-xl mb-8 sm:mb-10 space-y-8 sm:space-y-10 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                <div className="space-y-4 sm:space-y-6">
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Simulation Settings</p>
                    <div>
                        <label className="block text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 sm:mb-4">Tickets/Secs: {ticketsPerSec} (Tickets per Second)</label>
                        <input type="range" min="1" max="50" value={ticketsPerSec} onChange={(e) => { setTicketsPerSec(parseInt(e.target.value)); if (isRunning) stopSimulation(); }} className={`w-full accent-emerald-500 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full appearance-none cursor-pointer`} />
                    </div>
                </div>
             
            </div>
            <button onClick={isRunning ? stopSimulation : startSimulation} className={`w-full py-5 sm:py-6 rounded-xl sm:rounded-[2rem] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-sm shadow-2xl transition-all active:scale-95 ${isRunning ? 'bg-red-500 text-white' : `${brandStyles.bg} text-white ${brandStyles.shadow}`}`}>{isRunning ? 'Abort Simulation' : 'Enter Time Machine'}</button>
          </div>
          <div className={`bg-gray-950 rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 text-white shadow-2xl border transition-all duration-500 mb-8 sm:mb-12 relative overflow-hidden ${isRunning ? `${brandStyles.border}/50 ${brandStyles.shadow}` : 'border-white/10'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 relative z-10 text-center md:text-left">
              <div><p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 sm:mb-2">Time Traveled</p><p className="text-3xl sm:text-5xl font-black tabular-nums">{(stats.draws / 52).toFixed(1)}<span className="text-lg sm:text-xl text-gray-600 ml-1 font-serif italic lowercase">yrs</span></p></div>
              <div><p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 sm:mb-2">Total "Spent"</p><p className="text-3xl sm:text-5xl font-black text-red-500 tabular-nums tracking-tighter">{formatCurrency(stats.spent)}</p></div>
              <div><p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 sm:mb-2">Total Won</p><p className={`text-3xl sm:text-5xl font-black text-emerald-400 tabular-nums tracking-tighter`}>{formatCurrency(stats.won)}</p></div>
            </div>
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-10 border-t border-white/5 text-center relative z-10">
              <p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-1 sm:mb-2">Temporal Balance</p>
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
                          <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 sm:px-3 py-1 rounded-md sm:rounded-lg bg-gray-100 dark:bg-white/10 ${brandStyles.text}`}>{winner.drawDate} {winner.weekNumber && `• Week ${winner.weekNumber}`}</span>
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
