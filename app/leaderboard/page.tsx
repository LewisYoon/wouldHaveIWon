'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import { supabase } from '../../lib/supabase';
import { compareNumbers } from '../../lib/lotto-utils';

type GameType = 'All' | 'Oz Lotto' | 'Powerball' | 'Tatts Lotto';

interface WinnerRecord {
  email: string;
  prize: number;
  drawDate: string;
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
        // 1. Fetch tickets and draw results
        // Note: For a real production app with millions of records, 
        // you would use a dedicated 'leaderboard' table updated via database triggers.
        // For now, we process top recent tickets to show activity.
        const { data: tickets } = await supabase
          .from('tickets')
          .select('user_id, numbers, game, draw_date');

        const { data: results } = await supabase
          .from('draw_results')
          .select('*');

        const { data: users } = await supabase.rpc('get_user_emails_masked'); 
        // We'll use a safer approach since admin.listUsers is server-only.
        // For this demo, we'll use a mocked masking or a fallback.
        
        const winners: WinnerRecord[] = [];

        tickets?.forEach(t => {
          const res = results?.find(r => r.draw_date === t.draw_date && r.game === t.game);
          if (res) {
            const c = compareNumbers(t.numbers, res.numbers, res.bonus, t.game);
            const prize = res.prizes[c.prizeTier] || 0;
            
            if (prize > 0) {
              winners.push({
                email: 'Anonymous Player', // Masking happens below
                prize,
                drawDate: t.draw_date,
                game: t.game,
                division: c.prizeTier
              });
            }
          }
        });

        // Sort by prize desc and take top 50
        const sorted = winners.sort((a, b) => b.prize - a.prize).slice(0, 50);
        setRankings(sorted);
      } catch (err) {
        console.error("Leaderboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const filteredRankings = useMemo(() => {
    if (filterGame === 'All') return rankings;
    return rankings.filter(r => r.game === filterGame);
  }, [rankings, filterGame]);

  const maskEmail = (email: string) => {
    // In a real app, IDs would be linked to usernames. 
    // Here we generate a stable placeholder name for anonymity.
    const names = ["LuckyPanda", "WealthyKoala", "DreamChaser", "LottoWizard", "GoldenKangaroo", "FortuneSeeker", "JackpotHunter"];
    const hash = email.length % names.length;
    return names[hash] + "****";
  };

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
            Real-time rankings of the luckiest players in the WhatIFLotto community.
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
            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Crunching numbers...</p>
          </div>
        ) : filteredRankings.length > 0 ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {filteredRankings.map((record, index) => {
              const isTop3 = index < 3;
              return (
                <div 
                  key={index} 
                  className={`flex flex-col sm:flex-row items-center justify-between p-8 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-1 ${
                    isTop3 
                      ? 'bg-white dark:bg-gray-900 border-indigo-200 dark:border-indigo-500/30 shadow-2xl scale-[1.02] z-10' 
                      : 'bg-white/50 dark:bg-white/5 border-gray-100 dark:border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-8">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${
                      index === 0 ? 'bg-amber-400 text-amber-950 shadow-lg shadow-amber-400/20' :
                      index === 1 ? 'bg-gray-300 text-gray-800' :
                      index === 2 ? 'bg-orange-400 text-orange-950' :
                      'bg-gray-100 dark:bg-white/5 text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="text-left">
                      <p className="font-black uppercase tracking-tight text-lg flex items-center gap-2">
                        {maskEmail(record.game + index)} 
                        {index === 0 && <span className="text-sm">👑</span>}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{record.game} — {record.drawDate}</p>
                    </div>
                  </div>

                  <div className="text-center sm:text-right mt-6 sm:mt-0">
                    <p className={`text-3xl font-black tracking-tighter ${isTop3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {formatCurrency(record.prize)}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{record.division}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-40 text-center bg-gray-50 dark:bg-white/5 rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-white/10">
            <p className="text-gray-400 font-bold italic uppercase tracking-widest text-sm">No winners recorded for this category yet.</p>
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
