// app/analyzer/page.tsx
import { Metadata } from 'next';
import Navbar from '../../components/Navbar';
import NumberAnalyzer from '../../components/NumberAnalyzer';

export const metadata: Metadata = {
  title: "Lucky Number Analyzer: Check Your Lotto Strategy Balance",
  description: "Analyze your lottery numbers for mathematical balance. Check odd/even ratios, sum totals, and low/high distributions for Australian Powerball and Oz Lotto.",
  keywords: ["Lotto Number Analyzer", "Lottery Strategy Checker", "Powerball Number Analysis", "Lucky Number Math"],
};

export default function AnalyzerPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-24 space-y-24">
        <header className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-none">
            Strategy <span className="text-indigo-600 italic">Analyzer</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            Move beyond mere guessing. Our analyzer provides a mathematical breakdown of your chosen number sequences based on historical winning patterns.
          </p>
        </header>

        <NumberAnalyzer />

        <section className="p-10 bg-gray-50 dark:bg-gray-900/50 rounded-[3rem] border border-gray-100 dark:border-white/5 text-left max-w-4xl mx-auto">
          <h2 className="text-2xl font-black mb-8 uppercase tracking-tight italic">The Mathematics of Winning Combinations</h2>
          <div className="prose dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-400">
            <p>
              In lottery games, while every individual number has an equal chance of being drawn, the <strong>combination</strong> of numbers often follows a statistical distribution. For example, in a 45-number game like Saturday Lotto, it is extremely rare for all six numbers to be odd or all six to be even.
            </p>
            <h3 className="text-gray-900 dark:text-white font-black uppercase text-sm tracking-widest">The Sum Total Bell Curve</h3>
            <p>
              Historically, the sum of winning numbers tends to fall within a specific range (often referred to as the 70% range). For most 6-number games, this is between 100 and 200. Combinations that sum to very small or very large numbers are mathematically less frequent in the pool of all possible combinations.
            </p>
            <h3 className="text-gray-900 dark:text-white font-black uppercase text-sm tracking-widest">Balanced Distributions</h3>
            <p>
              A balanced set of numbers—containing a mix of low (1-22) and high (23-45) values—reflects the natural randomness of the draw. Our analyzer identifies whether your sequence is heavily weighted to one side, which could be an indicator of human bias (such as only picking birthday-related numbers).
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
