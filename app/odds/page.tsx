'use client';

import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { useState } from 'react';

export default function OddsPage() {
  const [game, setGame] = useState<'Oz Lotto' | 'Powerball' | 'Tatts Lotto'>('Oz Lotto');

  const oddsData: Record<string, {
    title: string;
    desc: string;
    history: string;
    mainNumbers: string;
    suppNumbers?: string;
    powerballNumbers?: string;
    totalBalls: number;
    breakdown: { div: string; matches: string; odds: string; }[];
    color: string;
  }> = {
    'Oz Lotto': {
      title: 'Oz Lotto Odds & Probabilities',
      desc: 'Oz Lotto is one of Australia’s most popular national lottery games, known for its massive jackpots and unique 7-number format.',
      history: 'Launched in 1994, Oz Lotto was Australia’s first truly national lottery game. Originally, it required players to pick 6 numbers, similar to Tatts Lotto. However, in 2005, the format was changed to require 7 numbers, significantly increasing the jackpot sizes and creating the iconic emerald-branded game we know today. In 2022, the ball pool was further expanded from 45 to 47 to allow for even larger prizes.',
      mainNumbers: '7 from 47',
      suppNumbers: '3 from remaining 40',
      totalBalls: 47,
      breakdown: [
        { div: '1', matches: '7 Main', odds: '1 in 62,891,499' },
        { div: '2', matches: '6 Main + 1 Supp', odds: '1 in 2,429,919' },
        { div: '3', matches: '6 Main', odds: '1 in 1,029,919' },
        { div: '4', matches: '5 Main + 1 Supp', odds: '1 in 52,243' },
        { div: '5', matches: '5 Main', odds: '1 in 24,098' },
        { div: '6', matches: '4 Main', odds: '1 in 1,173' },
        { div: '7', matches: '3 Main + 1 Supp', odds: '1 in 186' },
      ],
      color: 'emerald',
    },
    'Powerball': {
      title: 'Powerball Odds & Probabilities',
      desc: 'Powerball Australia is modeled after the famous American game but with its own distinct rules and massive multi-million dollar prize pools.',
      history: 'Since its introduction in 1996, Powerball has consistently produced Australia’s largest individual lottery wins. The game underwent a major transformation in 2018, moving to its current format of picking 7 numbers from 35, plus the all-important Powerball from a separate pool of 20. This change was designed to create more winners across more divisions while allowing the Division 1 jackpot to reach record-breaking heights.',
      mainNumbers: '7 from 35',
      powerballNumbers: '1 from 20',
      totalBalls: 35,
      breakdown: [
        { div: '1', matches: '7 Main + PB', odds: '1 in 134,490,400' },
        { div: '2', matches: '7 Main', odds: '1 in 7,078,443' },
        { div: '3', matches: '6 Main + PB', odds: '1 in 367,237' },
        { div: '4', matches: '6 Main', odds: '1 in 19,328' },
        { div: '5', matches: '5 Main + PB', odds: '1 in 12,056' },
        { div: '6', matches: '4 Main + PB', odds: '1 in 1,021' },
        { div: '7', matches: '5 Main', odds: '1 in 635' },
        { div: '8', matches: '3 Main + PB', odds: '1 in 186' },
        { div: '9', matches: '2 Main + PB', odds: '1 in 66' },
      ],
      color: 'indigo',
    },
    'Tatts Lotto': {
      title: 'Tatts Lotto (Saturday Lotto) Odds & Probabilities',
      desc: 'Tatts Lotto, or Saturday Lotto, is the traditional favorite for Australians, offering the best overall odds of winning any prize among the major games.',
      history: 'Tatts Lotto has been a Saturday night staple since the 1970s. It is celebrated for its regular "Superdraws" and "Megadraws," which offer significantly boosted Division 1 prize pools. Unlike Oz Lotto or Powerball, Tatts Lotto maintains a consistent 6/45 format, making it the most mathematically accessible game for players seeking a balanced win-to-odds ratio.',
      mainNumbers: '6 from 45',
      suppNumbers: '2 from remaining 39',
      totalBalls: 45,
      breakdown: [
        { div: '1', matches: '6 Main', odds: '1 in 8,145,060' },
        { div: '2', matches: '5 Main + 1-2 Supps', odds: '1 in 678,755' },
        { div: '3', matches: '5 Main', odds: '1 in 36,690' },
        { div: '4', matches: '4 Main', odds: '1 in 732' },
        { div: '5', matches: '3 Main + 1-2 Supps', odds: '1 in 297' },
        { div: '6', matches: '3 Main', odds: '1 in 45' },
      ],
      color: 'red',
    },
  };

  const currentOdds = oddsData[game];
  const brandColor = currentOdds.color === 'emerald' ? 'text-emerald-600' : currentOdds.color === 'red' ? 'text-red-600' : 'text-indigo-600';
  const brandBg = currentOdds.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-950/20' : currentOdds.color === 'red' ? 'bg-red-50 dark:bg-red-950/20' : 'bg-indigo-50 dark:bg-indigo-950/20';
  const brandBgLight = currentOdds.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-500/10' : currentOdds.color === 'red' ? 'bg-red-100 dark:bg-red-500/10' : 'bg-indigo-100 dark:bg-indigo-500/10';

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <div className="text-center mb-10 sm:mb-16 animate-in fade-in slide-in-from-top-8 duration-1000">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600 dark:from-indigo-400 dark:to-emerald-400 leading-tight pb-4">
            Odds & History
          </h1>
          <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto font-medium px-4">
            Discover the mathematics and heritage behind Australia's most iconic games.
          </p>
        </div>

        <div className="flex justify-center flex-wrap gap-2 sm:gap-4 mb-10 sm:mb-16">
          {Object.keys(oddsData).map((g) => (
            <button
              key={g}
              onClick={() => setGame(g as any)}
              className={`flex-1 sm:flex-none px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-[2rem] text-[10px] sm:text-sm font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all transform active:scale-95 ${
                game === g 
                  ? (oddsData[g as keyof typeof oddsData].color === 'emerald' ? 'bg-emerald-600 text-white shadow-xl scale-105' : oddsData[g as keyof typeof oddsData].color === 'red' ? 'bg-red-600 text-white shadow-xl scale-105' : 'bg-indigo-600 text-white shadow-xl scale-105')
                  : 'bg-white dark:bg-white/5 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 text-left">
          
          <div className="lg:col-span-2 space-y-8 sm:space-y-12">
            <section className={`p-8 sm:p-10 md:p-16 rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl border border-gray-100 dark:border-white/5 ${brandBg} relative overflow-hidden group`}>
              <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 blur-3xl opacity-20 ${currentOdds.color === 'emerald' ? 'bg-emerald-500' : currentOdds.color === 'red' ? 'bg-red-500' : 'bg-indigo-500'}`} />
              
              <h2 className={`text-2xl sm:text-4xl font-black mb-6 sm:mb-8 tracking-tight uppercase italic ${brandColor}`}>{currentOdds.title}</h2>
              <div className="space-y-6 sm:space-y-8 text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                <p>{currentOdds.desc}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 py-6 sm:py-8 border-y border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-inner ${brandBgLight}`}>🔢</div>
                        <div><p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Main Pool</p><p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{currentOdds.mainNumbers}</p></div>
                    </div>
                    {currentOdds.powerballNumbers ? (
                        <div className="flex items-center gap-4 sm:gap-5">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-inner ${brandBgLight}`}>⚡</div>
                            <div><p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Powerball</p><p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{currentOdds.powerballNumbers}</p></div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 sm:gap-5">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-inner ${brandBgLight}`}>✨</div>
                            <div><p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Supplementary</p><p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{currentOdds.suppNumbers}</p></div>
                        </div>
                    )}
                </div>

                <h3 className="text-xl sm:text-2xl font-black pt-4 uppercase tracking-tight italic">The Heritage</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{currentOdds.history}</p>
              </div>
            </section>

            <section className="bg-white dark:bg-gray-900 p-8 sm:p-10 md:p-16 rounded-[2.5rem] sm:rounded-[4rem] border border-gray-100 dark:border-white/5 shadow-2xl overflow-hidden">
              <h3 className="text-2xl sm:text-3xl font-black mb-8 sm:mb-10 tracking-tight uppercase italic">Statistical Breakdown</h3>
              <div className="overflow-x-auto -mx-8 px-8">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-100 dark:border-white/5">
                      <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Winning Tier</th>
                      <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Requirements</th>
                      <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Chances</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                    {currentOdds.breakdown.map((item) => (
                      <tr key={item.div} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 sm:px-6 py-4 sm:py-6 font-black text-sm sm:text-base text-gray-900 dark:text-white whitespace-nowrap">Div {item.div}</td>
                        <td className="px-4 sm:px-6 py-4 sm:py-6 font-bold text-gray-600 dark:text-gray-400 text-xs sm:text-sm whitespace-nowrap">{item.matches}</td>
                        <td className={`px-4 sm:px-6 py-4 sm:py-6 font-black text-base sm:text-lg tracking-tighter ${brandColor} whitespace-nowrap`}>{item.odds}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Static Educational Content for AdSense */}
            <section className="max-w-none prose prose-indigo dark:prose-invert space-y-8 text-left border-t border-gray-100 dark:border-white/5 pt-12 sm:pt-16">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight italic">Understanding Lottery Mathematics</h2>
              <div className="text-gray-600 dark:text-gray-400 space-y-6 font-medium leading-relaxed">
                <p>
                  The odds displayed above are calculated using combinatorics, a branch of mathematics concerned with counting. For Australian lotteries, the probability of winning is fixed and does not change based on previous draws or the number of people playing.
                </p>
                
                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white uppercase">The Power of Randomness</h3>
                <p>
                  Many players search for "hot" or "cold" numbers, but in a mathematically fair system like the Australian lottery Bloc, every ball has an equal probability of being drawn in every draw. Our <strong>Lotto Simulator</strong> uses this same principle of true randomness to help you visualize why "systems" rarely beat the house edge.
                </p>

                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white uppercase">Why Odds Vary Between Games</h3>
                <p>
                  The primary factor in lottery odds is the "matrix"—the size of the ball pool and the number of balls required to win. For example, Powerball Australia's 7/35 + 1/20 matrix creates much higher odds (1 in 134 million) than Tatts Lotto's 6/45 matrix (1 in 8 million). This is why Powerball jackpots can grow to massive amounts, as they are harder to win and more likely to roll over.
                </p>
              </div>
            </section>
          </div>

          <aside className="space-y-8 sm:space-y-10">
            <div className="p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] bg-gray-950 text-white shadow-2xl relative overflow-hidden border border-white/5">
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl" />
                <h4 className="text-lg sm:text-xl font-black mb-4 sm:mb-6 uppercase tracking-tighter italic">Pro Tip</h4>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-medium">
                    Did you know that while the odds of winning Division 1 are slim, the overall odds of winning <strong>any</strong> prize in Tatts Lotto are approximately 1 in 42? Simulation helps you visualize these smaller frequent wins vs the rare big hits.
                </p>
            </div>

            <div className="p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] bg-indigo-600 text-white shadow-2xl group hover:scale-[1.02] transition-all">
                <h4 className="text-lg sm:text-xl font-black mb-4 sm:mb-6 uppercase tracking-tighter italic">Test Your Numbers</h4>
                <p className="text-indigo-100 text-xs sm:text-sm mb-6 sm:mb-8 font-medium">
                    Curious how your favorite numbers would perform over 100 years of simulated draws?
                </p>
                <Link href="/simulator" className="w-full py-4 bg-white text-indigo-600 rounded-xl sm:rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] block text-center shadow-lg group-hover:brightness-110 transition-all">Launch Simulator</Link>
            </div>

            <div className="p-8 sm:p-10 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2.5rem] sm:rounded-[3rem] text-center">
                <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-loose">
                    Always play within your limits. Lottery simulation is for entertainment and awareness.
                </p>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
