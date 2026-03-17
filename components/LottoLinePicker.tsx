// lotto-project/components/LottoLinePicker.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { generateQuickPick } from '../lib/lotto-utils';

interface LottoLinePickerProps {
  lineId: string;
  displayIndex: number;
  selectedNumbers: number[];
  onNumbersChange: (id: string, numbers: number[] | ((prev: number[]) => number[])) => void;
  onDeleteLine: (id: string) => void;
  game?: 'Oz Lotto' | 'Powerball' | 'Tatts Lotto';
}

export default function LottoLinePicker({ 
  lineId, 
  displayIndex, 
  selectedNumbers, 
  onNumbersChange, 
  onDeleteLine,
  game = 'Oz Lotto'
}: LottoLinePickerProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const OZ_MAX = 47;
  const PB_MAX = 35;
  const PB_BALL_MAX = 20;
  const TATTS_MAX = 45;

  const isPB = game === 'Powerball';
  const mainRequired = isPB ? 7 : (game === 'Oz Lotto' ? 7 : 6);
  const mainMax = isPB ? PB_MAX : (game === 'Oz Lotto' ? OZ_MAX : TATTS_MAX);

  const mainNumbers = Array.from({ length: mainMax }, (_, i) => i + 1);
  const pbNumbers = Array.from({ length: PB_BALL_MAX }, (_, i) => i + 1);

  const isOz = game === 'Oz Lotto';
  const isTatts = game === 'Tatts Lotto';
  const brandColor = isOz ? 'text-emerald-600' : isTatts ? 'text-red-600' : 'text-indigo-600';
  const brandBall = isOz ? 'bg-emerald-500' : isTatts ? 'bg-red-500' : 'bg-indigo-600';

  // 스마트 스크롤 로직: 번호 유무에 따라 방향 결정
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      const hasAnyNumber = selectedNumbers.some(n => n > 0);
      
      if (hasAnyNumber) {
        scrollContainer.scrollTo({ left: scrollContainer.scrollWidth, behavior: 'smooth' });
      } else {
        scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }
  }, [selectedNumbers]);

  const handleMainToggle = (n: number) => {
    if (isAnimating) return;
    let next = [...selectedNumbers];
    if (isPB) {
      let mainPart = next.slice(0, 7).filter(x => x > 0);
      const pbPart = next[7] || 0;
      if (mainPart.includes(n)) {
        mainPart = mainPart.filter(num => num !== n);
      } else if (mainPart.length < 7) {
        mainPart = [...mainPart, n].sort((a, b) => a - b);
      }
      const result = [...mainPart];
      while (result.length < 7) result.push(0);
      result[7] = pbPart;
      onNumbersChange(lineId, result);
    } else {
      let mainPart = next.filter(x => x > 0);
      if (mainPart.includes(n)) {
        mainPart = mainPart.filter(num => num !== n);
      } else if (mainPart.length < mainRequired) {
        mainPart = [...mainPart, n].sort((a, b) => a - b);
      }
      onNumbersChange(lineId, mainPart);
    }
  };

  const handlePBToggle = (n: number) => {
    if (isAnimating || !isPB) return;
    let next = [...selectedNumbers];
    const mainPart = next.slice(0, 7);
    const currentPB = next[7] || 0;
    const newPB = currentPB === n ? 0 : n;
    
    const result = [...mainPart];
    while (result.length < 7) result.push(0);
    result[7] = newPB;
    onNumbersChange(lineId, result);
  };

  const handleAnimatedQuickPick = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const targetNumbers = generateQuickPick(game);
    onNumbersChange(lineId, new Array(isPB ? 8 : mainRequired).fill(0));

    targetNumbers.forEach((num, index) => {
      setTimeout(() => {
        onNumbersChange(lineId, (prev) => {
          const next = [...prev];
          next[index] = num;
          return next;
        });
        if (index === targetNumbers.length - 1) {
          setTimeout(() => setIsAnimating(false), 300);
        }
      }, index * 100);
    });
  };

  return (
    <div className="space-y-10">
      {/* Integrated Control Panel - Better for Desktop */}
      <div className="bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/5">
        <div className="flex flex-col">
          {/* Status Bar */}
          <div className="bg-white dark:bg-gray-900 px-6 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${selectedNumbers.filter(n => n > 0).length === (isPB ? 8 : mainRequired) ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 animate-pulse'}`} />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {selectedNumbers.filter(n => n > 0).length} of {isPB ? 8 : mainRequired} Ready
              </span>
            </div>
            <div className="flex gap-4">
              <button onClick={handleAnimatedQuickPick} disabled={isAnimating} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:opacity-70 transition-all disabled:opacity-30">Auto Pick</button>
              <button onClick={() => { onNumbersChange(lineId, []); onDeleteLine(lineId); }} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:opacity-70 transition-all">Reset All</button>
            </div>
          </div>

          {/* Ball Display Area */}
          <div className="p-6 sm:p-8 flex items-center justify-center">
            <div 
              ref={scrollRef}
              className="flex flex-row flex-nowrap items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-2 px-4 scroll-smooth"
            >
              {Array.from({ length: mainRequired }).map((_, i) => {
                const num = selectedNumbers[i];
                return (
                  <div key={`main-${i}`} className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-xs sm:text-lg border-b-[4px] transition-all duration-500 flex-shrink-0 shadow-lg ${num ? `${brandBall} text-white border-black/20 scale-110 animate-in slide-in-from-right-4` : 'bg-white dark:bg-gray-800 text-gray-200 dark:text-gray-700 border-gray-100 dark:border-white/5 opacity-40'}`}>
                    {num || ''}
                  </div>
                );
              })}
              {isPB && (
                <>
                  <div className="w-px h-8 bg-gray-300 dark:bg-white/10 mx-1 flex-shrink-0" />
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-xs sm:text-lg border-b-[4px] transition-all duration-500 flex-shrink-0 shadow-lg ${selectedNumbers[7] ? 'bg-amber-400 text-amber-950 border-amber-600 scale-110 animate-in slide-in-from-right-4' : 'bg-amber-50/20 dark:bg-amber-500/5 text-amber-600/20 dark:text-amber-400/20 border-amber-100/5 opacity-40'}`}>
                    {selectedNumbers[7] || 'P'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Selection */}
      <div className="grid grid-cols-1 gap-12 sm:px-4">
        <div className="space-y-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] text-left">Main Number Board</p>
          <div className="grid grid-cols-7 sm:grid-cols-10 gap-2 sm:gap-3">
            {mainNumbers.map(n => {
              const isSelected = (isPB ? selectedNumbers.slice(0, 7) : selectedNumbers).includes(n);
              return (
                <button key={n} type="button" disabled={isAnimating} onClick={() => handleMainToggle(n)} className={`aspect-square rounded-2xl text-xs sm:text-sm font-black transition-all transform active:scale-90 border-b-[4px] ${isSelected ? `${brandBall} text-white border-black/20 scale-110 shadow-2xl` : 'bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-white/5 hover:bg-gray-50'}`}>
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        {isPB && (
          <div className="space-y-6 pt-10 border-t border-gray-100 dark:border-white/10 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] text-left">Powerball Board</p>
            <div className="grid grid-cols-7 sm:grid-cols-10 gap-2 sm:gap-3">
              {pbNumbers.map(n => {
                const isSelected = selectedNumbers[7] === n;
                return (
                  <button key={`pb-${n}`} type="button" disabled={isAnimating} onClick={() => handlePBToggle(n)} className={`aspect-square rounded-2xl text-xs sm:text-sm font-black transition-all transform active:scale-90 border-b-[4px] ${isSelected ? 'bg-amber-400 text-amber-950 border-amber-600 scale-110 shadow-2xl' : 'bg-white dark:bg-amber-500/5 text-amber-600/40 dark:text-amber-400/40 border-gray-100 dark:border-white/5 hover:bg-amber-100/50'}`}>
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
