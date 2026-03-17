'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import LottoLinePicker from '../../components/LottoLinePicker';
import DivisionRules from '../../components/DivisionRules';
import Countdown from '../../components/Countdown';
import SettingsModal from '../../components/SettingsModal';
import { getNextDrawDates, compareNumbers, generateQuickPick } from '../../lib/lotto-utils';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

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
const FREE_TICKET_LIMIT = 25;

function LuckContent() {
  const { user, isPremium, isLoading: isAuthLoading, subscriptionInfo, refreshPremiumStatus } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const initialGame = (searchParams.get('game') as any) || 'Oz Lotto';
  const [game, setGame] = useState<'Oz Lotto' | 'Powerball' | 'Tatts Lotto'>(initialGame);

  const handleGameChange = (newGame: 'Oz Lotto' | 'Powerball' | 'Tatts Lotto') => {
    setGame(newGame);
    const params = new URLSearchParams(searchParams.toString());
    params.set('game', newGame);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

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

  const [autoTrackGames, setAutoTrackGames] = useState<{ [key: string]: number }>({});
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);

  useEffect(() => {
    const fetchPrefs = async () => {
      if (!user) return;
      if (subscriptionInfo?.autoTrackGames) setAutoTrackGames(subscriptionInfo.autoTrackGames);
      const { data } = await supabase.from('user_preferences').select('auto_track_games').eq('user_id', user.id).maybeSingle();
      if (data?.auto_track_games) setAutoTrackGames(data.auto_track_games);
    };
    if (!isAuthLoading) fetchPrefs();
  }, [user, isAuthLoading, subscriptionInfo]);

  const handleUpdateAutoTrack = async (gameName: string, qty: number) => {
    if (!user || !isPremium) return;
    const newGames = { ...autoTrackGames, [gameName]: qty };
    setAutoTrackGames(newGames);
    setIsUpdatingPrefs(true);
    const { error } = await supabase.from('user_preferences').upsert({ user_id: user.id, auto_track_games: newGames }, { onConflict: 'user_id' });
    if (!error) refreshPremiumStatus();
    setIsUpdatingPrefs(false);
  };
  
  const isOz = game === 'Oz Lotto';
  const isTatts = game === 'Tatts Lotto';
  const brandColor = isOz ? 'emerald' : isTatts ? 'red' : 'indigo';
  
  const brandStyles = {
    text: isOz ? 'text-emerald-600 dark:text-emerald-400' : isTatts ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400',
    bg: isOz ? 'bg-emerald-600' : isTatts ? 'bg-red-600' : 'bg-indigo-600',
    bgLight: isOz ? 'bg-emerald-50 dark:bg-emerald-950/30' : isTatts ? 'bg-red-50 dark:bg-red-950/30' : 'bg-indigo-50 dark:bg-indigo-950/20',
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
  }, [myTickets, drawResultsList, upcomingLedger, game]);

  useEffect(() => {
    setSelectedDate(upcomingDates[0]);
    setCurrentNumbers([]);
  }, [game, upcomingDates]);

  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      const { data: ledgerData } = await supabase.from('upcoming_draws').select('*');
      if (ledgerData) setUpcomingLedger(ledgerData);

      const { data: resultsData } = await supabase.from('draw_results').select('*').order('draw_date', { ascending: false });
      if (resultsData) setDrawResultsList(resultsData.map(r => ({ game: r.game, drawDate: r.draw_date, drawNumber: r.draw_number, numbers: r.numbers, bonus: r.bonus, prizes: r.prizes })));

      if(user) {
        const { data: ticketsData } = await supabase.from('tickets').select('*').eq('user_id', user.id).order('draw_date', { ascending: false });
        if (ticketsData) setMyTickets(ticketsData.map(t => ({ id: t.id, drawDate: t.draw_date, numbers: t.numbers, game: t.game })));
      } else {
        setMyTickets([]);
      }
      setIsDataLoading(false);
    };
    if (!isAuthLoading) loadData();
  }, [user, isAuthLoading]);

  const handleSaveTicket = async () => {
    if (!user) { router.push('/login'); return; }
    const required = game === 'Powerball' ? 8 : game === 'Oz Lotto' ? 7 : 6;
    if (currentNumbers.filter(n => n > 0).length < required) {
      alert(`Please select all ${required} numbers.`); return;
    }
    if (!isPremium && myTickets.filter(t => t.drawDate === selectedDate).length >= FREE_TICKET_LIMIT) {
      alert("Free tier limit reached for this draw."); return;
    }
    const { data, error } = await supabase.from('tickets').insert([{ user_id: user.id, draw_date: selectedDate, numbers: currentNumbers, game: game }]).select();
    if (!error && data) {
      setMyTickets([{ id: data[0].id, drawDate: data[0].draw_date, numbers: data[0].numbers, game: data[0].game }, ...myTickets]);
      setCurrentNumbers([]);
    }
  };

  const handleQuickPick = () => setCurrentNumbers(generateQuickPick(game));
  const handleMultiQuickPick = async () => {
    if (!user) { router.push('/login'); return; }
    if (!isPremium && myTickets.filter(t => t.drawDate === selectedDate).length >= FREE_TICKET_LIMIT) {
      alert("Free tier limit reached for this draw."); return;
    }
    const tickets = Array.from({ length: quickPickQty }, () => ({ user_id: user.id, draw_date: selectedDate, numbers: generateQuickPick(game), game: game }));
    const { data, error } = await supabase.from('tickets').insert(tickets).select();
    if (!error && data) {
      const mapped = data.map(t => ({ id: t.id, drawDate: t.draw_date, numbers: t.numbers, game: t.game }));
      setMyTickets([...mapped, ...myTickets]);
    }
  };

  const handleDeleteDateGroup = async (date: string) => {
    if (!window.confirm(`Delete all ${game} tickets for ${date}?`)) return;
    if (user) {
      const { error } = await supabase.from('tickets').delete().eq('user_id', user.id).eq('game', game).eq('draw_date', date);
      if (error) { alert(`Error: ${error.message}`); return; }
    }
    setMyTickets(prev => prev.filter(t => !(t.drawDate === date && t.game === game)));
  };

  const handleDeleteSingleTicket = async (id: string) => {
    if (user) {
      const { error } = await supabase.from('tickets').delete().eq('id', id).eq('user_id', user.id);
      if (error) { alert(`Error: ${error.message}`); return; }
    }
    setMyTickets(prev => prev.filter(t => t.id !== id));
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);
  const formatJackpot = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(0)}M`;
    if (val === 0) return "Pending";
    return formatCurrency(val);
  };

  const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
  );

  const ticketsByDate = useMemo(() => {
    return myTickets.reduce((acc, t) => {
      if (t.game === game) {
        if (!acc[t.drawDate]) acc[t.drawDate] = [];
        acc[t.drawDate].push(t);
      }
      return acc;
    }, {} as Record<string, Ticket[]>);
  }, [myTickets, game]);

  if (isAuthLoading) return <div className={`min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 font-black ${brandStyles.text} animate-pulse uppercase tracking-widest`}>Loading...</div>;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950 pb-24 transition-colors duration-500 text-gray-900 dark:text-gray-100 overflow-x-hidden">
      <Navbar />

      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/5 py-10 sm:py-16 px-4 sm:px-6 mb-8 sm:mb-16 shadow-sm transition-all duration-500 relative overflow-hidden text-left">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] bg-[radial-gradient(#4f46e5_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 animate-in fade-in slide-in-from-left-8 duration-700">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-6 sm:mb-8">
            Track My <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isOz ? 'from-emerald-600 to-teal-600' : isTatts ? 'from-red-600 to-orange-600' : 'from-indigo-600 to-purple-600'} italic`}>Luck</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {['Oz Lotto', 'Powerball', 'Tatts Lotto'].map((g) => (
              <button 
                key={g} 
                onClick={() => handleGameChange(g as any)} 
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
          
          <div className={`rounded-[2.5rem] p-8 sm:p-10 border transition-all duration-700 shadow-2xl relative overflow-hidden bg-white dark:bg-gray-900 border-gray-100 dark:border-white/5`}>
            <div className={`absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[80px] opacity-20 ${isOz ? 'bg-emerald-500' : isTatts ? 'bg-red-500' : 'bg-indigo-500'}`} />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-10">
                <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${brandStyles.text}`}>Luck Stats</p>
                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${brandStyles.bgLight} ${brandStyles.text}`}>Live Sync</div>
              </div>
              
              <div className="grid grid-cols-1 gap-10">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Missed</p>
                  <p className={`text-5xl sm:text-6xl font-black tracking-tighter ${brandStyles.text}`}>{formatCurrency(stats.totalMissedPrize)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6 pt-10 border-t border-gray-100 dark:border-white/5">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Money "Saved"</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(stats.totalInvested)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Best Win</p>
                    <p className={`text-2xl font-black ${brandStyles.text}`}>{stats.bestDivision === 'No Prize' ? '-' : stats.bestDivision.replace('Division ', 'Div ')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl transition-all duration-500">
            {!isPremium && myTickets.filter(t => t.drawDate === selectedDate).length >= FREE_TICKET_LIMIT && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 rounded-[2rem] text-white shadow-xl mb-8">
                <p className="font-black uppercase tracking-widest text-xs mb-2">Draw Limit Reached! 🚀</p>
                <p className="text-sm font-bold opacity-90 mb-4">You are tracking {FREE_TICKET_LIMIT} tickets for this draw. Upgrade to PRO for unlimited tracking.</p>
                <Link href="/premium" className="inline-block bg-white text-orange-600 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-50 transition-all">Upgrade Now</Link>
              </div>
            )}

            <div className="flex justify-between items-end mb-4 sm:mb-6 ml-2">
              <label className="block text-[9px] sm:text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">1. Pick Draw Date</label>
              {selectedJackpot !== null && (
                <div className="text-right animate-in fade-in slide-in-from-right-4">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1">Div 1 Prize</p>
                  <p className={`text-base sm:text-lg font-black ${brandStyles.text} tracking-tighter leading-none`}>{formatJackpot(selectedJackpot)}</p>
                </div>
              )}
            </div>

            <div className="space-y-8">
              <div className="relative group">
                <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={`w-full appearance-none bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent rounded-2xl p-5 font-black text-base text-gray-800 dark:text-white outline-none transition-all cursor-pointer ${brandStyles.focus}`}>
                  {upcomingDates.map(date => <option key={date} value={date}>{date}</option>)}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
              </div>

              <label className="block text-[9px] sm:text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 sm:mb-6 ml-2">2. Choose Your Numbers</label>
              <LottoLinePicker lineId="luck-picker" displayIndex={1} selectedNumbers={currentNumbers} onNumbersChange={(_, numbers) => setCurrentNumbers(numbers)} onDeleteLine={() => setCurrentNumbers([])} game={game} />
              
              <div className="pt-4 space-y-4">
                <button onClick={handleSaveTicket} className={`w-full py-5 text-white font-black rounded-[1.5rem] transition-all uppercase tracking-[0.2em] text-sm active:scale-95 shadow-xl hover:brightness-110 ${brandStyles.bg} ${brandStyles.shadow}`}>Save This Ticket</button>
                
                <div className="flex gap-3">
                  <select value={quickPickQty} onChange={(e) => setQuickPickQuantity(Number(e.target.value))} className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-6 py-5 font-black text-sm outline-none text-gray-700 dark:text-gray-300 border-none cursor-pointer">
                    {[10, 25, 50, 100].map(q => <option key={q} value={q}>x{q}</option>)}
                  </select>
                  <button onClick={handleMultiQuickPick} className="flex-1 py-5 bg-emerald-500 text-white font-black rounded-2xl transition-all uppercase tracking-[0.2em] text-xs shadow-xl shadow-emerald-500/20 hover:brightness-110 active:scale-95">Quick Pick Burst</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-10 animate-in fade-in slide-in-from-right-8 duration-1000 text-left">
          
          <div className={`rounded-[2.5rem] p-8 sm:p-10 border shadow-2xl relative overflow-hidden transition-all duration-700 ${!isPremium ? 'bg-gray-50/50 dark:bg-white/5 grayscale-[0.5] border-gray-100 dark:border-white/5' : ((autoTrackGames[game] || 0) > 0 ? 'bg-white dark:bg-gray-900 border-amber-400 dark:border-amber-500/50 shadow-amber-500/10' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-white/5')}`}>
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic leading-none">Auto-Tracker</h3>
                  <span className="text-[10px] font-black bg-amber-400 text-amber-950 px-2.5 py-1 rounded-lg shadow-sm">PRO</span>
                </div>
                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Hands-free monitoring</p>
              </div>
              
              {!isPremium ? (
                <Link href="/premium/" className="bg-amber-400 text-amber-950 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-lg shadow-amber-500/20">Upgrade</Link>
              ) : (
                <button 
                  onClick={() => handleUpdateAutoTrack(game, (autoTrackGames[game] || 0) > 0 ? 0 : 10)}
                  disabled={isUpdatingPrefs}
                  className={`w-14 h-8 rounded-full transition-all duration-500 relative flex-shrink-0 ${((autoTrackGames[game] || 0) > 0) ? 'bg-amber-500 shadow-lg shadow-amber-500/30' : 'bg-gray-200 dark:bg-gray-800'}`}
                >
                  <div className={`absolute top-1.5 left-1.5 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-md ${((autoTrackGames[game] || 0) > 0) ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              )}
            </div>

            {isPremium && (
              <div className="space-y-10 animate-in slide-in-from-top-4 duration-500">
                {(autoTrackGames[game] || 0) > 0 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{game} Capacity</label>
                      <span className="text-lg font-black text-amber-600 dark:text-amber-400 tracking-tighter">{autoTrackGames[game] || 0} Tickets</span>
                    </div>
                    <input 
                      type="range" min="5" max="100" step="5"
                      value={autoTrackGames[game] || 0} 
                      onChange={(e) => handleUpdateAutoTrack(game, parseInt(e.target.value))}
                      className="w-full accent-amber-500 h-2 bg-gray-100 dark:bg-white/5 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                )}
                <div className={`p-6 rounded-[1.5rem] border transition-all duration-500 ${((autoTrackGames[game] || 0) > 0) ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/10' : 'bg-gray-50 dark:bg-white/5 border-transparent'}`}>
                  <p className={`text-[11px] font-black leading-relaxed uppercase tracking-widest text-center ${((autoTrackGames[game] || 0) > 0) ? 'text-amber-700 dark:text-amber-400' : 'text-gray-400'}`}>
                    {((autoTrackGames[game] || 0) > 0) 
                      ? `System will generate ${autoTrackGames[game]} sets for every upcoming draw.`
                      : `Auto-Tracker is currently inactive for this game.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-10">
            <div className="flex items-end justify-between px-4 sm:px-6">
              <div className="space-y-1">
                <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">My History</h2>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">Archived Ticket Results</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-5 py-2.5 rounded-2xl uppercase tracking-widest shadow-sm">{myTickets.length} Tickets</span>
              </div>
            </div>

            <div className="max-h-[800px] overflow-y-auto pr-4 custom-scrollbar space-y-8 pb-20">
              {isDataLoading ? (
                <div className="py-40 flex flex-col items-center gap-6 animate-pulse"><div className={`w-16 h-16 border-[6px] ${brandStyles.text.replace('text-', 'border-')} border-t-transparent rounded-full animate-spin`} /><p className="text-gray-400 font-black uppercase tracking-[0.4em] text-xs italic">Syncing History...</p></div>
              ) : Object.keys(ticketsByDate).length === 0 ? (
                <div className="bg-white dark:bg-gray-900 p-24 sm:p-32 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-white/5 text-center group hover:border-indigo-500/30 transition-all duration-700">
                  <p className="text-lg text-gray-400 dark:text-gray-500 font-black italic mb-8 uppercase tracking-widest">Empty Archive</p>
                  <button onClick={handleMultiQuickPick} className={`text-xs font-black ${brandStyles.text} uppercase tracking-[0.4em] border-b-2 border-current pb-2 hover:opacity-70 transition-all`}>Begin Monitoring Luck</button>
                </div>
              ) : (
                Object.entries(ticketsByDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, tickets], idx) => {
                  const isExpanded = expandedDates.has(date);
                  const res = drawResultsList.find(r => r.drawDate === date);
                  let totalPrize = 0;
                  let div1Win = false;
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
                    });
                  }
                  const isWinner = res && (totalPrize > 0 || div1Win);
                  
                  return (
                    <div key={date} className={`bg-white dark:bg-gray-900 rounded-[2.5rem] border transition-all duration-700 ${isWinner ? `border-${brandColor}-300 dark:border-${brandColor}-500 shadow-2xl` : 'border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl'} overflow-hidden animate-in fade-in slide-in-from-bottom-8`} style={{ transitionDelay: `${idx * 150}ms` }}>
                      <div className="flex items-center group/card">
                        <button onClick={() => { const next = new Set(expandedDates); if (next.has(date)) next.delete(date); else next.add(date); setExpandedDates(next); }} className="flex-1 p-8 sm:p-10 flex items-center justify-between text-left gap-10">
                          <div className="flex items-center gap-10">
                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex-shrink-0 flex items-center justify-center font-black text-2xl transition-all duration-700 group-hover:rotate-12 ${isWinner ? brandStyles.bg + ' text-white shadow-2xl scale-110' : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500'}`}>{tickets.length}</div>
                            <div>
                              <p className={`text-[10px] font-black ${brandStyles.text} uppercase mb-2 tracking-[0.2em]`}>Draw: {date}</p>
                              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic">{res ? (isWinner ? 'WIN!' : 'NO WIN') : 'PENDING'}</p>
                            </div>
                          </div>
                          {res ? (
                            <div className="text-right">
                              <p className={`text-2xl sm:text-4xl font-black tracking-tighter ${isWinner ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-700'}`}>{formatJackpot(totalPrize)}</p>
                            </div>
                          ) : (
                            <div className="text-right hidden sm:block scale-125"><Countdown targetDate={date} /></div>
                          )}
                        </button>
                        <div className="pr-10">
                          <button onClick={() => handleDeleteDateGroup(date)} className="text-gray-300 dark:text-gray-700 hover:text-red-500 transition-all duration-300 p-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 transform hover:scale-110"><TrashIcon /></button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className={`p-8 sm:p-12 border-t dark:border-white/5 animate-in slide-in-from-top-8 duration-700 ${isWinner ? `${brandStyles.bgLight} dark:bg-${brandColor}-500/5` : 'bg-gray-50/30 dark:bg-white/5'}`}>
                          {res && (
                            <div className="mb-12 bg-white dark:bg-gray-800 p-10 sm:p-14 rounded-[3rem] border border-gray-100 dark:border-white/5 flex flex-col items-center shadow-2xl relative">
                              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-10 tracking-[0.5em]">Draw Numbers</p>
                              <div className="flex flex-wrap gap-4 sm:gap-6 justify-center">
                                {res.numbers.map((n: number, i: number) => (<span key={n} className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full ${brandStyles.bg} text-white flex items-center justify-center font-black border-b-[6px] border-black/20 shadow-2xl text-xl sm:text-2xl transform hover:-translate-y-2 transition-transform`} style={{ transitionDelay: `${i * 100}ms` }}>{n}</span>))}
                                <div className="w-px h-12 sm:h-16 bg-gray-200 dark:bg-white/10 mx-4" />
                                {res.bonus.map((n: number, i: number) => (<span key={n} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black border-b-[6px] border-amber-600 shadow-2xl text-xl sm:text-2xl transform hover:-translate-y-2 transition-transform" style={{ transitionDelay: `${(res.numbers.length + i) * 100}ms` }}>{n}</span>))}
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                            {tickets.map((t, tidx) => {
                              const c = res ? compareNumbers(t.numbers, res.numbers, res.bonus, game) : null;
                              let prize = (c && res) ? (res.prizes[c.prizeTier] || 0) : 0;
                              const ticketWon = prize > 0 || c?.prizeTier === 'Division 1';
                              return (
                                <div key={t.id} className={`p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border transition-all duration-700 group/ticket ${ticketWon ? `bg-white dark:bg-gray-800 border-${brandColor}-400 dark:border-${brandColor}-500 shadow-2xl scale-[1.02] z-10` : 'bg-white/60 dark:bg-white/5 border-gray-100 dark:border-white/5 opacity-60 hover:opacity-100 shadow-sm'}`}>
                                  <div className="flex justify-between items-center mb-8">
                                    <span className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest italic">Set #{tidx + 1}</span>
                                    <div className="flex items-center gap-4">
                                      {c && <span className={`text-[10px] font-black px-5 py-2 rounded-xl uppercase tracking-[0.2em] shadow-sm ${ticketWon ? brandStyles.bg + ' text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500'}`}>{c.prizeTier}</span>}
                                      <button onClick={() => handleDeleteSingleTicket(t.id)} className="text-gray-300 dark:text-gray-700 hover:text-red-500 transition-colors p-2"><TrashIcon /></button>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-3">
                                    {t.numbers.map(n => { 
                                      const isMainMatch = res && res.numbers.includes(n);
                                      const isBonusMatch = res && res.bonus.includes(n);
                                      return <span key={n} className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-xs sm:text-sm font-black border-b-[4px] transition-all duration-700 ${isMainMatch ? brandStyles.bg + ' text-white border-black/20 shadow-xl scale-110' : isBonusMatch ? 'bg-amber-400 text-amber-950 border-amber-600 shadow-xl scale-110' : 'bg-gray-50 dark:bg-white/10 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-white/10 opacity-50'}`}>{n}</span>; 
                                    })}
                                  </div>
                                  {ticketWon && <p className={`mt-10 text-lg font-black ${brandStyles.text} italic tracking-tighter`}>+{formatCurrency(prize)} MISSING</p>}
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
        </div>
      </main>

      <DivisionRules game={game} isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default function LuckPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 uppercase font-black tracking-[0.5em] animate-pulse text-xs text-gray-400">Initializing...</div>}>
      <LuckContent />
    </Suspense>
  );
}
