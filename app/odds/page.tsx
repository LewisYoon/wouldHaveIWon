'use client';

import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { useState } from 'react';

export default function OddsPage() {
  const [game, setGame] = useState<'Oz Lotto' | 'Powerball' | 'Tatts Lotto'>('Oz Lotto');

  const oddsData: Record<string, {
    title: string;
    desc: string;
    mainNumbers: string;
    suppNumbers?: string;
    powerballNumbers?: string;
    totalBalls: number;
    breakdown: { div: string; matches: string; odds: string; }[];
    color: string;
  }> = {
    'Oz Lotto': {
      title: 'Oz Lotto Odds & Probabilities',
      desc: 'Oz Lotto requires you to pick 7 numbers from 1 to 47. Three supplementary numbers are drawn from the remaining 40 balls, and these are used to determine Divisions 2, 4, and 7.',
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
      desc: 'Powerball requires you to pick 7 numbers from 1 to 35, plus 1 Powerball number from 1 to 20. The Powerball number significantly impacts the odds across multiple divisions.',
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
      desc: 'Tatts Lotto, also known as Saturday Lotto, requires you to pick 6 numbers from 1 to 45. Two supplementary numbers are drawn from the remaining 39 balls to determine Divisions 2 and 5.',
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
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
            Understand the Odds
          </h1>
          <p className="mt-4 text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Demystifying the probabilities behind Australia's favorite lottery games.
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-16">
          {Object.keys(oddsData).map((g) => (
            <button
              key={g}
              onClick={() => setGame(g as any)}
              className={`px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                game === g 
                  ? (oddsData[g as keyof typeof oddsData].color === 'emerald' ? 'bg-emerald-600 text-white shadow-lg' : oddsData[g as keyof typeof oddsData].color === 'red' ? 'bg-red-600 text-white shadow-lg' : 'bg-indigo-600 text-white shadow-lg')
                  : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <section className={`p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-white/5 ${brandBg} text-left`}>
          <h2 className={`text-3xl font-black mb-4 ${brandColor}`}>{currentOdds.title}</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">{currentOdds.desc}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-10">
            <div className="flex items-center gap-4">
              <span className={`w-10 h-10 flex items-center justify-center rounded-full ${brandColor} bg-opacity-20 text-xl font-bold`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/><line x1="20" y1="22" x2="20" y2="15"/></svg>
              </span>
              <div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Main Numbers</p>
                <p className="text-lg font-black text-gray-900 dark:text-white">{currentOdds.mainNumbers}</p>
              </div>
            </div>
            {currentOdds.powerballNumbers && (
              <div className="flex items-center gap-4">
                <span className={`w-10 h-10 flex items-center justify-center rounded-full ${brandColor} bg-opacity-20 text-xl font-bold`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Powerball</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">{currentOdds.powerballNumbers}</p>
                </div>
              </div>
            )}
            {currentOdds.suppNumbers && (
              <div className="flex items-center gap-4">
                <span className={`w-10 h-10 flex items-center justify-center rounded-full ${brandColor} bg-opacity-20 text-xl font-bold`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M10 9.3l-2.6 3.9"/><path d="M14 9.3l2.6 3.9"/><path d="M12 16.5l-2.6-3.9h5.2z"/></svg>
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Supplementary Numbers</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">{currentOdds.suppNumbers}</p>
                </div>
              </div>
            )}
          </div>

          <h3 className="text-2xl font-black mb-6 text-gray-900 dark:text-white">Winning Divisions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-900 rounded-lg shadow-md">
              <thead>
                <tr className={`bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-white/10 ${brandBgLight}`}>
                  <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Division</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Matches Required</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Odds</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                {currentOdds.breakdown.map((item) => (
                  <tr key={item.div} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Division {item.div}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{item.matches}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{item.odds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-20 p-8 rounded-3xl bg-gray-50 dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-white/5">
          <h2 className="text-3xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-3">
              <span className="text-purple-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
              </span>
              Perspective is Key
            </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            While it's exciting to play and imagine winning, remember that lotteries are designed as games of chance. The odds are stacked against winning the top prize. Our platform helps you visualize these odds without any financial risk, promoting a healthy understanding of probability. Always play responsibly. If you or someone you know needs help, please visit our <Link href="/responsible-play" className="text-indigo-500 font-bold underline">Responsible Play</Link> page.
          </p>
        </section>

      </main>
    </div>
  );
}
