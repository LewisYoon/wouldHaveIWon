// components/MiniCalculator.tsx
'use client';

import { useState, useMemo } from 'react';

type CalcType = 'odds' | 'savings';

export default function MiniCalculator({ type = 'odds' }: { type?: CalcType }) {
  const [value, setValue] = useState<number>(50); // Weekly spend

  const savingsResults = useMemo(() => {
    const weekly = value;
    const monthly = weekly * 4.33;
    const yearly = weekly * 52;
    const fiveYearsReturn = yearly * 5 * 1.4; // 40% gain after 5 years (8% annual)
    
    return { monthly, yearly, fiveYearsReturn };
  }, [value]);

  if (type === 'savings') {
    return (
      <div className="my-12 p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl">
        <h4 className="text-xl font-black mb-6 uppercase tracking-tight italic">Lotto Spending vs. Investing</h4>
        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-4 opacity-70">Weekly Lotto Budget: ${value}</label>
            <input 
              type="range" min="10" max="500" step="10" value={value} 
              onChange={(e) => setValue(parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 p-5 rounded-2xl">
              <p className="text-[9px] font-black uppercase opacity-60 mb-1">Monthly Cost</p>
              <p className="text-2xl font-black">${Math.floor(savingsResults.monthly)}</p>
            </div>
            <div className="bg-white/10 p-5 rounded-2xl">
              <p className="text-[9px] font-black uppercase opacity-60 mb-1">Yearly Cost</p>
              <p className="text-2xl font-black">${Math.floor(savingsResults.yearly).toLocaleString()}</p>
            </div>
            <div className="bg-emerald-400/20 p-5 rounded-2xl border border-emerald-400/30">
              <p className="text-[9px] font-black uppercase text-emerald-300 mb-1">5Y Invested Return</p>
              <p className="text-2xl font-black text-emerald-300">${Math.floor(savingsResults.fiveYearsReturn).toLocaleString()}</p>
            </div>
          </div>
          <p className="text-[10px] opacity-50 italic">*Assuming 8% average market return vs. 100% lotto loss.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-12 p-8 bg-gray-900 rounded-[2.5rem] text-white shadow-2xl border border-white/10">
      <h4 className="text-xl font-black mb-6 uppercase tracking-tight italic">Win Probability Calculator</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <p className="text-sm text-gray-400 font-medium">Select a game to see the mathematical impossibility:</p>
          <div className="flex flex-col gap-2">
            {['Powerball', 'Oz Lotto', 'Tatts Lotto'].map(g => (
              <button key={g} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-left font-black text-xs uppercase tracking-widest transition-all">
                {g} Odds
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-center items-center text-center p-6 bg-white/5 rounded-3xl border border-white/5">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Jackpot Chance</p>
          <p className="text-3xl font-black text-indigo-400 tracking-tighter">1 in 134,490,400</p>
          <p className="mt-4 text-[11px] text-gray-400 leading-relaxed italic">"You are more likely to be struck by lightning twice."</p>
        </div>
      </div>
    </div>
  );
}
