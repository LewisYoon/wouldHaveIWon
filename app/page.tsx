'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

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
        const { count: ticketCount } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true });

        const { data: users } = await supabase
          .from('tickets')
          .select('user_id');
        
        const uniqueUsers = new Set(users?.map(u => u.user_id)).size;

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
    <div className="flex flex-col min-h-screen selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <header className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white pt-20 pb-36 px-4 relative overflow-hidden transition-colors duration-700">
        
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 dark:bg-indigo-500/15 rounded-full blur-[100px] animate-pulse duration-[10s]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 dark:bg-emerald-500/15 rounded-full blur-[100px] delay-2000 animate-pulse duration-[15s]" />
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-indigo-500/5 dark:bg-white/5 border border-indigo-500/10 dark:border-white/10 rounded-full text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10 shadow-sm animate-in fade-in slide-in-from-top-4 duration-1000">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Official Live Results
          </div>

          <div className="mb-12 flex justify-center transform hover:scale-105 transition-transform duration-500">
            <div className="scale-125 md:scale-[1.8] drop-shadow-xl">
              <Logo />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tighter uppercase leading-[0.9] max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            Play the past. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500 dark:from-indigo-400 dark:via-purple-400 dark:to-emerald-400 font-serif italic lowercase tracking-tight px-2">Imagine</span> the <span className="relative inline-block px-2">future<span className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 -skew-x-12 -z-10 rounded-xl"></span></span>.
          </h1>
          
          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-14 max-w-2xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000">
            Australia's favorite risk-free lotto tracker. Check your numbers against real draws, get instant alerts, and see how much you could have won.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center animate-in fade-in slide-in-from-bottom-16 duration-1000">
            <Link 
              href="/luck" 
              className="group relative px-12 py-5 bg-indigo-600 text-white font-black rounded-2xl text-lg shadow-xl hover:bg-indigo-500 hover:-translate-y-1 active:scale-95 transition-all uppercase tracking-widest overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Track My Luck
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </Link>
            <Link 
              href="/simulator" 
              className="px-12 py-5 bg-white dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-900 dark:text-white font-black rounded-2xl text-lg transition-all backdrop-blur-xl shadow-md uppercase tracking-widest"
            >
              Lotto Simulator
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 -mt-20 relative z-20 flex-grow pb-40">
        
        {/* Results Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-36">
          {latestResults.length > 0 ? latestResults.map((res, i) => {
            const isOz = res.game === 'Oz Lotto';
            const ballBg = isOz ? 'bg-emerald-600' : 'bg-indigo-600';
            const gameTextColor = isOz ? 'text-emerald-600' : 'text-indigo-600';

            return (
              <div key={i} className="bg-white/95 dark:bg-gray-900/95 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-white/5 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1.5 group overflow-hidden text-left">
                <div className="flex justify-between items-center mb-10 relative z-10">
                  <div className="flex flex-col">
                    <span className={`text-[11px] font-black ${gameTextColor} uppercase tracking-[0.2em]`}>{res.game}</span>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1 tracking-tighter">Latest Draw</p>
                  </div>
                  <span className="text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-white/5 px-4 py-1.5 rounded-full uppercase tracking-widest">{res.draw_date}</span>
                </div>

                <div className="flex flex-wrap gap-2.5 justify-center md:justify-start relative z-10">
                  {res.numbers.map((n: number) => (
                    <span key={n} className={`w-11 h-11 rounded-full ${ballBg} text-white flex items-center justify-center font-black shadow-md border-b-4 border-black/20 text-lg group-hover:scale-105 transition-transform`}>
                      {n}
                    </span>
                  ))}
                  <div className="w-px h-11 bg-gray-200 dark:bg-white/10 mx-1 hidden md:block" />
                  {res.bonus && res.bonus.map((n: number) => (
                    <span key={`b-${n}`} className="w-11 h-11 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-md border-b-4 border-amber-600/50 text-lg group-hover:scale-105 transition-transform">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            );
          }) : !loading && (
            <div className="col-span-full bg-white dark:bg-gray-900 p-16 rounded-[3rem] shadow-lg text-center border border-gray-100 dark:border-white/5 text-gray-400 font-bold italic uppercase tracking-widest text-sm">
              Updating draw results...
            </div>
          )}
        </section>

        {/* Feature Grid */}
        <section className="mb-40">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">How it Works</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-indigo-600 to-emerald-500 mx-auto mt-4 rounded-full shadow-sm" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', title: 'Risk-Free Fun', desc: 'No real money, no stress. Just a simple way to test your lucky numbers against the real world.' },
              { icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01 9 11.01', title: 'Instant Updates', desc: 'We check the official results for you as soon as they are announced and let you know if you won.' },
              { icon: 'M12 8v4l3 3 M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', title: 'Your History', desc: 'Keep a permanent record of your favorite numbers and see how they perform over weeks and months.' }
            ].map((feature, i) => (
              <div key={i} className="text-center group p-4">
                <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center text-4xl font-black mx-auto mb-8 shadow-sm group-hover:scale-105 transition-all duration-500 border border-gray-100 dark:border-white/5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={feature.icon}/>
                  </svg>
                </div>
                <h3 className="text-2xl font-black mb-4 text-gray-900 dark:text-white uppercase tracking-tight italic transition-colors">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-xs mx-auto text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Global Statistics */}
        <section className="bg-gray-950 rounded-[3.5rem] p-12 md:p-20 text-white shadow-2xl overflow-hidden relative border border-white/5 mb-40 group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[80px] -mr-40 -mt-40 group-hover:bg-indigo-600/20 transition-colors duration-1000" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-left relative z-10">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-8">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                Live Data Active
              </div>
              <h2 className="text-5xl md:text-6xl font-black mb-8 uppercase tracking-tighter leading-[0.9]">
                Our Growing <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400 italic">Community</span>
              </h2>
              <p className="text-gray-400 text-lg mb-4 font-medium leading-relaxed max-w-md">
                Thousands of players are tracking their luck every day with our smart results checker.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl group-hover:border-indigo-500/30 transition-all duration-700 text-center shadow-lg">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Total Sets Checked</p>
                <p className="text-5xl font-black text-white tracking-tighter group-hover:text-indigo-400 transition-colors duration-500 tabular-nums">{liveStats.totalTickets.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl group-hover:border-emerald-500/30 transition-all duration-700 text-center shadow-lg">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Active Players</p>
                <p className="text-5xl font-black text-white tracking-tighter group-hover:text-emerald-400 transition-colors duration-500 tabular-nums">{liveStats.activeTrackers.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-24 bg-indigo-600 rounded-[3.5rem] text-white shadow-2xl mb-24 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 transition-transform duration-[2s] group-hover:scale-105" />
          <div className="relative z-10 px-6">
            <h2 className="text-5xl md:text-7xl font-black mb-8 uppercase tracking-tighter leading-[0.9] group-hover:scale-[1.01] transition-transform duration-700 italic">Is it your lucky day?</h2>
            <p className="text-indigo-100 mb-14 font-medium text-xl opacity-90 italic max-w-xl mx-auto">Join Australia's largest free lottery tracker and start imagining the win.</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link 
                href="/luck" 
                className="px-14 py-6 bg-white text-indigo-600 font-black rounded-2xl hover:bg-gray-50 shadow-xl transition-all uppercase tracking-widest text-xl active:scale-95 hover:-translate-y-1"
              >
                Track Now
              </Link>
              <Link 
                href="/login" 
                className="px-14 py-6 bg-indigo-950/30 text-white font-black rounded-2xl hover:bg-indigo-950/60 border-2 border-white/20 transition-all uppercase tracking-widest text-xl backdrop-blur-md active:scale-95 hover:-translate-y-1"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
