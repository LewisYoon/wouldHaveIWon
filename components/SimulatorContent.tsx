// lotto-project/components/SimulatorContent.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NumberPicker from './NumberPicker';
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
  
  const [game, setGame] = useState<'Oz Lotto' | 'Powerball' | 'Tatts Lotto'>((searchParams.get('game') as any) || 'Oz Lotto');
  const [simMode, setSimMode] = useState<'classic' | 'auto'>((searchParams.get('mode') as any) || 'classic');
  const [drawMode, setDrawMode] = useState<'official' | 'random' | 'manual'>('official');

  const [showConfetti, setShowConfetti] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { activeResult, officialResult, customResult, setCustomResult, generateRandomResult } = useLatestDraw(game, drawMode);
  const { allComparisonResults, stats, handleCheckAllResults, clearResults, luckNarrative, realWorldValue } = useSimulator(game, activeResult);

  const onRunSimulation = (allLines: number[][]) => {
    const { error, currentWins } = handleCheckAllResults(allLines);
    if (error) { toast.error(error); return; }
    
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

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-950 pb-32 transition-colors duration-500 text-gray-900 dark:text-gray-100">
      <Navbar />
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}
      
      <main className="w-full max-w-5xl pt-12 space-y-12 px-6">
        <header className="text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">Lotto <span className={`${brandStyles.text} italic`}>Simulator</span></h1>
          
          <div className="flex justify-center gap-4 mb-8">
            <button onClick={() => setSimMode('classic')} className={`px-8 py-3 rounded-xl font-black uppercase text-xs ${simMode === 'classic' ? `${brandStyles.bg} text-white` : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>Classic</button>
            <button onClick={() => setSimMode('auto')} className={`px-8 py-3 rounded-xl font-black uppercase text-xs ${simMode === 'auto' ? `${brandStyles.bg} text-white` : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>Turbo</button>
          </div>

          <div className="inline-flex bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
            {['Oz Lotto', 'Powerball', 'Tatts Lotto'].map(g => (
              <button key={g} onClick={() => { setGame(g as any); clearResults(); }} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition ${game === g ? `${brandStyles.bg} text-white` : 'text-gray-400 hover:text-gray-600'}`}>{g}</button>
            ))}
          </div>
        </header>

        <NumberPicker onCheckAllResults={onRunSimulation} onClearAll={clearResults} resultsRef={resultsRef} drawResult={activeResult} game={game} onModeChange={setSimMode} />

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
                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                            {allComparisonResults.map((res, i) => (
                               <div key={i} className={`flex justify-between items-center p-4 rounded-xl ${res.prizeTier !== "No Prize" ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                                   <span className="font-bold text-gray-700 dark:text-gray-200">{res.mainMatchesCount} Main + {res.bonusMatchesCount} Bonus</span>
                                   <span className="font-black text-sm text-gray-900 dark:text-gray-100">{res.prizeTier}</span>
                               </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
      </main>
    </div>
  );
}
