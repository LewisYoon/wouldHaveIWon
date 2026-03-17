// lotto-project/components/LottoLinePicker.tsx
'use client';

import React from 'react';
import { generateQuickPick } from '../lib/lotto-utils';

interface LottoLinePickerProps {
  lineId: string;
  displayIndex: number;
  selectedNumbers: number[];
  onNumbersChange: (id: string, numbers: number[]) => void;
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

  const handleMainToggle = (n: number) => {
    let next = [...selectedNumbers];
    if (isPB) {
      // PB 모드: 0-6번 인덱스만 메인 번호로 취급
      let mainPart = next.slice(0, 7).filter(x => x > 0);
      const pbPart = next[7] || 0;
      if (mainPart.includes(n)) {
        mainPart = mainPart.filter(num => num !== n);
      } else if (mainPart.length < 7) {
        mainPart = [...mainPart, n].sort((a, b) => a - b);
      }
      // 항상 8자리를 유지하도록 구성
      const result = [...mainPart];
      while (result.length < 7) result.push(0);
      result[7] = pbPart;
      onNumbersChange(lineId, result);
    } else {
      // 일반 모드
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
    if (!isPB) return;
    let next = [...selectedNumbers];
    const mainPart = next.slice(0, 7);
    const currentPB = next[7] || 0;
    const newPB = currentPB === n ? 0 : n;
    
    const result = [...mainPart];
    while (result.length < 7) result.push(0);
    result[7] = newPB;
    onNumbersChange(lineId, result);
  };

  return (
    <div className="space-y-8">
      {/* Selection Bar - Smaller Balls */}
      <div className="bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 p-4 rounded-[1.5rem] shadow-inner">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] bg-white dark:bg-gray-800 ${brandColor} shadow-sm`}>{displayIndex}</div>
          </div>

          <div className="flex flex-row flex-nowrap items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-2">
            {Array.from({ length: mainRequired }).map((_, i) => {
              const num = selectedNumbers[i];
              return (
                <div key={`main-${i}`} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-[10px] sm:text-xs border-b-[3px] transition-all duration-500 flex-shrink-0 ${num ? `${brandBall} text-white border-black/20 shadow-md` : 'bg-white dark:bg-gray-800 text-gray-200 dark:text-gray-700 border-gray-100 dark:border-white/5'}`}>
                  {num || ''}
                </div>
              );
            })}
            {isPB && (
              <>
                <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-0.5 flex-shrink-0" />
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-[10px] sm:text-xs border-b-[3px] transition-all duration-500 flex-shrink-0 ${selectedNumbers[7] ? 'bg-amber-400 text-amber-950 border-amber-600 shadow-md' : 'bg-amber-50/50 dark:bg-amber-500/5 text-amber-600/20 dark:text-amber-400/20 border-amber-100 dark:border-white/5'}`}>
                  {selectedNumbers[7] || 'P'}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => onNumbersChange(lineId, generateQuickPick(game))} className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 text-[9px] font-black uppercase tracking-widest border border-gray-100 dark:border-white/5 shadow-sm active:scale-95">Auto</button>
            <button onClick={() => onDeleteLine(lineId)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-100 dark:border-white/5 active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Main Board</p>
            <span className={`text-[10px] font-black ${brandColor}`}>{selectedNumbers.filter((n, i) => n !== 0 && (!isPB || i < 7)).length} / {mainRequired}</span>
          </div>
          <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
            {mainNumbers.map(n => {
              const isSelected = (isPB ? selectedNumbers.slice(0, 7) : selectedNumbers).includes(n);
              return (
                <button key={n} type="button" onClick={() => handleMainToggle(n)} className={`aspect-square rounded-xl text-[10px] sm:text-xs font-black transition-all transform active:scale-90 border-b-[3px] ${isSelected ? `${brandBall} text-white border-black/20 scale-110 shadow-lg` : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-white/5 hover:bg-gray-50'}`}>
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        {isPB && (
          <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-white/10">
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Powerball Board</p>
              <span className="text-[10px] font-black text-amber-500">{selectedNumbers[7] ? '1' : '0'} / 1</span>
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
              {pbNumbers.map(n => {
                const isSelected = selectedNumbers[7] === n;
                return (
                  <button key={`pb-${n}`} type="button" onClick={() => handlePBToggle(n)} className={`aspect-square rounded-xl text-[10px] sm:text-xs font-black transition-all transform active:scale-90 border-b-[3px] ${isSelected ? 'bg-amber-400 text-amber-950 border-amber-600 scale-110 shadow-lg' : 'bg-white dark:bg-amber-500/5 text-amber-600/40 border-gray-100 dark:border-white/5 hover:bg-amber-100/50'}`}>
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
