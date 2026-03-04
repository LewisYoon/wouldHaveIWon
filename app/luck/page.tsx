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

const STORAGE_KEY = 'lottoLuckTickets';
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

  // Load tickets from Supabase or LocalStorage
  useEffect(() => {
    const loadTickets = async () => {
      setIsDataLoading(true);
      if (user) {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching tickets from Supabase:", error);
        } else if (data) {
          setMyTickets(data.map(t => ({
            id: t.id,
            drawDate: t.draw_date,
            numbers: t.numbers
          })));
        }
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setMyTickets(JSON.parse(stored));
      }
      setIsDataLoading(false);
    };

    if (!isAuthLoading) {
      loadTickets();
    }
  }, [user, isAuthLoading]);

  // Load draw results from Supabase
  useEffect(() => {
    const fetchResults = async () => {
      const { data, error } = await supabase
        .from('draw_results')
        .select('*')
        .order('draw_date', { ascending: false });

      if (error) {
        console.error("Error fetching draw results:", error);
      } else if (data) {
        setDrawResultsList(data.map(r => ({
          game: r.game,
          drawDate: r.draw_date,
          numbers: r.numbers,
          bonus: r.bonus,
          prizes: r.prizes
        })));
      }
    };

    fetchResults();
  }, []);

  const ticketsByDate = useMemo(() => {
    const groups: Record<string, Ticket[]> = {};
    myTickets.forEach(ticket => {
      if (!groups[ticket.drawDate]) groups[ticket.drawDate] = [];
      groups[ticket.drawDate].push(ticket);
    });
    return groups;
  }, [myTickets]);

  const saveTicketsToDB = async (newTickets: Partial<Ticket>[]) => {
    if (user) {
      const { data, error } = await supabase
        .from('tickets')
        .insert(newTickets.map(t => ({
          user_id: user.id,
          draw_date: t.drawDate,
          numbers: t.numbers
        })))
        .select();
      
      if (error) {
        console.error("Error saving to Supabase:", error);
        return [];
      }
      return data.map(t => ({ id: t.id, drawDate: t.draw_date, numbers: t.numbers }));
    }
    return newTickets.map(t => ({ ...t, id: t.id || Date.now().toString() + Math.random() })) as Ticket[];
  };

  const handleSaveTicket = async () => {
    if (currentNumbers.length !== 7) {
      alert("Please select exactly 7 numbers.");
      return;
    }
    const newTicket: Partial<Ticket> = {
      drawDate: selectedDate,
      numbers: [...currentNumbers].sort((a, b) => a - b),
    };
    
    const saved = await saveTicketsToDB([newTicket]);
    const updated = [...myTickets, ...saved];
    setMyTickets(updated);
    if (!user) localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setCurrentNumbers([]);
  };

  const handleMultiQuickPick = async () => {
    const newTickets: Partial<Ticket>[] = [];
    for (let i = 0; i < quickPickQty; i++) {
      newTickets.push({
        drawDate: selectedDate,
        numbers: generateQuickPick(),
      });
    }
    
    const saved = await saveTicketsToDB(newTickets);
    const updated = [...myTickets, ...saved];
    setMyTickets(updated);
    if (!user) localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleDeleteIndividualTicket = async (ticketId: string) => {
    if (user) {
      const { error } = await supabase.from('tickets').delete().eq('id', ticketId);
      if (error) {
        console.error("Error deleting from Supabase:", error);
        return;
      }
    }
    const updated = myTickets.filter(t => t.id !== ticketId);
    setMyTickets(updated);
    if (!user) localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleDeleteDateGroup = async (date: string) => {
    if (!window.confirm(`Are you sure you want to delete all tickets for ${date}?`)) return;
    
    if (user) {
      const { error } = await supabase.from('tickets').delete().eq('draw_date', date);
      if (error) {
        console.error("Error deleting group from Supabase:", error);
        return;
      }
    }
    
    const updated = myTickets.filter(t => t.drawDate !== date);
    setMyTickets(updated);
    if (!user) localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    const nextExpanded = new Set(expandedDates);
    nextExpanded.delete(date);
    setExpandedDates(nextExpanded);
  };

  const toggleExpand = (date: string) => {
    const next = new Set(expandedDates);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    setExpandedDates(next);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);

  if (isAuthLoading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 pb-24">
      <Navbar />

      <main className="flex w-full flex-1 flex-col items-center px-4 md:px-20 text-center pt-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Entry Section */}
          <div className="lg:col-span-5 space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Try Your Luck</h1>
            {!user && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-700 text-left mb-4">
                💡 <strong>Guest Mode:</strong> Your tickets are saved in this browser. <Link href="/login" className="underline font-bold">Sign in</Link> to save them permanently to your account.
              </div>
            )}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Select Draw Date</label>
              <select 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl mb-6 bg-white text-black font-medium"
              >
                {upcomingDates.map(date => (
                  <option key={date} value={date}>{date} (Tuesday)</option>
                ))}
              </select>

              <LottoLinePicker 
                lineId="luck-picker"
                displayIndex={1}
                selectedNumbers={currentNumbers}
                onNumbersChange={(_, numbers) => setCurrentNumbers(numbers)}
                onDeleteLine={() => setCurrentNumbers([])}
              />

              <div className="grid grid-cols-1 gap-3 mt-6">
                <button onClick={handleSaveTicket} className="py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">
                  Save Manual Set
                </button>
                
                <div className="flex gap-2">
                  <select 
                    value={quickPickQty}
                    onChange={(e) => setQuickPickQuantity(Number(e.target.value))}
                    className="p-3 border border-gray-300 rounded-xl bg-white text-black font-medium w-24"
                  >
                    {[10, 20, 30, 40, 50, 100].map(q => <option key={q} value={q}>x{q}</option>)}
                  </select>
                  <button onClick={handleMultiQuickPick} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition">
                    Quick Pick
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* My Tickets Section */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <h2 className="text-3xl font-bold text-gray-900">My Tickets</h2>
            <div className="space-y-4">
              {isDataLoading ? (
                <div className="text-center py-12 text-gray-400">Loading your tickets...</div>
              ) : Object.keys(ticketsByDate).length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center">
                  <p className="text-gray-500 italic mb-4">No tickets yet. Pick some numbers!</p>
                </div>
              ) : (
                Object.entries(ticketsByDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, tickets]) => {
                  const isExpanded = expandedDates.has(date);
                  const cost = tickets.length * TICKET_COST;
                  const resultForDate = drawResultsList.find(r => r.drawDate === date);
                  const resultsAnnounced = !!resultForDate;
                  
                                      let totalPrize = 0;
                                      let hasDiv1Win = false;
                                      if (resultsAnnounced && resultForDate) {
                                        tickets.forEach(t => {
                                          const comp = compareNumbers(t.numbers, resultForDate.numbers, resultForDate.bonus);
                                          const prize = resultForDate.prizes[comp.prizeTier] || 0;
                                          totalPrize += prize;
                                          if (comp.prizeTier === 'Division 1') hasDiv1Win = true;
                                        });
                                      }
                  
                                      const isWinner = resultsAnnounced && (totalPrize > 0 || hasDiv1Win);
                  
                                      return (
                                        <div key={date} className={`${isWinner ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'} rounded-2xl shadow-sm border overflow-hidden`}>
                                          <div className="flex items-center pr-4">
                                            <button 
                                              onClick={() => toggleExpand(date)}
                                              className={`flex-1 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${isWinner ? 'hover:bg-green-100' : 'hover:bg-gray-50'} transition text-left`}
                                            >
                                              <div>
                                                <p className={`text-sm font-bold ${isWinner ? 'text-green-700' : 'text-blue-600'} uppercase tracking-widest`}>Draw: {date}</p>
                                                <p className="text-lg font-bold text-gray-800">{tickets.length} Sets Purchased</p>
                                                <p className="text-xs text-gray-500">Est. Spent: {formatCurrency(cost)}</p>
                                              </div>
                                              <div className="flex items-center gap-4">
                                                {resultsAnnounced ? (
                                                  <div className="text-right">
                                                    <p className={`text-lg font-black ${isWinner ? 'text-green-600' : 'text-red-500'}`}>
                                                      {hasDiv1Win ? 'JACKPOT!' : (totalPrize > 0 ? `Won ${formatCurrency(totalPrize)}!` : 'No Win')}
                                                    </p>
                                                    <p className={`text-xs font-bold ${isWinner ? 'text-green-700' : 'text-gray-400'}`}>
                                                      {isWinner ? "You're a winner!" : "Try next time"}
                                                    </p>
                                                  </div>
                                                ) : (
                                                  <span className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full animate-pulse">Pending Results</span>
                                                )}
                                                <svg className={`w-6 h-6 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                              </div>
                                            </button>
                                            
                                            <button 
                                              onClick={() => handleDeleteDateGroup(date)}
                                              className="text-red-400 hover:text-red-600 transition-colors p-2"
                                              title="Delete All Tickets for this Date"
                                            >
                                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                              </svg>
                                            </button>
                                          </div>
                  
                                          {isExpanded && (
                                            <div className={`p-5 ${isWinner ? 'bg-green-100/50' : 'bg-gray-50'} border-t ${isWinner ? 'border-green-100' : 'border-gray-100'} space-y-6`}>
                                              {resultsAnnounced && resultForDate && (
                                                <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Winning Numbers</h3>
                                                  <div className="flex flex-wrap gap-2 items-center">
                                                    {resultForDate.numbers.map((n) => (
                                                      <div 
                                                        key={`win-${n}`} 
                                                        className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold shadow-sm text-sm border-2 border-green-600"
                                                      >
                                                        {n}
                                                      </div>
                                                    ))}
                                                    <div className="h-8 w-px bg-gray-200 mx-1" />
                                                    {resultForDate.bonus.map((n) => (
                                                      <div 
                                                        key={`bonus-${n}`} 
                                                        className="w-10 h-10 rounded-full bg-yellow-400 text-gray-800 flex items-center justify-center font-bold shadow-sm text-sm border-2 border-yellow-500"
                                                      >
                                                        {n}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                  
                                              <div>
                                                <h3 className={`text-xs font-bold ${isWinner ? 'text-green-700' : 'text-gray-400'} uppercase tracking-widest mb-3`}>Your Selections</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                  {tickets.map((t, idx) => {
                                                    const comp = resultsAnnounced && resultForDate ? compareNumbers(t.numbers, resultForDate.numbers, resultForDate.bonus) : null;
                                                    const prize = comp && resultForDate ? (resultForDate.prizes[comp.prizeTier] || 0) : 0;
                                                    const isDiv1 = comp?.prizeTier === 'Division 1';
                                                    const ticketIsWinner = prize > 0 || isDiv1;
                                                    
                                                    return (
                                                      <div key={t.id} className={`${ticketIsWinner ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'} p-3 rounded-xl border text-xs shadow-sm relative group`}>
                                                        <div className="flex justify-between items-center mb-1">
                                                          <span className={`font-bold ${ticketIsWinner ? 'text-green-700' : 'text-gray-400'}`}>#{idx + 1}</span>
                                                          <div className="flex items-center gap-2">
                                                            {comp && (
                                                              <span className={`font-bold ${ticketIsWinner ? 'text-green-600' : 'text-gray-400'}`}>
                                                                {isDiv1 && prize === 0 ? 'JACKPOT!' : formatCurrency(prize)}
                                                              </span>
                                                            )}
                                                            <button 
                                                              onClick={() => handleDeleteIndividualTicket(t.id)}
                                                              className="text-red-400 hover:text-red-600 transition-colors p-1"
                                                              title="Delete selection"
                                                            >
                                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                              </svg>
                                                            </button>
                                                          </div>
                                                        </div>
                  
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {t.numbers.map(n => {
                                        const isMainMatch = resultsAnnounced && resultForDate && resultForDate.numbers.includes(n);
                                        const isBonusMatch = resultsAnnounced && resultForDate && resultForDate.bonus.includes(n);
                                        
                                        return (
                                          <span 
                                            key={n} 
                                            className={`w-6 h-6 flex items-center justify-center rounded-full border ${
                                              isMainMatch ? 'bg-green-500 border-green-600 text-white font-bold' : 
                                              isBonusMatch ? 'bg-yellow-400 border-yellow-500 text-gray-800 font-bold' : 
                                              'border-gray-200 text-gray-700'
                                            }`}
                                          >
                                            {n}
                                          </span>
                                        );
                                      })}
                                    </div>
                                    {comp && <p className={`mt-2 text-[10px] ${ticketIsWinner ? 'text-green-600' : 'text-indigo-500'} font-bold uppercase`}>{comp.mainMatchesCount} Matches - {comp.prizeTier}</p>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
