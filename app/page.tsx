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
  const [upcomingDraws, setUpcomingDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch site-wide statistics via secure RPC
        const { data: statsData } = await supabase.rpc('get_site_stats');

        const { data: resultsData } = await supabase
          .from('draw_results')
          .select('*')
          .order('draw_date', { ascending: false });

        const latestByGame: Record<string, any> = {};
        resultsData?.forEach((draw) => {
          if (!latestByGame[draw.game]) {
            latestByGame[draw.game] = draw;
          }
        });
        const latestResultsArray = Object.values(latestByGame);

        const today = new Date().toISOString().split('T')[0];
        const { data: upcomingData } = await supabase
          .from('upcoming_draws')
          .select('*')
          .gte('draw_date', today)
          .order('draw_date', { ascending: true });
        
        const nearestByGame: Record<string, any> = {};
        upcomingData?.forEach((draw) => {
          if (!nearestByGame[draw.game]) {
            nearestByGame[draw.game] = draw;
          }
        });
        const upcomingDrawsArray = Object.values(nearestByGame);

        setLatestResults(latestResultsArray);
        setUpcomingDraws(upcomingDrawsArray);
        
        if (statsData) {
          setLiveStats({
            totalTickets: statsData.total_tickets || 0,
            activeTrackers: statsData.total_users || 0,
          });
        }
      } catch (err) {
        console.error("Data fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(0)} Million`;
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(amount);
  };

  const getGameBranding = (name: string) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('oz')) return { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', ball: 'bg-emerald-600' };
    if (n.includes('tatts') || n.includes('sat')) return { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-500/10', ball: 'bg-red-600' };
    return { color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10', ball: 'bg-indigo-600' };
  };

  return (
    <div className="flex flex-col min-h-screen selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <header className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white pt-16 sm:pt-20 pb-24 sm:pb-36 px-4 relative overflow-hidden transition-colors duration-700">
        
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 dark:bg-indigo-500/15 rounded-full blur-[100px] animate-pulse duration-[10s]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 dark:bg-emerald-500/15 rounded-full blur-[100px] delay-2000 animate-pulse duration-[15s]" />
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10 px-2">
          <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 bg-indigo-500/5 dark:bg-white/5 border border-indigo-500/10 dark:border-white/10 rounded-full text-indigo-600 dark:text-indigo-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] mb-8 sm:mb-10 shadow-sm animate-in fade-in slide-in-from-top-4 duration-1000">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Official Live Data
          </div>

          <div className="mb-8 sm:mb-12 flex justify-center transform hover:scale-105 transition-transform duration-500">
            <div className="scale-110 sm:scale-[1.8] drop-shadow-xl">
              <Logo />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-6 sm:mb-8 tracking-tighter uppercase leading-[0.95] sm:leading-[0.9] max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            Professional Australian <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500 dark:from-indigo-400 dark:via-purple-400 dark:to-emerald-400 font-serif italic lowercase tracking-tight px-2">Luck</span> <span className="relative inline-block px-2">Tracker<span className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 -skew-x-12 -z-10 rounded-xl"></span></span>.
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-10 sm:mb-14 max-w-2xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 px-4">
            Check your numbers against real Oz Lotto, Powerball, and Tatts Lotto results risk-free. Australia's most advanced <strong>Luck Tracking</strong> platform and <strong>Lotto Simulator</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center animate-in fade-in slide-in-from-bottom-16 duration-1000 px-6">
            <Link 
              href="/luck" 
              className="w-full sm:w-auto group relative px-8 sm:px-12 py-4 sm:py-5 bg-indigo-600 text-white font-black rounded-2xl text-base sm:text-lg shadow-xl hover:bg-indigo-500 hover:-translate-y-1 active:scale-95 transition-all uppercase tracking-widest overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Track My Luck
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </Link>
            <Link 
              href="/simulator" 
              className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-white dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-900 dark:text-white font-black rounded-2xl text-base sm:text-lg transition-all backdrop-blur-xl shadow-md uppercase tracking-widest"
            >
              Lotto Simulator
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 -mt-12 sm:-mt-20 relative z-20 flex-grow pb-40">
        
        {/* Upcoming Jackpots */}
        {upcomingDraws.length > 0 && (
          <section className="mb-20 sm:mb-24 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="text-left mb-6 sm:mb-8 px-4">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Next Big Wins</h2>
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Upcoming Estimated Jackpots</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {upcomingDraws.map((draw, i) => {
                const brand = getGameBranding(draw.game);
                
                return (
                  <div key={i} className={`p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl transition-all duration-500 hover:-translate-y-1 group bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl`}>
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4 sm:mb-6">
                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${brand.color}`}>{draw.game}</span>
                        <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full">{draw.draw_date}</span>
                      </div>
                      <div className="flex-grow">
                        <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter mb-1">
                          {formatAmount(draw.jackpot)}
                        </p>
                        <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Estimated Div 1</p>
                      </div>
                      <Link href={`/luck/?game=${encodeURIComponent(draw.game)}`} className={`mt-6 sm:mt-8 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] py-3 rounded-xl text-center transition-all ${brand.bg} ${brand.color} hover:brightness-95`}>
                        Track This Draw
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Latest Results Section */}
        <section className="mb-24 sm:mb-36">
          <div className="text-left mb-6 sm:mb-8 px-4">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Latest Results</h2>
            <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Verified Official Draw History</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {latestResults.length > 0 ? latestResults.map((res, i) => {
              const brand = getGameBranding(res.game);

              return (
                <div key={i} className="bg-white/95 dark:bg-gray-900/95 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-white/5 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1.5 group overflow-hidden text-left">
                  <div className="flex justify-between items-center mb-8 sm:mb-10 relative z-10">
                    <div className="flex flex-col">
                      <span className={`text-[10px] sm:text-[11px] font-black ${brand.color} uppercase tracking-[0.2em]`}>{res.game}</span>
                      <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1 tracking-tighter">Results</p>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-white/5 px-3 sm:px-4 py-1.5 rounded-full uppercase tracking-widest">{res.draw_date}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:gap-2.5 justify-center sm:justify-start relative z-10">
                    {res.numbers.map((n: number) => (
                      <span key={n} className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full ${brand.ball} text-white flex items-center justify-center font-black shadow-md border-b-4 border-black/20 text-base sm:text-lg group-hover:scale-105 transition-transform`}>
                        {n}
                      </span>
                    ))}
                    <div className="w-px h-9 sm:h-11 bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block" />
                    {res.bonus && res.bonus.map((n: number) => (
                      <span key={`b-${n}`} className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-md border-b-4 border-amber-600/50 text-base sm:text-lg group-hover:scale-105 transition-transform">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              );
            }) : !loading && (
              <div className="col-span-full bg-white dark:bg-gray-900 p-12 sm:p-16 rounded-[2.5rem] sm:rounded-[3rem] shadow-lg text-center border border-gray-100 dark:border-white/5 text-gray-400 font-bold italic uppercase tracking-widest text-sm">
                Updating draw results...
              </div>
            )}
          </div>
        </section>

        {/* Knowledge Hub / Articles Section */}
        <section className="mb-24 sm:mb-40">
          <div className="text-left mb-10 sm:mb-16 px-4">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic leading-tight">Luck Tracking Knowledge Hub</h2>
            <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Expert Insights & Mathematical Analysis</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <article className="bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-xl hover:-translate-y-1 transition-all duration-500 group">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🧮</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black mb-4 uppercase tracking-tight">The Mathematics of Luck</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8">
                Understanding the 1 in 134 million odds of Powerball requires a grasp of combinatorics. We break down why some numbers seem "luckier" than others.
              </p>
              <Link href="/how-it-works" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600/20 pb-1 hover:border-indigo-600 transition-all">Read Full Guide</Link>
            </article>

            <article className="bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-xl hover:-translate-y-1 transition-all duration-500 group">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🇦🇺</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black mb-4 uppercase tracking-tight">Australian Lotto History</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8">
                From the first Tatts Lotto draw in 1972 to the massive Powerball jackpots of today, explore how the Australian lottery landscape has evolved.
              </p>
              <Link href="/odds" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600/20 pb-1 hover:border-emerald-600 transition-all">Explore History</Link>
            </article>

            <article className="bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-xl hover:-translate-y-1 transition-all duration-500 group">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black mb-4 uppercase tracking-tight">Responsible Play</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8">
                Luck tracking is a powerful tool for financial awareness. By "playing" without spending, you can witness the reality of the house edge.
              </p>
              <Link href="/responsible-play" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 border-b-2 border-purple-600/20 pb-1 hover:border-purple-600 transition-all">Safety First</Link>
            </article>
          </div>

          <div className="mt-12 sm:mt-16 text-center">
            <Link href="/blog" className="inline-flex items-center gap-3 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-400 hover:text-indigo-500 transition-all group">
              Explore the full knowledge base
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        </section>

        {/* Global Statistics */}
        <section className="bg-gray-950 rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-12 md:p-20 text-white shadow-2xl overflow-hidden relative border border-white/5 mb-24 sm:mb-40 group mx-2">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[80px] -mr-40 -mt-40 group-hover:bg-indigo-600/20 transition-colors duration-1000" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <div className="text-left relative z-10">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-6 sm:mb-8">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                Live Data Active
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 sm:mb-8 uppercase tracking-tighter leading-[0.9]">
                Our Growing <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400 italic">Community</span>
              </h2>
              <p className="text-gray-400 text-base sm:text-lg mb-4 font-medium leading-relaxed max-w-md">
                Thousands of players are tracking their luck every day with our smart results checker.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 relative z-10">
              <div className="bg-white/5 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 backdrop-blur-xl group-hover:border-indigo-500/30 transition-all duration-700 text-center shadow-lg">
                <p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-3 sm:mb-4">Total Sets Checked</p>
                <p className="text-4xl sm:text-5xl font-black text-white tracking-tighter group-hover:text-indigo-400 transition-colors duration-500 tabular-nums">{liveStats.totalTickets.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 backdrop-blur-xl group-hover:border-emerald-500/30 transition-all duration-700 text-center shadow-lg">
                <p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-3 sm:mb-4">Active Players</p>
                <p className="text-4xl sm:text-5xl font-black text-white tracking-tighter group-hover:text-emerald-400 transition-colors duration-500 tabular-nums">{liveStats.activeTrackers.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-16 sm:py-24 bg-indigo-600 rounded-[2.5rem] sm:rounded-[3.5rem] text-white shadow-2xl mb-24 relative overflow-hidden group mx-2">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 transition-transform duration-[2s] group-hover:scale-105" />
          <div className="relative z-10 px-6">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 sm:mb-8 uppercase tracking-tighter leading-[0.95] sm:leading-[0.9] group-hover:scale-[1.01] transition-transform duration-700 italic">Is it your lucky day?</h2>
            <p className="text-indigo-100 mb-10 sm:mb-14 font-medium text-lg sm:text-xl opacity-90 italic max-w-xl mx-auto px-4">Join Australia's largest free lottery tracker and start imagining the win.</p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              <Link 
                href="/luck" 
                className="w-full sm:w-auto px-10 sm:px-14 py-4 sm:py-6 bg-white text-indigo-600 font-black rounded-2xl hover:bg-gray-50 shadow-xl transition-all uppercase tracking-widest text-base sm:text-xl active:scale-95 hover:-translate-y-1"
              >
                Track Now
              </Link>
              <Link 
                href="/login" 
                className="px-10 sm:px-14 py-4 sm:py-6 bg-indigo-950/30 text-white font-black rounded-2xl hover:bg-indigo-950/60 border-2 border-white/20 transition-all uppercase tracking-widest text-base sm:text-xl backdrop-blur-md active:scale-95 hover:-translate-y-1 w-full sm:w-auto"
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
