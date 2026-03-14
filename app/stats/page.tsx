'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { compareNumbers } from '../../lib/lotto-utils';

const TICKET_COST = 1.45;

export default function StatsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, isAuthLoading]);

  useEffect(() => {
    const fetchData = async () => {
      if (isAuthLoading) return;
      if (!user) {
        setIsDataLoading(false);
        return;
      }

      setIsDataLoading(true);
      try {
        const { data: ticketsData } = await supabase
          .from('tickets')
          .select('*')
          .eq('user_id', user.id);

        const { data: resultsData } = await supabase
          .from('draw_results')
          .select('*');

        const { data: upcomingData } = await supabase
          .from('upcoming_draws')
          .select('*');

        setTickets(ticketsData || []);
        setResults(resultsData || []);
        setUpcoming(upcomingData || []);
      } catch (err) {
        console.error("Stats fetch error:", err);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, [user, isAuthLoading]);

  const stats = useMemo(() => {
    let globalMissed = 0;
    let globalWins = 0;
    let bestDiv = 99;
    let bestGame = '';
    
    const gameStats: Record<string, any> = {
      'Oz Lotto': { tickets: 0, wins: 0, missed: 0 },
      'Powerball': { tickets: 0, wins: 0, missed: 0 },
      'Tatts Lotto': { tickets: 0, wins: 0, missed: 0 },
    };

    tickets.forEach(t => {
      if (gameStats[t.game]) gameStats[t.game].tickets++;
      
      const res = results.find(r => r.draw_date === t.draw_date && r.game === t.game);
      if (res) {
        const c = compareNumbers(t.numbers, res.numbers, res.bonus, t.game);
        let prize = res.prizes[c.prizeTier] || 0;
        
        // Jackpot bridge
        if (c.prizeTier === 'Division 1' && prize === 0) {
          const up = upcoming.find(u => u.draw_date === t.draw_date && u.game.includes(t.game.split(' ')[0]));
          if (up) prize = up.jackpot;
        }

        if (prize > 0) {
          globalMissed += prize;
          globalWins++;
          if (gameStats[t.game]) {
            gameStats[t.game].wins++;
            gameStats[t.game].missed += prize;
          }
          
          const divNum = parseInt(c.prizeTier.replace('Division ', ''));
          if (divNum < bestDiv) {
            bestDiv = divNum;
            bestGame = t.game;
          }
        }
      }
    });

    const totalSaved = tickets.length * TICKET_COST;
    return { globalMissed, globalWins, bestDiv, bestGame, totalSaved, gameStats };
  }, [tickets, results, upcoming]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);

  const impactMetrics = useMemo(() => {
    const saved = stats.totalSaved;
    return [
      { label: 'Flat Whites', qty: Math.floor(saved / 5.5), icon: '☕' },
      { label: 'Averge Dinners', qty: Math.floor(saved / 45), icon: '🍽️' },
      { label: 'Full Tanks of Fuel', qty: Math.floor(saved / 90), icon: '⛽' },
      { label: 'Luxury Nights', qty: Math.floor(saved / 450), icon: '🏨' },
    ];
  }, [stats.totalSaved]);

  if (isAuthLoading || isDataLoading) return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 selection:bg-indigo-500 transition-colors duration-500">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 w-full">
        <header className="mb-10 sm:mb-16 text-left animate-in fade-in slide-in-from-left-8 duration-700">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none italic">
            My <span className="text-indigo-600 dark:text-indigo-400">Impact</span>
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-xl text-gray-500 dark:text-gray-400 font-medium max-w-2xl">
            Visualize your luck and track the actual financial impact of risk-free simulation.
          </p>
        </header>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-16">
          <div className="bg-indigo-600 p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] text-white shadow-2xl shadow-indigo-500/20 transform hover:scale-[1.02] transition-transform duration-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] mb-6 sm:mb-8 text-indigo-100/70">Total Money Saved</p>
            <p className="text-4xl sm:text-5xl font-black tracking-tighter mb-2">{formatCurrency(stats.totalSaved)}</p>
            <p className="text-[10px] sm:text-xs font-bold text-indigo-100/60 uppercase">Cost of {tickets.length} virtual tickets</p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border border-gray-100 dark:border-white/5 shadow-xl transform hover:scale-[1.02] transition-transform duration-500">
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] mb-6 sm:mb-8 text-gray-400">Missed Prize Pool</p>
            <p className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">{formatCurrency(stats.globalMissed)}</p>
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase italic">From {stats.globalWins} total matches</p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] border border-gray-100 dark:border-white/5 shadow-xl transform hover:scale-[1.02] transition-transform duration-500">
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] mb-6 sm:mb-8 text-gray-400">Personal Record</p>
            <p className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">
              {stats.bestDiv === 99 ? 'No Wins' : `Div ${stats.bestDiv}`}
            </p>
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase italic">{stats.bestDiv === 99 ? 'Keep tracking!' : `Achieved in ${stats.bestGame}`}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
          
          {/* Real-World Impact */}
          <div className="lg:col-span-7 space-y-8 sm:space-y-12">
            <section className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-gray-100 dark:border-white/5 shadow-xl">
              <h3 className="text-2xl sm:text-3xl font-black mb-8 sm:mb-12 tracking-tight uppercase italic">The "Reality Check"</h3>
              <div className="grid grid-cols-2 gap-4 sm:gap-8">
                {impactMetrics.map((item, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-white/5 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-gray-100 dark:border-white/5 group hover:bg-white dark:hover:bg-gray-800 transition-all duration-500 shadow-sm hover:shadow-md text-center sm:text-left">
                    <div className="text-3xl sm:text-4xl mb-4 sm:mb-6 group-hover:scale-125 transition-transform duration-500 w-full sm:w-fit">{item.icon}</div>
                    <p className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-1">{item.qty.toLocaleString()}x</p>
                    <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 sm:mt-12 pt-6 sm:pt-10 border-t border-gray-100 dark:border-white/5 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium leading-relaxed italic max-w-lg mx-auto">
                  By tracking your luck for free, you've kept this amount in your pocket while still enjoying the thrill of the draw.
                </p>
              </div>
            </section>

            <section className="bg-gray-950 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-white/5 group">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:32px_32px]" />
              <div className="relative z-10">
                <h3 className="text-2xl sm:text-3xl font-black mb-8 sm:mb-10 tracking-tight uppercase italic">Historical Consistency</h3>
                <div className="flex flex-col gap-4 sm:gap-6">
                  {Object.entries(stats.gameStats).map(([game, data]: [string, any]) => (
                    <div key={game} className="flex items-center justify-between p-5 sm:p-6 bg-white/5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 hover:border-indigo-500/30 transition-all">
                      <div>
                        <p className="font-black uppercase tracking-tight text-base sm:text-lg">{game}</p>
                        <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em] sm:tracking-[0.2em]">{data.tickets} tickets tracked</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg sm:text-xl text-indigo-400">{formatCurrency(data.missed)}</p>
                        <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase">Missed</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar / Mini CTA */}
          <aside className="lg:col-span-5 space-y-8 sm:space-y-10">
            <div className="p-8 sm:p-10 bg-indigo-50 dark:bg-indigo-500/5 rounded-[2rem] sm:rounded-[3rem] border border-indigo-100 dark:border-indigo-500/20">
              <h4 className="text-lg sm:text-xl font-black mb-4 sm:mb-6 uppercase tracking-tight italic">Improve My Stats</h4>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed mb-8 sm:mb-10 font-medium">
                Want to see higher potential winnings or more money saved? Keep your luck active by tracking upcoming draws.
              </p>
              <div className="space-y-3 sm:space-y-4">
                <Link href="/luck" className="w-full py-4 sm:py-5 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-xs tracking-widest block text-center shadow-lg hover:bg-indigo-500 transition-all">
                  Track Upcoming Draws
                </Link>
                <Link href="/simulator" className="w-full py-4 sm:py-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-xs tracking-widest block text-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  Open Simulator
                </Link>
              </div>
            </div>

            <div className="p-8 sm:p-10 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2rem] sm:rounded-[3rem] text-center">
              <p className="text-gray-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-6 leading-relaxed">
                "The only way to guarantee a win is to not spend real money."
              </p>
              <div className="flex justify-center gap-3 sm:gap-4">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-500" />
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" />
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500" />
              </div>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
