import Navbar from '../../components/Navbar';
import { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Responsible Play | WhatIFLotto',
  description: 'Our commitment to responsible simulation and resources for gambling help in Australia.',
};

export default function ResponsiblePlay() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 selection:bg-indigo-500 selection:text-white transition-colors duration-500">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
        {/* Header */}
        <section className="text-center mb-12 sm:mb-20 animate-in fade-in slide-in-from-top-8 duration-1000">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 sm:mb-6 leading-tight">
            Responsible <span className="text-indigo-600 dark:text-indigo-400 italic">Play</span>
          </h1>
          <p className="text-base sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium px-4">
            At WhatIFLotto, we believe that simulation should be a tool for awareness, not an encouragement for excessive risk.
          </p>
        </section>

        {/* Content Body */}
        <div className="space-y-12 sm:space-y-16 text-left">
          
          <section className="bg-gray-50 dark:bg-white/5 p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-inner">
            <h2 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6 tracking-tight uppercase italic">Our Stance on Simulation</h2>
            <div className="space-y-4 sm:space-y-6 text-sm sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
              <p>
                WhatIFLotto is strictly a <strong>non-gambling platform</strong>. We do not accept real money wagers, nor do we facilitate any form of actual betting. Our simulation technology is designed to help you understand the sheer mathematical scale of lottery odds.
              </p>
              <p>
                We hope that by seeing your simulated "lifetime spend" compared to your "simulated winnings," you will gain a clearer, more grounded perspective.
              </p>
            </div>
          </section>

          <section className="space-y-6 sm:space-y-8">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">Signs of Risky Play</h2>
            <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 font-medium">
              If you or someone you know chooses to participate in real-world lotteries, it is important to recognize the signs:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {[
                "Spending more money on gambling than you can afford to lose.",
                "Feeling the need to gamble with larger amounts to get the same excitement.",
                "Borrowing money or selling assets to fund gambling.",
                "Neglecting personal responsibilities, work, or family.",
                "Feeling anxious, irritable, or depressed when not gambling.",
                "Chasing losses by gambling more to win back what was lost."
              ].map((sign, i) => (
                <div key={i} className="flex gap-4 items-start p-5 sm:p-6 bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 bg-red-500 rounded-full mt-1" />
                  <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">{sign}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-indigo-600 rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden mx-2">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8 uppercase italic">Where to Find Help</h2>
              <p className="text-base sm:text-lg text-indigo-100 mb-8 sm:mb-10 font-medium leading-relaxed">
                If you are struggling with gambling, there are free, confidential support services available across Australia 24/7. You are not alone.
              </p>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white/10 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/20 backdrop-blur-md">
                  <h4 className="text-xl sm:text-2xl font-black mb-1 sm:mb-2 uppercase">Gambling Help Online</h4>
                  <p className="font-medium text-indigo-50 mb-4 sm:mb-6 text-base sm:text-lg">National 24/7 Support Service</p>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <a href="tel:1800858858" className="w-full sm:w-auto px-8 py-3 bg-white text-indigo-600 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest hover:brightness-110 transition-all text-center">Call 1800 858 858</a>
                    <a href="https://www.gamblinghelponline.org.au" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-8 py-3 bg-indigo-950/30 text-white border-2 border-white/20 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-indigo-950/50 transition-all text-center">Visit Website</a>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white/10 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10">
                    <h5 className="text-sm font-black uppercase mb-1 sm:mb-2 text-white/90">Lifeline</h5>
                    <p className="text-xs font-medium text-indigo-100 mb-3 sm:mb-4">Crisis Support & Suicide Prevention</p>
                    <a href="tel:131114" className="text-base sm:text-lg font-black underline hover:text-white transition-colors">Call 13 11 14</a>
                  </div>
                  <div className="bg-white/10 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10">
                    <h5 className="text-sm font-black uppercase mb-1 sm:mb-2 text-white/90">Beyond Blue</h5>
                    <p className="text-xs font-medium text-indigo-100 mb-3 sm:mb-4">Mental Health & Suicide Prevention</p>
                    <a href="tel:1300224636" className="text-base sm:text-lg font-black underline hover:text-white transition-colors">Call 1300 22 46 36</a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="text-center pt-8 sm:pt-10">
            <p className="text-gray-400 font-bold italic text-[10px] sm:text-sm uppercase tracking-widest leading-relaxed">
              Play for fun. Play for imagination. <br className="sm:hidden" /> But always play within your limits.
            </p>
          </footer>

        </div>
      </main>
    </div>
  );
}
