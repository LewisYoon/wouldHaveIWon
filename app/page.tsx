'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [liveStats, setLiveStats] = useState({
    totalTickets: 0,
    totalWinners: 0,
    avgProfit: -124.50 // Base stat
  });

  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        // Get total tickets count
        const { count: ticketCount, error: ticketError } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true });

        // Get count of history entries (which are winners)
        const { count: winnerCount, error: winnerError } = await supabase
          .from('simulator_history')
          .select('*', { count: 'exact', head: true });

        if (!ticketError && !winnerError) {
          setLiveStats(prev => ({
            ...prev,
            totalTickets: (ticketCount || 0) + 1240, // Adding a base 'vanity' number + real data
            totalWinners: (winnerCount || 0) + 85
          }));
        }
      } catch (err) {
        console.error("Stats fetch failed:", err);
      }
    };

    fetchLiveStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <header className="bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-950 text-white py-24 px-4 overflow-hidden relative">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-block px-4 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-fade-in">
            The Ultimate "What-If" Engine
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter uppercase leading-[0.9]">
            WhatIF <span className="text-yellow-400 font-serif italic lowercase tracking-normal">Lotto</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100/80 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Stop wondering if you would have won. Use the world's most advanced Oz Lotto <span className="text-white font-bold">Regret Calculator</span> to test your lucky numbers against reality.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              href="/luck" 
              className="group relative px-12 py-5 bg-yellow-400 text-indigo-950 font-black rounded-2xl text-xl shadow-[0_20px_50px_rgba(251,191,36,0.3)] hover:bg-yellow-300 hover:-translate-y-1 transition-all uppercase tracking-wider overflow-hidden"
            >
              <span className="relative z-10">Calculate My Luck</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </Link>
            <Link 
              href="/simulator" 
              className="px-10 py-5 bg-white/5 border-2 border-white/10 hover:bg-white/10 text-white font-bold rounded-2xl text-lg transition-all backdrop-blur-sm"
            >
              Run Simulator
            </Link>
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] -z-0" />
      </header>

      <main className="max-w-6xl mx-auto px-4 py-24">
        
        {/* Viral Value Propositions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 hover:-translate-y-2 transition-all duration-500">
            <div className="text-4xl mb-6">📉</div>
            <h3 className="text-xl font-black mb-4 text-gray-900 uppercase tracking-tighter">The Regret Calculator</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-medium">
              Ever thought "I almost played those numbers"? We calculate the exact prize division and profit you missed out on.
            </p>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 hover:-translate-y-2 transition-all duration-500">
            <div className="text-4xl mb-6">⚡</div>
            <h3 className="text-xl font-black mb-4 text-gray-900 uppercase tracking-tighter">Near-Miss Tracker</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-medium">
              We highlight exactly how close you came. Whether it's 3 main numbers or a heartbreaking 6+1, we visualize the distance.
            </p>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 hover:-translate-y-2 transition-all duration-500">
            <div className="text-4xl mb-6">💎</div>
            <h3 className="text-xl font-black mb-4 text-gray-900 uppercase tracking-tighter">100% Risk Free</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-medium">
              Experience the adrenaline of the Oz Lotto draw every Tuesday night without risking your hard-earned money.
            </p>
          </div>
        </section>

        {/* Deep SEO Content Block */}
        <section className="relative mb-32">
          <div className="absolute inset-0 bg-indigo-600 rounded-[3.5rem] rotate-1 scale-[1.02] opacity-5" />
          <div className="relative bg-white rounded-[3.5rem] p-8 md:p-20 border border-gray-100 shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 leading-tight uppercase tracking-tighter">
                  Stop Guessing. <br /><span className="text-blue-600 italic">Start Simulating.</span>
                </h2>
                <div className="space-y-6 text-gray-600 font-medium leading-relaxed">
                  <p>
                    <strong>WhatIFLotto</strong> is Australia's premier Oz Lotto simulation platform. We bridge the gap between curiosity and reality by providing a high-fidelity "Near Miss" analysis engine.
                  </p>
                  <p>
                    Our algorithm compares your numbers against official thelott.com data, calculating everything from Division 7 matches to the elusive Division 1 Jackpot. 
                  </p>
                  <div className="flex items-center gap-4 py-4">
                    <div className="flex -space-x-3">
                      {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200" />)}
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Join {liveStats.totalTickets.toLocaleString()}+ Luck Trackers</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                <h4 className="font-black text-gray-900 uppercase text-sm mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                  Live Tracker Stats
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm">
                    <span className="text-xs font-bold text-gray-500 uppercase">Simulated Tickets</span>
                    <span className="font-black text-blue-600">{liveStats.totalTickets.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm">
                    <span className="text-xs font-bold text-gray-500 uppercase">Winning Matches</span>
                    <span className="font-black text-emerald-500">{liveStats.totalWinners.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm">
                    <span className="text-xs font-bold text-gray-500 uppercase">Global Regret Index</span>
                    <span className="font-black text-orange-500">Extreme</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tighter italic">Ready to see what you missed?</h2>
          <p className="text-gray-500 mb-10 font-medium">No real money. No risk. Just pure "What-If" data.</p>
          <Link 
            href="/luck" 
            className="inline-block px-16 py-5 bg-indigo-600 text-white font-black rounded-[2rem] hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all uppercase tracking-widest text-sm"
          >
            Open My Free Ticket
          </Link>
        </section>

      </main>
    </div>
  );
}
