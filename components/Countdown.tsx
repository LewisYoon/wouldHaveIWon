'use client';

import { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: string; // YYYY-MM-DD
  game: string;
}

export default function Countdown({ targetDate, game }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const drawTime = new Date(`${targetDate}T20:30:00+11:00`).getTime(); // 8:30 PM AEDT
      const difference = drawTime - now;

      if (difference <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        setTimeLeft({
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference / (1000 * 60 * 60)) % 24),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-3 bg-indigo-900 text-white px-6 py-3 rounded-2xl shadow-xl border-indigo-700/50">
      <div className="flex flex-col">
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-300">Next {game} Draw</span>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black tracking-tighter">
            {timeLeft.d > 0 && `${timeLeft.d}d `}{timeLeft.h}h {timeLeft.m}m <span className="text-indigo-400 w-8 inline-block">{timeLeft.s}s</span>
          </span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
        </div>
      </div>
    </div>
  );
}
