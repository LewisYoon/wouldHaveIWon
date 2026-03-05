import Navbar from '../../components/Navbar';

export default function HowItWorksPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500 dark:from-indigo-400 dark:to-emerald-400">
            How It Works
          </h1>
          <p className="mt-6 text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            WhatIFLotto is a free and fun way to see how your favorite numbers would have performed in real lottery draws. No money, no risk—just insight and fun.
          </p>
        </div>

        <div className="space-y-24">
          
          {/* Step 1: Pick Your Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <span className="inline-block px-5 py-2 rounded-full bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-widest mb-6">Step 1</span>
              <h2 className="text-4xl font-black mb-6 tracking-tight">Choose Your Lucky Numbers</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Dive into the excitement by selecting your preferred lottery game: Oz Lotto, Powerball, or TattsLotto. Head over to the <a href="/luck" className="text-indigo-500 font-bold underline">Luck Tracker</a>, where you can easily pick your numbers using our interactive interface. Whether you have a special set of digits or prefer a "Quick Pick" for instant random numbers, we've got you covered. You can save as many different ticket combinations as you wish for upcoming draws, all completely free and without any commitment.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Our number selection process is designed to mimic the official lottery experience, ensuring accurate comparisons.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-white/5 flex items-center justify-center">
              <div className="aspect-video w-full h-full bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <svg className="absolute w-full h-full text-indigo-300 dark:text-indigo-600 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M15 9l-3 3-3-3"/><path d="M9 15h6"/></svg>
                <div className="w-2/3 h-2/3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-lg flex items-center justify-center text-indigo-600 font-black text-3xl z-10">
                    Your Numbers
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Automated Draw Results & Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-white/5 flex items-center justify-center md:order-2">
              <div className="aspect-video w-full h-full bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <svg className="absolute w-full h-full text-emerald-300 dark:text-emerald-600 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M21.5 12c0-5.25-4.25-9.5-9.5-9.5S2.5 6.75 2.5 12s4.25 9.5 9.5 9.5"/><path d="M22 12h-2"/><path d="M13 2.06V4a1 1 0 0 0 1 1h2.94"/><path d="M4 12H2"/><path d="M12 22v-2"/><path d="M11 12.06V11a1 1 0 0 1 1-1h2.94"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/></svg>
                <div className="w-2/3 h-2/3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-lg flex flex-col items-center justify-center text-emerald-600 font-black text-2xl z-10">
                    <span className="text-lg mb-2">Results In!</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>
            </div>
            <div className="text-center md:text-left md:order-1">
              <span className="inline-block px-5 py-2 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-widest mb-6">Step 2</span>
              <h2 className="text-4xl font-black mb-6 tracking-tight">Instant Result Notifications</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Forget manually checking tickets. Our advanced system automatically fetches and processes the official lottery results the moment they are announced. If any of your saved tickets match a winning division, we'll send you an instant, personalized email notification straight to your inbox. It's a hands-free experience designed to keep you informed without lifting a finger.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                We synchronize directly with official data sources to ensure accuracy and timely alerts.
              </p>
            </div>
          </div>

          {/* Step 3: Review and Analyze */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <span className="inline-block px-5 py-2 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-black text-sm uppercase tracking-widest mb-6">Step 3</span>
              <h2 className="text-4xl font-black mb-6 tracking-tight">Detailed Performance Insights</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                After each draw, revisit your <a href="/luck" className="text-indigo-500 font-bold underline">Luck Tracker</a> history for an in-depth performance review. Our analysis will clearly show you which numbers matched, reveal the specific divisions you would have won, and quantify the "what if" prize money you would have collected. It's a fascinating way to monitor your numbers' long-term trends and discover just how close you've been to hitting that elusive jackpot.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Gain valuable insights into your number selection strategy over weeks, months, or even years.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-white/5 flex items-center justify-center">
              <div className="aspect-video w-full h-full bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
                 <svg className="absolute w-full h-full text-red-300 dark:text-red-600 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
                 <div className="w-2/3 h-2/3 rounded-xl bg-red-500/10 border border-red-500/20 shadow-lg flex flex-col items-center justify-center text-red-600 font-black text-2xl z-10">
                    <span className="text-lg mb-2">Your Stats</span>
                    <span className="text-3xl">📊</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
