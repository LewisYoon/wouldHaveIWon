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
      
      <main className="max-w-4xl mx-auto px-6 py-24">
        {/* Header */}
        <section className="text-center mb-20 animate-in fade-in slide-in-from-top-8 duration-1000">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-tight">
            Responsible <span className="text-indigo-600 dark:text-indigo-400 italic">Play</span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
            At WhatIFLotto, we believe that simulation should be a tool for awareness, not an encouragement for excessive risk.
          </p>
        </section>

        {/* Content Body */}
        <div className="space-y-16 text-left">
          
          <section className="bg-gray-50 dark:bg-white/5 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-inner">
            <h2 className="text-3xl font-black mb-6 tracking-tight uppercase italic">Our Stance on Simulation</h2>
            <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
              <p>
                WhatIFLotto is strictly a <strong>non-gambling platform</strong>. We do not accept real money wagers, nor do we facilitate any form of actual betting. Our simulation technology is designed to help you understand the sheer mathematical scale of lottery odds by allowing you to "play" without financial consequence.
              </p>
              <p>
                We hope that by seeing your simulated "lifetime spend" compared to your "simulated winnings," you will gain a clearer, more grounded perspective on the reality of lottery games.
              </p>
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="text-3xl font-black tracking-tight uppercase">Signs of Risky Play</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
              If you or someone you know chooses to participate in real-world lotteries or gambling, it is important to recognize the signs of problematic behavior:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "Spending more money on gambling than you can afford to lose.",
                "Feeling the need to gamble with larger amounts of money to get the same excitement.",
                "Borrowing money or selling assets to fund gambling.",
                "Neglecting personal responsibilities, work, or family to gamble.",
                "Feeling anxious, irritable, or depressed when not gambling.",
                "Chasing losses by gambling more to win back what was lost."
              ].map((sign, i) => (
                <div key={i} className="flex gap-4 items-start p-6 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                  <span className="w-6 h-6 flex-shrink-0 bg-red-500 rounded-full mt-1" />
                  <p className="font-medium text-gray-700 dark:text-gray-300">{sign}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-8 uppercase italic">Where to Find Help</h2>
              <p className="text-lg text-indigo-100 mb-10 font-medium leading-relaxed">
                If you are struggling with gambling, there are free, confidential support services available across Australia 24/7. You are not alone.
              </p>
              
              <div className="space-y-6">
                <div className="bg-white/10 p-8 rounded-3xl border border-white/20 backdrop-blur-md">
                  <h4 className="text-2xl font-black mb-2 uppercase">Gambling Help Online</h4>
                  <p className="font-medium text-indigo-50 mb-4 text-lg">National 24/7 Support Service</p>
                  <div className="flex flex-wrap gap-4">
                    <a href="tel:1800858858" className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all">Call 1800 858 858</a>
                    <a href="https://www.gamblinghelponline.org.au" target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-indigo-950/30 text-white border-2 border-white/20 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-950/50 transition-all">Visit Website</a>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white/10 p-6 rounded-3xl border border-white/10">
                    <h5 className="font-black uppercase mb-2">Lifeline</h5>
                    <p className="text-sm font-medium text-indigo-100 mb-4">Crisis Support & Suicide Prevention</p>
                    <a href="tel:131114" className="text-lg font-black underline hover:text-white">Call 13 11 14</a>
                  </div>
                  <div className="bg-white/10 p-6 rounded-3xl border border-white/10">
                    <h5 className="font-black uppercase mb-2">Beyond Blue</h5>
                    <p className="text-sm font-medium text-indigo-100 mb-4">Anxiety, depression and suicide prevention</p>
                    <a href="tel:1300224636" className="text-lg font-black underline hover:text-white">Call 1300 22 46 36</a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="text-center pt-10">
            <p className="text-gray-400 font-bold italic text-sm uppercase tracking-widest">
              Play for fun. Play for imagination. But always play within your limits.
            </p>
          </footer>

        </div>
      </main>
    </div>
  );
}
