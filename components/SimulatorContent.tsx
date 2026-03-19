// lotto-project/components/SimulatorContent.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('game', game);
    params.set('mode', simMode);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [game, simMode]);

  const [showConfetti, setShowConfetti] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { activeResult, officialResult, customResult, setCustomResult, generateRandomResult } = useLatestDraw(game, drawMode);
  const { allComparisonResults, stats, handleCheckAllResults, clearResults, luckNarrative, realWorldValue } = useSimulator(game, activeResult);

  const handleDrawModeChange = (mode: 'official' | 'random' | 'manual') => {
    setDrawMode(mode);
    clearResults();
  };

  const onRunSimulation = (allLines: number[][]) => {
    const { error, currentWins } = handleCheckAllResults(allLines);
    if (error) { toast.error(error); return; }
    const wins = typeof currentWins === 'number' ? currentWins : 0;
    if (wins > 0) {
      toast.success('Simulation Complete', { description: `You had ${wins} winning tickets!` });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 10000);
    }
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const isOz = game === 'Oz Lotto';
  const isTatts = game === 'Tatts Lotto';
  const brandStyles = {
    text: isOz ? 'text-emerald-600 dark:text-emerald-400' : isTatts ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400',
    bg: isOz ? 'bg-emerald-600' : isTatts ? 'bg-red-600' : 'bg-indigo-600',
    bgLight: isOz ? 'bg-emerald-50 dark:bg-emerald-950/30' : isTatts ? 'bg-red-50 dark:bg-red-950/30' : 'bg-indigo-50 dark:bg-indigo-950/30',
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);

  if (isLoading) return <div className={`flex min-h-screen items-center justify-center font-black animate-pulse uppercase tracking-widest`}>Loading Simulator...</div>;

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-950 pb-32 transition-colors duration-500 overflow-x-hidden text-gray-900 dark:text-gray-100">
      <Navbar />
      {showConfetti && <Confetti numberOfPieces={300} recycle={false} />}
      <main className="flex w-full flex-col items-center px-4 sm:px-10 md:px-20 text-center pt-8 sm:pt-16 relative z-10">
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6 sm:mb-10 leading-none">
          Lotto <span className={`${brandStyles.text} italic font-serif lowercase`}>Simulator</span>
        </h1>
        {/* ... (이전의 모든 UI 코드 유지) ... */}
        <NumberPicker onCheckAllResults={onRunSimulation} onClearAll={clearResults} resultsRef={resultsRef} drawResult={activeResult} game={game} onModeChange={setSimMode} />
        <DivisionRules game={game} isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
      </main>
    </div>
  );
}
