'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import { supabase } from '../../lib/supabase';

type GameType = 'All' | 'Oz Lotto' | 'Powerball' | 'Tatts Lotto';

interface WinnerRecord {
  id: string;
  user_nickname: string;
  prize: number;
  draw_date: string;
  game: string;
  division: string;
}

export default function LeaderboardPage() {
  const [filterGame, setFilterGame] = useState<GameType>('All');
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<WinnerRecord[]>([]);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        // Now fetching from the PUBLIC leaderboard table
        // This works even when logged out!
        let query = supabase
          .from('leaderboard')
          .select('*')
          .order('prize', { ascending: false })
          .limit(50);

        if (filterGame !== 'All') {
          query = query.eq('game', filterGame);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        setRankings(data || []);
      } catch (err) {
        console.error("Leaderboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [filterGame]); // Refetch when filter changes

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);


  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 selection:bg-indigo-500 transition-colors duration-500">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-6 py-20">
        <header className="text-center mb-20 animate-in fade-in slide-in-from-top-8 duration-1000">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-8 italic">
            Hall of <span className="text-indigo-600 dark:text-indigo-400">Fame</span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Celebrating the luckiest risk-free wins in our community. Anyone can witness the magic!
          </p>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {(['All', 'Oz Lotto', 'Powerball', 'Tatts Lotto'] as GameType[]).map((g) => (
            <button
              key={g}
              onClick={() => setFilterGame(g)}
              className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                filterGame === g 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' 
                  : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-40 flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Fetching legends...</p>
          </div>
        ) : rankings.length > 0 ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {rankings.map((record, index) => {
              const isTop3 = index < 3 && filterGame === 'All';
              return (
                <div 
                  key={record.id} 
                  className={`flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-1 ${
                    isTop3 
                      ? 'bg-white dark:bg-gray-900 border-indigo-200 dark:border-indigo-500/30 shadow-2xl scale-[1.02] z-10' 
                      : 'bg-white/50 dark:bg-white/5 border-gray-100 dark:border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4 sm:gap-8 w-full sm:w-auto">
                    <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-sm sm:text-xl ${
                      index === 0 ? 'bg-amber-400 text-amber-950 shadow-lg shadow-amber-400/20' :
                      index === 1 ? 'bg-gray-300 text-gray-800' :
                      index === 2 ? 'bg-orange-400 text-orange-950' :
                      'bg-gray-100 dark:bg-white/5 text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="text-left truncate">
                      <p className="font-black uppercase tracking-tight text-base sm:text-lg flex items-center gap-2 truncate">
                        {record.user_nickname} 
                        {index === 0 && <span className="text-sm">👑</span>}
                      </p>
                      <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] sm:tracking-[0.2em]">{record.game} — {record.draw_date}</p>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-baseline sm:items-end justify-between sm:justify-center w-full sm:w-auto mt-6 sm:mt-0 pt-6 sm:pt-0 border-t sm:border-0 border-gray-100 dark:border-white/5">
                    <p className={`text-2xl sm:text-3xl font-black tracking-tighter ${isTop3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {formatCurrency(record.prize)}
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase ml-2 sm:ml-0">{record.division}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-40 text-center bg-gray-50 dark:bg-white/5 rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-white/10">
            <p className="text-gray-400 font-bold italic uppercase tracking-widest text-sm">No legends found in this category.</p>
          </div>
        )}

        <footer className="mt-32 pt-16 border-t border-gray-100 dark:border-white/5 text-center">
          <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-2xl mx-auto italic">
            The Hall of Fame displays top matches tracked by our community. These are risk-free simulations and do not represent real-world monetary winnings.
          </p>
        </footer>
      </main>
    </div>
  );
}
