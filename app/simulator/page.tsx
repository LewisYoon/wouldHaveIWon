// lotto-project/app/simulator/page.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NumberPicker from '../../components/NumberPicker';
import DivisionRules from '../../components/DivisionRules';
import Confetti from 'react-confetti';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

// Custom Hooks
import { useSimulator } from '../../hooks/useSimulator';
import { useLatestDraw } from '../../hooks/useLatestDraw';

export default function SimulatorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading } = useAuth();
  
  // URL Params State
  const [game, setGame] = useState<'Oz Lotto' | 'Powerball' | 'Tatts Lotto'>(
    (searchParams.get('game') as any) || 'Oz Lotto'
  );
  const [simMode, setSimMode] = useState<'classic' | 'auto'>(
    (searchParams.get('mode') as any) || 'classic'
  );
  const [drawMode, setDrawMode] = useState<'official' | 'random' | 'manual'>('official');

  // Update URL effect
  useEffect(() => {
    const currentGame = searchParams.get('game');
    const currentMode = searchParams.get('mode');
    if (currentGame !== game || currentMode !== simMode) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('game', game);
      params.set('mode', simMode);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [game, simMode, router, searchParams]);

  // UI State
  const [showConfetti, setShowConfetti] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Custom Hooks Integration
  const { 
    activeResult, 
    officialResult, 
    customResult, 
    setCustomResult, 
    generateRandomResult 
  } = useLatestDraw(game, drawMode);

  const { 
    allComparisonResults, 
    stats, 
    handleCheckAllResults, 
    clearResults, 
    luckNarrative, 
    realWorldValue 
  } = useSimulator(game, activeResult);

  const handleDrawModeChange = (mode: 'official' | 'random' | 'manual') => {
    setDrawMode(mode);
    clearResults();
  };

  const onRunSimulation = (allLines: number[][]) => {
    const { error, currentWins } = handleCheckAllResults(allLines);
    if (error) {
      toast.error(error);
      return;
    }
    const wins = typeof currentWins === 'number' ? currentWins : 0;
    if (wins > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 10000);
    }
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

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

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);

  if (isLoading) return <div className={`flex min-h-screen items-center justify-center bg-white dark:bg-gray-950 font-black ${brandStyles.text} animate-pulse uppercase tracking-widest text-sm`}>Loading Simulator...</div>;

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-950 pb-32 transition-colors duration-500 overflow-x-hidden text-gray-900 dark:text-gray-100">
      <Navbar />
      {showConfetti && <Confetti numberOfPieces={300} recycle={false} />}

      <main className="flex w-full flex-col items-center px-4 sm:px-10 md:px-20 text-center pt-8 sm:pt-16 relative z-10">
        <div className="mb-10 sm:mb-16 animate-in fade-in slide-in-from-top-8 duration-700 w-full">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-6 sm:mb-10 leading-none">
            Lotto <span className={`${brandStyles.text} italic font-serif lowercase`}>Simulator</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3 justify-center">
            {['Oz Lotto', 'Powerball', 'Tatts Lotto'].map((g) => (
              <button
                key={g}
                onClick={() => { setGame(g as any); clearResults(); }}
                className={`flex-1 sm:flex-none px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-[2rem] text-[10px] sm:text-sm font-black uppercase tracking-[0.1em] transition-all duration-300 transform active:scale-95 ${
                  game === g ? `${brandStyles.bg} text-white shadow-xl scale-105` : 'bg-white dark:bg-white/5 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/10 hover:bg-gray-50'
                }`}
              >
                {g}
              </button>
            ))}
             <button onClick={() => setIsRulesModalOpen(true)} className="ml-auto bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-700 w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black">?</button>
          </div>
        </div>

        {/* Setup Winning Draw */}
        <div className="w-full max-w-2xl mb-10 sm:mb-16 space-y-8 sm:space-y-10 text-left">
          <div className="bg-white dark:bg-gray-900 p-1.5 sm:p-2 rounded-2xl sm:rounded-[2.5rem] border border-gray-100 dark:border-white/5 flex overflow-hidden max-w-md mx-auto shadow-xl">
            {(['official', 'random', 'manual'] as const).map((mode) => (
              <button key={mode} onClick={() => handleDrawModeChange(mode)} className={`flex-1 py-3 sm:py-4 px-3 sm:px-6 rounded-xl sm:rounded-[2rem] text-[9px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${drawMode === mode ? `${brandStyles.bg} text-white shadow-lg` : 'text-gray-400 hover:bg-gray-50'}`}>
                {mode === 'official' ? 'Real' : mode === 'random' ? 'Rand' : 'Pick'}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-gray-100 dark:border-white/5 shadow-2xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 rounded-full -mr-16 -mt-16 transition-transform duration-1000 group-hover:scale-150 ${brandStyles.bgLight}`} />
            <div className="relative z-10 text-center">
              {drawMode === 'official' && (
                <div className="animate-in fade-in zoom-in-95">
                  {officialResult ? (
                    <>
                      <p className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] mb-3 ${brandStyles.text}`}>Official Result</p>
                      <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">Date: {officialResult.drawDate}</p>
                      <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
                        {officialResult.numbers.map((n, i) => (
                          <span key={`off-${i}`} className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full text-white flex items-center justify-center font-black shadow-xl border-b-[4px] ${brandStyles.bg}`}>{n}</span>
                        ))}
                        <div className="w-px h-10 sm:h-14 bg-gray-200 dark:bg-white/10 mx-1 sm:mx-2" />
                        {officialResult.bonus.map((n, i) => (
                          <span key={`off-b-${i}`} className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-xl border-b-[4px] border-amber-600">{n}</span>
                        ))}
                      </div>
                    </>
                  ) : <div className={`py-6 sm:py-10 ${brandStyles.text} font-black italic animate-pulse`}>Fetching latest draw...</div>}
                </div>
              )}

              {drawMode === 'random' && (
                <div className="animate-in fade-in zoom-in-95 flex flex-col items-center">
                  <div className="flex items-center gap-3 mb-6">
                    <p className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] ${brandStyles.text}`}>Random Generator</p>
                    <button onClick={generateRandomResult} className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-indigo-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
                    {customResult.numbers.map((n, i) => (
                      <span key={`rand-${i}`} className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full text-white flex items-center justify-center font-black shadow-xl border-b-[4px] ${brandStyles.bg}`}>{n}</span>
                    ))}
                    <div className="w-px h-10 sm:h-14 bg-gray-200 dark:bg-white/10 mx-1 sm:mx-2" />
                    {customResult.bonus.map((n, i) => (
                      <span key={`rand-b-${i}`} className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-xl border-b-[4px] border-amber-600">{n}</span>
                    ))}
                  </div>
                </div>
              )}

              {drawMode === 'manual' && (
                <div className="animate-in fade-in zoom-in-95 space-y-8 text-left">
                  <p className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-center ${brandStyles.text}`}>Set Up Custom Target</p>
                  <div className="space-y-8">
                    <div>
                      <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase mb-4 tracking-[0.2em] ml-2">1. Main Numbers ({game === 'Tatts Lotto' ? 6 : 7})</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2.5 justify-center bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-gray-100 dark:border-white/5">
                        {Array.from({ length: isOz ? 47 : isTatts ? 45 : 35 }, (_, i) => i + 1).map(num => {
                          const isMain = customResult.numbers.includes(num);
                          const required = isTatts ? 6 : 7;
                          const disabled = !isMain && customResult.numbers.length >= required;
                          return (
                            <button key={num} disabled={disabled} onClick={() => { const newNumbers = isMain ? customResult.numbers.filter(n => n !== num) : [...customResult.numbers, num].sort((a,b) => a-b); setCustomResult(prev => ({ ...prev, numbers: newNumbers })); }} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full text-[9px] sm:text-[11px] font-black transition-all ${isMain ? `${brandStyles.bg} text-white scale-110 shadow-lg` : 'bg-white dark:bg-white/5 text-gray-400 border border-gray-200'} ${disabled ? 'opacity-20 grayscale' : ''}`}>{num}</button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] sm:text-[10px] font-black text-amber-600 uppercase mb-4 tracking-[0.2em] ml-2">2. Bonus Numbers ({isOz ? '3' : isTatts ? '2' : '1'})</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2.5 justify-center bg-amber-50/30 dark:bg-amber-500/5 p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-amber-100 dark:border-amber-500/10">
                        {Array.from({ length: isOz || isTatts ? 45 : 20 }, (_, i) => i + 1).map(num => {
                          const isSupp = customResult.bonus.includes(num);
                          const maxSupp = isOz ? 3 : isTatts ? 2 : 1;
                          const disabled = !isSupp && customResult.bonus.length >= maxSupp;
                          return (
                            <button key={num} disabled={disabled} onClick={() => { const newBonus = isSupp ? customResult.bonus.filter(n => n !== num) : [...customResult.bonus, num].sort((a,b) => a-b); setCustomResult(prev => ({ ...prev, bonus: newBonus })); }} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full text-[9px] sm:text-[11px] font-black transition-all ${isSupp ? 'bg-amber-400 text-amber-950 scale-110 shadow-lg' : 'bg-white dark:bg-white/5 text-gray-400 border border-gray-200'} ${disabled ? 'opacity-20 grayscale' : ''}`}>{num}</button>
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
            onCheckAllResults={onRunSimulation} 
            onClearAll={clearResults} 
            resultsRef={resultsRef} 
            drawResult={activeResult} 
            game={game} 
            onModeChange={setSimMode}
          />
        </div>

        {/* Classic Mode Results */}
        {simMode === 'classic' && allComparisonResults && (
          <div ref={resultsRef} className="w-full max-w-6xl mt-12 sm:mt-24 space-y-8 sm:space-y-12 text-left px-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
              <div className={`p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border transition-all duration-700 relative overflow-hidden text-white shadow-2xl group ${game === 'Oz Lotto' ? 'bg-emerald-950 border-emerald-500/20' : game === 'Tatts Lotto' ? 'bg-red-950 border-red-500/20' : 'bg-indigo-950 border-indigo-500/20'}`}>
                <p className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[0.4em] mb-6 sm:mb-10 ${isOz ? 'text-emerald-400' : isTatts ? 'text-red-400' : 'text-indigo-400'}`}>Simulation Result</p>
                <h3 className="text-2xl sm:text-4xl font-black mb-8 sm:mb-12 tracking-tighter italic text-white leading-tight">"{luckNarrative}"</h3>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-white/10">📊</div>
                  <div><p className={`text-[10px] font-bold uppercase tracking-widest ${isOz ? 'text-emerald-400' : isTatts ? 'text-red-400' : 'text-indigo-400'}`}>Return on Investment</p><p className="text-3xl font-black text-white tracking-tighter">{stats.roi.toFixed(1)}%</p></div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-gray-100 dark:border-white/5 shadow-2xl">
                <p className="text-[9px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6 sm:mb-10">{realWorldValue.label}</p>
                <div className="space-y-4">
                  {realWorldValue.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl"><span className="font-bold text-gray-600 dark:text-gray-400">{item.name}</span><span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{item.qty.toLocaleString()}x</span></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 text-left">
              <div className="bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-xl">
                <p className="text-[9px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Total Cost</p><p className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">{formatCurrency(stats.totalSpent)}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-xl">
                <p className="text-[9px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Total Won</p><p className={`text-3xl sm:text-5xl font-black ${brandStyles.text} tracking-tighter`}>{formatCurrency(stats.totalWon)}</p>
              </div>
              <div className={`p-8 sm:p-10 rounded-2xl sm:rounded-[3rem] border shadow-2xl ${stats.profit >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                <p className="text-[9px] sm:text-[11px] font-black text-white/60 uppercase tracking-[0.3em] mb-3">Net Profit/Loss</p><p className="text-3xl sm:text-5xl font-black tracking-tighter">{formatCurrency(stats.profit)}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-gray-100 dark:border-white/5 text-left shadow-2xl">
              <h2 className="text-2xl sm:text-4xl font-black mb-8 sm:mb-12 tracking-tighter uppercase italic">Draw Analysis</h2>
              <div className="grid grid-cols-1 gap-3 sm:gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {allComparisonResults?.map((result, index) => {
                  const hasPrize = result.prizeTier !== "No Prize";
                  const prizeAmt = activeResult?.prizes[result.prizeTier] || 0;
                  return (
                    <div key={index} className={`flex flex-row items-center justify-between p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border transition-all ${hasPrize ? `${brandStyles.bgLight} border-${brandColor}-200 shadow-lg` : 'bg-gray-50/30 opacity-40 grayscale'}`}>
                      <div className="flex items-center gap-4 sm:gap-8">
                        <span className="text-[10px] font-black text-gray-300 w-6">{String(index + 1).padStart(2, '0')}</span>
                        <div>
                          <p className="text-sm sm:text-lg font-black text-gray-800 dark:text-white tracking-tight">{result.mainMatchesCount} Main {game === 'Powerball' ? `+ ${result.bonusMatchesCount > 0 ? 'PB' : 'No PB'}` : `+ ${result.bonusMatchesCount} Supps`}</p>
                          <p className={`text-[8px] sm:text-[11px] font-bold uppercase tracking-[0.1em] mt-0.5 ${hasPrize ? brandStyles.text : 'text-gray-400'}`}>{result.prizeTier}</p>
                        </div>
                      </div>
                      <div className="text-right"><p className={`text-xl sm:text-3xl font-black tracking-tighter ${hasPrize ? brandStyles.text : 'text-gray-200'}`}>{hasPrize ? formatCurrency(prizeAmt) : formatCurrency(0)}</p></div>
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
