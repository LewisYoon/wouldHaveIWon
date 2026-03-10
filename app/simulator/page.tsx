'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import NumberPicker from '../../components/NumberPicker';
import LottoLinePicker from '../../components/LottoLinePicker';
import DivisionRules from '../../components/DivisionRules';
import { compareNumbers, ComparisonResult, generateQuickPick } from '../../lib/lotto-utils';
import Confetti from 'react-confetti';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface DrawResult {
  game: string;
  drawDate: string;
  numbers: number[];
  bonus: number[];
  prizes: Record<string, number>;
}

const TICKET_COST = 1.45;

export default function SimulatorPage() {
  const { user, isLoading } = useAuth();
  const [game, setGame] = useState<'Oz Lotto' | 'Powerball' | 'Tatts Lotto'>('Oz Lotto');
  const [simMode, setSimMode] = useState<'classic' | 'auto'>('classic');
  const [allComparisonResults, setAllComparisonResults] = useState<ComparisonResult[] | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  
  const [officialResult, setOfficialResult] = useState<DrawResult | null>(null);
  const [customResult, setCustomResult] = useState<DrawResult>({
    game: 'Custom Draw',
    drawDate: 'Simulated',
    numbers: [],
    bonus: [],
    prizes: {
      "Division 1": 10000000, "Division 2": 50000, "Division 3": 5000,
      "Division 4": 400, "Division 5": 50, "Division 6": 25,
      "Division 7": 15, "Division 8": 10, "Division 9": 5, "No Prize": 0
    }
  });
  
  const [drawMode, setDrawMode] = useState<'official' | 'random' | 'manual'>('official');
  const resultsRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState({
    totalSpent: 0, totalWon: 0, profit: 0, winCount: 0, jackpotHit: false, roi: 0
  });

  const generateRandomResult = useCallback(() => {
    const main = generateQuickPick(game);
    if (game === 'Oz Lotto') {
      const supp: number[] = [];
      while (supp.length < 3) {
        const num = Math.floor(Math.random() * 47) + 1;
        if (!main.includes(num) && !supp.includes(num)) supp.push(num);
      }
      setCustomResult(prev => ({ ...prev, numbers: main, bonus: supp.sort((a,b) => a-b) }));
    } else if (game === 'Tatts Lotto') {
      const supp: number[] = [];
      while (supp.length < 2) {
        const num = Math.floor(Math.random() * 45) + 1;
        if (!main.includes(num) && !supp.includes(num)) supp.push(num);
      }
      setCustomResult(prev => ({ ...prev, numbers: main, bonus: supp.sort((a,b) => a-b) }));
    } else {
      const mainPB = main.slice(0, 7);
      const pb = main[7];
      setCustomResult(prev => ({ ...prev, numbers: mainPB, bonus: [pb] }));
    }
  }, [game]);

  useEffect(() => {
    const fetchLatestResult = async () => {
      setOfficialResult(null);
      handleClearAllResults();
      
      // If we are in random or manual mode, clear/refresh custom result to match new game format
      if (drawMode !== 'official') {
          setCustomResult(prev => ({ ...prev, numbers: [], bonus: [] }));
          if (drawMode === 'random') generateRandomResult();
      }

      try {
        const { data } = await supabase.from('draw_results').select('*').eq('game', game).order('draw_date', { ascending: false }).limit(1).maybeSingle();
        if (data) setOfficialResult({ game: data.game, drawDate: data.draw_date, numbers: data.numbers, bonus: data.bonus, prizes: data.prizes });
      } catch (err) { console.error("Failed to fetch result:", err); }
    };
    fetchLatestResult();
  }, [game, drawMode, generateRandomResult]);

  const activeResult = drawMode === 'official' ? officialResult : customResult;

  // Handle drawMode change
  const handleDrawModeChange = (mode: 'official' | 'random' | 'manual') => {
    setDrawMode(mode);
    if (mode === 'random') generateRandomResult();
  };

  const handleCheckAllResults = (allLines: number[][]) => {
    if (!activeResult || activeResult.numbers.length < (game === 'Tatts Lotto' ? 6 : 7)) {
      alert("Please ensure the winning numbers are set first.");
      return;
    }

    const results: ComparisonResult[] = [];
    let currentWon = 0;
    let currentWins = 0;
    let hitJackpot = false;

    allLines.forEach(userNumbers => {
      const result = compareNumbers(userNumbers, activeResult.numbers, activeResult.bonus, game);
      results.push(result);
      const prize = activeResult.prizes[result.prizeTier] || 0;
      currentWon += prize;
      if (result.prizeTier !== "No Prize") {
        currentWins++;
        if (result.prizeTier === "Division 1") hitJackpot = true;
      }
    });

    const spent = allLines.length * TICKET_COST;
    setStats({ totalSpent: spent, totalWon: currentWon, profit: currentWon - spent, winCount: currentWins, jackpotHit: hitJackpot, roi: spent > 0 ? (currentWon / spent) * 100 : 0 });
    setAllComparisonResults(results);
    if (currentWins > 0) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 10000); }
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleClearAllResults = () => {
    setAllComparisonResults(null);
    setShowConfetti(false);
    setStats({ totalSpent: 0, totalWon: 0, profit: 0, winCount: 0, jackpotHit: false, roi: 0 });
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);

  const realWorldValue = useMemo(() => {
    const absProfit = Math.abs(stats.profit);
    if (stats.profit >= 0) {
      return { label: "What you could buy", items: [ { name: "Flat White Coffees", qty: Math.floor(stats.totalWon / 5.5) }, { name: "Electric Scooters", qty: Math.floor(stats.totalWon / 800) }, { name: "Luxury Hotel Nights", qty: Math.floor(stats.totalWon / 1200) } ] };
    } else {
      return { label: "What you could have bought instead", items: [ { name: "Yearly Subscriptions", qty: Math.floor(absProfit / 240) }, { name: "Premium Dining Meals", qty: Math.floor(absProfit / 25) }, { name: "Fuel Tank Refills", qty: Math.floor(absProfit / 100) } ] };
    }
  }, [stats.profit, stats.totalWon]);

  const luckNarrative = useMemo(() => {
    if (stats.jackpotHit) return "JACKPOT! You actually hit the Division 1 prize!";
    if (stats.roi > 100) return "AMAZING LUCK: You beat the house today!";
    if (stats.roi > 50) return "NOT BAD: You won back some of your spend.";
    if (allComparisonResults && stats.totalWon === 0) return "TOTAL WIPEOUT: Not a single match this time.";
    return "USUAL LUCK: The house edge is working as expected.";
  }, [stats, allComparisonResults]);

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950 font-black text-indigo-600 animate-pulse uppercase tracking-widest text-sm transition-colors duration-500">Loading Simulator...</div>;

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-950 pb-32 transition-colors duration-500 overflow-x-hidden text-gray-900 dark:text-gray-100">
      <Navbar />
      {showConfetti && <Confetti numberOfPieces={300} recycle={false} />}

      <main className="flex w-full flex-col items-center px-6 md:px-20 text-center pt-16 relative z-10">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] bg-[radial-gradient(#4f46e5_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none -z-10" />

        <div className="mb-16 animate-in fade-in slide-in-from-top-8 duration-700">
          <h1 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-10">
            Lotto <span className="text-indigo-600 dark:text-indigo-400 italic font-serif lowercase">Simulator</span>
          </h1>
          <div className="flex items-center gap-4 justify-center">
            {['Oz Lotto', 'Powerball', 'Tatts Lotto'].map((g) => (
              <button
                key={g}
                onClick={() => setGame(g as any)}
                className={`px-10 py-4 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 transform active:scale-95 ${
                  game === g 
                    ? (g === 'Oz Lotto' ? 'bg-emerald-600 text-white shadow-xl scale-105' : g === 'Tatts Lotto' ? 'bg-red-600 text-white shadow-xl scale-105' : 'bg-indigo-600 text-white shadow-xl scale-105')
                    : 'bg-white dark:bg-white/5 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 shadow-sm'
                }`}
              >
                {g}
              </button>
            ))}
             <button onClick={() => setIsRulesModalOpen(true)} className="ml-auto bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors w-14 h-14 rounded-full flex items-center justify-center font-black text-lg">?</button>
          </div>
        </div>

        {/* Setup Winning Draw */}
        <div className="w-full max-w-2xl mb-16 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="bg-white dark:bg-gray-900 p-2 rounded-[2.5rem] border border-gray-100 dark:border-white/5 flex overflow-hidden max-w-md mx-auto shadow-xl group hover:border-indigo-500/30">
            {(['official', 'random', 'manual'] as const).map((mode) => (
              <button key={mode} onClick={() => handleDrawModeChange(mode)} className={`flex-1 py-4 px-6 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${drawMode === mode ? 'bg-gray-900 dark:bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                {mode === 'official' ? 'Real Draw' : mode === 'random' ? 'Random' : 'Pick Own'}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 p-12 rounded-[4rem] border border-gray-100 dark:border-white/5 transition-all duration-700 overflow-hidden relative shadow-2xl hover:shadow-indigo-500/10 group">
            <div className={`absolute top-0 right-0 w-48 h-48 rounded-full -mr-24 -mt-24 transition-transform duration-1000 group-hover:scale-150 ${game === 'Oz Lotto' ? 'bg-emerald-50/50' : game === 'Tatts Lotto' ? 'bg-red-50/50' : 'bg-indigo-50/50'}`} />
            <div className="relative z-10">
              {drawMode === 'official' && (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                  {officialResult ? (
                    <>
                      <p className={`text-[11px] font-black uppercase tracking-[0.3em] mb-4 ${game === 'Oz Lotto' ? 'text-emerald-600' : game === 'Tatts Lotto' ? 'text-red-600' : 'text-indigo-600'}`}>Official Result</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white mb-10 tracking-tight">Draw Date: {officialResult.drawDate}</p>
                      <div className="flex flex-wrap gap-4 justify-center">
                        {officialResult.numbers.map((n, i) => (
                          <span key={`off-${i}`} className={`w-14 h-14 rounded-full text-white flex items-center justify-center font-black shadow-xl border-b-[6px] text-xl transition-transform hover:-translate-y-1 duration-300 ${game === 'Oz Lotto' ? 'bg-emerald-500 border-emerald-700' : game === 'Tatts Lotto' ? 'bg-red-500 border-red-700' : 'bg-indigo-500 border-indigo-700'}`}>{n}</span>
                        ))}
                        <div className="w-px h-14 bg-gray-200 dark:bg-white/10 mx-2" />
                        {officialResult.bonus.map((n, i) => (
                          <span key={`off-b-${i}`} className="w-14 h-14 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-xl border-b-[6px] border-amber-600 text-xl transition-transform hover:-translate-y-1 duration-300">{n}</span>
                        ))}
                      </div>
                    </>
                  ) : <div className="py-10 text-gray-400 font-black italic animate-pulse tracking-[0.2em] text-xs uppercase">Fetching latest draw...</div>}
                </div>
              )}

              {drawMode === 'random' && (
                <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
                  <div className="flex items-center gap-4 mb-10">
                    <p className="text-[11px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.3em]">Random Draw Generator</p>
                    <button onClick={generateRandomResult} className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-purple-500 transition-colors" title="Regenerate Numbers">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-4 justify-center min-h-[56px]">
                    {customResult.numbers.length > 0 ? (
                      <>
                        {customResult.numbers.map((n, i) => (
                          <span key={`rand-${i}`} className={`w-14 h-14 rounded-full text-white flex items-center justify-center font-black shadow-xl border-b-[6px] text-xl transition-transform hover:-translate-y-1 duration-300 ${game === 'Oz Lotto' ? 'bg-emerald-600 border-emerald-800' : game === 'Tatts Lotto' ? 'bg-red-600 border-red-800' : 'bg-indigo-600 border-indigo-800'}`}>{n}</span>
                        ))}
                        <div className="w-px h-14 bg-gray-200 dark:bg-white/10 mx-2" />
                        {customResult.bonus.map((n, i) => (
                          <span key={`rand-b-${i}`} className="w-14 h-14 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-xl border-b-[6px] border-amber-600 text-xl transition-transform hover:-translate-y-1 duration-300">{n}</span>
                        ))}
                      </>
                    ) : <div className="h-14 flex items-center text-gray-300 font-black italic tracking-[0.3em] uppercase text-xs">Generating...</div>}
                  </div>
                </div>
              )}

              {drawMode === 'manual' && (
                <div className="animate-in fade-in zoom-in-95 duration-500 space-y-12 text-left">
                  <p className="text-[11px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.3em] text-center">Set Up Winning Numbers</p>
                  <div className="space-y-12">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-6 tracking-[0.2em] ml-4">1. Main Numbers ({game === 'Tatts Lotto' ? 6 : 7})</p>
                      <div className="flex flex-wrap gap-2.5 justify-center bg-gray-50 dark:bg-gray-800/50 p-8 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-inner">
                        {Array.from({ length: game === 'Oz Lotto' ? 47 : game === 'Tatts Lotto' ? 45 : 35 }, (_, i) => i + 1).map(num => {
                          const isMain = customResult.numbers.includes(num);
                          const required = game === 'Tatts Lotto' ? 6 : 7;
                          const disabled = !isMain && customResult.numbers.length >= required;
                          return (
                            <button key={num} disabled={disabled} onClick={() => { const newNumbers = isMain ? customResult.numbers.filter(n => n !== num) : [...customResult.numbers, num].sort((a,b) => a-b); setCustomResult(prev => ({ ...prev, numbers: newNumbers })); }} className={`w-10 h-10 rounded-full text-[11px] font-black transition-all duration-300 ${isMain ? (game === 'Oz Lotto' ? 'bg-emerald-600 text-white scale-110 shadow-lg' : game === 'Tatts Lotto' ? 'bg-red-600 text-white scale-110 shadow-lg' : 'bg-indigo-600 text-white scale-110 shadow-lg') : 'bg-white dark:bg-white/5 text-gray-400 border border-gray-200 dark:border-white/10 hover:border-indigo-300 shadow-sm'} ${disabled ? 'opacity-20 grayscale' : ''}`}>{num}</button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-amber-600 uppercase mb-6 tracking-[0.2em] ml-4">2. Bonus Numbers ({game === 'Oz Lotto' ? '3' : game === 'Tatts Lotto' ? '2' : '1'})</p>
                      <div className="flex flex-wrap gap-2.5 justify-center bg-amber-50/30 dark:bg-amber-500/5 p-8 rounded-[3rem] border border-amber-100 dark:border-amber-500/10 shadow-inner">
                        {Array.from({ length: game === 'Oz Lotto' || game === 'Tatts Lotto' ? 45 : 20 }, (_, i) => i + 1).map(num => {
                          const isSupp = customResult.bonus.includes(num);
                          const maxSupp = game === 'Oz Lotto' ? 3 : game === 'Tatts Lotto' ? 2 : 1;
                          const disabled = !isSupp && customResult.bonus.length >= maxSupp;
                          return (
                            <button key={num} disabled={disabled} onClick={() => { const newBonus = isSupp ? customResult.bonus.filter(n => n !== num) : [...customResult.bonus, num].sort((a,b) => a-b); setCustomResult(prev => ({ ...prev, bonus: newBonus })); }} className={`w-10 h-10 rounded-full text-[11px] font-black transition-all duration-300 ${isSupp ? 'bg-amber-400 text-amber-950 scale-110 shadow-lg' : 'bg-white dark:bg-white/5 text-gray-400 border border-gray-200 dark:border-white/10 hover:border-amber-400 shadow-sm'} ${disabled ? 'opacity-20 grayscale' : ''}`}>{num}</button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <NumberPicker 
            onCheckAllResults={handleCheckAllResults} 
            onClearAll={handleClearAllResults} 
            resultsRef={resultsRef} 
            drawResult={activeResult} 
            game={game} 
            onModeChange={setSimMode}
          />
        </div>

        {/* Results Sections (Only in Classic Mode) */}
        {simMode === 'classic' && allComparisonResults && (
          <div ref={resultsRef} className="w-full max-w-6xl mt-24 space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className={`p-12 rounded-[4rem] text-left border transition-all duration-700 relative overflow-hidden text-white shadow-2xl hover:scale-[1.01] group ${game === 'Oz Lotto' ? 'bg-emerald-950 border-emerald-500/20' : game === 'Tatts Lotto' ? 'bg-red-950 border-red-500/20' : 'bg-indigo-950 border-indigo-500/20'}`}>
                <div className={`absolute top-0 right-0 w-48 h-48 rounded-full -mr-24 -mt-24 transition-transform duration-[2s] group-hover:scale-150 ${game === 'Oz Lotto' ? 'bg-emerald-500/5' : game === 'Tatts Lotto' ? 'bg-red-500/5' : 'bg-indigo-500/5'}`} />
                <p className={`text-[11px] font-black uppercase tracking-[0.4em] mb-10 ${game === 'Oz Lotto' ? 'text-emerald-400' : game === 'Tatts Lotto' ? 'text-red-400' : 'text-indigo-400'}`}>Simulation Result</p>
                <h3 className="text-3xl md:text-4xl font-black mb-12 tracking-tighter italic text-white">"{luckNarrative}"</h3>
                <div className="flex items-center gap-6 relative z-10">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-inner ${game === 'Oz Lotto' ? 'bg-emerald-500/10' : game === 'Tatts Lotto' ? 'bg-red-500/10' : 'bg-indigo-500/10'}`}>📊</div>
                  <div><p className={`text-xs font-bold uppercase tracking-widest ${game === 'Oz Lotto' ? 'text-emerald-400' : game === 'Tatts Lotto' ? 'text-red-400' : 'text-indigo-400'}`}>Return on Investment</p><p className="text-4xl font-black text-white tracking-tighter">{stats.roi.toFixed(1)}%</p></div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-12 rounded-[4rem] border border-gray-100 dark:border-white/5 text-left shadow-2xl">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] mb-10">{realWorldValue.label}</p>
                <div className="space-y-6">
                  {realWorldValue.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl transition-all duration-500 group hover:bg-white dark:hover:bg-gray-800 shadow-sm hover:shadow-md"><span className="font-bold text-gray-600 dark:text-gray-400 text-lg">{item.name}</span><span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter transition-transform group-hover:scale-110">{item.qty.toLocaleString()}x</span></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-xl">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Total Cost</p><p className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">{formatCurrency(stats.totalSpent)}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-xl">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Total Won</p><p className="text-5xl font-black text-emerald-600 tracking-tighter">{formatCurrency(stats.totalWon)}</p>
              </div>
              <div className={`p-10 rounded-[3rem] border shadow-2xl ${stats.profit >= 0 ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-rose-600 border-rose-700 text-white'}`}>
                <p className="text-[11px] font-black text-white/60 uppercase tracking-[0.3em] mb-4">Net Profit/Loss</p><p className="text-5xl font-black tracking-tighter">{formatCurrency(stats.profit)}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-12 rounded-[4rem] border border-gray-100 dark:border-white/5 text-left shadow-2xl">
              <h2 className="text-4xl font-black mb-12 tracking-tighter uppercase italic">Draw Analysis</h2>
              <div className="grid grid-cols-1 gap-4 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar">
                {allComparisonResults?.map((result, index) => {
                  const hasPrize = result.prizeTier !== "No Prize";
                  const prizeAmt = activeResult?.prizes[result.prizeTier] || 0;
                  return (
                    <div key={index} className={`flex flex-col sm:flex-row sm:items-center justify-between p-8 rounded-[2.5rem] transition-all duration-500 border group hover:-translate-y-1 ${hasPrize ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20 shadow-lg' : 'bg-gray-50/30 dark:bg-white/5 border-gray-100 dark:border-white/5 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 hover:shadow-md'}`}>
                      <div className="flex items-center gap-8">
                        <span className="text-[12px] font-black text-gray-300 dark:text-gray-700 w-8 transition-colors group-hover:text-indigo-500">{String(index + 1).padStart(2, '0')}</span>
                        <div>
                          <p className="text-lg font-black text-gray-800 dark:text-white tracking-tight">{result.mainMatchesCount} Main {game === 'Powerball' ? `+ ${result.bonusMatchesCount > 0 ? 'PB' : 'No PB'}` : `+ ${result.bonusMatchesCount} Supps`}</p>
                          <p className={`text-[11px] font-bold uppercase tracking-[0.2em] mt-1 ${hasPrize ? 'text-emerald-600' : 'text-gray-400'}`}>{result.prizeTier}</p>
                        </div>
                      </div>
                      <div className="text-right mt-6 sm:mt-0"><p className={`text-3xl font-black tracking-tighter transition-all duration-500 group-hover:scale-110 ${hasPrize ? 'text-emerald-600' : 'text-gray-200'}`}>{hasPrize ? formatCurrency(prizeAmt) : formatCurrency(0)}</p></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
      <DivisionRules game={game} isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
    </div>
  );
}
