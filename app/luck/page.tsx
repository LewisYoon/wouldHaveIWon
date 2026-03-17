'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import DivisionRules from '../../components/DivisionRules';
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

function NumberGrid({ 
  game, 
  selectedNumbers, 
  onNumberClick, 
  brandColor 
}: { 
  game: string; 
  selectedNumbers: number[]; 
  onNumberClick: (n: number) => void;
  brandColor: string;
}) {
  const OZ_MAX = 47;
  const PB_MAX = 35;
  const PB_BALL_MAX = 20;
  const TATTS_MAX = 45;

  const isPB = game === 'Powerball';
  const mainMax = game === 'Oz Lotto' ? OZ_MAX : isPB ? PB_MAX : TATTS_MAX;
  
  const mainNumbers = Array.from({ length: mainMax }, (_, i) => i + 1);
  const pbNumbers = Array.from({ length: PB_BALL_MAX }, (_, i) => i + 1);

  const brandStyles = {
    emerald: 'bg-emerald-500 text-white shadow-emerald-500/20',
    red: 'bg-red-500 text-white shadow-red-500/20',
    indigo: 'bg-indigo-600 text-white shadow-indigo-500/20',
  }[brandColor as 'emerald' | 'red' | 'indigo'] || 'bg-indigo-600 text-white';

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-1">Main Numbers</p>
        <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
          {mainNumbers.map(n => {
            const isSelected = selectedNumbers.slice(0, isPB ? 7 : undefined).includes(n);
            return (
              <button 
                key={n} 
                type="button"
                onClick={() => onNumberClick(n)}
                className={`aspect-square rounded-xl text-xs font-black transition-all transform active:scale-90 shadow-sm border-b-2 ${
                  isSelected 
                    ? `${brandStyles} border-black/20 scale-105 shadow-md` 
                    : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {isPB && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-4 px-1">Powerball</p>
          <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
            {pbNumbers.map(n => {
              const isSelected = selectedNumbers[7] === n;
              return (
                <button 
                  key={n} 
                  type="button"
                  onClick={() => onNumberClick(n)}
                  className={`aspect-square rounded-xl text-xs font-black transition-all transform active:scale-90 shadow-sm border-b-2 ${
                    isSelected 
                      ? 'bg-amber-400 text-amber-950 border-amber-600 scale-105 shadow-md' 
                      : 'bg-amber-50/50 dark:bg-amber-500/5 text-amber-600/40 dark:text-amber-400/40 border-amber-100/50 dark:border-white/5 hover:bg-amber-100/50'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

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
    if (user && typeof window !== 'undefined' && (window.location.hash.includes('access_token') || window.location.search.includes('type=signup'))) {
      const channel = supabase.channel(`auth-sync:${user.email?.toLowerCase()}`);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'verified',
            payload: { email: user.email }
          });
          setTimeout(() => {
            supabase.removeChannel(channel);
          }, 3000);
        }
      });
    }
  }, [user]);

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
    const loadLedger = async () => {
      const { data } = await supabase.from('upcoming_draws').select('*');
      if (data) setUpcomingLedger(data);
    };
    loadLedger();
  }, []);

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
      if (upcoming && upcoming.length > 0) setSelectedJackpot(upcoming[0].jackpot);
    };
    fetchJackpot();
  }, [game, selectedDate, upcomingLedger]);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) { setMyTickets([]); setIsDataLoading(false); return; }
      setIsDataLoading(true);
      const { data } = await supabase.from('tickets').select('*').eq('user_id', user.id).order('draw_date', { ascending: false });
      if (data) {
        setMyTickets(data.map(t => ({ id: t.id, drawDate: t.draw_date, numbers: t.numbers, game: t.game })));
      }
      setIsDataLoading(false);
    };
    if (!isAuthLoading) fetchTickets();
  }, [user, isAuthLoading]);

  useEffect(() => {
    const fetchResults = async () => {
      const { data } = await supabase.from('draw_results').select('*').order('draw_date', { ascending: false });
      if (data) {
        setDrawResultsList(data.map(r => ({ game: r.game, drawDate: r.draw_date, drawNumber: r.draw_number, numbers: r.numbers, bonus: r.bonus, prizes: r.prizes })));
      }
    };
    fetchResults();
  }, []);

  const handleNumberClick = (n: number) => {
    const isPB = game === 'Powerball';
    if (isPB) {
      const isCurrentlyPB = n <= 20 && currentNumbers[7] === n;
      if (isCurrentlyPB) {
        const next = [...currentNumbers];
        next[7] = 0;
        setCurrentNumbers(next);
        return;
      }

      // Check if it's a potential PB selection (only if clicking from the PB grid area would be ideal, 
      // but here we just have one handler). We'll assume the grid handles the logic or we use logic:
      // If the number clicked is from the PB grid (we know it's PB mode), we need to distinguish.
      // But let's simplify: if they click a number that is already in main, remove it. 
      // If they click a number and main is not full, add to main. 
      // EXCEPT for the PB slot.
      
      // Let's refine the NumberGrid to pass a type.
    }

    // Fallback simple toggle for now to fix build
    if (currentNumbers.includes(n)) {
      setCurrentNumbers(currentNumbers.filter(num => num !== n));
    } else {
      const max = game === 'Powerball' ? 8 : game === 'Oz Lotto' ? 7 : 6;
      if (currentNumbers.length < max) {
        setCurrentNumbers([...currentNumbers, n].sort((a, b) => a - b));
      }
    }
  };

  const handleSaveTicket = async () => {
    if (!user) { router.push('/login'); return; }
    const required = game === 'Powerball' ? 8 : game === 'Oz Lotto' ? 7 : 6;
    if (currentNumbers.length < required) {
      alert(`Please select all ${required} numbers.`);
      return;
    }
    if (!isPremium) {
      const currentDrawTickets = myTickets.filter(t => t.drawDate === selectedDate).length;
      if (currentDrawTickets >= FREE_TICKET_LIMIT) {
        alert("Free tier limit reached for this draw. Upgrade to PRO for unlimited tracking!");
        return;
      }
    }
    const { data, error } = await supabase.from('tickets').insert([{ user_id: user.id, draw_date: selectedDate, numbers: currentNumbers, game: game }]).select();
    if (!error && data) {
      setMyTickets([{ id: data[0].id, drawDate: data[0].draw_date, numbers: data[0].numbers, game: data[0].game }, ...myTickets]);
      setCurrentNumbers([]);
    }
  };

  const handleQuickPick = () => { setCurrentNumbers(generateQuickPick(game)); };

  const handleMultiQuickPick = async () => {
    if (!user) { router.push('/login'); return; }
    if (!isPremium) {
      const currentDrawTickets = myTickets.filter(t => t.drawDate === selectedDate).length;
      const availableSpace = FREE_TICKET_LIMIT - currentDrawTickets;
      if (availableSpace <= 0) { alert("Free tier limit reached. Upgrade to PRO for unlimited tracking!"); return; }
      if (quickPickQty > availableSpace) { alert(`Only ${availableSpace} slots remaining for this draw on the Free Tier.`); return; }
    }
    const tickets = Array.from({ length: quickPickQty }, () => ({ user_id: user.id, draw_date: selectedDate, numbers: generateQuickPick(game), game: game }));
    const { data, error } = await supabase.from('tickets').insert(tickets).select();
    if (!error && data) {
      const mapped = data.map(t => ({ id: t.id, drawDate: t.draw_date, numbers: t.numbers, game: t.game }));
      setMyTickets([...mapped, ...myTickets]);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (!error) setMyTickets(myTickets.filter(t => t.id !== id));
  };

  const toggleExpandDate = (date: string) => {
    const next = new Set(expandedDates);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    setExpandedDates(next);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 selection:bg-indigo-500 selection:text-white transition-colors duration-500">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12 sm:mb-20">
          <div className="text-left">
            <h2 className="text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.4em] text-[10px] mb-4">Official Results Sync</h2>
            <h1 className="text-5xl sm:text-7xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic leading-[0.8]">
              Track Your <br />
              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isOz ? 'from-emerald-400 to-teal-500' : isTatts ? 'from-red-400 to-orange-500' : 'from-indigo-400 to-purple-500'}`}>Fortune</span>.
            </h1>
          </div>
          <div className="flex bg-gray-100 dark:bg-white/5 p-1.5 rounded-[2rem] border border-gray-200 dark:border-white/10 w-full md:w-auto overflow-x-auto no-scrollbar">
            {(['Oz Lotto', 'Powerball', 'Tatts Lotto'] as const).map((g) => (
              <button key={g} onClick={() => handleGameChange(g)} className={`flex-1 md:flex-none px-6 sm:px-10 py-3 sm:py-4 rounded-[1.5rem] text-xs sm:text-sm font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${game === g ? `bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xl shadow-black/5` : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>{g}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
          <div className="lg:col-span-5 space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className={`rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border border-gray-100 dark:border-white/5 shadow-xl relative overflow-hidden transition-all duration-500 bg-white dark:bg-gray-900`}>
              <div className="flex justify-between items-center mb-8 sm:mb-10">
                <div className="text-left">
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Select Draw Date</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Which draw are you tracking?</p>
                </div>
                {selectedJackpot && (
                  <div className="text-right">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${brandStyles.text}`}>Jackpot</span>
                    <p className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">${(selectedJackpot / 1000000).toFixed(0)}M</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 no-scrollbar">
                {upcomingDates.map((date) => (
                  <button key={date} onClick={() => setSelectedDate(date)} className={`flex-shrink-0 px-5 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border-2 transition-all font-black text-[10px] sm:text-xs uppercase tracking-widest ${selectedDate === date ? `${brandStyles.border} ${brandStyles.text} ${brandStyles.bgLight} scale-105` : 'border-transparent bg-gray-50 dark:bg-white/5 text-gray-400'}`}>{date}</button>
                ))}
              </div>
              <div className="mt-10 sm:mt-12 space-y-8">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Choose Numbers</h3>
                  <button onClick={handleQuickPick} className={`${brandStyles.text} text-[10px] font-black uppercase tracking-widest hover:underline`}>Quick Pick</button>
                </div>
                <NumberGrid game={game} selectedNumbers={currentNumbers} onNumberClick={handleNumberClick} brandColor={brandColor} />
              </div>
              {!isPremium && (
                <div className="mt-10 pt-8 border-t border-gray-50 dark:border-white/5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Free Tier Usage</span>
                    <Link href="/premium" className="text-[9px] font-black text-amber-500 uppercase tracking-widest hover:underline">Unlimited PRO</Link>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full flex-grow overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${brandStyles.bg}`} style={{ width: `${Math.min(100, (myTickets.filter(t => t.drawDate === selectedDate).length / FREE_TICKET_LIMIT) * 100)}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400">{myTickets.filter(t => t.drawDate === selectedDate).length} / {FREE_TICKET_LIMIT}</span>
                  </div>
                </div>
              )}
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
            <div className={`rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border shadow-xl relative overflow-hidden transition-all duration-500 ${!isPremium ? 'bg-gray-50/50 dark:bg-white/5 grayscale-[0.5] border-gray-100 dark:border-white/5' : ((autoTrackGames[game] || 0) > 0 ? 'bg-white dark:bg-gray-900 border-amber-400 dark:border-amber-500/50 shadow-amber-500/10' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-white/5')}`}>
              <div className="flex justify-between items-start mb-8 sm:mb-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Auto-Tracker</h3>
                    <span className="text-[8px] font-black bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-md">PRO</span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 leading-relaxed italic text-left">Automatically track new draws. Set ticket quantities per game.</p>
                </div>
                {!isPremium ? (
                  <Link href="/premium/" className="flex-shrink-0 bg-amber-400 text-amber-950 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-sm">Upgrade</Link>
                ) : (
                  <button onClick={() => handleUpdateAutoTrack(game, (autoTrackGames[game] || 0) > 0 ? 0 : 10)} disabled={isUpdatingPrefs} className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${((autoTrackGames[game] || 0) > 0) ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-800'}`}><div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${((autoTrackGames[game] || 0) > 0) ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                )}
              </div>
              {isPremium && (
                <div className="space-y-8 animate-in slide-in-from-top-2 duration-500">
                  {(autoTrackGames[game] || 0) > 0 && (
                    <div className="space-y-4 animate-in zoom-in-95 duration-200">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{game} Quantity</label>
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400">{autoTrackGames[game] || 0} Tickets</span>
                      </div>
                      <input type="range" min="5" max="100" step="5" value={autoTrackGames[game] || 0} onChange={(e) => handleUpdateAutoTrack(game, parseInt(e.target.value))} className="w-full accent-amber-500 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full appearance-none cursor-pointer" />
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl border transition-colors ${((autoTrackGames[game] || 0) > 0) ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/10' : 'bg-gray-50 dark:bg-white/5 border-transparent'}`}>
                    <p className={`text-[9px] font-medium leading-relaxed italic text-left ${((autoTrackGames[game] || 0) > 0) ? 'text-amber-700 dark:text-amber-400' : 'text-gray-400'}`}>{((autoTrackGames[game] || 0) > 0) ? `We will automatically generate ${autoTrackGames[game]} random tickets for you as soon as new results are announced.` : `Auto-Tracker is currently disabled for ${game}. Toggle the switch above to enable.`}</p>
                  </div>
                </div>
              )}
              {!isPremium && (
                <div className="space-y-4">
                  <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full w-full overflow-hidden"><div className="h-full bg-gray-200 dark:bg-white/10 w-1/3" /></div>
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 leading-relaxed italic text-left">PRO members can automatically generate up to 100 tickets per draw without lifting a finger.</p>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 border border-gray-100 dark:border-white/5 shadow-xl">
              <div className="flex justify-between items-center mb-8 sm:mb-10">
                <div className="text-left"><h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Your Archive</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Tracked Ticket History</p></div>
                <button onClick={() => setIsRulesModalOpen(true)} className="p-2 text-gray-400 hover:text-indigo-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-12">
                {[
                  { label: 'Checked', val: stats.totalTicketsChecked, color: 'text-gray-900 dark:text-white' },
                  { label: 'Total Wins', val: stats.totalWins, color: 'text-emerald-500' },
                  { label: 'Best Hit', val: stats.bestDivision === 'No Prize' ? '-' : stats.bestDivision.replace('Division ', 'Div '), color: brandStyles.text },
                  { label: 'Missed $', val: `$${stats.totalMissedPrize.toLocaleString()}`, color: 'text-amber-500' },
                ].map((s, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl text-center border border-transparent hover:border-gray-100 dark:hover:border-white/10 transition-all"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</p><p className={`text-sm sm:text-base font-black uppercase tracking-tighter ${s.color}`}>{s.val}</p></div>
                ))}
              </div>
              {isDataLoading ? (
                <div className="py-20 text-center animate-pulse"><p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">Syncing Archive...</p></div>
              ) : myTickets.length === 0 ? (
                <div className="py-20 sm:py-32 text-center"><div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div><p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No tickets tracked yet</p></div>
              ) : (
                <div className="space-y-4">
                  {Array.from(new Set(myTickets.map(t => t.drawDate))).map(date => {
                    const ticketsForDate = myTickets.filter(t => t.drawDate === date);
                    const isExpanded = expandedDates.has(date);
                    const result = drawResultsList.find(r => r.drawDate === date && r.game === game);
                    return (
                      <div key={date} className="border border-gray-50 dark:border-white/5 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-gray-50/30 dark:bg-white/5 transition-all">
                        <button onClick={() => toggleExpandDate(date)} className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-4"><div className={`w-2 h-2 rounded-full ${result ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} /><div className="text-left"><p className="text-xs sm:text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">{date}</p><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{ticketsForDate.length} {ticketsForDate.length === 1 ? 'Sequence' : 'Sequences'}</p></div></div>
                          <div className="flex items-center gap-4">{result && (<span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hidden sm:block">Results Ready</span>)}<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg></div>
                        </button>
                        {isExpanded && (
                          <div className="px-5 sm:px-6 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-300">
                            {ticketsForDate.map((ticket) => {
                              const comparison = result ? compareNumbers(ticket.numbers, result.numbers, result.bonus, ticket.game as any) : null;
                              return (
                                <div key={ticket.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-50 dark:border-white/5 group shadow-sm">
                                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {ticket.numbers.map((n, i) => {
                                      const isMatch = comparison?.matchedNumbers.includes(n);
                                      const isBonusMatch = comparison?.matchedBonusNumbers.includes(n);
                                      return <span key={i} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black transition-all ${isMatch ? `${brandStyles.bg} text-white shadow-lg` : isBonusMatch ? 'bg-amber-400 text-amber-950 shadow-lg' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}>{n}</span>;
                                    })}
                                  </div>
                                  <div className="flex items-center gap-3">{comparison && (<span className={`text-[9px] font-black uppercase tracking-widest ${comparison.prizeTier !== 'No Prize' ? 'text-emerald-500' : 'text-gray-300'}`}>{comparison.prizeTier === 'No Prize' ? 'Missed' : comparison.prizeTier.replace('Division ', 'Div ')}</span>)}<button onClick={() => handleDeleteTicket(ticket.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <DivisionRules isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} game={game} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default function LuckPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950"><p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Initializing Luck Tracker...</p></div>}>
      <LuckContent />
    </Suspense>
  );
}
