// app/odds/page.tsx
import { Metadata } from 'next';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Australian Lotto Odds Explained: Powerball & Oz Lotto Probability",
  description: "A comprehensive guide to the mathematical odds of winning Australian lotteries. Detailed breakdown of Division 1 to 9 for Powerball, Oz Lotto, and Tatts Lotto.",
  keywords: ["Lotto Odds Australia", "Powerball Probability", "Oz Lotto Winning Chance", "Lottery Mathematics"],
};

export default function OddsPage() {
  const games = [
    {
      name: "Powerball",
      odds: "1 in 134,490,400",
      description: "To win Division 1, you must match all 7 main numbers plus the Powerball. It is Australia's hardest game to win, but offers the largest jackpots.",
      divisions: [
        { tier: "Div 1", matches: "7 + PB", odds: "1:134,490,400" },
        { tier: "Div 2", matches: "7", odds: "1:7,078,443" },
        { tier: "Div 3", matches: "6 + PB", odds: "1:686,176" },
        { tier: "Div 9", matches: "2 + PB", odds: "1:66" }
      ]
    },
    {
      name: "Oz Lotto",
      odds: "1 in 45,379,620",
      description: "Match 7 numbers from 47. Oz Lotto is known for its high number of winners in lower divisions due to the three supplementary numbers.",
      divisions: [
        { tier: "Div 1", matches: "7", odds: "1:45,379,620" },
        { tier: "Div 2", matches: "6 + 1 Supp", odds: "1:3,398,472" },
        { tier: "Div 3", matches: "6", odds: "1:180,770" },
        { tier: "Div 7", matches: "3 + 1 Supp", odds: "1:71" }
      ]
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-24 space-y-24">
        <header className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-none">
            The <span className="text-indigo-600 italic">Mathematics</span> of Winning
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            Understanding the true probability behind the draw is the first step toward responsible play. Explore the statistical reality of Australia's biggest games.
          </p>
        </header>

        <div className="space-y-20">
          {games.map((game) => (
            <section key={game.name} className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-gray-900 dark:border-white pb-6">
                <div>
                  <h2 className="text-4xl font-black uppercase italic">{game.name}</h2>
                  <p className="text-gray-500 mt-2 font-medium">{game.description}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Division 1 Odds</p>
                  <p className="text-3xl font-black text-indigo-600">{game.odds}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {game.divisions.map((div) => (
                  <div key={div.tier} className="bg-gray-50 dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{div.tier}</p>
                    <p className="text-xl font-black mb-1">{div.odds}</p>
                    <p className="text-xs font-bold text-gray-500 uppercase">{div.matches}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="bg-indigo-600 rounded-[3rem] p-10 sm:p-16 text-white text-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter italic leading-none">Experience the Odds First-Hand</h2>
            <p className="text-indigo-100 text-lg sm:text-xl max-w-2xl mx-auto font-medium">
              Don't just read about the probability. Run a simulation to see how those odds play out over thousands of virtual years.
            </p>
            <div className="flex justify-center">
              <Link href="/simulator" className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">Launch Simulator</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
