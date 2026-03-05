'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import LottoLinePicker from '../../components/LottoLinePicker';
import { getNextDrawDates, compareNumbers, generateQuickPick } from '../../lib/lotto-utils';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

interface Ticket {
  id: string;
  drawDate: string;
  numbers: number[];
  game: string;
}

interface DrawResult {
  game: string;
  drawDate: string;
  numbers: number[];
  bonus: number[];
  prizes: Record<string, number>;
}

const TICKET_COST = 1.45;

export default function LuckPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [game, setGame] = useState<'Oz Lotto' | 'Powerball'>('Oz Lotto');
  const upcomingDates = useMemo(() => getNextDrawDates(5, game), [game]);
  const [selectedDate, setSelectedDate] = useState(upcomingDates[0]);
  const [currentNumbers, setCurrentNumbers] = useState<number[]>([]);
  const [quickPickQty, setQuickPickQuantity] = useState(10);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [drawResultsList, setDrawResultsList] = useState<DrawResult[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Sync selected date when game changes
  useEffect(() => {
    setSelectedDate(upcomingDates[0]);
    setCurrentNumbers([]);
  }, [game, upcomingDates]);

  useEffect(() => {
    const loadTickets = async () => {
      setIsDataLoading(true);
      if (user) {
        const { data } = await supabase.from('tickets').select('*').eq('game', game).order('created_at', { ascending: false });
        if (data) setMyTickets(data.map(t => ({ id: t.id, drawDate: t.draw_date, numbers: t.numbers, game: t.game })));
      } else {
        const stored = localStorage.getItem(`luckTickets_${game.replace(/\s/g, '')}`);
        if (stored) setMyTickets(JSON.parse(stored));
        else setMyTickets([]);
      }
      setIsDataLoading(false);
    };
    if (!isAuthLoading) loadTickets();
  }, [user, isAuthLoading, game]);

  useEffect(() => {
    const fetchResults = async () => {
      const { data } = await supabase.from('draw_results').select('*').eq('game', game).order('draw_date', { ascending: false });
      if (data) setDrawResultsList(data.map(r => ({ game: r.game, drawDate: r.draw_date, numbers: r.numbers, bonus: r.bonus, prizes: r.prizes })));
    };
    fetchResults();
  }, [game]);

  const ticketsByDate = useMemo(() => {
    const groups: Record<string, Ticket[]> = {};
    myTickets.forEach(t => {
      if (!groups[t.drawDate]) groups[t.drawDate] = [];
      groups[t.drawDate].push(t);
    });
    return groups;
  }, [myTickets]);

  const saveTicketsState = (updated: Ticket[]) => {
    setMyTickets(updated);
    if (!user) localStorage.setItem(`luckTickets_${game.replace(/\s/g, '')}`, JSON.stringify(updated));
  };

  const handleSaveTicket = async () => {
    const required = game === 'Oz Lotto' ? 7 : 8;
    if (currentNumbers.filter(n => n > 0).length !== required) { alert(`Select ${required} numbers`); return; }
    
    if (user) {
      const { data } = await supabase.from('tickets').insert({ draw_date: selectedDate, numbers: currentNumbers, user_id: user.id, game }).select();
      if (data) setMyTickets([{ id: data[0].id, drawDate: data[0].draw_date, numbers: data[0].numbers, game: data[0].game }, ...myTickets]);
    } else {
      const updated = [{ id: Date.now().toString(), drawDate: selectedDate, numbers: currentNumbers, game }, ...myTickets];
      saveTicketsState(updated);
    }
    setCurrentNumbers([]);
  };

  const handleMultiQuickPick = async () => {
    const newSets = Array.from({ length: quickPickQty }, () => generateQuickPick(game));
    if (user) {
      const { data } = await supabase.from('tickets').insert(newSets.map(n => ({ user_id: user.id, draw_date: selectedDate, numbers: n, game }))).select();
      if (data) setMyTickets([...data.map(t => ({ id: t.id, drawDate: t.draw_date, numbers: t.numbers, game: t.game })), ...myTickets]);
    } else {
      const updated = [...newSets.map((n, i) => ({ id: `${Date.now()}-${i}`, drawDate: selectedDate, numbers: n, game })), ...myTickets];
      saveTicketsState(updated);
    }
  };

  const handleDeleteDateGroup = async (date: string) => {
    if (!window.confirm(`Delete all ${game} tickets for ${date}?`)) return;
    if (user) await supabase.from('tickets').delete().eq('draw_date', date).eq('game', game).eq('user_id', user.id);
    const updated = myTickets.filter(t => t.drawDate !== date);
    saveTicketsState(updated);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);

  if (isAuthLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 font-black text-indigo-600 animate-pulse uppercase tracking-widest">Initialising...</div>;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pb-24">
      <Navbar />

      <header className="bg-white border-b border-gray-200 py-12 px-6 mb-12 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase mb-2">Try Your <span className="text-indigo-600">Luck</span></h1>
            <div className="flex gap-2 mt-4">
              {['Oz Lotto', 'Powerball'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGame(g as any)}
                  className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${game === g ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          {!user && (
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-4 max-w-md">
              <span className="text-2xl">☁️</span>
              <p className="text-xs text-indigo-700 font-bold leading-relaxed">Guest Mode. <Link href="/login" className="underline font-bold">Sign in</Link> to sync your {game} tickets.</p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 px-6">
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">1. Choose Draw Date</label>
            <select 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full appearance-none bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-black text-gray-800 focus:border-indigo-500 outline-none transition-all mb-8"
            >
              {upcomingDates.map(date => <option key={date} value={date}>{date} ({game === 'Oz Lotto' ? 'Tuesday' : 'Thursday'})</option>)}
            </select>

            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">2. Select Your Numbers</label>
            <LottoLinePicker 
              lineId="luck-picker"
              displayIndex={1}
              selectedNumbers={currentNumbers}
              onNumbersChange={(_, numbers) => setCurrentNumbers(numbers)}
              onDeleteLine={() => setCurrentNumbers([])}
              game={game}
            />

            <div className="grid grid-cols-1 gap-4 mt-8">
              <button onClick={handleSaveTicket} className="py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-lg transition-all uppercase tracking-wider text-sm active:scale-95">Save Set</button>
              <div className="flex gap-3">
                <select value={quickPickQty} onChange={(e) => setQuickPickQuantity(Number(e.target.value))} className="bg-gray-100 rounded-2xl p-4 font-black text-gray-700 w-24 text-center">
                  {[10, 25, 50, 100].map(q => <option key={q} value={q}>x{q}</option>)}
                </select>
                <button onClick={handleMultiQuickPick} className="flex-1 py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 shadow-lg transition-all uppercase tracking-wider text-sm active:scale-95">Quick Pick Burst</button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{game} History</h2>
            <span className="text-[10px] font-black text-gray-400 bg-gray-200 px-3 py-1 rounded-full uppercase">{myTickets.length} Sets</span>
          </div>

          <div className="space-y-4">
            {isDataLoading ? <p className="text-center py-20 text-gray-400 font-bold italic">Loading tickets...</p> : Object.keys(ticketsByDate).length === 0 ? (
              <div className="bg-white p-20 rounded-[3rem] border border-dashed border-gray-200 text-center">
                <p className="text-gray-400 font-bold italic">No {game} tickets found.</p>
              </div>
            ) : (
              Object.entries(ticketsByDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, tickets]) => {
                const isExpanded = expandedDates.has(date);
                const res = drawResultsList.find(r => r.drawDate === date);
                let totalPrize = 0;
                let div1Win = false;
                if (res) {
                  tickets.forEach(t => {
                    const c = compareNumbers(t.numbers, res.numbers, res.bonus, game);
                    totalPrize += res.prizes[c.prizeTier] || 0;
                    if (c.prizeTier === 'Division 1') div1Win = true;
                  });
                }
                const isWinner = res && (totalPrize > 0 || div1Win);

                return (
                  <div key={date} className={`bg-white rounded-[2rem] border transition-all duration-300 ${isWinner ? 'border-emerald-200 shadow-xl' : 'border-gray-100'}`}>
                    <div className="flex items-center pr-4">
                      <button onClick={() => { const next = new Set(expandedDates); if (next.has(date)) next.delete(date); else next.add(date); setExpandedDates(next); }} className="flex-1 p-6 flex items-center justify-between text-left">
                        <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${isWinner ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{tickets.length}</div>
                          <div>
                            <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Draw: {date}</p>
                            <p className="text-lg font-black text-gray-900">{res ? 'Result Published' : 'Pending'}</p>
                          </div>
                        </div>
                        {res && (
                          <div className="text-right mr-4">
                            <p className={`text-xl font-black ${isWinner ? 'text-emerald-600' : 'text-gray-300'}`}>{div1Win ? 'JACKPOT!' : formatCurrency(totalPrize)}</p>
                          </div>
                        )}
                      </button>
                      <button onClick={() => handleDeleteDateGroup(date)} className="text-gray-300 hover:text-red-500 p-2">🗑️</button>
                    </div>

                    {isExpanded && (
                      <div className={`p-8 border-t ${isWinner ? 'bg-emerald-50/30' : 'bg-gray-50'}`}>
                        {res && (
                          <div className="mb-8 bg-white p-6 rounded-3xl border border-gray-100 text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">Winning Numbers</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {res.numbers.map(n => <span key={n} className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold border-b-4 border-emerald-700 shadow-sm">{n}</span>)}
                              <div className="w-px h-9 bg-gray-200 mx-1" />
                              {res.bonus.map(n => <span key={n} className="w-9 h-9 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold border-b-4 border-amber-600 shadow-sm">{n}</span>)}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {tickets.map((t, idx) => {
                            const c = res ? compareNumbers(t.numbers, res.numbers, res.bonus, game) : null;
                            const prize = (c && res) ? (res.prizes[c.prizeTier] || 0) : 0;
                            const ticketWon = prize > 0 || c?.prizeTier === 'Division 1';
                            return (
                              <div key={t.id} className={`p-4 rounded-2xl border transition-all ${ticketWon ? 'bg-white border-emerald-300 shadow-md' : 'bg-white/50 border-gray-100 opacity-60'}`}>
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-[10px] font-black text-gray-400 uppercase">#{idx + 1}</span>
                                  {c && <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${ticketWon ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{c.prizeTier}</span>}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {t.numbers.slice(0, 7).map(n => {
                                    const match = res && res.numbers.includes(n);
                                    return <span key={n} className={`w-6 h-6 flex items-center justify-center rounded-full text-[9px] font-black ${match ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{n}</span>;
                                  })}
                                  {game === 'Powerball' && t.numbers[7] && (
                                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[9px] font-black ${res && res.bonus.includes(t.numbers[7]) ? 'bg-amber-400 text-amber-950' : 'bg-amber-50 text-amber-600/40'}`}>{t.numbers[7]}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
