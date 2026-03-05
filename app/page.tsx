'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [liveStats, setLiveStats] = useState({
    totalTickets: 0,
    activeTrackers: 0,
  });

  const [latestResults, setLatestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch total tickets
        const { count: ticketCount } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true });

        // Fetch unique users (Active Trackers)
        const { data: users } = await supabase
          .from('tickets')
          .select('user_id');
        
        const uniqueUsers = new Set(users?.map(u => u.user_id)).size;

        // Fetch latest results for both games
        const { data: ozResult } = await supabase
          .from('draw_results')
          .select('*')
          .eq('game', 'Oz Lotto')
          .order('draw_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: pbResult } = await supabase
          .from('draw_results')
          .select('*')
          .eq('game', 'Powerball')
          .order('draw_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        const results = [];
        if (ozResult) results.push(ozResult);
        if (pbResult) results.push(pbResult);

        setLatestResults(results);
        setLiveStats({
          totalTickets: ticketCount || 0,
          activeTrackers: uniqueUsers || 0,
        });
      } catch (err) {
        console.error("Data fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <header className="bg-indigo-700 text-white pt-24 pb-32 px-4 relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter uppercase leading-[0.9]">
            WhatIF <span className="text-yellow-400 italic">Lotto</span>
          </h1>
          <p className="text-xl md:text-2xl text-indigo-100 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            The risk-free way to test your luck. Save your numbers, get notified of results, and see if you would have won the jackpot.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              href="/luck" 
              className="px-12 py-6 bg-yellow-400 text-indigo-950 font-black rounded-2xl text-xl shadow-xl hover:bg-yellow-300 hover:-translate-y-1 transition-all uppercase tracking-widest"
            >
              Track My Luck
            </Link>
            <Link 
              href="/simulator" 
              className="px-12 py-6 bg-white text-indigo-700 font-black rounded-2xl text-xl shadow-xl hover:bg-gray-50 hover:-translate-y-1 transition-all uppercase tracking-widest"
            >
              Run Simulator
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 -mt-16 relative z-20">
        
        {/* Latest Real Results Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          {latestResults.length > 0 ? latestResults.map((res, i) => {
            const isOz = res.game === 'Oz Lotto';
            const ballBg = isOz ? 'bg-emerald-600' : 'bg-indigo-600';
            const ballBorder = isOz ? 'border-emerald-800' : 'border-indigo-800';
            const gameTextColor = isOz ? 'text-emerald-600' : 'text-indigo-600';

            return (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <span className={`text-xs font-black ${gameTextColor} uppercase tracking-widest`}>{res.game} Official Draw</span>
                  <span className="text-xs font-bold text-gray-400">{res.draw_date}</span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                  {res.numbers.map((n: number) => (
                    <span key={n} className={`w-10 h-10 rounded-full ${ballBg} text-white flex items-center justify-center font-bold shadow-md border-b-4 ${ballBorder}`}>
                      {n}
                    </span>
                  ))}
                  {res.bonus && res.bonus.map((n: number) => (
                    <span key={`b-${n}`} className="w-10 h-10 rounded-full bg-yellow-400 text-indigo-950 flex items-center justify-center font-bold shadow-md border-b-4 border-yellow-600">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            );
          }) : !loading && (
            <div className="col-span-full bg-white p-12 rounded-[2.5rem] shadow-xl text-center border border-gray-100 text-gray-400 font-bold italic">
              Awaiting latest draw results...
            </div>
          )}
        </section>

        {/* How it Works Section */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">How it Works</h2>
            <div className="w-20 h-1.5 bg-yellow-400 mx-auto mt-4 rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-sm">1</div>
              <h3 className="text-xl font-black mb-3 text-gray-900 uppercase tracking-tight">Pick Your Numbers</h3>
              <p className="text-gray-500 font-medium">Select your "lucky" numbers for the next Oz Lotto or Powerball draw.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-100 text-yellow-700 rounded-3xl flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-sm">2</div>
              <h3 className="text-xl font-black mb-3 text-gray-900 uppercase tracking-tight">Get Notified</h3>
              <p className="text-gray-500 font-medium">We'll email you the moment results are out. No need to check manually.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-sm">3</div>
              <h3 className="text-xl font-black mb-3 text-gray-900 uppercase tracking-tight">Compare & Win</h3>
              <p className="text-gray-500 font-medium">See your prize division and exactly how much you would have won.</p>
            </div>
          </div>
        </section>

        {/* Real Stats Section */}
        <section className="bg-gray-900 rounded-[3rem] p-12 md:p-20 text-white shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tighter leading-tight">
                Real Simulation <br /><span className="text-yellow-400">Tracker</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 font-medium">
                Our platform tracks simulated tickets across Australia against actual live data. See the mathematical reality of your luck.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live Database Sync Active
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Simulated Tickets</p>
                <p className="text-5xl font-black text-white tracking-tighter">{liveStats.totalTickets.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Active Trackers</p>
                <p className="text-5xl font-black text-yellow-400 tracking-tighter">{liveStats.activeTrackers.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="py-20 text-center border-t border-gray-100 mt-20">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6">WhatIFLotto Australia</p>
        <div className="flex justify-center gap-8 mb-8 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy</Link>
          <Link href="/responsible-play" className="hover:text-indigo-600 transition-colors">Responsible Play</Link>
        </div>
        <p className="text-[10px] text-gray-300 px-4">
          © {new Date().getFullYear()} WhatIFLotto. All rights reserved. For simulation purposes only. No real money or gambling occurs on this platform.
        </p>
      </footer>
    </div>
  );
}
