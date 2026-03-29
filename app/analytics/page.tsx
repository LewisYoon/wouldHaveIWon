'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import { supabase } from '../../lib/supabase';

type GameType = 'Oz Lotto' | 'Powerball' | 'Tatts Lotto';

export default function AnalyticsPage() {
  const [game, setGame] = useState<GameType>('Oz Lotto');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('draw_results')
        .select('*')
        .eq('game', game)
        .order('draw_date', { ascending: false });
      
      setResults(data || []);
      setLoading(false);
    };
    fetchResults();
  }, [game]);

  const stats = useMemo(() => {
    if (results.length === 0) return null;

    const freqMap: Record<number, number> = {};
    const pairMap: Record<string, number> = {};
    const lastSeenMap: Record<number, string> = {};
    const totalDraws = results.length;

    // Range depends on game
    const maxBall = game === 'Oz Lotto' ? 47 : game === 'Powerball' ? 35 : 45;

    // Initialize maps
    for (let i = 1; i <= maxBall; i++) {
      freqMap[i] = 0;
      lastSeenMap[i] = 'Never';
    }

    results.forEach((draw) => {
      const nums = [...draw.numbers].sort((a, b) => a - b);
      
      // Frequency & Last Seen
      nums.forEach((n: number) => {
        freqMap[n]++;
        if (lastSeenMap[n] === 'Never') {
          lastSeenMap[n] = draw.draw_date;
        }
      });

      // Pairs
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          const pair = `${nums[i]},${nums[j]}`;
          pairMap[pair] = (pairMap[pair] || 0) + 1;
        }
      }
    });

    const sortedFreq = Object.entries(freqMap)
      .map(([num, count]) => ({ num: parseInt(num), count, percent: (count / totalDraws) * 100 }))
      .sort((a, b) => b.count - a.count);

    const sortedPairs = Object.entries(pairMap)
      .map(([pair, count]) => ({ pair: pair.split(',').map(Number), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const hotNumbers = sortedFreq.slice(0, 6);
    const coldNumbers = [...sortedFreq].reverse().slice(0, 6);

    const startDate = results[results.length - 1]?.draw_date;
    const endDate = results[0]?.draw_date;

    return { hotNumbers, coldNumbers, sortedFreq, sortedPairs, totalDraws, lastSeenMap, startDate, endDate };
  }, [results, game]);

  const brandColor = game === 'Oz Lotto' ? 'emerald' : game === 'Tatts Lotto' ? 'red' : 'indigo';

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 selection:bg-indigo-500 transition-colors duration-500">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-6 py-20">
        <header className="text-left mb-12 sm:mb-16 animate-in fade-in slide-in-from-top-8 duration-1000">
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-6 sm:mb-8 italic">
            Lotto <span className={`text-${brandColor}-600 dark:text-${brandColor}-400`}>Analytics</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-3xl font-medium leading-relaxed mb-8">
            Data-driven insights into the most frequent and rarest numbers in Australian lotteries based on historical draw history.
          </p>
          {stats && (
            <div className="inline-flex flex-wrap items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>{stats.startDate} — {stats.endDate}</span>
              </div>
              <span className="hidden sm:inline text-gray-300">|</span>
              <span>{stats.totalDraws} Draws</span>
            </div>
          )}
        </header>

        <div className="flex flex-wrap gap-2 sm:gap-4 mb-12 sm:mb-16">
          {(['Oz Lotto', 'Powerball', 'Tatts Lotto'] as GameType[]).map((g) => (
            <button
              key={g}
              onClick={() => setGame(g)}
              className={`flex-1 sm:flex-none px-6 sm:px-10 py-3.5 sm:py-4 rounded-xl sm:rounded-[2rem] text-[10px] sm:text-sm font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all transform active:scale-95 ${
                game === g 
                  ? `bg-${brandColor}-600 text-white shadow-xl scale-105` 
                  : 'bg-white dark:bg-white/5 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-40 flex flex-col items-center gap-6 animate-pulse">
            <div className={`w-16 h-16 border-4 border-${brandColor}-500 border-t-transparent rounded-full animate-spin`} />
            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Analyzing historical data...</p>
          </div>
        ) : stats ? (
          <div className="space-y-24">
            
            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
              {/* Hot Numbers */}
              <section className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-gray-100 dark:border-white/5 shadow-2xl relative overflow-hidden text-left">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${brandColor}-500/5 rounded-full -mr-16 -mt-16`} />
                <h2 className="text-2xl sm:text-3xl font-black mb-8 sm:mb-10 tracking-tight uppercase italic flex items-center gap-3">
                  <span className="text-orange-500 text-3xl">🔥</span> Hot Numbers
                </h2>
                <div className="grid grid-cols-3 gap-4 sm:gap-6">
                  {stats.hotNumbers.map((item) => (
                    <div key={item.num} className="text-center p-4 sm:p-6 bg-gray-50 dark:bg-white/5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/5 group hover:scale-105 transition-all">
                      <p className={`text-2xl sm:text-4xl font-black mb-1 sm:mb-2 text-${brandColor}-600 dark:text-${brandColor}-400`}>{item.num}</p>
                      <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.count} Draws</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Cold Numbers */}
              <section className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-gray-100 dark:border-white/5 shadow-2xl relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16" />
                <h2 className="text-2xl sm:text-3xl font-black mb-8 sm:mb-10 tracking-tight uppercase italic flex items-center gap-3">
                  <span className="text-blue-400 text-3xl">❄️</span> Cold Numbers
                </h2>
                <div className="grid grid-cols-3 gap-4 sm:gap-6">
                  {stats.coldNumbers.map((item) => (
                    <div key={item.num} className="text-center p-4 sm:p-6 bg-gray-50 dark:bg-white/5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/5 group hover:scale-105 transition-all">
                      <p className="text-2xl sm:text-4xl font-black mb-1 sm:mb-2 text-gray-400">{item.num}</p>
                      <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.count} Draws</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Frequent Pairs */}
            <section className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-gray-100 dark:border-white/5 shadow-2xl text-left">
                <h2 className="text-2xl sm:text-3xl font-black mb-10 tracking-tight uppercase italic flex items-center gap-3">
                    <span className="text-indigo-500 text-3xl">👯</span> Frequent Pairs
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    {stats.sortedPairs.map((item, i) => (
                        <div key={i} className="p-6 bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/5 flex flex-col items-center">
                            <div className="flex gap-2 mb-4">
                                {item.pair.map(n => (
                                    <span key={n} className={`w-10 h-10 rounded-full ${n % 2 === 0 ? 'bg-indigo-600' : 'bg-indigo-400'} text-white flex items-center justify-center font-black shadow-md`}>{n}</span>
                                ))}
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.count} Shared Draws</p>
                        </div>
                    ))}
                </div>
                <p className="mt-8 text-xs text-gray-400 font-medium italic text-center">Pairs of numbers that have appeared together in the same draw most often.</p>
            </section>

            {/* Frequency Chart */}
            <section className="bg-gray-950 p-8 sm:p-12 md:p-20 rounded-[2.5rem] sm:rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
              <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:24px_24px]" />
              <h2 className="text-3xl sm:text-4xl font-black mb-12 sm:mb-16 tracking-tight uppercase italic text-center relative z-10 leading-tight">Number Distribution (%)</h2>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 relative z-10">
                {stats.sortedFreq.sort((a,b) => a.num - b.num).map((item) => {
                  const intensity = Math.min(1, item.percent / 20);
                  return (
                    <div key={item.num} className="group relative">
                      <div 
                        className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-xs sm:text-sm transition-all duration-500 border border-white/10 hover:scale-110 cursor-default`}
                        style={{ backgroundColor: `rgba(79, 70, 229, ${intensity + 0.1})` }}
                      >
                        {item.num}
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-white text-gray-950 rounded-xl text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-20 hidden sm:block">
                        {item.count} Draws ({item.percent.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SEO Content Section */}
            <section className="max-w-4xl mx-auto prose prose-indigo dark:prose-invert space-y-12 text-left border-t border-gray-100 dark:border-white/5 pt-20">
              <h2 className="text-4xl font-black uppercase tracking-tight italic">How to Use Lotto Statistics Effectively</h2>
              <div className="text-gray-600 dark:text-gray-400 space-y-8 text-lg font-medium leading-relaxed">
                <p>
                  While every Australian lottery draw is a mathematically independent event, historical data often reveals patterns that catch the eye of many players. The <strong>Most Common Powerball Numbers</strong> or <strong>Oz Lotto Frequency Charts</strong> are among the most searched terms for a reason: they help players narrow down their selections from a vast pool of possibilities.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 not-prose">
                  <div className="space-y-4 p-8 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight italic">The Hot Number Theory</h3>
                    <p className="text-sm">Some players believe that "Hot" numbers are currently in a streak and are more likely to appear again. Our analytics engine helps you identify these trends over any given historical period.</p>
                  </div>
                  <div className="space-y-4 p-8 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight italic">The Law of Averages</h3>
                    <p className="text-sm">Conversely, "Cold" numbers are those that haven't appeared for a while. Proponents of this theory believe these numbers are "due" to come up to satisfy long-term probability balances.</p>
                  </div>
                </div>

                <p>
                  Using our <strong>Lotto Simulator</strong> in conjunction with these statistics allows you to test both theories. You can create a batch of tickets using only "Hot" numbers and see how they would have performed over the last 10 years of real data. This is the most professional and risk-free way to develop your own personal lottery strategy.
                </p>
              </div>
            </section>

          </div>
        ) : (
          <div className="py-40 text-center bg-gray-50 dark:bg-white/5 rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-white/10">
            <p className="text-gray-400 font-bold italic uppercase tracking-widest text-sm">No draw data available for analysis yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
