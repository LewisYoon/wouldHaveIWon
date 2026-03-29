// components/NumberAnalyzer.tsx
'use client';

import { useState, useMemo } from 'react';

export default function NumberAnalyzer() {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [inputVal, setInputVal] = useState<string>('');

  const analysis = useMemo(() => {
    if (numbers.length === 0) return null;

    const evenCount = numbers.filter(n => n % 2 === 0).length;
    const oddCount = numbers.length - evenCount;
    const sum = numbers.reduce((a, b) => a + b, 0);
    const lowCount = numbers.filter(n => n <= 22).length; // 1-45 range middle
    const highCount = numbers.length - lowCount;

    // Bell curve analysis (Sum of 6 numbers usually falls between 100-200)
    const sumScore = sum >= 100 && sum <= 200 ? 'Balanced' : sum < 100 ? 'Very Low' : 'Very High';

    const feedback = [];
    if (evenCount === 0 || oddCount === 0) {
      feedback.push("Your set is heavily weighted towards one side of the odd/even spectrum. Statistically, a mix is more common.");
    }
    if (lowCount === 0 || highCount === 0) {
      feedback.push("Your set lacks a balance of low and high numbers. Most winning draws contain a mix of both halves.");
    }
    if (sumScore !== 'Balanced') {
      feedback.push(`The sum of your numbers (${sum}) is ${sumScore.toLowerCase()} compared to the historical 70% range of 100-200.`);
    }
    if (numbers.some((n, i) => i > 0 && n === numbers[i-1] + 1 && i > 1 && numbers[i-1] === numbers[i-2] + 1)) {
        feedback.push("You have a sequence of 3 or more consecutive numbers. While possible, this is statistically rare in actual draws.");
    }

    return { evenCount, oddCount, sum, lowCount, highCount, sumScore, feedback };
  }, [numbers]);

  const handleProcessInput = () => {
    const parsed = Array.from(new Set(inputVal.split(/[, ]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n > 0 && n <= 47)));
    if (parsed.length > 0) setNumbers(parsed.sort((a,b) => a-b));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-10 bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-2xl text-left">
      <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter italic border-b-4 border-indigo-500 inline-block text-gray-900 dark:text-white">Strategy Analyzer</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Enter your numbers separated by space or comma to analyze their mathematical balance and historical alignment.</p>
          <div className="flex gap-2">
            <input 
              type="text" value={inputVal} onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. 7, 14, 23, 31, 44, 45"
              className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all font-bold"
            />
            <button onClick={handleProcessInput} className="bg-indigo-600 text-white px-8 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-500 transition-all">Analyze</button>
          </div>

          <div className="flex flex-wrap gap-3 min-h-[50px]">
            {numbers.map(n => (
              <span key={n} className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg border border-indigo-100 dark:border-indigo-500/20 animate-in zoom-in-75 duration-300">{n}</span>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-white/5 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5">
          {analysis ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Odd / Even Ratio</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{analysis.oddCount} : {analysis.evenCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Low / High Ratio</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{analysis.lowCount} : {analysis.highCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sum Total</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{analysis.sum}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sum Spectrum</p>
                  <p className={`text-xl font-black ${analysis.sumScore === 'Balanced' ? 'text-emerald-500' : 'text-amber-500'}`}>{analysis.sumScore}</p>
                </div>
              </div>
              
              <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-white/10">
                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Insights & Observations</p>
                {analysis.feedback.length > 0 ? (
                  analysis.feedback.map((f, i) => (
                    <p key={i} className="text-[11px] text-gray-600 dark:text-gray-400 font-bold leading-relaxed flex gap-2">
                        <span className="text-amber-500">⚠</span> {f}
                    </p>
                  ))
                ) : (
                  <p className="text-[11px] text-emerald-500 font-bold leading-relaxed flex gap-2">
                      <span className="text-emerald-500">✓</span> Your sequence is mathematically balanced and aligns with typical winning patterns.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center py-10">
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs italic">Awaiting Analysis...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
