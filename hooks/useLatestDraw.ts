import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { generateQuickPick } from '../lib/lotto-utils';
import type { DrawResult } from '../types/lotto';

export function useLatestDraw(game: string, drawMode: 'official' | 'random' | 'manual') {
  const [officialResult, setOfficialResult] = useState<DrawResult | null>(null);
  const [customResult, setCustomResult] = useState<DrawResult>({
    game: 'Custom Draw',
    drawDate: 'Simulated',
    numbers: [],
    bonus: [],
    prizes: {
      "Division 1": 10000000, "Division 2": 50000, "Division 3": 5000,
      "Division 4": 400, "Division 5": 50, "Division 6": 25,
      "Division 7": 15, "Division 8": 10, "Division 9": 5, "No Prize": 0
    }
  });

  const generateRandomResult = useCallback(() => {
    const main = generateQuickPick(game as any);
    if (game === 'Oz Lotto') {
      const supp: number[] = [];
      while (supp.length < 3) {
        const num = Math.floor(Math.random() * 47) + 1;
        if (!main.includes(num) && !supp.includes(num)) supp.push(num);
      }
      setCustomResult(prev => ({ ...prev, numbers: main, bonus: supp.sort((a,b) => a-b) }));
    } else if (game === 'Tatts Lotto') {
      const supp: number[] = [];
      while (supp.length < 2) {
        const num = Math.floor(Math.random() * 45) + 1;
        if (!main.includes(num) && !supp.includes(num)) supp.push(num);
      }
      setCustomResult(prev => ({ ...prev, numbers: main, bonus: supp.sort((a,b) => a-b) }));
    } else {
      const mainPB = main.slice(0, 7);
      const pb = main[7];
      setCustomResult(prev => ({ ...prev, numbers: mainPB, bonus: [pb] }));
    }
  }, [game]);

  useEffect(() => {
    const fetchLatestResult = async () => {
      setOfficialResult(null);
      
      if (drawMode !== 'official') {
        setCustomResult(prev => ({ ...prev, numbers: [], bonus: [] }));
        if (drawMode === 'random') generateRandomResult();
        return;
      }

      try {
        const { data } = await supabase.from('draw_results').select('*').eq('game', game).order('draw_date', { ascending: false }).limit(1).maybeSingle();
        if (data) setOfficialResult({ game: data.game, drawDate: data.draw_date, numbers: data.numbers, bonus: data.bonus, prizes: data.prizes });
      } catch (err) { console.error("Failed to fetch result:", err); }
    };
    fetchLatestResult();
  }, [game, drawMode, generateRandomResult]);

  const activeResult = drawMode === 'official' ? officialResult : customResult;

  return { officialResult, customResult, setCustomResult, activeResult, generateRandomResult };
}
