'use client';

import { useState, useEffect, useRef } from 'react';
import NumberPicker from '../components/NumberPicker';
import { compareNumbers, ComparisonResult } from '../lib/lotto-utils';
import Confetti from 'react-confetti';

export default function Home() {
  const [allComparisonResults, setAllComparisonResults] = useState<ComparisonResult[] | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Mock draw numbers and bonus numbers for demonstration
  const mockDrawNumbers: number[] = [3, 15, 22, 28, 30, 37, 41].sort((a, b) => a - b);
  const mockBonusNumbers: number[] = [10, 25, 45].sort((a, b) => a - b);

  const handleCheckAllResults = (allLines: number[][]) => {
    const results: ComparisonResult[] = [];
    let anyPrizeWon = false;

    allLines.forEach(userNumbers => {
      const result = compareNumbers(userNumbers, mockDrawNumbers, mockBonusNumbers);
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
      }, 10000); // Show confetti for 10 seconds
      return () => clearTimeout(timer);
    }
  };

  const handleClearAllResults = () => {
    setAllComparisonResults(null);
    setShowConfetti(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center py-2 bg-gray-100 relative">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} gravity={0.1} />}

      <nav className="w-full bg-gray-700 p-4 text-white shadow-md border-b border-gray-600"> {/* Updated header styling */}
        <div className="container mx-auto flex justify-center items-center">
          <a href="#" className="text-2xl font-extrabold tracking-wide">Lotto App</a> {/* More prominent title */}
        </div>
      </nav>
      <main className="flex w-full flex-1 flex-col items-center px-4 md:px-20 text-center pb-32">
        <h1 className="text-4xl md:text-6xl font-bold my-8 text-gray-900">
          Would I Have Won Lotto?
        </h1>
        <NumberPicker onCheckAllResults={handleCheckAllResults} onClearAll={handleClearAllResults} resultsRef={resultsRef} />

        {allComparisonResults && allComparisonResults.length > 0 && (
          <div ref={resultsRef} className={`mt-8 p-6 bg-blue-50 border-blue-200 border rounded-lg shadow-md text-left w-full max-w-2xl`}>
            <h2 className="text-2xl font-bold text-blue-800 mb-4 text-center">All Your Results</h2>
            <div className="mb-4 text-sm text-gray-600 text-center">
              <p>Mock Draw Numbers: {mockDrawNumbers.join(', ')}</p>
              <p>Mock Bonus Numbers: {mockBonusNumbers.join(', ')}</p>
            </div>
            {allComparisonResults.map((result, index) => {
              const hasPrizeForLine = result.prizeTier !== "No Prize";
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
                    <span className="font-bold text-blue-700">{result.prizeTier}</span>
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