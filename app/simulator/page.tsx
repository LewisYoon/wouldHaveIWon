'use client';

import { useState, useEffect, useRef } from 'react';
import NumberPicker from '../../components/NumberPicker';
import { compareNumbers, ComparisonResult } from '../../lib/lotto-utils';
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

export default function SimulatorPage() {
  const { user, isLoading } = useAuth();
  const [allComparisonResults, setAllComparisonResults] = useState<ComparisonResult[] | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLatestResult = async () => {
      try {
        console.log("Fetching latest result from Supabase...");
        const { data, error } = await supabase
          .from('draw_results')
          .select('*')
          .order('draw_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        if (data) {
          console.log("Found result in Supabase:", data);
          setDrawResult({
            game: data.game,
            drawDate: data.draw_date,
            numbers: data.numbers,
            bonus: data.bonus,
            prizes: data.prizes
          });
        } else {
          console.log("No data in Supabase 'draw_results' table. Falling back to local JSON...");
          const res = await fetch('/draw-results.json');
          const localData = await res.json();
          const latest = Array.isArray(localData) ? localData[0] : localData;
          if (latest) {
            setDrawResult(latest);
          }
        }
      } catch (err) {
        console.error("Failed to fetch result, trying fallback:", err);
        try {
          const res = await fetch('/draw-results.json');
          const localData = await res.json();
          const latest = Array.isArray(localData) ? localData[0] : localData;
          if (latest) {
            setDrawResult(latest);
          }
        } catch (fallbackErr) {
          console.error("Fallback also failed:", fallbackErr);
        }
      }
    };

    fetchLatestResult();
  }, []);

  const handleCheckAllResults = (allLines: number[][]) => {
    if (!drawResult) {
      alert("Still loading draw results. Please try again in a moment.");
      return;
    }

    const results: ComparisonResult[] = [];
    let anyPrizeWon = false;

    allLines.forEach(userNumbers => {
      const result = compareNumbers(userNumbers, drawResult.numbers, drawResult.bonus);
      results.push(result);
      if (result.prizeTier !== "No Prize") {
        anyPrizeWon = true;
      }
    });

    setAllComparisonResults(results);

    if (anyPrizeWon) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  };

  const handleClearAllResults = () => {
    setAllComparisonResults(null);
    setShowConfetti(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-black">Loading Auth...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center py-2 bg-gray-100 relative">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} gravity={0.1} />}

      <Navbar />
      
      <main className="flex w-full flex-1 flex-col items-center px-4 md:px-20 text-center pb-32 pt-8">
        <h1 className="text-4xl md:text-6xl font-bold my-8 text-gray-900">
          OZ Lotto Simulator
        </h1>

        {!user && (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-700 text-left mb-8 max-w-2xl w-full mx-auto">
            💡 <strong>Guest Mode:</strong> You can use the simulator freely. <Link href="/login" className="underline font-bold">Sign in</Link> to save your favorite number sets to history across all your devices.
          </div>
        )}
        
        {drawResult ? (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-2xl">
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold text-gray-800">{drawResult.game} - {drawResult.drawDate}</p>
              <div className="flex flex-wrap gap-2 justify-center my-3">
                {drawResult.numbers.map((n, i) => (
                  <span key={`main-${i}`} className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm border-2 border-green-600 shadow-sm">
                    {n}
                  </span>
                ))}
                <div className="w-px h-8 bg-gray-200 mx-1" />
                {drawResult.bonus.map((n, i) => (
                  <span key={`bonus-${n}-${i}`} className="w-8 h-8 rounded-full bg-yellow-400 text-gray-800 flex items-center justify-center font-bold text-sm border-2 border-yellow-500 shadow-sm">
                    {n}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Latest Result</p>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-200 animate-pulse rounded-lg w-full max-w-2xl">
            <p className="text-gray-500 font-bold italic">Loading latest result...</p>
          </div>
        )}

        <NumberPicker 
          onCheckAllResults={handleCheckAllResults} 
          onClearAll={handleClearAllResults} 
          resultsRef={resultsRef} 
          drawResult={drawResult}
        />

        {allComparisonResults && allComparisonResults.length > 0 && drawResult && (
          <div ref={resultsRef} className={`mt-8 p-6 bg-blue-50 border-blue-200 border rounded-lg shadow-md text-left w-full max-w-2xl`}>
            <h2 className="text-2xl font-bold text-blue-800 mb-4 text-center">All Your Results</h2>
            <div className="mb-4 text-sm text-gray-600 text-center">
              <p>Draw Numbers: {drawResult.numbers.join(', ')}</p>
              <p>Bonus Numbers: {drawResult.bonus.join(', ')}</p>
            </div>
            {allComparisonResults.map((result, index) => {
              const hasPrizeForLine = result.prizeTier !== "No Prize";
              const isDiv1 = result.prizeTier === "Division 1";
              const prizeAmount = drawResult.prizes[result.prizeTier] || 0;
              
              const lineBg = hasPrizeForLine ? 'bg-green-50' : 'bg-blue-50';
              const lineBorder = hasPrizeForLine ? 'border-green-200' : 'border-blue-200';
              
              return (
                <div key={index} className={`mb-4 pb-4 border-b last:border-b-0 ${lineBg} ${lineBorder} p-4 rounded-lg`}>
                  <h3 className="text-xl font-semibold text-blue-700 mb-2">Set {index + 1}</h3>
                  <p className="text-lg text-gray-800 mb-1">
                    <span className="font-semibold">Main Numbers Matched:</span> {result.mainMatchesCount}
                  </p>
                  <p className="text-lg text-gray-800 mb-1">
                    <span className="font-semibold">Bonus Numbers Matched:</span> {result.bonusMatchesCount}
                    {result.matchedBonusNumbers.length > 0 &&
                      ` (${result.matchedBonusNumbers.join(', ')})`}
                  </p>
                  <p className="text-lg text-gray-800 mb-1">
                    <span className="font-semibold">Prize Tier:</span>{' '}
                    <span className="font-bold text-blue-700">
                      {result.prizeTier} {hasPrizeForLine && (
                        <span>({isDiv1 && prizeAmount === 0 ? 'JACKPOT!' : formatCurrency(prizeAmount)})</span>
                      )}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
