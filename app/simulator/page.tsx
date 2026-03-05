'use client';

import { useState, useEffect, useRef } from 'react';
import NumberPicker from '../../components/NumberPicker';
import LottoLinePicker from '../../components/LottoLinePicker';
import { compareNumbers, ComparisonResult, generateQuickPick } from '../../lib/lotto-utils';
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

  useEffect(() => {
    const fetchLatestResult = async () => {
      try {
        const { data, error } = await supabase
          .from('draw_results')
          .select('*')
          .order('draw_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

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
  }, []);

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
      const result = compareNumbers(userNumbers, activeResult.numbers, activeResult.bonus);
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
    const main = generateQuickPick(); // 7 numbers
    // Supplementary numbers (must be unique from main)
    const supp: number[] = [];
    while (supp.length < 3) {
      const num = Math.floor(Math.random() * 47) + 1;
      if (!main.includes(num) && !supp.includes(num)) {
        supp.push(num);
      }
    }
    setCustomResult(prev => ({ ...prev, numbers: main, bonus: supp.sort((a,b) => a-b) }));
    setDrawMode('random');
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-black">Loading Auth...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center py-2 bg-gray-100 relative">
      {showConfetti && <Confetti recycle={false} numberOfPieces={stats.jackpotHit ? 1000 : 200} gravity={0.1} />}

      <Navbar />
      
      <main className="flex w-full flex-1 flex-col items-center px-4 md:px-20 text-center pb-32 pt-8">
        <h1 className="text-4xl md:text-6xl font-black my-8 text-gray-900 tracking-tighter uppercase">
          WhatIF<span className="text-blue-600">Simulator</span>
        </h1>

        <div className="w-full max-w-2xl mb-8 space-y-6">
          {/* Mode Selector */}
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 flex overflow-hidden">
            {(['official', 'random', 'manual'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setDrawMode(mode)}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  drawMode === mode 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                {mode === 'official' ? 'Official' : mode === 'random' ? 'Random' : 'Manual'}
              </button>
            ))}
          </div>

          {/* Draw Configuration UI */}
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 transition-all">
            {drawMode === 'official' && (
              <div className="animate-in fade-in duration-500">
                {officialResult ? (
                  <>
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Testing against Official Data</p>
                    <p className="text-lg font-bold text-gray-800 mb-4">Draw: {officialResult.drawDate}</p>
                    <div className="flex flex-wrap gap-2 justify-center mb-2">
                      {officialResult.numbers.map((n, i) => (
                        <span key={`off-${i}`} className="w-9 h-9 rounded-full bg-green-500 text-white flex items-center justify-center font-bold shadow-md border-b-4 border-green-700">{n}</span>
                      ))}
                      <div className="w-px h-9 bg-gray-200 mx-1" />
                      {officialResult.bonus.map((n, i) => (
                        <span key={`off-b-${i}`} className="w-9 h-9 rounded-full bg-yellow-400 text-gray-800 flex items-center justify-center font-bold shadow-md border-b-4 border-yellow-600">{n}</span>
                      ))}
                    </div>
                  </>
                ) : <p className="text-gray-400 italic">No official data found...</p>}
              </div>
            )}

            {drawMode === 'random' && (
              <div className="animate-in fade-in duration-500 flex flex-col items-center">
                <p className="text-xs font-black text-purple-600 uppercase tracking-widest mb-4 text-center">Simulate with Random Results</p>
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {customResult.numbers.length > 0 ? (
                    <>
                      {customResult.numbers.map((n, i) => (
                        <span key={`rand-${i}`} className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-md border-b-4 border-blue-700">{n}</span>
                      ))}
                      <div className="w-px h-9 bg-gray-200 mx-1" />
                      {customResult.bonus.map((n, i) => (
                        <span key={`rand-b-${i}`} className="w-9 h-9 rounded-full bg-yellow-400 text-gray-800 flex items-center justify-center font-bold shadow-md border-b-4 border-yellow-600">{n}</span>
                      ))}
                    </>
                  ) : <div className="h-9 flex items-center text-gray-300 font-bold italic text-sm">Waiting for generation...</div>}
                </div>
                <button 
                  onClick={generateRandomResult}
                  className="px-8 py-2 bg-purple-600 text-white text-xs font-black rounded-full hover:bg-purple-700 transition shadow-lg shadow-purple-100 uppercase tracking-widest"
                >
                  Generate New Numbers
                </button>
              </div>
            )}

            {drawMode === 'manual' && (
              <div className="animate-in fade-in duration-500 space-y-6">
                <p className="text-xs font-black text-orange-600 uppercase tracking-widest text-center">Configure Manual Winning Numbers</p>
                <div className="grid grid-cols-1 gap-6">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-3 text-left">Step 1: Pick 7 Main Numbers</p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {Array.from({ length: 47 }, (_, i) => i + 1).map(num => {
                        const isMain = customResult.numbers.includes(num);
                        const isSupp = customResult.bonus.includes(num);
                        const disabled = !isMain && customResult.numbers.length >= 7;
                        return (
                          <button
                            key={num}
                            disabled={isSupp || disabled}
                            onClick={() => {
                              const newNumbers = isMain 
                                ? customResult.numbers.filter(n => n !== num)
                                : [...customResult.numbers, num].sort((a,b) => a-b);
                              setCustomResult(prev => ({ ...prev, numbers: newNumbers }));
                            }}
                            className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                              isMain ? 'bg-blue-600 text-white scale-110 shadow-lg' : 
                              isSupp ? 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-30' :
                              'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'
                            }`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-3 text-left">Step 2: Pick 3 Supplementary</p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {Array.from({ length: 47 }, (_, i) => i + 1).map(num => {
                        const isMain = customResult.numbers.includes(num);
                        const isSupp = customResult.bonus.includes(num);
                        const disabled = !isSupp && customResult.bonus.length >= 3;
                        return (
                          <button
                            key={num}
                            disabled={isMain || disabled}
                            onClick={() => {
                              const newBonus = isSupp 
                                ? customResult.bonus.filter(n => n !== num)
                                : [...customResult.bonus, num].sort((a,b) => a-b);
                              setCustomResult(prev => ({ ...prev, bonus: newBonus }));
                            }}
                            className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                              isSupp ? 'bg-yellow-400 text-gray-800 scale-110 shadow-lg' : 
                              isMain ? 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-30' :
                              'bg-white text-gray-600 border border-gray-200 hover:border-yellow-400'
                            }`}
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

        <NumberPicker 
          onCheckAllResults={handleCheckAllResults} 
          onClearAll={handleClearAllResults} 
          resultsRef={resultsRef} 
          drawResult={activeResult}
        />

        {allComparisonResults && (
          <div ref={resultsRef} className="w-full max-w-4xl mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Financial Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 text-left">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Investment</p>
                <p className="text-3xl font-black text-gray-900">{formatCurrency(stats.totalSpent)}</p>
                <p className="text-xs text-gray-500 mt-1">{allComparisonResults.length} Sets @ $1.45</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 text-left">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Winnings</p>
                <p className="text-3xl font-black text-green-600">{formatCurrency(stats.totalWon)}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.winCount} Winning Tickets</p>
              </div>
              <div className={`p-6 rounded-3xl shadow-lg border text-left ${stats.profit >= 0 ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'}`}>
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">Net Profit/Loss</p>
                <p className="text-3xl font-black text-white">{formatCurrency(stats.profit)}</p>
                <p className="text-xs text-white/70 mt-1">{stats.profit >= 0 ? 'Legendary Luck!' : 'The Reality of Lotto'}</p>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 text-left">
              <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                Ticket Breakdown
                <span className="text-sm font-normal text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-tighter">Analysis</span>
              </h2>
              
              <div className="space-y-3">
                {allComparisonResults.map((result, index) => {
                  const hasPrize = result.prizeTier !== "No Prize";
                  const prizeAmt = activeResult?.prizes[result.prizeTier] || 0;
                  
                  return (
                    <div key={index} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl transition-all ${hasPrize ? 'bg-green-50 border-l-4 border-green-500 shadow-sm' : 'bg-gray-50/50 grayscale opacity-60'}`}>
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-xs font-black text-gray-400 shadow-inner">#{index + 1}</span>
                        <div>
                          <p className="text-sm font-black text-gray-800">
                            {result.mainMatchesCount} Main + {result.bonusMatchesCount} Supps
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{result.prizeTier}</p>
                        </div>
                      </div>
                      <div className="text-right mt-2 sm:mt-0">
                        <p className={`text-lg font-black ${hasPrize ? 'text-green-600' : 'text-gray-300'}`}>
                          {result.prizeTier === "Division 1" && prizeAmt === 0 ? 'JACKPOT!' : formatCurrency(prizeAmt)}
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
