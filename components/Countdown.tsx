'use client';

import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: string; // ISO format: YYYY-MM-DD
}

export default function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Results usually available by 9:00 PM Sydney Time
      const target = new Date(`${targetDate}T21:00:00`);
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        const drawDay = new Date(targetDate).setHours(0,0,0,0);
        const today = new Date().setHours(0,0,0,0);
        if (today >= drawDay) {
          setIsProcessing(true);
        }
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const totalHours = Math.floor(difference / (1000 * 60 * 60)); // For fallback
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
      setIsProcessing(false);
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isProcessing) {
    return (
      <div className="flex items-center gap-2 text-indigo-500 animate-pulse font-black text-[10px] uppercase tracking-widest">
        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
        Fetching Result...
      </div>
    );
  }

  if (!timeLeft) return (
    <div className="text-gray-300 dark:text-gray-700 italic font-black text-[10px] uppercase tracking-widest">
      Awaiting Draw
    </div>
  );

  const { days, hours, minutes, seconds } = timeLeft;

  return (
    <div className="flex flex-col items-end">
      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mb-1">Result In</span>
      <div className="flex gap-1 font-black text-indigo-600 dark:text-indigo-400 tracking-tighter text-xs tabular-nums bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
        {days > 0 ? (
          <>
            <span>{days}d</span>
            <span>{hours}h</span>
          </>
        ) : (
          <>
            <span>{hours}h</span>
            <span>{minutes}m</span>
            <span>{seconds}s</span>
          </>
        )}
      </div>
    </div>
  );
}
