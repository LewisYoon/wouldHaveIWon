'use client';

import Navbar from '../../components/Navbar';
import Link from 'next/link';

export default function HowItWorks() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-6 py-24">
        {/* Hero Section */}
        <section className="text-center mb-24 animate-in fade-in slide-in-from-top-8 duration-1000">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-8 leading-tight">
            How <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500 dark:from-indigo-400 dark:to-emerald-400">WhatIFLotto</span> Works
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto font-medium leading-relaxed">
            A comprehensive guide to Australia's premier risk-free lottery simulation and tracking platform.
          </p>
        </section>

        {/* Detailed Content Sections */}
        <div className="space-y-32">
          
          {/* Section 1: The Core Mission */}
          <article className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-4xl font-black mb-8 tracking-tight italic">Bridging Reality and Imagination</h2>
              <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium text-left">
                <p>
                  WhatIFLotto was born from a simple question: "What if my lucky numbers actually came up?" Instead of spending thousands of dollars over a lifetime to find out, we provide a mathematically accurate simulation environment where you can test your numbers against real official Australian draw data.
                </p>
                <p>
                  Our platform connects directly to verified draw results for Oz Lotto, Powerball, and Tatts Lotto (Saturday Lotto), providing you with instant feedback on your performance without ever risking a single cent of your hard-earned money.
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-[3rem] p-12 aspect-square flex items-center justify-center shadow-inner">
              <div className="text-8xl animate-bounce">🎲</div>
            </div>
          </article>

          {/* Section 2: Tracking Your Luck */}
          <article className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-[3rem] p-12 aspect-square flex items-center justify-center shadow-inner">
              <div className="text-8xl animate-pulse">📈</div>
            </div>
            <div className="text-left">
              <h2 className="text-4xl font-black mb-8 tracking-tight italic">The Luck Tracker</h2>
              <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                <p>
                  The "Track My Luck" feature is the heart of the WhatIFLotto experience. It allows you to save sets of numbers for specific upcoming draw dates. Once the official results are finalized (usually around 8:30 PM - 9:00 PM AEST on draw nights), our system automatically checks your sets.
                </p>
                <ul className="list-disc pl-6 space-y-4 font-medium text-gray-600 dark:text-gray-300">
                  <li><strong>Verified Accuracy:</strong> We use the exact same division logic as the official Australian lottery providers.</li>
                  <li><strong>Jackpot Bridging:</strong> Even if there is no official Division 1 winner, we bridge the estimated jackpot data so you know exactly how much you would have won.</li>
                  <li><strong>Historical Archive:</strong> Build a permanent record of your luck across weeks, months, or years.</li>
                </ul>
              </div>
            </div>
          </article>

          {/* Section 3: High-Speed Simulation */}
          <article className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 text-left">
              <h2 className="text-4xl font-black mb-8 tracking-tight italic">Turbo Simulation (The Time Machine)</h2>
              <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                <p>
                  Want to know what 50 years of playing 10 tickets a week looks like? Our Turbo Mode simulator allows you to compress a lifetime of play into mere minutes.
                </p>
                <p>
                  The "Time Machine" mode generates mathematically perfect random draws and checks them against your batches at speeds of up to 50 draws per second. It provides a visceral "Reality Check" by comparing your total virtual spending to real-world luxuries like luxury cars or house deposits.
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2 bg-purple-50 dark:bg-purple-500/10 rounded-[3rem] p-12 aspect-square flex items-center justify-center shadow-inner">
              <div className="text-8xl animate-spin-slow">🚀</div>
            </div>
          </article>

          {/* Section 4: Data Integrity */}
          <section className="bg-gray-950 rounded-[4rem] p-12 md:p-20 text-white shadow-2xl relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -mr-48 -mt-48" />
            <div className="relative z-10 text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-10 tracking-tight uppercase">Verified Data Integrity</h2>
              <div className="max-w-3xl mx-auto space-y-8 text-lg text-gray-400 font-medium leading-relaxed">
                <p>
                  We pride ourselves on using verified, official data. Our automated systems sync with the latest Australian lottery results every Tuesday, Thursday, and Saturday night.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-2xl font-black text-indigo-400 mb-2">100%</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Risk Free</p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-2xl font-black text-emerald-400 mb-2">Live</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Result Sync</p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-2xl font-black text-purple-400 mb-2">Instant</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Notifications</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="text-left py-20">
            <h2 className="text-4xl font-black mb-16 tracking-tighter uppercase italic">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {[
                { q: "Is this a gambling site?", a: "No. WhatIFLotto is a simulation and tracking platform. You cannot spend real money or place actual bets on this site. It is designed for educational and entertainment purposes only." },
                { q: "Are the odds accurate?", a: "Yes. Our simulation and division check logic strictly follows the official rules and probabilities published by Australian lottery providers." },
                { q: "Do I need an account?", a: "While you can use the simulator anonymously, creating an account allows you to build a permanent history and receive automated result notifications via email." },
                { q: "When are results updated?", a: "We sync results shortly after the official draws conclude—typically around 8:35 PM AEST on Tuesday, Thursday, and Saturday nights." }
              ].map((item, i) => (
                <div key={i} className="space-y-4">
                  <h4 className="text-xl font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight leading-tight">Q: {item.q}</h4>
                  <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="bg-indigo-600 rounded-[3rem] p-16 text-center text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 group-hover:scale-105 transition-transform duration-[2s]" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tighter italic">Ready to test your luck?</h2>
              <p className="text-lg text-indigo-100 mb-12 max-w-xl mx-auto font-medium">Join thousands of Australians visualizing their lottery dreams risk-free.</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/luck" className="px-12 py-5 bg-white text-indigo-600 font-black rounded-2xl shadow-xl hover:-translate-y-1 transition-all uppercase tracking-widest text-sm">Start Tracking</Link>
                <Link href="/simulator" className="px-12 py-5 bg-indigo-950/30 text-white border-2 border-white/20 font-black rounded-2xl shadow-xl hover:-translate-y-1 transition-all uppercase tracking-widest text-sm backdrop-blur-md">Enter Simulator</Link>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
