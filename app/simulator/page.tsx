'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import NumberPicker from '../../components/NumberPicker';
import LottoLinePicker from '../../components/LottoLinePicker';
import { compareNumbers, ComparisonResult, generateQuickPick, getNextDrawDates } from '../../lib/lotto-utils';
import Confetti from 'react-confetti';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

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
  const [game, setGame] = useState<'Oz Lotto' | 'Powerball'>('Oz Lotto');
  const [allComparisonResults, setAllComparisonResults] = useState<ComparisonResult[] | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [officialResult, setOfficialResult] = useState<DrawResult | null>(null);
  const [customResult, setCustomResult] = useState<DrawResult>({
    game: 'Custom Draw',
    drawDate: 'Simulated',
    numbers: [],
    bonus: [],
    prizes: {
      "Division 1": 10000000,
      "Division 2": 50000,
      "Division 3": 5000,
      "Division 4": 400,
      "Division 5": 50,
      "Division 6": 25,
      "Division 7": 15,
      "No Prize": 0
    }
  });
  
  const [drawMode, setDrawMode] = useState<'official' | 'random' | 'manual'>('official');
  const resultsRef = useRef<HTMLDivElement>(null);

  // Stats
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalWon: 0,
    profit: 0,
    winCount: 0,
    jackpotHit: false
  });

  // Fetch official result when game changes
  useEffect(() => {
    const fetchLatestResult = async () => {
      setOfficialResult(null);
      handleClearAllResults();
      
      try {
        const { data, error } = await supabase
          .from('draw_results')
          .select('*')
          .eq('game', game)
          .order('draw_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setOfficialResult({
            game: data.game,
            drawDate: data.draw_date,
            numbers: data.numbers,
            bonus: data.bonus,
            prizes: data.prizes
          });
        }
      } catch (err) {
        console.error("Failed to fetch result:", err);
      }
    };

    fetchLatestResult();
  }, [game]);

  const activeResult = drawMode === 'official' ? officialResult : customResult;

  const handleCheckAllResults = (allLines: number[][]) => {
    if (!activeResult || activeResult.numbers.length < 7) {
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
    setStats({
      totalSpent: spent,
      totalWon: currentWon,
      profit: currentWon - spent,
      winCount: currentWins,
      jackpotHit: hitJackpot
    });

    setAllComparisonResults(results);

    if (currentWins > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 10000);
    }
    
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleClearAllResults = () => {
    setAllComparisonResults(null);
    setShowConfetti(false);
    setStats({
      totalSpent: 0,
      totalWon: 0,
      profit: 0,
      winCount: 0,
      jackpotHit: false
    });
  };

  const generateRandomResult = () => {
    const main = generateQuickPick(game);
    if (game === 'Oz Lotto') {
      const supp: number[] = [];
      while (supp.length < 3) {
        const num = Math.floor(Math.random() * 47) + 1;
        if (!main.includes(num) && !supp.includes(num)) supp.push(num);
      }
      setCustomResult(prev => ({ ...prev, numbers: main, bonus: supp.sort((a,b) => a-b) }));
    } else {
      // Powerball random
      const mainPB = main.slice(0, 7);
      const pb = main[7];
      setCustomResult(prev => ({ ...prev, numbers: mainPB, bonus: [pb] }));
    }
    setDrawMode('random');
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 font-black text-indigo-600 animate-pulse uppercase tracking-widest text-sm">Loading Simulator...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 pb-32">
      <Navbar />
      
      <main className="flex w-full flex-col items-center px-4 md:px-20 text-center pt-12">
        <div className="mb-12">
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter uppercase leading-[0.8] mb-6">
            WhatIF<span className="text-indigo-600">Simulator</span>
          </h1>
          <div className="flex gap-3 justify-center">
            {['Oz Lotto', 'Powerball'].map((g) => (
              <button
                key={g}
                onClick={() => setGame(g as any)}
                className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${game === g ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105' : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full max-w-2xl mb-12 space-y-6">
          {/* Mode Selector */}
          <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-gray-100 flex overflow-hidden max-w-md mx-auto">
            {(['official', 'random', 'manual'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setDrawMode(mode)}
                className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  drawMode === mode ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                {mode === 'official' ? 'Official' : mode === 'random' ? 'Random' : 'Manual'}
              </button>
            ))}
          </div>

          {/* Draw Configuration UI */}
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-gray-100 transition-all overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            
            <div className="relative z-10">
              {drawMode === 'official' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {officialResult ? (
                    <>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Live Official Draw Data</p>
                      <p className="text-xl font-black text-gray-900 mb-6 tracking-tight">Draw Date: {officialResult.drawDate}</p>
                      <div className="flex flex-wrap gap-2.5 justify-center">
                        {officialResult.numbers.map((n, i) => (
                          <span key={`off-${i}`} className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black shadow-lg border-b-4 border-emerald-700 text-lg">{n}</span>
                        ))}
                        <div className="w-px h-11 bg-gray-200 mx-1" />
                        {officialResult.bonus.map((n, i) => (
                          <span key={`off-b-${i}`} className="w-11 h-11 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-lg border-b-4 border-amber-600 text-lg">{n}</span>
                        ))}
                      </div>
                    </>
                  ) : <div className="py-4 text-gray-400 font-bold italic animate-pulse">Fetching latest {game} results...</div>}
                </div>
              )}

              {drawMode === 'random' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col items-center">
                  <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-6">Probability Simulation Mode</p>
                  <div className="flex flex-wrap gap-2.5 justify-center mb-10">
                    {customResult.numbers.length > 0 ? (
                      <>
                        {customResult.numbers.map((n, i) => (
                          <span key={`rand-${i}`} className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg border-b-4 border-indigo-800 text-lg">{n}</span>
                        ))}
                        <div className="w-px h-11 bg-gray-200 mx-1" />
                        {customResult.bonus.map((n, i) => (
                          <span key={`rand-b-${i}`} className="w-11 h-11 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-lg border-b-4 border-amber-600 text-lg">{n}</span>
                        ))}
                      </>
                    ) : <div className="h-11 flex items-center text-gray-300 font-black italic tracking-tighter uppercase">No numbers generated</div>}
                  </div>
                  <button onClick={generateRandomResult} className="px-10 py-4 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 shadow-xl shadow-purple-100 transition-all uppercase tracking-widest text-xs">Generate Random Draw</button>
                </div>
              )}

              {drawMode === 'manual' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8">
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest text-center">Custom Scenario Configuration</p>
                  <div className="space-y-8">
                    <div className="text-left">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-4 tracking-widest ml-4">1. Select 7 Winning Main Numbers</p>
                      <div className="flex flex-wrap gap-1.5 justify-center bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        {Array.from({ length: game === 'Oz Lotto' ? 47 : 35 }, (_, i) => i + 1).map(num => {
                          const isMain = customResult.numbers.includes(num);
                          const disabled = !isMain && customResult.numbers.length >= 7;
                          return (
                            <button
                              key={num}
                              disabled={disabled}
                              onClick={() => {
                                const newNumbers = isMain 
                                  ? customResult.numbers.filter(n => n !== num)
                                  : [...customResult.numbers, num].sort((a,b) => a-b);
                                setCustomResult(prev => ({ ...prev, numbers: newNumbers }));
                              }}
                              className={`w-8 h-8 rounded-full text-[10px] font-black transition-all ${isMain ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 'bg-white text-gray-400 border border-gray-200 hover:border-indigo-300'} ${disabled ? 'opacity-20' : ''}`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="text-left">
                      <p className="text-[9px] font-black text-amber-600 uppercase mb-4 tracking-widest ml-4">2. Select {game === 'Oz Lotto' ? '3 Supplementary' : '1 Powerball'}</p>
                      <div className="flex flex-wrap gap-1.5 justify-center bg-amber-50/50 p-6 rounded-3xl border border-amber-100">
                        {Array.from({ length: game === 'Oz Lotto' ? 47 : 20 }, (_, i) => i + 1).map(num => {
                          const isSupp = customResult.bonus.includes(num);
                          const maxSupp = game === 'Oz Lotto' ? 3 : 1;
                          const disabled = !isSupp && customResult.bonus.length >= maxSupp;
                          return (
                            <button
                              key={num}
                              disabled={disabled}
                              onClick={() => {
                                const newBonus = isSupp 
                                  ? customResult.bonus.filter(n => n !== num)
                                  : [...customResult.bonus, num].sort((a,b) => a-b);
                                setCustomResult(prev => ({ ...prev, bonus: newBonus }));
                              }}
                              className={`w-8 h-8 rounded-full text-[10px] font-black transition-all ${isSupp ? 'bg-amber-400 text-amber-950 scale-110 shadow-lg' : 'bg-white text-gray-400 border border-gray-200 hover:border-amber-400'} ${disabled ? 'opacity-20' : ''}`}
                            >
                              {num}
                            </button>
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

        <NumberPicker 
          onCheckAllResults={handleCheckAllResults} 
          onClearAll={handleClearAllResults} 
          resultsRef={resultsRef} 
          drawResult={activeResult}
          game={game}
        />

        {allComparisonResults && (
          <div ref={resultsRef} className="w-full max-w-4xl mt-16 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500 opacity-20" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Invested</p>
                <p className="text-4xl font-black text-gray-900 tracking-tighter">{formatCurrency(stats.totalSpent)}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-2 italic">{allComparisonResults.length} Simulated Tickets</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500 opacity-20" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Winnings</p>
                <p className="text-4xl font-black text-emerald-600 tracking-tighter">{formatCurrency(stats.totalWon)}</p>
                <p className="text-[10px] font-bold text-emerald-500 mt-2 italic">{stats.winCount} Winning Sets Found</p>
              </div>
              <div className={`p-8 rounded-[2.5rem] shadow-2xl border text-left relative overflow-hidden transition-colors duration-500 ${stats.profit >= 0 ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-rose-600 border-rose-700 text-white'}`}>
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Net Profit/Loss</p>
                <p className="text-4xl font-black tracking-tighter">{formatCurrency(stats.profit)}</p>
                <p className="text-[10px] font-bold text-white/60 mt-2 uppercase tracking-tighter">{stats.profit >= 0 ? 'Incredible Luck' : 'The House Always Wins'}</p>
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 text-left">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Draw Analysis</h2>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[9px] font-black text-emerald-600 uppercase">Verified</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {allComparisonResults.map((result, index) => {
                  const hasPrize = result.prizeTier !== "No Prize";
                  const prizeAmt = activeResult?.prizes[result.prizeTier] || 0;
                  return (
                    <div key={index} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-3xl transition-all duration-300 border ${hasPrize ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' : 'bg-gray-50/30 border-gray-100 opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}>
                      <div className="flex items-center gap-5">
                        <span className="text-[10px] font-black text-gray-300 w-6">#{String(index + 1).padStart(2, '0')}</span>
                        <div>
                          <p className="text-sm font-black text-gray-800 tracking-tight">
                            {result.mainMatchesCount} Main {game === 'Powerball' ? `+ ${result.bonusMatchesCount > 0 ? 'Powerball' : 'No PB'}` : `+ ${result.bonusMatchesCount} Supps`}
                          </p>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${hasPrize ? 'text-emerald-600' : 'text-gray-400'}`}>{result.prizeTier}</p>
                        </div>
                      </div>
                      <div className="text-right mt-3 sm:mt-0">
                        <p className={`text-xl font-black tracking-tighter ${hasPrize ? 'text-emerald-600' : 'text-gray-200'}`}>
                          {result.prizeTier === "Division 1" && prizeAmt === 0 ? 'JACKPOT!' : (hasPrize ? formatCurrency(prizeAmt) : formatCurrency(0))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
