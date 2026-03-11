'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import LottoLinePicker from '../../components/LottoLinePicker';
import DivisionRules from '../../components/DivisionRules';
import Countdown from '../../components/Countdown';
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
  drawNumber?: number;
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
  const [upcomingLedger, setUpcomingLedger] = useState<any[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [selectedJackpot, setSelectedJackpot] = useState<number | null>(null);

  // Branding Helpers
  const isOz = game === 'Oz Lotto';
  const isTatts = game === 'Tatts Lotto';
  const brandColor = isOz ? 'emerald' : isTatts ? 'red' : 'indigo';
  const brandHex = isOz ? '#10b981' : isTatts ? '#ef4444' : '#4f46e5';
  
  const brandStyles = {
    text: isOz ? 'text-emerald-600 dark:text-emerald-400' : isTatts ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400',
    bg: isOz ? 'bg-emerald-600' : isTatts ? 'bg-red-600' : 'bg-indigo-600',
    bgLight: isOz ? 'bg-emerald-50 dark:bg-emerald-950/30' : isTatts ? 'bg-red-50 dark:bg-red-950/30' : 'bg-indigo-50 dark:bg-indigo-950/30',
    border: isOz ? 'border-emerald-100 dark:border-emerald-500/20' : isTatts ? 'border-red-100 dark:border-red-500/20' : 'border-indigo-100 dark:border-indigo-500/20',
    shadow: isOz ? 'shadow-emerald-500/20' : isTatts ? 'shadow-red-500/20' : 'shadow-indigo-500/20',
    focus: isOz ? 'focus:border-emerald-500' : isTatts ? 'focus:border-red-500' : 'focus:border-indigo-500'
  };

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
        
        let prize = res.prizes[c.prizeTier] || 0;
        if (c.prizeTier === 'Division 1' && prize === 0) {
          const ledgerMatch = upcomingLedger.find(l => l.game?.toLowerCase().includes(t.game.toLowerCase().split(' ')[0]) && l.draw_date === t.drawDate);
          if (ledgerMatch) prize = ledgerMatch.jackpot;
        }

        totalMissedPrize += prize;
        if (c.prizeTier !== 'No Prize') {
          totalWins++;
          if (bestDivision === 'No Prize' || parseInt(c.prizeTier.replace('Division ', '')) < (bestDivision === 'No Prize' ? 99 : parseInt(bestDivision.replace('Division ', '')))) {
            bestDivision = c.prizeTier;
          }
        }
      }
    });

    const totalInvested = myTickets.length * TICKET_COST;
    return { totalMissedPrize, totalTicketsChecked, totalWins, bestDivision, totalInvested };
  }, [myTickets, drawResultsList, upcomingLedger]);

  useEffect(() => {
    setSelectedDate(upcomingDates[0]);
    setCurrentNumbers([]);
  }, [game, upcomingDates]);

  useEffect(() => {
    const loadLedger = async () => {
      const { data } = await supabase.from('upcoming_draws').select('*');
      if (data) setUpcomingLedger(data);
    };
    loadLedger();
  }, []);

  useEffect(() => {
    const fetchJackpot = async () => {
      setSelectedJackpot(null);
      const gameSearchTerm = game.toLowerCase().split(' ')[0];
      const ledgerMatch = upcomingLedger.find(l => l.game?.toLowerCase().includes(gameSearchTerm) && l.draw_date === selectedDate);
      if (ledgerMatch) {
        setSelectedJackpot(ledgerMatch.jackpot);
        return;
      }
      const { data: upcoming } = await supabase.from('upcoming_draws').select('jackpot').ilike('game', `%${gameSearchTerm}%`).eq('draw_date', selectedDate).limit(1);
      if (upcoming && upcoming.length > 0) {
        setSelectedJackpot(upcoming[0].jackpot);
        return;
      }
      const { data: past } = await supabase.from('draw_results').select('prizes').ilike('game', `%${gameSearchTerm}%`).eq('draw_date', selectedDate).maybeSingle();
      if (past && past.prizes) {
        const div1 = past.prizes['Division 1'];
        setSelectedJackpot(div1 !== undefined ? div1 : null);
      }
    };
    fetchJackpot();
  }, [game, selectedDate, upcomingLedger]);

  const saveTicketsState = (updated: Ticket[]) => {
    setMyTickets(updated);
    if (!user) localStorage.setItem(`luckTickets_${game.replace(/\s/g, '')}`, JSON.stringify(updated));
  };

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
      if (data) setDrawResultsList(data.map(r => ({ 
        game: r.game, 
        drawDate: r.draw_date, 
        drawNumber: r.draw_number,
        numbers: r.numbers, 
        bonus: r.bonus, 
        prizes: r.prizes 
      })));
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

  const handleSaveTicket = async () => {
    const required = game === 'Oz Lotto' ? 7 : game === 'Powerball' ? 8 : 6;
    if (currentNumbers.filter(n => n > 0).length !== required) { alert(`Select ${required} numbers`); return; }
    if (user) {
      const { data } = await supabase.from('tickets').insert({ draw_date: selectedDate, numbers: currentNumbers, user_id: user.id, game }).select();
      if (data) saveTicketsState([{ id: data[0].id, drawDate: data[0].draw_date, numbers: data[0].numbers, game: data[0].game }, ...myTickets]);
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
      if (data) saveTicketsState([...data.map(t => ({ id: t.id, drawDate: t.draw_date, numbers: t.numbers, game: t.game })), ...myTickets]);
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

  const handleDeleteSingleTicket = async (id: string) => {
    if (user) {
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) { console.error("Deletion failed:", error.message); return; }
    }
    const updated = myTickets.filter(t => t.id !== id);
    saveTicketsState(updated);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);
  const formatJackpot = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(0)} Million`;
    if (val === 0) return "Jackpot Pending";
    return formatCurrency(val);
  };

  const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
  );

  if (isAuthLoading) return <div className={`min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 font-black ${brandStyles.text} animate-pulse uppercase tracking-widest`}>Loading...</div>;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950 pb-24 transition-colors duration-500 text-gray-900 dark:text-gray-100 overflow-x-hidden">
      <Navbar />

      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/5 py-10 sm:py-16 px-4 sm:px-6 mb-8 sm:mb-16 shadow-sm transition-all duration-500 relative overflow-hidden text-left">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] bg-[radial-gradient(#4f46e5_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 animate-in fade-in slide-in-from-left-8 duration-700">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-6 sm:mb-8">
            Track My <span className={`text-transparent bg-clip-text bg-gradient-to-r from-${brandColor}-600 to-purple-600 dark:from-${brandColor}-400 dark:to-purple-400 italic`}>Luck</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {['Oz Lotto', 'Powerball', 'Tatts Lotto'].map((g) => (
              <button 
                key={g} 
                onClick={() => setGame(g as any)} 
                className={`flex-1 sm:flex-none px-4 sm:px-10 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-sm font-black uppercase tracking-widest transition-all duration-300 transform active:scale-95 ${
                  game === g 
                    ? (g === 'Oz Lotto' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20' : g === 'Tatts Lotto' ? 'bg-red-600 text-white shadow-xl shadow-red-500/20' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20') 
                    : 'bg-white dark:bg-white/5 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5'
                }`}
              >
                {g}
              </button>
            ))}
            <button onClick={() => setIsRulesModalOpen(true)} className="ml-auto bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black text-base sm:text-lg shadow-sm border border-gray-200 dark:border-white/10">?</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-16 px-4 sm:px-6 relative z-10">
        <div className="lg:col-span-5 space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left">
          <div className={`rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border transition-all duration-700 shadow-2xl hover:scale-[1.02] group relative overflow-hidden ${brandStyles.bgLight} ${brandStyles.border}`}>
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 ${game === 'Oz Lotto' ? 'bg-emerald-500/5' : game === 'Tatts Lotto' ? 'bg-red-500/5' : 'bg-indigo-500/5'}`} />
            <p className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] mb-6 sm:mb-8 ${brandStyles.text}`}>Luck Dashboard</p>
            <div className="space-y-8 sm:space-y-10 relative z-10">
              <div className="grid grid-cols-2 gap-4 sm:gap-8">
                <div><p className="text-[8px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1 sm:mb-2">Total Missed</p><p className={`text-2xl sm:text-4xl font-black tracking-tighter ${brandStyles.text}`}>{formatCurrency(stats.totalMissedPrize)}</p></div>
                <div><p className="text-[8px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1 sm:mb-2">Money "Saved"</p><p className="text-2xl sm:text-4xl font-black tracking-tighter text-gray-700 dark:text-gray-200">{formatCurrency(stats.totalInvested)}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:gap-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-white/5">
                <div><p className="text-[8px] sm:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Tickets Checked</p><p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{stats.totalTicketsChecked}</p></div>
                <div><p className="text-[8px] sm:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Best Win</p><p className={`text-xl sm:text-2xl font-black ${brandStyles.text}`}>{stats.bestDivision}</p></div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-xl transition-all duration-500">
            <div className="flex justify-between items-end mb-4 sm:mb-6 ml-2">
              <label className="block text-[9px] sm:text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">1. Pick Draw Date</label>
              {selectedJackpot !== null && (<div className="text-right animate-in fade-in slide-in-from-right-4"><p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1">Div 1 Prize</p><p className={`text-base sm:text-lg font-black ${brandStyles.text} tracking-tighter leading-none`}>{formatJackpot(selectedJackpot)}</p></div>)}
            </div>
            <div className="relative group mb-8 sm:mb-10">
              <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={`w-full appearance-none bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 font-black text-sm sm:text-base text-gray-800 dark:text-white outline-none transition-all cursor-pointer ${brandStyles.focus}`}>
                {upcomingDates.map(date => <option key={date} value={date}>{date} ({game === 'Oz Lotto' ? 'Tue' : game === 'Powerball' ? 'Thu' : 'Sat'})</option>)}
              </select>
            </div>
            <label className="block text-[9px] sm:text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 sm:mb-6 ml-2">2. Choose Your Numbers</label>
            <LottoLinePicker lineId="luck-picker" displayIndex={1} selectedNumbers={currentNumbers} onNumbersChange={(_, numbers) => setCurrentNumbers(numbers)} onDeleteLine={() => setCurrentNumbers([])} game={game} />
            <div className="grid grid-cols-1 gap-4 sm:gap-5 mt-8 sm:mt-12">
              <button onClick={handleSaveTicket} className={`py-4 sm:py-6 text-white font-black rounded-2xl sm:rounded-3xl transition-all uppercase tracking-[0.2em] text-xs sm:text-sm active:scale-95 shadow-xl hover:brightness-110 ${brandStyles.bg} ${brandStyles.shadow}`}>Save This Ticket</button>
              <div className="flex gap-3 sm:gap-4">
                <select value={quickPickQty} onChange={(e) => setQuickPickQuantity(Number(e.target.value))} className="bg-gray-100 dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 font-black text-[10px] sm:text-xs outline-none text-gray-700 dark:text-gray-300 w-20 sm:w-24 border-none cursor-pointer">{[10, 25, 50, 100].map(q => <option key={q} value={q}>x{q}</option>)}</select>
                <button onClick={handleMultiQuickPick} className="flex-1 py-4 sm:py-6 bg-emerald-500 text-white font-black rounded-2xl sm:rounded-3xl transition-all uppercase tracking-[0.2em] text-[10px] sm:text-sm shadow-xl shadow-emerald-500/20 hover:brightness-110 active:scale-95">Quick Pick Burst</button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-right-8 duration-1000 text-left">
          <div className="flex items-center justify-between px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">My History</h2>
            <span className="text-[9px] sm:text-[11px] font-black text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-white/5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full uppercase tracking-widest">{myTickets.length} Tickets</span>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {isDataLoading ? (
              <div className="py-20 sm:py-40 flex flex-col items-center gap-6 animate-pulse"><div className={`w-12 h-12 sm:w-16 sm:h-16 border-4 ${brandStyles.text.replace('text-', 'border-')} border-t-transparent rounded-full animate-spin`} /><p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px] sm:text-xs italic">Loading history...</p></div>
            ) : Object.keys(ticketsByDate).length === 0 ? (
              <div className="bg-white dark:bg-gray-900 p-20 sm:p-32 rounded-[2.5rem] sm:rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-white/5 text-center transition-all duration-700 group hover:border-indigo-500/30"><p className="text-sm sm:text-base text-gray-400 dark:text-gray-500 font-bold italic mb-6 sm:mb-8">No tickets saved in your history.</p><button onClick={handleMultiQuickPick} className={`text-[10px] sm:text-[11px] font-black ${brandStyles.text} uppercase tracking-[0.3em] border-b-2 border-current hover:opacity-80 transition-all pb-1`}>Create my first tickets</button></div>
            ) : (
              Object.entries(ticketsByDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, tickets], idx) => {
                const isExpanded = expandedDates.has(date);
                const res = drawResultsList.find(r => r.drawDate === date);
                let totalPrize = 0;
                let div1Win = false;
                let bestMatchForDate = 'No Prize';
                if (res) {
                  tickets.forEach(t => {
                    const c = compareNumbers(t.numbers, res.numbers, res.bonus, game);
                    let prize = res.prizes[c.prizeTier] || 0;
                    if (c.prizeTier === 'Division 1' && prize === 0) {
                      const ledgerMatch = upcomingLedger.find(l => l.game?.toLowerCase().includes(game.toLowerCase().split(' ')[0]) && l.draw_date === date);
                      if (ledgerMatch) prize = ledgerMatch.jackpot;
                    }
                    totalPrize += prize;
                    if (c.prizeTier === 'Division 1') div1Win = true;
                    const currentDivisionRank = c.prizeTier === 'No Prize' ? 99 : parseInt(c.prizeTier.replace('Division ', ''));
                    const bestDivisionRank = bestMatchForDate === 'No Prize' ? 99 : parseInt(bestMatchForDate.replace('Division ', ''));
                    if (currentDivisionRank < bestDivisionRank) {
                        bestMatchForDate = c.prizeTier;
                    }
                  });
                }
                const isWinner = res && (totalPrize > 0 || div1Win);

                return (
                  <div key={date} className={`bg-white dark:bg-gray-900 rounded-[2rem] sm:rounded-[3rem] border transition-all duration-500 ${isWinner ? `border-${brandColor}-200 dark:border-${brandColor}-500 shadow-2xl` : 'border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl'} animate-in fade-in slide-in-from-bottom-4`} style={{ transitionDelay: `${idx * 100}ms` }}>
                    <div className="flex items-center pr-4 sm:pr-6">
                      <button onClick={() => { const next = new Set(expandedDates); if (next.has(date)) next.delete(date); else next.add(date); setExpandedDates(next); }} className="flex-1 p-6 sm:p-10 flex items-center justify-between text-left group gap-4 sm:gap-10">
                        <div className="flex items-center gap-4 sm:gap-10">
                          <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-lg sm:text-xl transition-all duration-500 group-hover:rotate-12 ${isWinner ? brandStyles.bg + ' text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500'}`}>{tickets.length}</div>
                          <div className="truncate">
                            <p className={`text-[9px] sm:text-[11px] font-black ${brandStyles.text} uppercase mb-1 sm:mb-2`}>Draw: {date}</p>
                            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight truncate">{res ? (isWinner ? 'WINNER!' : (totalPrize === 0 ? 'NO LUCK' : 'RESULTS')) : 'AWAITING'}</p>
                          </div>
                        </div>
                        {res ? (
                          <div className="text-right flex-shrink-0">
                            <p className={`text-xl sm:text-3xl font-black tracking-tighter ${isWinner ? brandStyles.text : 'text-gray-300 dark:text-gray-700'}`}>
                              {formatJackpot(totalPrize)}
                            </p>
                            {bestMatchForDate !== 'No Prize' && !div1Win && <p className="text-[8px] sm:text-[9px] font-black text-orange-500 uppercase tracking-widest mt-0.5 sm:mt-1 animate-pulse italic">So Close!</p>}
                          </div>
                        ) : (
                          <div className="text-right flex-shrink-0">
                            <Countdown targetDate={date} />
                          </div>
                        )}
                      </button>
                      <button onClick={() => handleDeleteDateGroup(date)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 p-2 sm:p-3 transition-colors transform hover:scale-125 duration-300">
                        <TrashIcon />
                      </button>
                    </div>
                    {isExpanded && (
                      <div className={`p-6 sm:p-10 border-t dark:border-white/5 animate-in slide-in-from-top-4 duration-500 ${isWinner ? `${brandStyles.bgLight} dark:bg-${brandColor}-500/5` : 'bg-gray-50/50 dark:bg-white/5'}`}>
                        {res && (
                          <div className="mb-8 sm:mb-12 bg-white dark:bg-gray-800 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-gray-100 dark:border-white/5 flex flex-col items-center shadow-inner relative overflow-hidden group">
                            <p className="text-[8px] sm:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-6 sm:mb-8 tracking-[0.4em] relative z-10">Winning Numbers</p>
                            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center relative z-10">
                              {res.numbers.map((n, i) => (<span key={n} className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full ${brandStyles.bg} text-white flex items-center justify-center font-black border-b-[4px] sm:border-b-[6px] border-black/20 shadow-xl text-base sm:text-xl transform hover:-translate-y-1 transition-transform`} style={{ transitionDelay: `${i * 50}ms` }}>{n}</span>))}
                              <div className="w-px h-10 sm:h-14 bg-gray-200 dark:bg-white/10 mx-1 sm:mx-2" />
                              {res.bonus.map((n, i) => (<span key={n} className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black border-b-[4px] sm:border-b-[6px] border-amber-600 shadow-xl text-base sm:text-xl transform hover:-translate-y-1 transition-transform" style={{ transitionDelay: `${(res.numbers.length + i) * 50}ms` }}>{n}</span>))}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          {tickets.map((t, tidx) => {
                            const c = res ? compareNumbers(t.numbers, res.numbers, res.bonus, game) : null;
                            let prize = (c && res) ? (res.prizes[c.prizeTier] || 0) : 0;
                            if (c?.prizeTier === 'Division 1' && prize === 0) {
                              const ledgerMatch = upcomingLedger.find(l => l.game?.toLowerCase().includes(game.toLowerCase().split(' ')[0]) && l.draw_date === date);
                              if (ledgerMatch) prize = ledgerMatch.jackpot;
                            }
                            const ticketWon = prize > 0 || c?.prizeTier === 'Division 1';
                            const nearMiss = c && c.mainMatchesCount >= 5 && !ticketWon;
                            return (
                              <div key={t.id} className={`p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-1 ${ticketWon ? `bg-white dark:bg-gray-800 border-${brandColor}-300 dark:border-${brandColor}-500 shadow-2xl scale-[1.02] z-10` : 'bg-white/60 dark:bg-white/5 border-gray-100 dark:border-white/5 opacity-70 hover:opacity-100'}`}>
                                <div className="flex justify-between items-center mb-6 sm:mb-8">
                                  <span className="text-[9px] sm:text-[11px] font-black text-gray-300 dark:text-gray-600 uppercase italic">Ticket #{tidx + 1}</span>
                                  <div className="flex items-center gap-2">
                                    {c && <span className={`text-[8px] sm:text-[10px] font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full uppercase tracking-widest ${ticketWon ? brandStyles.bg + ' text-white' : nearMiss ? 'bg-orange-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500'}`}>{nearMiss ? 'SO CLOSE' : c.prizeTier}</span>}
                                    <button onClick={() => handleDeleteSingleTicket(t.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors p-1 transform hover:scale-110">
                                      <TrashIcon />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {t.numbers.slice(0, 7).map(n => { 
                                    const isMainMatch = res && res.numbers.includes(n);
                                    const isBonusMatch = res && res.bonus.includes(n);
                                    const isSuppMatch = (isOz || isTatts) && isBonusMatch && !isMainMatch;

                                    return <span key={n} className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-[10px] sm:text-[12px] font-black border-b-2 transition-all duration-500 ${isMainMatch ? brandStyles.bg + ' text-white border-black/20 shadow-lg scale-110' : isSuppMatch ? 'bg-amber-400 text-amber-950 border-amber-600 shadow-lg scale-110' : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-white/5'}`}>{n}</span>; 
                                  })}
                                  {game === 'Powerball' && t.numbers[7] && (
                                    <span className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-[10px] sm:text-[12px] font-black border-b-2 transition-all duration-500 ${res && res.bonus.includes(t.numbers[7]) ? 'bg-amber-400 text-amber-950 border-amber-600 shadow-lg scale-110' : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-white/5'}`}>{t.numbers[7]}</span>
                                  )}
                                </div>
                                {ticketWon && <p className={`mt-6 sm:mt-8 text-base sm:text-lg font-black ${brandStyles.text} italic`}>+{formatCurrency(prize)} MISSING</p>}
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

      {/* Static Educational Content for AdSense/SEO */}
      <section className="max-w-4xl mx-auto px-6 py-32 text-left border-t border-gray-100 dark:border-white/5 mt-20">
        <h2 className="text-4xl font-black mb-12 uppercase tracking-tighter italic">Guide to Lottery Tracking</h2>
        <div className="prose prose-indigo dark:prose-invert max-w-none space-y-10 text-lg text-gray-600 dark:text-gray-400 font-medium leading-relaxed text-left">
          <p>
            The WhatIFLotto Luck Tracker is designed as a psychological and mathematical tool to help Australians understand the reality of lottery participation. By tracking your "lucky numbers" against real official results from Oz Lotto, Powerball, and Tatts Lotto, you can experience the highs and lows of the game without any financial risk.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 not-prose">
            <div className="space-y-4">
              <h3 className="text-xl font-black uppercase text-gray-900 dark:text-white">1. Psychological Distance</h3>
              <p className="text-sm">Seeing a "Division 1 Miss" in a simulation creates a healthy psychological distance between the desire to win and the financial impulse to play. It allows you to visualize the outcome objectively.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-black uppercase text-gray-900 dark:text-white">2. Data-Driven Awareness</h3>
              <p className="text-sm">Our platform uses verified data to show you exactly how much you would have spent over time. For many, seeing the "Money Saved" statistic is more rewarding than the occasional virtual win.</p>
            </div>
          </div>

          <p>
            Our automated systems sync with official Australian lottery providers every Tuesday, Thursday, and Saturday. We ensure that every division check—from a simple Division 9 Powerball win to a multi-million dollar Oz Lotto jackpot—is calculated with 100% mathematical accuracy.
          </p>

          <blockquote className="border-l-4 border-indigo-500 pl-6 italic font-bold text-gray-900 dark:text-white bg-indigo-50 dark:bg-indigo-500/5 p-8 rounded-r-3xl">
            "The best way to understand the odds is to witness them in action. Our tracker provides a front-row seat to the mathematics of probability."
          </blockquote>
        </div>
      </section>

      <DivisionRules game={game} isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
    </div>
  );
}
