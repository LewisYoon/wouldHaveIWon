import Navbar from '../components/Navbar';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 selection:bg-indigo-500 transition-colors duration-500">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-6 py-20 sm:py-32">
        <header className="text-left mb-16 sm:mb-24 animate-in fade-in slide-in-from-top-8 duration-1000">
          <h2 className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.4em] text-[10px] mb-4">Our Mission</h2>
          <h1 className="text-5xl sm:text-7xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic leading-none mb-10">Math Over <span className="text-gray-400">Myth</span></h1>
          <p className="text-xl sm:text-2xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-3xl">
            WhatIFLotto was founded on a simple premise: understanding the mathematical reality of lotteries is the most powerful tool for responsible play.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-16 sm:gap-24 mb-32">
          <div className="space-y-8">
            <h3 className="text-2xl font-black uppercase tracking-tight italic">Why We Exist</h3>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                Most lottery platforms focus on the dream of winning. While we celebrate the thrill of "what if," our core mission is to provide Australians with the tools to visualize the staggering odds involved in Powerball, Oz Lotto, and Tatts Lotto.
            </p>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                By providing high-speed simulations and transparent historical data, we allow users to "play" 10,000 games in seconds. This experience often provides a visceral reality check that a simple "1 in 134 million" statistic cannot.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-white/5 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16" />
             <h3 className="text-xl font-black mb-6 uppercase tracking-tight italic">The Three Pillars</h3>
             <ul className="space-y-6">
                <li className="flex gap-4">
                    <span className="text-indigo-500 font-black">01.</span>
                    <div>
                        <p className="font-black uppercase text-sm mb-1">Financial Literacy</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Helping players understand the true cost-to-win ratio of their entertainment choices.</p>
                    </div>
                </li>
                <li className="flex gap-4">
                    <span className="text-indigo-500 font-black">02.</span>
                    <div>
                        <p className="font-black uppercase text-sm mb-1">Data Transparency</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Verified historical results and unbiased mathematical analysis of lottery patterns.</p>
                    </div>
                </li>
                <li className="flex gap-4">
                    <span className="text-indigo-500 font-black">03.</span>
                    <div>
                        <p className="font-black uppercase text-sm mb-1">Zero-Risk Thrill</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Experience the excitement of tracking numbers without spending a single dollar of real currency.</p>
                    </div>
                </li>
             </ul>
          </div>
        </section>

        <section className="bg-gray-950 rounded-[3rem] sm:rounded-[4rem] p-10 sm:p-20 text-white shadow-2xl relative overflow-hidden border border-white/5 text-center">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:40px_40px]" />
            <h2 className="text-3xl sm:text-5xl font-black mb-8 uppercase tracking-tighter italic relative z-10">Independent & Unbiased</h2>
            <p className="text-gray-400 text-lg sm:text-xl font-medium leading-relaxed max-w-2xl mx-auto mb-12 relative z-10">
                WhatIFLotto is an independent simulation platform. We are not affiliated with, endorsed by, or sponsored by any official lottery provider. Our goal is education and entertainment.
            </p>
            <div className="flex justify-center gap-6 relative z-10">
                <Link href="/responsible-play" className="px-10 py-5 bg-white text-gray-950 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-gray-200 transition-all active:scale-95 shadow-xl">Responsible Play</Link>
                <Link href="/contact" className="px-10 py-5 bg-white/5 border border-white/10 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-white/10 transition-all active:scale-95">Get In Touch</Link>
            </div>
        </section>
      </main>
    </div>
  );
}
