import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Ticket, compareNumbers } from '../lib/lotto-utils';
import { DrawResult } from '../types/lotto'
export function useLuckData(game: string, myTickets: Ticket[]) {
  const [drawResultsList, setDrawResultsList] = useState<DrawResult[]>([]);
  const [upcomingLedger, setUpcomingLedger] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const loadPublicData = async () => {
      setIsDataLoading(true);
      const { data: ledger } = await supabase.from('upcoming_draws').select('*');
      if (ledger) setUpcomingLedger(ledger);

      const { data: results } = await supabase.from('draw_results').select('*').order('draw_date', { ascending: false });
      if (results) {
        setDrawResultsList(results.map(r => ({
          game: r.game,
          drawDate: r.draw_date,
          drawNumber: r.draw_number,
          numbers: r.numbers,
          bonus: r.bonus,
          prizes: r.prizes
        })));
      }
      setIsDataLoading(false);
    };
    loadPublicData();
  }, []);

  const stats = useMemo(() => {
    let totalMissedPrize = 0;
    let totalTicketsChecked = 0;
    let totalWins = 0;
    let bestDivision = 'No Prize';
    const TICKET_COST = 1.45;

    const relevantTickets = myTickets.filter(t => t.game === game);

    relevantTickets.forEach(t => {
      const res = drawResultsList.find(r => r.drawDate === t.drawDate && r.game === t.game);
      if (res) {
        totalTicketsChecked++;
        const c = compareNumbers(t.numbers, res.numbers, res.bonus, t.game as any);

        let prize = res.prizes[c.prizeTier] || 0;
        if (c.prizeTier === 'Division 1' && prize === 0) {
          const ledgerMatch = upcomingLedger.find(l => l.game?.toLowerCase().includes(t.game.toLowerCase().split(' ')[0]) && l.draw_date === t.drawDate);
          if (ledgerMatch) prize = ledgerMatch.jackpot;
        }

        totalMissedPrize += prize;
        if (c.prizeTier !== 'No Prize') {
          totalWins++;
          const currentDiv = parseInt(c.prizeTier.replace('Division ', ''));
          const bestDivNum = bestDivision === 'No Prize' ? 99 : parseInt(bestDivision.replace('Division ', ''));
          if (currentDiv < bestDivNum) {
            bestDivision = c.prizeTier;
          }
        }
      }
    });

    const totalInvested = relevantTickets.length * TICKET_COST;
    return { totalMissedPrize, totalTicketsChecked, totalWins, bestDivision, totalInvested };
  }, [myTickets, drawResultsList, upcomingLedger, game]);

  return { drawResultsList, upcomingLedger, isDataLoading, stats };
}
