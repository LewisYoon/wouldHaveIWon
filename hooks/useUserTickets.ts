import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Ticket, generateQuickPick } from '../lib/lotto-utils';

export function useUserTickets(user: any, isPremium: boolean, isAuthLoading: boolean) {
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [isTicketsLoading, setIsTicketsLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!user) { setMyTickets([]); setIsTicketsLoading(false); return; }
    setIsTicketsLoading(true);
    const { data } = await supabase.from('tickets').select('*').eq('user_id', user.id).order('draw_date', { ascending: false });
    if (data) {
      setMyTickets(data.map(t => ({ id: t.id, drawDate: t.draw_date, numbers: t.numbers, game: t.game })));
    }
    setIsTicketsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!isAuthLoading) fetchTickets();
  }, [user, isAuthLoading, fetchTickets]);

  const addTicket = async (game: string, date: string, numbers: number[]) => {
    if (!user) return { error: 'Not logged in' };
    const { data, error } = await supabase.from('tickets').insert([{ user_id: user.id, draw_date: date, numbers, game }]).select();
    if (!error && data) {
      setMyTickets(prev => [{ id: data[0].id, drawDate: data[0].draw_date, numbers: data[0].numbers, game: data[0].game }, ...prev]);
      return { data: data[0] };
    }
    return { error };
  };

  const addQuickPicks = async (game: string, date: string, quantity: number, existingCount: number, limit: number) => {
    if (!user) return { error: 'Not logged in' };
    const ticketsToCreate = Math.min(quantity, isPremium ? 1000 : limit - existingCount);
    if (ticketsToCreate <= 0) return { error: 'Limit reached' };

    const tickets = Array.from({ length: ticketsToCreate }, () => ({ user_id: user.id, draw_date: date, numbers: generateQuickPick(game as any), game }));
    const { data, error } = await supabase.from('tickets').insert(tickets).select();
    if (!error && data) {
      const mapped = data.map(t => ({ id: t.id, drawDate: t.draw_date, numbers: t.numbers, game: t.game }));
      setMyTickets(prev => [...mapped, ...prev]);
      return { data };
    }
    return { error };
  };

  const deleteTicketsByDate = async (game: string, date: string) => {
    if (!user) return { error: 'Not logged in' };
    const { error } = await supabase.from('tickets').delete().eq('user_id', user.id).eq('game', game).eq('draw_date', date);
    if (!error) {
      setMyTickets(prev => prev.filter(t => !(t.drawDate === date && t.game === game)));
    }
    return { error };
  };

  const deleteSingleTicket = async (id: string) => {
    if (!user) return { error: 'Not logged in' };
    const { error } = await supabase.from('tickets').delete().eq('id', id).eq('user_id', user.id);
    if (!error) {
      setMyTickets(prev => prev.filter(t => t.id !== id));
    }
    return { error };
  };

  return { 
    myTickets, 
    isTicketsLoading, 
    addTicket, 
    addQuickPicks, 
    deleteTicketsByDate, 
    deleteSingleTicket, 
    refreshTickets: fetchTickets 
  };
}
