'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function ResultsTicker() {
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const fetchLatest = async () => {
      const { data } = await supabase
        .from('draw_results')
        .select('game, numbers, draw_date')
        .order('draw_date', { ascending: false })
        .limit(10);
      
      if (data) {
        // Get latest unique by game
        const latest: Record<string, any> = {};
        data.forEach(d => {
          if (!latest[d.game]) latest[d.game] = d;
        });
        setResults(Object.values(latest));
      }
    };
    fetchLatest();
  }, []);

  if (results.length === 0) return null;

  return (
    <div className="bg-indigo-600 dark:bg-indigo-950 text-white py-2 overflow-hidden whitespace-nowrap relative z-[9998] border-b border-white/10 shadow-sm">
      <div className="flex animate-marquee gap-12 sm:gap-24 items-center">
        {results.map((res, i) => (
          <div key={i} className="flex items-center gap-3 sm:gap-4 shrink-0 px-4">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-80">{res.game}</span>
            <div className="flex gap-1.5 sm:gap-2">
              {res.numbers.map((n: number) => (
                <span key={n} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center text-[9px] sm:text-[10px] font-black border border-white/10 shadow-sm">{n}</span>
              ))}
            </div>
            <span className="text-[8px] sm:text-[9px] font-bold opacity-60 uppercase">{res.draw_date}</span>
          </div>
        ))}
        {/* Duplicate for seamless loop */}
        {results.map((res, i) => (
          <div key={`dup-${i}`} className="flex items-center gap-3 sm:gap-4 shrink-0 px-4">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-80">{res.game}</span>
            <div className="flex gap-1.5 sm:gap-2">
              {res.numbers.map((n: number) => (
                <span key={n} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center text-[9px] sm:text-[10px] font-black border border-white/10 shadow-sm">{n}</span>
              ))}
            </div>
            <span className="text-[8px] sm:text-[9px] font-bold opacity-60 uppercase">{res.draw_date}</span>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: fit-content;
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
