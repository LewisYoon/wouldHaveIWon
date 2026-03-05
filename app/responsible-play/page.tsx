import Navbar from '../../components/Navbar';
import Link from 'next/link';

export default function ResponsiblePlayPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-red-600 dark:from-amber-400 dark:to-red-400">
            Responsible Play
          </h1>
          <p className="mt-6 text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            WhatIFLotto is a simulation tool built for fun and education. We advocate for a healthy, balanced approach to gaming.
          </p>
        </div>

        <div className="space-y-16">
          
          <section className="bg-gray-50 dark:bg-gray-900 p-10 rounded-[3rem] shadow-xl border border-gray-100 dark:border-white/5">
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="w-24 h-24 bg-amber-100 dark:bg-amber-500/10 rounded-3xl flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <h2 className="text-3xl font-black mb-4 tracking-tight">The Reality of the Odds</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Winning a major lottery prize is a high-impact, extremely low-probability event. For example, the odds of winning Division 1 in Oz Lotto are approximately 1 in 62 million. To put that in perspective, you are statistically more likely to be struck by lightning than to win the jackpot.
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  Our simulator is a powerful educational tool designed to visualize these probabilities. By running hundreds or thousands of simulations instantly, you can see firsthand how the "house edge" works and why lottery play should never be considered a financial strategy.
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-emerald-50 dark:bg-emerald-500/5 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-500/10">
              <h3 className="text-2xl font-black mb-6 text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Healthy Habits
              </h3>
              <ul className="space-y-4 text-emerald-900 dark:text-emerald-300 font-medium">
                <li className="flex gap-3"><span>•</span> <span>Treat lottery spend as a fixed entertainment cost, like a movie ticket.</span></li>
                <li className="flex gap-3"><span>•</span> <span>Only play with money you can afford to lose.</span></li>
                <li className="flex gap-3"><span>•</span> <span>Never use funds intended for essentials (rent, food, bills).</span></li>
                <li className="flex gap-3"><span>•</span> <span>Take regular breaks and keep your play in perspective.</span></li>
              </ul>
            </div>
            
            <div className="bg-rose-50 dark:bg-rose-500/5 p-8 rounded-[2.5rem] border border-rose-100 dark:border-rose-500/10">
              <h3 className="text-2xl font-black mb-6 text-rose-700 dark:text-rose-400 flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Warning Signs
              </h3>
              <ul className="space-y-4 text-rose-900 dark:text-rose-300 font-medium">
                <li className="flex gap-3"><span>•</span> <span>Feeling stressed or anxious about your lottery play.</span></li>
                <li className="flex gap-3"><span>•</span> <span>Borrowing money or selling items to buy more tickets.</span></li>
                <li className="flex gap-3"><span>•</span> <span>Chasing losses or spending more than you planned.</span></li>
                <li className="flex gap-3"><span>•</span> <span>Hiding the amount of time or money you spend on gaming.</span></li>
              </ul>
            </div>
          </section>

          <section className="bg-gray-950 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent opacity-50" />
            <div className="relative z-10 text-center">
              <h2 className="text-4xl font-black mb-8 italic uppercase tracking-tighter">Professional Support</h2>
              <p className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto">
                If you or someone you care about is experiencing difficulties with gambling, free and confidential support is available 24/7 across Australia.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <a 
                  href="https://www.gamblinghelponline.org.au" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-10 py-5 bg-white text-gray-900 font-black rounded-2xl hover:bg-gray-100 transition shadow-xl uppercase tracking-widest text-sm"
                >
                  Gambling Help Online
                </a>
                <div className="flex items-center justify-center gap-4 text-2xl font-black">
                  <span className="text-gray-500 uppercase text-xs tracking-widest">Or Call</span>
                  <span className="text-indigo-400">1800 858 858</span>
                </div>
              </div>
              
              <p className="mt-12 text-gray-500 text-sm font-medium">
                Lifeline Australia: 13 11 14 (24/7 Crisis Support)
              </p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
