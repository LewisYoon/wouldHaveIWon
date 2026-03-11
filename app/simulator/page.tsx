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

  // Branding Helpers
  const isOz = game === 'Oz Lotto';
  const isTatts = game === 'Tatts Lotto';
  const brandColor = isOz ? 'emerald' : isTatts ? 'red' : 'indigo';
  
  const brandStyles = {
    text: isOz ? 'text-emerald-600 dark:text-emerald-400' : isTatts ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400',
    bg: isOz ? 'bg-emerald-600' : isTatts ? 'bg-red-600' : 'bg-indigo-600',
    border: isOz ? 'border-emerald-500' : isTatts ? 'border-red-500' : 'border-indigo-500',
    bgLight: isOz ? 'bg-emerald-50 dark:bg-emerald-950/30' : isTatts ? 'bg-red-50 dark:bg-red-950/30' : 'bg-indigo-50 dark:bg-indigo-950/30',
    shadow: isOz ? 'shadow-emerald-500/20' : isTatts ? 'shadow-red-500/20' : 'shadow-indigo-500/20'
  };

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

  if (isLoading) return <div className={`flex min-h-screen items-center justify-center bg-white dark:bg-gray-950 font-black ${brandStyles.text} animate-pulse uppercase tracking-widest text-sm transition-colors duration-500`}>Loading Simulator...</div>;

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-950 pb-32 transition-colors duration-500 overflow-x-hidden text-gray-900 dark:text-gray-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "WhatIFLotto Australian Lotto Simulator",
            "operatingSystem": "Web",
            "applicationCategory": "EducationalApplication",
            "description": "A high-speed Australian lotto simulator for Oz Lotto, Powerball, and Tatts Lotto. Test your odds risk-free.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "AUD"
            }
          })
        }}
      />
      {showConfetti && <Confetti numberOfPieces={300} recycle={false} />}

      <main className="flex w-full flex-col items-center px-4 sm:px-10 md:px-20 text-center pt-8 sm:pt-16 relative z-10">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] bg-[radial-gradient(#4f46e5_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none -z-10" />

        <div className="mb-10 sm:mb-16 animate-in fade-in slide-in-from-top-8 duration-700 w-full">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-6 sm:mb-10 leading-none">
            Lotto <span className={`${brandStyles.text} italic font-serif lowercase`}>Simulator</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3 justify-center">
            {['Oz Lotto', 'Powerball', 'Tatts Lotto'].map((g) => (
              <button
                key={g}
                onClick={() => setGame(g as any)}
                className={`flex-1 sm:flex-none px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-[2rem] text-[10px] sm:text-sm font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all duration-300 transform active:scale-95 ${
                  game === g 
                    ? (g === 'Oz Lotto' ? 'bg-emerald-600 text-white shadow-xl scale-105' : g === 'Tatts Lotto' ? 'bg-red-600 text-white shadow-xl scale-105' : 'bg-indigo-600 text-white shadow-xl scale-105')
                    : 'bg-white dark:bg-white/5 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 shadow-sm'
                }`}
              >
                {g}
              </button>
            ))}
             <button onClick={() => setIsRulesModalOpen(true)} className="ml-auto bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black text-base sm:text-lg shadow-sm border border-gray-200 dark:border-white/10">?</button>
          </div>
        </div>

        {/* Setup Winning Draw */}
        <div className="w-full max-w-2xl mb-10 sm:mb-16 space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left">
          <div className="bg-white dark:bg-gray-900 p-1.5 sm:p-2 rounded-2xl sm:rounded-[2.5rem] border border-gray-100 dark:border-white/5 flex overflow-hidden max-w-md mx-auto shadow-xl group hover:border-indigo-500/30">
            {(['official', 'random', 'manual'] as const).map((mode) => (
              <button key={mode} onClick={() => handleDrawModeChange(mode)} className={`flex-1 py-3 sm:py-4 px-3 sm:px-6 rounded-xl sm:rounded-[2rem] text-[9px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${drawMode === mode ? `${brandStyles.bg} text-white shadow-lg` : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                {mode === 'official' ? 'Real' : mode === 'random' ? 'Rand' : 'Pick'}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-gray-100 dark:border-white/5 transition-all duration-700 overflow-hidden relative shadow-2xl hover:shadow-indigo-500/10 group">
            <div className={`absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 rounded-full -mr-16 -mt-16 sm:-mr-24 sm:-mt-24 transition-transform duration-1000 group-hover:scale-150 ${brandStyles.bgLight}`} />
            <div className="relative z-10 text-center">
              {drawMode === 'official' && (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                  {officialResult ? (
                    <>
                      <p className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] mb-3 sm:mb-4 ${brandStyles.text}`}>Official Result</p>
                      <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-6 sm:mb-10 tracking-tight">Date: {officialResult.drawDate}</p>
                      <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
                        {officialResult.numbers.map((n, i) => (
                          <span key={`off-${i}`} className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full text-white flex items-center justify-center font-black shadow-xl border-b-[4px] sm:border-b-[6px] text-base sm:text-xl transition-transform hover:-translate-y-1 duration-300 ${brandStyles.bg} border-black/20`}>{n}</span>
                        ))}
                        <div className="w-px h-10 sm:h-14 bg-gray-200 dark:bg-white/10 mx-1 sm:mx-2" />
                        {officialResult.bonus.map((n, i) => (
                          <span key={`off-b-${i}`} className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-xl border-b-[4px] sm:border-b-[6px] border-amber-600 text-base sm:text-xl transition-transform hover:-translate-y-1 duration-300">{n}</span>
                        ))}
                      </div>
                    </>
                  ) : <div className={`py-6 sm:py-10 ${brandStyles.text} font-black italic animate-pulse tracking-[0.2em] text-[10px] sm:text-xs uppercase`}>Fetching latest draw...</div>}
                </div>
              )}

              {drawMode === 'random' && (
                <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
                  <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
                    <p className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] ${brandStyles.text}`}>Random Generator</p>
                    <button onClick={generateRandomResult} className={`p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 hover:${brandStyles.text} transition-colors`} title="Regenerate Numbers">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-4 justify-center min-h-[40px] sm:min-h-[56px]">
                    {customResult.numbers.length > 0 ? (
                      <>
                        {customResult.numbers.map((n, i) => (
                          <span key={`rand-${i}`} className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full text-white flex items-center justify-center font-black shadow-xl border-b-[4px] sm:border-b-[6px] border-black/20 text-base sm:text-xl transition-transform hover:-translate-y-1 duration-300 ${brandStyles.bg}`}>{n}</span>
                        ))}
                        <div className="w-px h-10 sm:h-14 bg-gray-200 dark:bg-white/10 mx-1 sm:mx-2" />
                        {customResult.bonus.map((n, i) => (
                          <span key={`rand-b-${i}`} className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-xl border-b-[4px] sm:border-b-[6px] border-amber-600 text-base sm:text-xl transition-transform hover:-translate-y-1 duration-300">{n}</span>
                        ))}
                      </>
                    ) : <div className="h-10 sm:h-14 flex items-center text-gray-300 font-black italic tracking-[0.3em] uppercase text-[10px] sm:text-xs">Generating...</div>}
                  </div>
                </div>
              )}

              {drawMode === 'manual' && (
                <div className="animate-in fade-in zoom-in-95 duration-500 space-y-8 sm:space-y-12 text-left">
                  <p className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-center ${brandStyles.text}`}>Set Up Custom Target</p>
                  <div className="space-y-8 sm:space-y-12">
                    <div>
                      <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase mb-4 sm:mb-6 tracking-[0.2em] ml-2 sm:ml-4">1. Main Numbers ({game === 'Tatts Lotto' ? 6 : 7})</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2.5 justify-center bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-inner">
                        {Array.from({ length: isOz ? 47 : isTatts ? 45 : 35 }, (_, i) => i + 1).map(num => {
                          const isMain = customResult.numbers.includes(num);
                          const required = isTatts ? 6 : 7;
                          const disabled = !isMain && customResult.numbers.length >= required;
                          return (
                            <button key={num} disabled={disabled} onClick={() => { const newNumbers = isMain ? customResult.numbers.filter(n => n !== num) : [...customResult.numbers, num].sort((a,b) => a-b); setCustomResult(prev => ({ ...prev, numbers: newNumbers })); }} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full text-[9px] sm:text-[11px] font-black transition-all duration-300 ${isMain ? `${brandStyles.bg} text-white scale-110 shadow-lg` : 'bg-white dark:bg-white/5 text-gray-400 border border-gray-200 dark:border-white/10 hover:border-indigo-300 shadow-sm'} ${disabled ? 'opacity-20 grayscale' : ''}`}>{num}</button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] sm:text-[10px] font-black text-amber-600 uppercase mb-4 sm:mb-6 tracking-[0.2em] ml-2 sm:ml-4">2. Bonus Numbers ({isOz ? '3' : isTatts ? '2' : '1'})</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2.5 justify-center bg-amber-50/30 dark:bg-amber-500/5 p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-amber-100 dark:border-amber-500/10 shadow-inner">
                        {Array.from({ length: isOz || isTatts ? 45 : 20 }, (_, i) => i + 1).map(num => {
                          const isSupp = customResult.bonus.includes(num);
                          const maxSupp = isOz ? 3 : isTatts ? 2 : 1;
                          const disabled = !isSupp && customResult.bonus.length >= maxSupp;
                          return (
                            <button key={num} disabled={disabled} onClick={() => { const newBonus = isSupp ? customResult.bonus.filter(n => n !== num) : [...customResult.bonus, num].sort((a,b) => a-b); setCustomResult(prev => ({ ...prev, bonus: newBonus })); }} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full text-[9px] sm:text-[11px] font-black transition-all duration-300 ${isSupp ? 'bg-amber-400 text-amber-950 scale-110 shadow-lg' : 'bg-white dark:bg-white/5 text-gray-400 border border-gray-200 dark:border-white/10 hover:border-amber-400 shadow-sm'} ${disabled ? 'opacity-20 grayscale' : ''}`}>{num}</button>
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

        {/* Classic Mode Results */}
        {simMode === 'classic' && allComparisonResults && (
          <div ref={resultsRef} className="w-full max-w-6xl mt-12 sm:mt-24 space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 text-left px-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
              <div className={`p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border transition-all duration-700 relative overflow-hidden text-white shadow-2xl hover:scale-[1.01] group ${game === 'Oz Lotto' ? 'bg-emerald-950 border-emerald-500/20' : game === 'Tatts Lotto' ? 'bg-red-950 border-red-500/20' : 'bg-indigo-950 border-indigo-500/20'}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 rounded-full -mr-16 -mt-16 sm:-mr-24 sm:-mt-24 transition-transform duration-[2s] group-hover:scale-150 ${game === 'Oz Lotto' ? 'bg-emerald-500/5' : game === 'Tatts Lotto' ? 'bg-red-500/5' : 'bg-indigo-500/5'}`} />
                <p className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[0.4em] mb-6 sm:mb-10 ${isOz ? 'text-emerald-400' : isTatts ? 'text-red-400' : 'text-indigo-400'}`}>Simulation Result</p>
                <h3 className="text-2xl sm:text-4xl font-black mb-8 sm:mb-12 tracking-tighter italic text-white leading-tight">"{luckNarrative}"</h3>
                <div className="flex items-center gap-4 sm:gap-6 relative z-10">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex items-center justify-center text-2xl sm:text-3xl shadow-inner ${isOz ? 'bg-emerald-500/10' : isTatts ? 'bg-red-500/10' : 'bg-indigo-500/10'}`}>📊</div>
                  <div><p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${isOz ? 'text-emerald-400' : isTatts ? 'text-red-400' : 'text-indigo-400'}`}>Return on Investment</p><p className="text-3xl sm:text-4xl font-black text-white tracking-tighter">{stats.roi.toFixed(1)}%</p></div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-gray-100 dark:border-white/5 shadow-2xl">
                <p className="text-[9px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6 sm:mb-10">{realWorldValue.label}</p>
                <div className="space-y-4 sm:space-y-6">
                  {realWorldValue.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl sm:rounded-3xl transition-all duration-500 group hover:bg-white dark:hover:bg-gray-800 shadow-sm hover:shadow-md"><span className="font-bold text-gray-600 dark:text-gray-400 text-base sm:text-lg">{item.name}</span><span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter transition-transform group-hover:scale-110">{item.qty.toLocaleString()}x</span></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 text-left">
              <div className="bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-xl">
                <p className="text-[9px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 sm:mb-4">Total Cost</p><p className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">{formatCurrency(stats.totalSpent)}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-xl">
                <p className="text-[9px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 sm:mb-4">Total Won</p><p className={`text-3xl sm:text-5xl font-black ${brandStyles.text} tracking-tighter`}>{formatCurrency(stats.totalWon)}</p>
              </div>
              <div className={`p-8 sm:p-10 rounded-2xl sm:rounded-[3rem] border shadow-2xl sm:col-span-2 md:col-span-1 ${stats.profit >= 0 ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-rose-600 border-rose-700 text-white'}`}>
                <p className="text-[9px] sm:text-[11px] font-black text-white/60 uppercase tracking-[0.3em] mb-3 sm:mb-4">Net Profit/Loss</p><p className="text-3xl sm:text-5xl font-black tracking-tighter">{formatCurrency(stats.profit)}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-gray-100 dark:border-white/5 text-left shadow-2xl">
              <h2 className="text-2xl sm:text-4xl font-black mb-8 sm:mb-12 tracking-tighter uppercase italic">Draw Analysis</h2>
              <div className="grid grid-cols-1 gap-3 sm:gap-4 max-h-[600px] sm:max-h-[800px] overflow-y-auto pr-2 sm:pr-4 custom-scrollbar">
                {allComparisonResults?.map((result, index) => {
                  const hasPrize = result.prizeTier !== "No Prize";
                  const prizeAmt = activeResult?.prizes[result.prizeTier] || 0;
                  return (
                    <div key={index} className={`flex flex-row items-center justify-between p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] transition-all duration-500 border group hover:-translate-y-1 ${hasPrize ? `${brandStyles.bgLight} border-${brandColor}-200 dark:border-${brandColor}-500/20 shadow-lg` : 'bg-gray-50/30 dark:bg-white/5 border-gray-100 dark:border-white/5 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 hover:shadow-md'}`}>
                      <div className="flex items-center gap-4 sm:gap-8">
                        <span className="text-[10px] sm:text-[12px] font-black text-gray-300 dark:text-gray-700 w-6 sm:w-8 transition-colors group-hover:text-indigo-500">{String(index + 1).padStart(2, '0')}</span>
                        <div>
                          <p className="text-sm sm:text-lg font-black text-gray-800 dark:text-white tracking-tight">{result.mainMatchesCount} Main {game === 'Powerball' ? `+ ${result.bonusMatchesCount > 0 ? 'PB' : 'No PB'}` : `+ ${result.bonusMatchesCount} Supps`}</p>
                          <p className={`text-[8px] sm:text-[11px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] mt-0.5 sm:mt-1 ${hasPrize ? brandStyles.text : 'text-gray-400'}`}>{result.prizeTier}</p>
                        </div>
                      </div>
                      <div className="text-right"><p className={`text-xl sm:text-3xl font-black tracking-tighter transition-all duration-500 group-hover:scale-110 ${hasPrize ? brandStyles.text : 'text-gray-200'}`}>{hasPrize ? formatCurrency(prizeAmt) : formatCurrency(0)}</p></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Static Educational Content for AdSense/SEO */}
      <section className="max-w-4xl mx-auto px-6 py-32 text-left border-t border-gray-100 dark:border-white/5 mt-20">
        <h2 className="text-4xl font-black mb-12 uppercase tracking-tighter italic">Lotto Simulation Technology</h2>
        <div className="prose prose-indigo dark:prose-invert max-w-none space-y-10 text-lg text-gray-600 dark:text-gray-400 font-medium leading-relaxed text-left">
          <p>
            WhatIFLotto's simulation engine is built on the principles of true mathematical randomness and historical data analysis. Whether you are using our <strong>Classic Mode</strong> to check a single week's luck or our <strong>Turbo Mode</strong> to simulate a lifetime of play, the goal remains the same: education through visualization.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 not-prose">
            <div className="space-y-4">
              <h3 className="text-xl font-black uppercase text-gray-900 dark:text-white">Why We Simulate?</h3>
              <p className="text-sm">Human brains are not naturally evolved to understand probabilities like 1 in 134,490,400 (the odds of winning Powerball Division 1). Simulation allows you to compress time and see these odds play out thousands of times in seconds.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-black uppercase text-gray-900 dark:text-white">The "Reality Check"</h3>
              <p className="text-sm">By comparing simulated winnings to real-world items like luxury cars or everyday coffees, we provide a tangible context to lottery outcomes. It’s one thing to see a loss; it’s another to see how many "dream vacations" were spent to get there.</p>
            </div>
          </div>

          <p>
            Our simulator adheres strictly to the official rules of the Australian lottery. This includes correct ball pools (e.g., 7 from 35 for Powerball), correct supplementary/powerball logic, and exact prize division structures. We update our prize pool estimates regularly to reflect current Australian jackpot trends.
          </p>

          <footer className="pt-10 border-t border-gray-100 dark:border-white/10">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Independent Simulation • Official Rules • 100% Risk-Free
            </p>
          </footer>
        </div>
      </section>

      <DivisionRules game={game} isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
    </div>
  );
}
