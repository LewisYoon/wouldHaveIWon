'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  const [upcomingDates] = useState(() => getNextDrawDates());
  const [selectedDate, setSelectedDate] = useState(upcomingDates[0]);
  const [currentNumbers, setCurrentNumbers] = useState<number[]>([]);
  const [quickPickQty, setQuickPickQuantity] = useState(10);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [drawResultsList, setDrawResultsList] = useState<DrawResult[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const loadTickets = async () => {
      setIsDataLoading(true);
      if (user) {
        const { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
        if (data) setMyTickets(data.map(t => ({ id: t.id, drawDate: t.draw_date, numbers: t.numbers })));
      } else {
        const stored = localStorage.getItem('lottoLuckTickets');
        if (stored) setMyTickets(JSON.parse(stored));
      }
      setIsDataLoading(false);
    };
    if (!isAuthLoading) loadTickets();
  }, [user, isAuthLoading]);

  useEffect(() => {
    const fetchResults = async () => {
      const { data } = await supabase.from('draw_results').select('*').order('draw_date', { ascending: false });
      if (data) setDrawResultsList(data.map(r => ({ game: r.game, drawDate: r.draw_date, numbers: r.numbers, bonus: r.bonus, prizes: r.prizes })));
    };
    fetchResults();
  }, []);

  const ticketsByDate = useMemo(() => {
    const groups: Record<string, Ticket[]> = {};
    myTickets.forEach(t => {
      if (!groups[t.drawDate]) groups[t.drawDate] = [];
      groups[t.drawDate].push(t);
    });
    return groups;
  }, [myTickets]);

  const handleSaveTicket = async () => {
    if (currentNumbers.length !== 7) { alert("Select 7 numbers"); return; }
    const newTicket = { draw_date: selectedDate, numbers: [...currentNumbers].sort((a,b)=>a-b) };
    if (user) {
      const { data } = await supabase.from('tickets').insert({ ...newTicket, user_id: user.id }).select();
      if (data) setMyTickets([{ id: data[0].id, drawDate: data[0].draw_date, numbers: data[0].numbers }, ...myTickets]);
    } else {
      const updated = [{ id: Date.now().toString(), drawDate: selectedDate, numbers: newTicket.numbers }, ...myTickets];
      setMyTickets(updated);
      localStorage.setItem('lottoLuckTickets', JSON.stringify(updated));
    }
    setCurrentNumbers([]);
  };

  const handleMultiQuickPick = async () => {
    const newSets = Array.from({ length: quickPickQty }, () => generateQuickPick());
    if (user) {
      const { data } = await supabase.from('tickets').insert(newSets.map(n => ({ user_id: user.id, draw_date: selectedDate, numbers: n }))).select();
      if (data) setMyTickets([...data.map(t => ({ id: t.id, drawDate: t.draw_date, numbers: t.numbers })), ...myTickets]);
    } else {
      const updated = [...newSets.map((n, i) => ({ id: `${Date.now()}-${i}`, drawDate: selectedDate, numbers: n })), ...myTickets];
      setMyTickets(updated);
      localStorage.setItem('lottoLuckTickets', JSON.stringify(updated));
    }
  };

  const toggleExpand = (date: string) => {
    const next = new Set(expandedDates);
    if (next.has(date)) next.delete(date); else next.add(date);
    setExpandedDates(next);
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
            <p className="text-gray-500 font-medium">Pick your numbers for the next official Oz Lotto draw.</p>
          </div>
          {!user && (
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-4 max-w-md">
              <span className="text-2xl">☁️</span>
              <p className="text-xs text-indigo-700 font-bold leading-relaxed">
                You are playing as a guest. <Link href="/login" className="underline decoration-indigo-300 hover:text-indigo-900">Sign in</Link> to save your tickets permanently to the cloud.
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 px-6">
        {/* Input Section */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">1. Choose Draw Date</label>
            <div className="relative mb-8">
              <select 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full appearance-none bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-black text-gray-800 focus:border-indigo-500 outline-none transition-all cursor-pointer"
              >
                {upcomingDates.map(date => <option key={date} value={date}>{date} (Tuesday)</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600 font-bold">↓</div>
            </div>

            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">2. Select Your Numbers</label>
            <LottoLinePicker 
              lineId="luck-picker"
              displayIndex={1}
              selectedNumbers={currentNumbers}
              onNumbersChange={(_, numbers) => setCurrentNumbers(numbers)}
              onDeleteLine={() => setCurrentNumbers([])}
            />

            <div className="grid grid-cols-1 gap-4 mt-8">
              <button onClick={handleSaveTicket} className="py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all uppercase tracking-wider text-sm active:scale-95">
                Save Selected Set
              </button>
              
              <div className="flex gap-3">
                <select 
                  value={quickPickQty}
                  onChange={(e) => setQuickPickQuantity(Number(e.target.value))}
                  className="bg-gray-100 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 font-black text-gray-700 outline-none transition-all w-24 text-center cursor-pointer"
                >
                  {[10, 25, 50, 100].map(q => <option key={q} value={q}>x{q}</option>)}
                </select>
                <button onClick={handleMultiQuickPick} className="flex-1 py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all uppercase tracking-wider text-sm active:scale-95">
                  Quick Pick Burst
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Your Ticket History</h2>
            <span className="text-[10px] font-black text-gray-400 bg-gray-200 px-3 py-1 rounded-full uppercase">{myTickets.length} Total Sets</span>
          </div>

          <div className="space-y-4">
            {Object.keys(ticketsByDate).length === 0 ? (
              <div className="bg-white p-20 rounded-[3rem] border border-dashed border-gray-200 text-center flex flex-col items-center">
                <span className="text-5xl mb-6 grayscale opacity-50">🎫</span>
                <p className="text-gray-400 font-bold italic">No tickets found. Time to pick some winners!</p>
              </div>
            ) : (
              Object.entries(ticketsByDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, tickets]) => {
                const isExpanded = expandedDates.has(date);
                const res = drawResultsList.find(r => r.drawDate === date);
                
                let totalPrize = 0;
                let div1Win = false;
                if (res) {
                  tickets.forEach(t => {
                    const c = compareNumbers(t.numbers, res.numbers, res.bonus);
                    totalPrize += res.prizes[c.prizeTier] || 0;
                    if (c.prizeTier === 'Division 1') div1Win = true;
                  });
                }

                const isWinner = res && (totalPrize > 0 || div1Win);

                return (
                  <div key={date} className={`group bg-white rounded-[2rem] border transition-all duration-300 ${isWinner ? 'border-emerald-200 shadow-xl shadow-emerald-50' : 'border-gray-100 hover:shadow-lg hover:border-gray-200'}`}>
                    <button 
                      onClick={() => toggleExpand(date)}
                      className="w-full p-6 flex items-center justify-between gap-6 text-left"
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-colors ${isWinner ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <span className="text-[10px] font-black uppercase leading-none">Sets</span>
                          <span className="text-lg font-black">{tickets.length}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Draw: {date}</p>
                          <p className="text-lg font-black text-gray-900">{res ? 'Result Published' : 'Results Pending'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {res && (
                          <div className="text-right hidden sm:block">
                            <p className={`text-xl font-black ${isWinner ? 'text-emerald-600' : 'text-gray-300'}`}>
                              {div1Win ? 'JACKPOT!' : (totalPrize > 0 ? formatCurrency(totalPrize) : 'No Win')}
                            </p>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{isWinner ? 'Winner' : 'Simulation Complete'}</p>
                          </div>
                        )}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-transform duration-300 ${isExpanded ? 'rotate-180 border-indigo-500 text-indigo-600' : 'border-gray-100 text-gray-300 group-hover:border-gray-300'}`}>
                          ↓
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className={`p-8 border-t transition-all animate-in slide-in-from-top-2 duration-300 ${isWinner ? 'bg-emerald-50/30 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                        {res && (
                          <div className="mb-10 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Official Winning Numbers</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {res.numbers.map(n => <span key={n} className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md border-b-4 border-emerald-700">{n}</span>)}
                              <div className="w-px h-10 bg-gray-200 mx-2" />
                              {res.bonus.map(n => <span key={n} className="w-10 h-10 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-md border-b-4 border-amber-600">{n}</span>)}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {tickets.map((t, idx) => {
                            const c = res ? compareNumbers(t.numbers, res.numbers, res.bonus) : null;
                            const prize = c ? (res.prizes[c.prizeTier] || 0) : 0;
                            const ticketWon = prize > 0 || c?.prizeTier === 'Division 1';
                            
                            return (
                              <div key={t.id} className={`p-4 rounded-2xl border transition-all ${ticketWon ? 'bg-white border-emerald-300 shadow-md ring-4 ring-emerald-500/5' : 'bg-white/50 border-gray-100 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}>
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-[10px] font-black text-gray-400 uppercase">Set #{idx + 1}</span>
                                  {c && <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${ticketWon ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{c.prizeTier}</span>}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {t.numbers.map(n => {
                                    const match = res && res.numbers.includes(n);
                                    const supp = res && res.bonus.includes(n);
                                    return (
                                      <span key={n} className={`w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-black transition-colors ${match ? 'bg-emerald-500 text-white' : supp ? 'bg-amber-400 text-amber-950' : 'bg-gray-100 text-gray-400'}`}>
                                        {n}
                                      </span>
                                    );
                                  })}
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
