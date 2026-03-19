// lotto-project/components/SimulatorContent.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NumberPicker from './NumberPicker';
import LottoLinePicker from './LottoLinePicker';
import DivisionRules from './DivisionRules';
import Confetti from 'react-confetti';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

// Custom Hooks
import { useSimulator } from '../hooks/useSimulator';
import { useLatestDraw } from '../hooks/useLatestDraw';

export default function SimulatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading } = useAuth();
  
  const game = (searchParams.get('game') as 'Oz Lotto' | 'Powerball' | 'Tatts Lotto') || 'Oz Lotto';
  const simMode = (searchParams.get('mode') as 'classic' | 'auto') || 'classic';
  const [drawMode, setDrawMode] = useState<'official' | 'random' | 'manual'>('official');

  const updateUrl = (newGame: string, newMode: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('game', newGame);
    params.set('mode', newMode);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const [showConfetti, setShowConfetti] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { activeResult, setCustomResult, generateRandomResult } = useLatestDraw(game, drawMode);
  const { allComparisonResults, stats, handleCheckAllResults, clearResults, luckNarrative, realWorldValue, saveTurboSummary, saveInProgress, loadSavedSession, setStatsFromSession } = useSimulator(game, activeResult);

  const clearAllSimulatorData = () => {
    clearResults();
    setPickerKey(prev => prev + 1);
  };

  useEffect(() => {
    const saved = loadSavedSession(game);
    if (saved) {
      toast.info("Unfinished session found", {
        description: "Continue from where you left off?",
        action: { label: "Restore", onClick: () => setStatsFromSession(saved.stats) }
      });
    }
  }, [game]);

  useEffect(() => {
    if (simMode === 'auto' && stats.totalSpent > 0) {
      saveInProgress(stats, game);
    }
  }, [stats, simMode, game]);

  const onRunSimulation = async (allLines: number[][]) => {
    const { error, currentWins } = handleCheckAllResults(allLines);
    if (error) { toast.error(error); return; }
    
    if (simMode === 'auto') {
        await saveTurboSummary(stats, game);
        localStorage.removeItem(`turbo_save_${game}`);
        toast.success("Turbo Session Saved");
    }

    setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);

    const wins = typeof currentWins === 'number' ? currentWins : 0;
    if (wins > 0) {
      toast.success('Simulation Complete', { description: `You had ${wins} winning tickets!` });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    } else {
      toast.info('Simulation Complete', { description: 'No winning tickets this time.' });
    }
  };

  const isOz = game === 'Oz Lotto';
  const isTatts = game === 'Tatts Lotto';
  const brandStyles = {
    text: isOz ? 'text-emerald-600 dark:text-emerald-400' : isTatts ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400',
    bg: isOz ? 'bg-emerald-600' : isTatts ? 'bg-red-600' : 'bg-indigo-600',
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);

  if (isLoading) return <div className="flex min-h-screen items-center justify-center font-black animate-pulse">Loading Simulator...</div>;

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-950 pb-32 transition-colors duration-500 text-gray-900 dark:text-gray-100">
      <Navbar />
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}
      
      <main className="w-full max-w-5xl pt-12 space-y-12 px-6">
        <header className="text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">Lotto <span className={`${brandStyles.text} italic`}>Simulator</span></h1>
          
          <div className="flex justify-center gap-2 bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 inline-flex">
            {(['official', 'random', 'manual'] as const).map(mode => (
                <button key={mode} onClick={() => { setDrawMode(mode); clearResults(); }} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition ${drawMode === mode ? `${brandStyles.bg} text-white` : 'text-gray-400 hover:text-gray-600'}`}>
                    {mode === 'official' ? 'Real Draw' : mode === 'random' ? 'Random' : 'Pick'}
                </button>
            ))}
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <button onClick={() => { updateUrl(game, 'classic'); }} className={`px-8 py-3 rounded-xl font-black uppercase text-xs ${simMode === 'classic' ? `${brandStyles.bg} text-white` : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>Classic</button>
            <button onClick={() => { updateUrl(game, 'auto'); }} className={`px-8 py-3 rounded-xl font-black uppercase text-xs ${simMode === 'auto' ? `${brandStyles.bg} text-white` : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>Turbo</button>
          </div>

          <div className="inline-flex bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
            {['Oz Lotto', 'Powerball', 'Tatts Lotto'].map(g => (
              <button key={g} onClick={() => { updateUrl(g, simMode); clearResults(); }} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition ${game === g ? `${brandStyles.bg} text-white` : 'text-gray-400 hover:text-gray-600'}`}>{g}</button>
            ))}
          </div>
        </header>

        {activeResult && (
            <div className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-2xl">
                <div className="flex flex-col items-center gap-4 mb-8">
                    <h2 className="text-xl font-black uppercase italic tracking-widest text-center">
                        {drawMode === 'official' ? 'Official Results' : drawMode === 'random' ? 'Random Draw' : 'Your Custom Pick'}
                    </h2>
                    
                    {drawMode === 'manual' && (
                        <div className="w-full max-w-lg space-y-6">
                            <div className="p-6 bg-indigo-50 dark:bg-indigo-950/20 rounded-3xl border-2 border-indigo-500/20">
                                <p className="text-[10px] font-black text-gray-400 uppercase mb-4 ml-2">Main Numbers</p>
                                <LottoLinePicker 
                                    lineId="manual-main" displayIndex={1} selectedNumbers={activeResult.numbers} 
                                    onNumbersChange={(_, nums) => setCustomResult((prev) => ({...prev, numbers: nums.filter(n => n > 0).sort((a,b) => a-b)}))} 
                                    game={game} minRange={1} maxRange={game === 'Powerball' ? 35 : (game === 'Oz Lotto' ? 47 : 45)}
                                />
                            </div>
                            <div className="p-6 bg-amber-50 dark:bg-amber-950/20 rounded-3xl border-2 border-amber-500/20">
                                <p className="text-[10px] font-black text-gray-400 uppercase mb-4 ml-2">{game === 'Powerball' ? 'Powerball Number' : 'Bonus Numbers'}</p>
                                <LottoLinePicker 
                                    lineId="manual-bonus" displayIndex={2} maxSlots={game === 'Powerball' ? 1 : (game === 'Oz Lotto' ? 3 : 2)}
                                    minRange={1} maxRange={game === 'Powerball' ? 20 : (game === 'Oz Lotto' ? 47 : 45)}
                                    selectedNumbers={activeResult.bonus}
                                    onNumbersChange={(_, nums) => {
                                        setCustomResult((prev) => {
                                            const limit = game === 'Powerball' ? 1 : (game === 'Oz Lotto' ? 3 : 2);
                                            const validBonus = nums
                                                .filter(n => n > 0 && !prev.numbers.includes(n))
                                                .slice(0, limit);
                                            return { ...prev, bonus: validBonus };
                                        });
                                    }} 
                                    game={game} 
                                />
                            </div>
                        </div>
                    )}
                    
                    <div className="flex items-center gap-4">
                        {drawMode === 'official' && (
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest italic">Draw Date: {activeResult.drawDate}</p>
                        )}
                        {drawMode === 'random' && (
                            <button onClick={generateRandomResult} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
                    {activeResult.numbers.map((n, i) => (
                    <span key={i} className={`w-12 h-12 rounded-full text-white flex items-center justify-center font-black shadow-lg border-b-[4px] border-black/20 ${brandStyles.bg}`}>{n}</span>
                    ))}
                    <div className="w-px h-12 bg-gray-200 dark:bg-white/10 mx-2" />
                    {activeResult.bonus.map((n, i) => (
                    <span key={`b-${i}`} className="w-12 h-12 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-lg border-b-[4px] border-amber-600">{n}</span>
                    ))}
                </div>
            </div>
        )}

        <NumberPicker onCheckAllResults={onRunSimulation} onClearAll={clearAllSimulatorData} resultsRef={resultsRef} drawResult={activeResult} game={game} mode={simMode} onModeChange={(m) => updateUrl(game, m)} />

        <div ref={resultsRef} className="scroll-mt-20 space-y-12">
            {allComparisonResults && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 shadow-xl dark:border-white/5">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-6">Simulation Summary</h3>
                            <p className="text-2xl font-black italic">{luckNarrative}</p>
                            
                            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-100 dark:border-white/5 text-center">
                                <div><p className="text-[10px] text-gray-400 uppercase tracking-widest">Spent</p><p className="font-black text-sm">{formatCurrency(stats.totalSpent)}</p></div>
                                <div><p className="text-[10px] text-gray-400 uppercase tracking-widest">Won</p><p className="font-black text-emerald-500 text-sm">{formatCurrency(stats.totalWon)}</p></div>
                                <div><p className="text-[10px] text-gray-400 uppercase tracking-widest">Net</p><p className={`font-black text-sm ${stats.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatCurrency(stats.profit)}</p></div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 shadow-xl dark:border-white/5">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-6">{realWorldValue.label}</h3>
                            {realWorldValue.items.map((item, i) => (
                                 <div key={i} className="flex justify-between py-3 border-b border-gray-50 dark:border-white/5 last:border-0"><span className="text-gray-600 dark:text-gray-400">{item.name}</span><span className="font-black">{item.qty.toLocaleString()}x</span></div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 shadow-xl dark:border-white/5">
                        <h2 className="text-xl font-black mb-8 uppercase italic">Draw Analysis</h2>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {allComparisonResults.map((res: any, i: number) => {
                               const isWinner = res.prizeTier !== "No Prize";
                               return (
                               <div key={i} className={`p-6 rounded-2xl border ${isWinner ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500/20' : 'bg-gray-50 dark:bg-gray-800 border-transparent'}`}>
                                   <div className="flex justify-between items-center mb-4 text-xs font-black uppercase text-gray-500">
                                       <div className="flex items-center gap-2">
                                            <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md">#{i + 1}</span>
                                            <span className={isWinner ? 'text-emerald-600' : 'text-gray-400'}>{res.prizeTier}</span>
                                       </div>
                                       <span>{res.mainMatchesCount} Main + {res.bonusMatchesCount} Bonus</span>
                                   </div>
                                   <div className="flex flex-wrap gap-2">
                                       {(res.userNumbers || []).map((n: number, idx: number) => (
                                           <span key={idx} className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-md border-b-2 ${res.drawNumbers.includes(n) ? `${brandStyles.bg} text-white` : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>{n}</span>
                                       ))}
                                       {(res.drawBonus || []).map((n: number, idx: number) => (
                                           <span key={`b-${idx}`} className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-md border-b-2 ${res.matchedBonusNumbers.includes(n) ? 'bg-amber-400 text-amber-950' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>{n}</span>
                                       ))}
                                   </div>
                               </div>
                               );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
      </main>
    </div>
  );
}
