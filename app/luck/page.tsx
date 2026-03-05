'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import LottoLinePicker from '../../components/LottoLinePicker';
import DivisionRules from '../../components/DivisionRules';
import { getNextDrawDates, compareNumbers, generateQuickPick } from '../../lib/lotto-utils';
import { supabase } from '../../lib/supabase';

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
  const [game, setGame] = useState<'Oz Lotto' | 'Powerball' | 'Tatts Lotto'>('Oz Lotto');
  const upcomingDates = useMemo(() => getNextDrawDates(5, game), [game]);
  const [selectedDate, setSelectedDate] = useState(upcomingDates[0]);
  const [currentNumbers, setCurrentNumbers] = useState<number[]>([]);
  const [quickPickQty, setQuickPickQuantity] = useState(10);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [drawResultsList, setDrawResultsList] = useState<DrawResult[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const stats = useMemo(() => {
    let totalMissedPrize = 0;
    let totalTicketsChecked = 0;
    let totalWins = 0;
    let bestDivision = 'No Prize';

    myTickets.forEach(t => {
      const res = drawResultsList.find(r => r.drawDate === t.drawDate && r.game === t.game);
      if (res) {
        totalTicketsChecked++;
        const c = compareNumbers(t.numbers, res.numbers, res.bonus, t.game as any);
        const prize = res.prizes[c.prizeTier] || 0;
        totalMissedPrize += prize;
        if (c.prizeTier !== 'No Prize') {
          totalWins++;
          if (bestDivision === 'No Prize' || c.prizeTier < bestDivision) {
            bestDivision = c.prizeTier;
          }
        }
      }
    });

    const totalInvested = myTickets.length * TICKET_COST;
    return { totalMissedPrize, totalTicketsChecked, totalWins, bestDivision, totalInvested };
  }, [myTickets, drawResultsList]);

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
    const required = game === 'Oz Lotto' ? 7 : game === 'Powerball' ? 8 : 6;
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

  if (isAuthLoading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 font-black text-indigo-600 animate-pulse uppercase tracking-widest">Loading...</div>;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950 pb-24 transition-colors duration-500 text-gray-900 dark:text-gray-100 overflow-x-hidden">
      <Navbar />

      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/5 py-16 px-6 mb-16 shadow-sm transition-all duration-500 relative overflow-hidden text-left">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] bg-[radial-gradient(#4f46e5_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 animate-in fade-in slide-in-from-left-8 duration-700">
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-8">
            Track My <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 italic">Luck</span>
          </h1>
          <div className="flex items-center gap-3">
            {['Oz Lotto', 'Powerball', 'Tatts Lotto'].map((g) => (
              <button
                key={g}
                onClick={() => setGame(g as any)}
                className={`px-10 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 transform active:scale-95 ${
                  game === g 
                    ? (g === 'Oz Lotto' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20' : g === 'Tatts Lotto' ? 'bg-red-600 text-white shadow-xl shadow-red-500/20' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20')
                    : 'bg-white dark:bg-white/5 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5'
                }`}
              >
                {g}
              </button>
            ))}
            <button onClick={() => setIsRulesModalOpen(true)} className="ml-auto bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors w-12 h-12 rounded-full flex items-center justify-center font-black text-lg">?</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16 px-6 relative z-10">
        
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left">
          <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-xl transition-all duration-500">
            <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6 ml-2">1. Pick Draw Date</label>
            <div className="relative group mb-10">
              <select 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`w-full appearance-none bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-white/5 rounded-2xl p-5 font-black text-gray-800 dark:text-white outline-none transition-all cursor-pointer ${game === 'Oz Lotto' ? 'focus:border-emerald-500' : game === 'Tatts Lotto' ? 'focus:border-red-500' : 'focus:border-indigo-500'}`}
              >
                {upcomingDates.map(date => <option key={date} value={date}>{date} ({game === 'Oz Lotto' ? 'Tuesday' : game === 'Powerball' ? 'Thursday' : 'Saturday'})</option>)}
              </select>
            </div>

            <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6 ml-2">2. Choose Your Numbers</label>
            <LottoLinePicker 
              lineId="luck-picker"
              displayIndex={1}
              selectedNumbers={currentNumbers}
              onNumbersChange={(_, numbers) => setCurrentNumbers(numbers)}
              onDeleteLine={() => setCurrentNumbers([])}
              game={game}
            />

            <div className="grid grid-cols-1 gap-5 mt-12">
              <button onClick={handleSaveTicket} className={`py-6 text-white font-black rounded-3xl transition-all uppercase tracking-[0.2em] text-sm active:scale-95 shadow-xl hover:brightness-110 ${game === 'Oz Lotto' ? 'bg-emerald-600 shadow-emerald-500/20' : game === 'Tatts Lotto' ? 'bg-red-600 shadow-red-500/20' : 'bg-indigo-600 shadow-indigo-500/20'}`}>Save This Ticket</button>
              <div className="flex gap-4">
                <select value={quickPickQty} onChange={(e) => setQuickPickQuantity(Number(e.target.value))} className="bg-gray-100 dark:bg-gray-800 rounded-3xl p-5 font-black text-xs outline-none text-gray-700 dark:text-gray-300 w-24 border-none cursor-pointer">
                  {[10, 25, 50, 100].map(q => <option key={q} value={q}>x{q}</option>)}
                </select>
                <button onClick={handleMultiQuickPick} className="flex-1 py-6 bg-emerald-500 text-white font-black rounded-3xl transition-all uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/20 hover:brightness-110 active:scale-95">Quick Pick Burst</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7 space-y-10 animate-in fade-in slide-in-from-right-8 duration-1000 text-left">
          <div className="flex items-center justify-between px-6">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">My History</h2>
            <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-white/5 px-5 py-2 rounded-full uppercase tracking-widest">{myTickets.length} Tickets</span>
          </div>

          <div className="space-y-6">
            {isDataLoading ? (
              <div className="py-40 flex flex-col items-center gap-6 animate-pulse">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-xs italic">Loading history...</p>
              </div>
            ) : Object.keys(ticketsByDate).length === 0 ? (
              <div className="bg-white dark:bg-gray-900 p-32 rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-white/5 text-center transition-all duration-700 group hover:border-indigo-500/30">
                <p className="text-gray-400 dark:text-gray-500 font-bold italic mb-8">No tickets saved in your history.</p>
                <button onClick={handleMultiQuickPick} className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] border-b-2 border-indigo-600/20 hover:border-indigo-600 transition-all pb-1">Create my first tickets</button>
              </div>
            ) : (
              Object.entries(ticketsByDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, tickets], idx) => {
                const isExpanded = expandedDates.has(date);
                const res = drawResultsList.find(r => r.drawDate === date);
                let totalPrize = 0;
                let div1Win = false;
                let bestMatchForDate = 0;
                
                if (res) {
                  tickets.forEach(t => {
                    const c = compareNumbers(t.numbers, res.numbers, res.bonus, game);
                    totalPrize += res.prizes[c.prizeTier] || 0;
                    if (c.prizeTier === 'Division 1') div1Win = true;
                    if (c.mainMatchesCount > bestMatchForDate) bestMatchForDate = c.mainMatchesCount;
                  });
                }
                const isWinner = res && (totalPrize > 0 || div1Win);

                return (
                  <div key={date} className={`bg-white dark:bg-gray-900 rounded-[3rem] border transition-all duration-500 ${isWinner ? 'border-emerald-200 dark:border-emerald-500 shadow-2xl' : 'border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl'} animate-in fade-in slide-in-from-bottom-4`} style={{ transitionDelay: `${idx * 100}ms` }}>
                    <div className="flex items-center pr-6">
                      <button onClick={() => { const next = new Set(expandedDates); if (next.has(date)) next.delete(date); else next.add(date); setExpandedDates(next); }} className="flex-1 p-10 flex items-center justify-between text-left group">
                        <div className="flex items-center gap-10">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl transition-all duration-500 group-hover:rotate-12 ${isWinner ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500'}`}>{tickets.length}</div>
                          <div>
                            <p className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-2">Draw: {date}</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{res ? (isWinner ? 'WINNER DETECTED' : 'RESULTS IN') : 'AWAITING DRAW'}</p>
                          </div>
                        </div>
                        {res ? (
                          <div className="text-right mr-6">
                            <p className={`text-3xl font-black tracking-tighter ${isWinner ? 'text-emerald-600' : 'text-gray-300 dark:text-gray-700'}`}>{div1Win ? 'JACKPOT!' : formatCurrency(totalPrize)}</p>
                            {bestMatchForDate >= 5 && !div1Win && <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mt-1 animate-pulse italic">So Close!</p>}
                          </div>
                        ) : (
                          <div className="text-right mr-6 text-gray-300 dark:text-gray-700 italic font-black text-xs uppercase animate-pulse tracking-widest">Checking...</div>
                        )}
                      </button>
                      <button onClick={() => handleDeleteDateGroup(date)} className="text-gray-300 dark:text-gray-700 hover:text-red-500 p-3 transition-colors transform hover:scale-125 duration-300">🗑️</button>
                    </div>

                    {isExpanded && (
                      <div className={`p-10 border-t dark:border-white/5 animate-in slide-in-from-top-4 duration-500 ${isWinner ? 'bg-emerald-50/20 dark:bg-emerald-500/5' : 'bg-gray-50/50 dark:bg-white/5'}`}>
                        {res && (
                          <div className="mb-12 bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 flex flex-col items-center shadow-inner relative overflow-hidden group">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-8 tracking-[0.4em] relative z-10">Winning Numbers</p>
                            <div className="flex flex-wrap gap-4 justify-center relative z-10">
                              {res.numbers.map((n, i) => (
                                <span key={n} className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black border-b-[6px] border-emerald-700 shadow-xl text-xl transform hover:-translate-y-1 transition-transform" style={{ transitionDelay: `${i * 50}ms` }}>{n}</span>
                              ))}
                              <div className="w-px h-14 bg-gray-200 dark:bg-white/10 mx-2" />
                              {res.bonus.map((n, i) => (
                                <span key={n} className="w-14 h-14 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black border-b-[6px] border-amber-600 shadow-xl text-xl transform hover:-translate-y-1 transition-transform" style={{ transitionDelay: `${(res.numbers.length + i) * 50}ms` }}>{n}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {tickets.map((t, tidx) => {
                            const c = res ? compareNumbers(t.numbers, res.numbers, res.bonus, game) : null;
                            const prize = (c && res) ? (res.prizes[c.prizeTier] || 0) : 0;
                            const ticketWon = prize > 0 || c?.prizeTier === 'Division 1';
                            const nearMiss = c && c.mainMatchesCount >= 5 && !ticketWon;

                            return (
                              <div key={t.id} className={`p-8 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-1 ${ticketWon ? 'bg-white dark:bg-gray-800 border-emerald-300 dark:border-emerald-500 shadow-2xl scale-[1.02] z-10' : 'bg-white/60 dark:bg-white/5 border-gray-100 dark:border-white/5 opacity-70 hover:opacity-100'}`}>
                                <div className="flex justify-between items-center mb-8">
                                  <span className="text-[11px] font-black text-gray-300 dark:text-gray-600 uppercase italic">Ticket #{tidx + 1}</span>
                                  {c && <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${ticketWon ? 'bg-emerald-500 text-white' : nearMiss ? 'bg-orange-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500'}`}>{nearMiss ? 'SO CLOSE' : c.prizeTier}</span>}
                                </div>
                                <div className="flex flex-wrap gap-2.5 mb-2">
                                  {t.numbers.slice(0, 7).map(n => {
                                    const match = res && res.numbers.includes(n);
                                    return <span key={n} className={`w-10 h-10 flex items-center justify-center rounded-full text-[12px] font-black border-b-2 transition-all duration-500 ${match ? 'bg-emerald-500 text-white border-emerald-700 shadow-lg scale-110' : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-white/5'}`}>{n}</span>;
                                  })}
                                  {game === 'Powerball' && t.numbers[7] && (
                                    <span className={`w-10 h-10 flex items-center justify-center rounded-full text-[12px] font-black border-b-2 transition-all duration-500 ${res && res.bonus.includes(t.numbers[7]) ? 'bg-amber-400 text-amber-950 border-amber-600 shadow-lg scale-110' : 'bg-amber-50 dark:bg-amber-500/5 text-amber-600/40 dark:text-amber-400/20 border-amber-100 dark:border-white/5'}`}>{t.numbers[7]}</span>
                                  )}
                                </div>
                                {ticketWon && <p className="mt-8 text-lg font-black text-emerald-600 dark:text-emerald-400 italic">+{formatCurrency(prize)} MISSING</p>}
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

      <DivisionRules game={game} isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
    </div>
  );
}
