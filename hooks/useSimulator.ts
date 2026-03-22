import { useState, useCallback, useMemo } from 'react';
import { compareNumbers, ComparisonResult, DrawResult } from '../lib/lotto-utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const TICKET_COST = 1.45;

export function useSimulator(game: string, activeResult: DrawResult | null) {
  const { user } = useAuth();
  const [allComparisonResults, setAllComparisonResults] = useState<ComparisonResult[] | null>(null);
  const [stats, setStats] = useState({
    totalSpent: 0, totalWon: 0, profit: 0, winCount: 0, jackpotHit: false, roi: 0
  });

  const handleCheckAllResults = useCallback((allLines: number[][]): { results?: ComparisonResult[], currentWins?: number, error?: string } => {
    if (!activeResult || activeResult.numbers.length < (game === 'Tatts Lotto' ? 6 : 7)) {
      return { error: "Please ensure the winning numbers are set first." };
    }

    const results: ComparisonResult[] = [];
    let currentWon = 0;
    let currentWins = 0;
    let hitJackpot = false;

    allLines.forEach(userNumbers => {
      const result = compareNumbers(userNumbers, activeResult.numbers, activeResult.bonus, game as any);
      results.push(result);
      const prize = activeResult.prizes[result.prizeTier] || 0;
      currentWon += prize;
      if (result.prizeTier !== "No Prize") {
        currentWins++;
        if (result.prizeTier === "Division 1") hitJackpot = true;
      }
    });

    const spent = allLines.length * TICKET_COST;
    setStats({ 
      totalSpent: spent, 
      totalWon: currentWon, 
      profit: currentWon - spent, 
      winCount: currentWins, 
      jackpotHit: hitJackpot, 
      roi: spent > 0 ? (currentWon / spent) * 100 : 0 
    });
    setAllComparisonResults(results);
    
    return { results, currentWins };
  }, [activeResult, game]);

  const clearResults = useCallback(() => {
    setAllComparisonResults(null);
    setStats({ totalSpent: 0, totalWon: 0, profit: 0, winCount: 0, jackpotHit: false, roi: 0 });
  }, []);

  const luckNarrative = useMemo(() => {
    if (stats.jackpotHit) return "JACKPOT! You actually hit the Division 1 prize!";
    if (stats.roi > 100) return "AMAZING LUCK: You beat the house today!";
    if (stats.roi > 50) return "NOT BAD: You won back some of your spend.";
    if (allComparisonResults && stats.totalWon === 0) return "TOTAL WIPEOUT: Not a single match this time.";
    return "USUAL LUCK: The house edge is working as expected.";
  }, [stats, allComparisonResults]);

  const realWorldValue = useMemo(() => {
    const absProfit = Math.abs(stats.profit);
    if (stats.profit >= 0) {
      return { 
        label: "What you could buy", 
        items: [ 
          { name: "Flat White Coffees", qty: Math.floor(stats.totalWon / 5.5) }, 
          { name: "Electric Scooters", qty: Math.floor(stats.totalWon / 800) }, 
          { name: "Luxury Hotel Nights", qty: Math.floor(stats.totalWon / 1200) } 
        ] 
      };
    } else {
      return { 
        label: "What you could have bought instead", 
        items: [ 
          { name: "Yearly Subscriptions", qty: Math.floor(absProfit / 240) }, 
          { name: "Premium Dining Meals", qty: Math.floor(absProfit / 25) }, 
          { name: "Fuel Tank Refills", qty: Math.floor(absProfit / 100) } 
        ] 
      };
    }
  }, [stats.profit, stats.totalWon]);

  const saveTurboState = useCallback(async (game: string, currentStats: any) => {
    const data = { 
      game, 
      stats: {
        draws: currentStats.draws,
        spent: currentStats.spent,
        won: currentStats.won,
      },
      updated_at: new Date().toISOString() 
    };

    if (user) {
      // Save to Supabase for logged in users
      await supabase.from('turbo_sessions').upsert({ 
        user_id: user.id, 
        game: game,
        stats: data.stats,
        updated_at: data.updated_at
      }, { onConflict: 'user_id,game' });
    } else {
      // Save to LocalStorage for guests
      localStorage.setItem(`turbo_state_${game}`, JSON.stringify(data));
    }
  }, [user]);

  const loadTurboState = useCallback(async (game: string) => {
    if (user) {
      const { data, error } = await supabase
        .from('turbo_sessions')
        .select('stats')
        .eq('user_id', user.id)
        .eq('game', game)
        .single();
      
      if (data && !error) return data.stats;
    } else {
      const saved = localStorage.getItem(`turbo_state_${game}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.stats;
      }
    }
    return null;
  }, [user]);

  const setStatsFromSession = useCallback((savedStats: any) => {
    setStats(savedStats);
  }, []);

  return { 
    allComparisonResults, 
    stats, 
    handleCheckAllResults, 
    clearResults, 
    luckNarrative, 
    realWorldValue,
    saveTurboState,
    loadTurboState,
    setStatsFromSession
  };
}
