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
      
      {/* Hero Section - Maximum Visual Impact */}
      <header className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white pt-24 pb-56 px-4 relative overflow-hidden transition-colors duration-700">
        
        {/* Advanced Background layers */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Moving Mesh Gradients */}
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] animate-pulse duration-[10s]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[120px] delay-2000 animate-pulse duration-[15s]" />
          
          {/* Interactive Grid */}
          <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Dynamic Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-indigo-500/5 dark:bg-white/5 border border-indigo-500/10 dark:border-white/10 rounded-full text-indigo-600 dark:text-indigo-400 text-[11px] font-black uppercase tracking-[0.4em] mb-16 animate-in fade-in slide-in-from-top-12 duration-1000 shadow-sm">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
            </span>
            Real-Time Data Active
          </div>

          {/* Floating Logo Branding */}
          <div className="mb-20 flex justify-center transform animate-float transition-all duration-700 hover:brightness-110">
            <div className="scale-[1.8] md:scale-[3] drop-shadow-2xl">
              <Logo />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-[10rem] font-black mb-12 tracking-tighter uppercase leading-[0.8] max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 drop-shadow-sm">
            Own the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500 dark:from-indigo-400 dark:via-purple-400 dark:to-emerald-400 font-serif italic lowercase tracking-tight px-4">Possible</span>
          </h1>
          
          <p className="text-xl md:text-3xl text-gray-500 dark:text-gray-400 mb-20 max-w-3xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-200">
            Secure your tracked numbers, receive instant results via email, and master the reality of the game—risk-free.
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-500">
            <Link 
              href="/luck" 
              className="group relative px-20 py-10 bg-indigo-600 text-white font-black rounded-[2.5rem] text-2xl shadow-[0_25px_100px_rgba(79,70,229,0.4)] hover:bg-indigo-500 hover:-translate-y-2 active:scale-95 transition-all uppercase tracking-widest overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Start Tracking
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-2 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </Link>
            <Link 
              href="/simulator" 
              className="px-20 py-10 bg-white dark:bg-white/5 border-4 border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-900 dark:text-white font-black rounded-[2.5rem] text-2xl transition-all backdrop-blur-2xl hover:-translate-y-2 active:scale-95 uppercase tracking-widest shadow-xl"
            >
              Simulator
            </Link>
          </div>
        </div>

        {/* Decorative Wave Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] transform rotate-180 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[120px] fill-indigo-500">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 -mt-32 relative z-20 flex-grow pb-60">
        
        {/* Real Results - Staggered Reveal Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-56">
          {latestResults.length > 0 ? latestResults.map((res, i) => {
            const isOz = res.game === 'Oz Lotto';
            const ballBg = isOz ? 'bg-emerald-600' : 'bg-indigo-600';
            const ballBorder = isOz ? 'border-emerald-800' : 'border-indigo-800';
            const gameTextColor = isOz ? 'text-emerald-600' : 'text-indigo-600';

            return (
              <div key={i} className={`bg-white/95 dark:bg-gray-900/95 p-12 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-white/5 backdrop-blur-3xl transition-all duration-700 hover:-translate-y-3 group relative overflow-hidden animate-in fade-in slide-in-from-bottom-12 delay-${i * 300}`}>
                <div className={`absolute top-0 right-0 w-48 h-48 ${isOz ? 'bg-emerald-500/5' : 'bg-indigo-500/5'} rounded-full -mr-20 -mt-20 group-hover:scale-[2] transition-transform duration-[1.5s]`} />
                
                <div className="flex justify-between items-start mb-16 relative z-10">
                  <div className="flex flex-col">
                    <span className={`text-[14px] font-black ${gameTextColor} uppercase tracking-[0.3em]`}>{res.game}</span>
                    <p className="text-4xl font-black text-gray-900 dark:text-white mt-2 tracking-tighter">Current Results</p>
                  </div>
                  <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-5 py-2 rounded-2xl uppercase tracking-widest border border-gray-200 dark:border-white/10">{res.draw_date}</span>
                </div>

                <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-6 relative z-10">
                  {res.numbers.map((n: number, idx: number) => (
                    <div key={n} className="animate-in zoom-in-50 duration-500" style={{ transitionDelay: `${idx * 100}ms` }}>
                      <span className={`w-14 h-14 rounded-full ${ballBg} text-white flex items-center justify-center font-black shadow-xl border-b-[6px] ${ballBorder} text-2xl group-hover:translate-y-[-8px] transition-transform duration-500`}>
                        {n}
                      </span>
                    </div>
                  ))}
                  <div className="w-px h-14 bg-gray-200 dark:bg-white/10 mx-2 hidden md:block" />
                  {res.bonus && res.bonus.map((n: number, idx: number) => (
                    <div key={`b-${n}`} className="animate-in zoom-in-50 duration-500" style={{ transitionDelay: `${(res.numbers.length + idx) * 100}ms` }}>
                      <span className="w-14 h-14 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-xl border-b-[6px] border-amber-600 text-2xl group-hover:translate-y-[-8px] transition-transform duration-500">
                        {n}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }) : !loading && (
            <div className="col-span-full bg-white dark:bg-gray-900 p-24 rounded-[5rem] shadow-3xl text-center border border-gray-100 dark:border-white/5 text-gray-400 font-black italic text-2xl uppercase tracking-[0.2em] animate-pulse">
              Syncing with official lottery grid...
            </div>
          )}
        </section>

        {/* Feature Grid - Maximum Interactivity */}
        <section className="mb-64">
          <div className="text-center mb-32">
            <h2 className="text-6xl md:text-7xl font-black text-gray-900 dark:text-white uppercase tracking-tighter drop-shadow-sm italic">The WhatIF Protocol</h2>
            <div className="w-48 h-3 bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500 mx-auto mt-8 rounded-full shadow-lg" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
            <div className="text-center group cursor-default">
              <div className="w-40 h-40 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-[3.5rem] flex items-center justify-center text-6xl font-black mx-auto mb-12 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 border-2 border-indigo-100 dark:border-indigo-500/20 relative">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="relative z-10"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 className="text-4xl font-black mb-8 text-gray-900 dark:text-white uppercase tracking-tight italic transition-colors">Risk Neutral</h3>
              <p className="text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-sm mx-auto">Master the psychological edge. Zero financial exposure, 100% data fidelity.</p>
            </div>
            
            <div className="text-center group cursor-default">
              <div className="w-40 h-40 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-[3.5rem] flex items-center justify-center text-6xl font-black mx-auto mb-12 shadow-2xl group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700 border-2 border-emerald-100 dark:border-emerald-500/20 relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="relative z-10"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h3 className="text-4xl font-black mb-8 text-gray-900 dark:text-white uppercase tracking-tight italic transition-colors">Neural Sync</h3>
              <p className="text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-sm mx-auto">Automated verification cycles linked to official thelott.com infrastructure.</p>
            </div>

            <div className="text-center group cursor-default">
              <div className="w-40 h-40 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-[3.5rem] flex items-center justify-center text-6xl font-black mx-auto mb-12 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 border-2 border-amber-100 dark:border-amber-500/20 relative">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="relative z-10"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
              </div>
              <h3 className="text-4xl font-black mb-8 text-gray-900 dark:text-white uppercase tracking-tight italic transition-colors">Proof of Luck</h3>
              <p className="text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-sm mx-auto">Immutable historical tracking of your personal number performance over time.</p>
            </div>
          </div>
        </section>

        {/* Global Statistics - Cyberpunk aesthetic */}
        <section className="bg-gray-950 rounded-[5rem] p-16 md:p-32 text-white shadow-[0_60px_150px_rgba(0,0,0,0.6)] overflow-hidden relative border border-white/10 mb-64 transition-colors duration-500 group">
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center relative z-10">
            <div className="text-left">
              <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[12px] font-black uppercase tracking-[0.5em] text-indigo-400 mb-12 shadow-inner">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,1)]" />
                Network Latency: 12ms
              </div>
              <h2 className="text-7xl md:text-[9rem] font-black mb-12 uppercase tracking-tighter leading-[0.8] transition-all duration-700">
                Global <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400 italic font-serif lowercase px-2">Metrics</span>
              </h2>
              <p className="text-gray-400 text-3xl mb-16 font-medium leading-relaxed max-w-xl">
                Real-time computation of simulated lottery logic across the nation.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-12">
              <div className="bg-white/5 p-16 rounded-[4rem] border border-white/10 backdrop-blur-3xl group-hover:border-indigo-500/50 transition-all duration-700 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-12 -mt-12 blur-2xl" />
                <p className="text-[12px] font-black text-gray-500 uppercase tracking-[0.4em] mb-8">Cycles Processed</p>
                <p className="text-[6rem] md:text-[8rem] font-black text-white tracking-tighter group-hover:text-indigo-400 transition-colors duration-500 tabular-nums">{liveStats.totalTickets.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 p-16 rounded-[4rem] border border-white/10 backdrop-blur-3xl group-hover:border-emerald-500/50 transition-all duration-700 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full -ml-12 -mb-12 blur-2xl" />
                <p className="text-[12px] font-black text-gray-500 uppercase tracking-[0.4em] mb-8">Active Terminals</p>
                <p className="text-[6rem] md:text-[8rem] font-black text-white tracking-tighter group-hover:text-emerald-400 transition-colors duration-500 tabular-nums">{liveStats.activeTrackers.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA - Final Intensity */}
        <section className="text-center py-40 bg-indigo-600 rounded-[6rem] text-white shadow-[0_50px_150px_rgba(79,70,229,0.5)] mb-24 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-900 transition-transform duration-[2s] group-hover:scale-110" />
          <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          <div className="relative z-10 px-6">
            <h2 className="text-7xl md:text-[11rem] font-black mb-12 uppercase tracking-tighter leading-[0.8] group-hover:scale-[1.02] transition-transform duration-1000 italic">Verify your <br />Destiny.</h2>
            <p className="text-indigo-100 mb-20 font-medium text-3xl opacity-90 italic max-w-2xl mx-auto leading-relaxed">Join the most advanced lottery simulation grid in Australia. Immediate access.</p>
            <div className="flex flex-col sm:flex-row gap-10 justify-center items-center">
              <Link 
                href="/luck" 
                className="px-24 py-10 bg-white text-indigo-600 font-black rounded-[3rem] hover:bg-gray-50 shadow-2xl transition-all uppercase tracking-[0.2em] text-3xl active:scale-90 hover:-translate-y-2"
              >
                Track
              </Link>
              <Link 
                href="/login" 
                className="px-24 py-10 bg-indigo-950/40 text-white font-black rounded-[3rem] hover:bg-indigo-950/60 border-4 border-white/20 transition-all uppercase tracking-[0.2em] text-3xl backdrop-blur-xl active:scale-90 hover:-translate-y-2"
              >
                Sync
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
