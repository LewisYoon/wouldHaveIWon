// lotto-project/app/luck/page.tsx
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import LottoLinePicker from '../../components/LottoLinePicker';
import DivisionRules from '../../components/DivisionRules';
import Countdown from '../../components/Countdown';
import SettingsModal from '../../components/SettingsModal';
import { getNextDrawDates, compareNumbers, Ticket } from '../../lib/lotto-utils';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// Custom Hooks
import { useLuckData } from '../../hooks/useLuckData';
import { useUserTickets } from '../../hooks/useUserTickets';
import { useUserPreferences } from '../../hooks/useUserPreferences';

const TICKET_COST = 1.45;
const FREE_TICKET_LIMIT = 25;

function LuckContent() {
  const { user, isPremium, isLoading: isAuthLoading, subscriptionInfo, refreshPremiumStatus } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Game & Date State
  const initialGame = (searchParams.get('game') as any) || 'Oz Lotto';
  const [game, setGame] = useState<'Oz Lotto' | 'Powerball' | 'Tatts Lotto'>(initialGame);
  const upcomingDates = useMemo(() => getNextDrawDates(5, game), [game]);
  const [selectedDate, setSelectedDate] = useState(upcomingDates[0]);
  
  // Picker State
  const [currentNumbers, setCurrentNumbers] = useState<number[]>([]);
  const [quickPickQty, setQuickPickQuantity] = useState(10);
  
  // Custom Hooks
  const { 
    myTickets, 
    isTicketsLoading, 
    addTicket, 
    addQuickPicks, 
    deleteTicketsByDate, 
    deleteSingleTicket 
  } = useUserTickets(user, !!isPremium, isAuthLoading);

  const { 
    drawResultsList, 
    upcomingLedger, 
    isDataLoading, 
    stats 
  } = useLuckData(game, myTickets);

  const { 
    autoTrackGames, 
    isUpdatingPrefs, 
    updateAutoTrack 
  } = useUserPreferences(user, isAuthLoading, subscriptionInfo, refreshPremiumStatus);

  const [selectedJackpot, setSelectedJackpot] = useState<number | null>(null);

  const handleGameChange = (newGame: 'Oz Lotto' | 'Powerball' | 'Tatts Lotto') => {
    setGame(newGame);
    const params = new URLSearchParams(searchParams.toString());
    params.set('game', newGame);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setSelectedDate(upcomingDates[0]);
    setCurrentNumbers([]);
  }, [game, upcomingDates]);

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

  const handleSaveTicket = async () => {
    if (!user) { router.push('/login'); return; }
    const required = game === 'Powerball' ? 8 : game === 'Oz Lotto' ? 7 : 6;
    if (currentNumbers.filter(n => n > 0).length < required) {
      toast.error(`Please select all ${required} numbers.`); return;
    }
    const ticketsForThisDraw = myTickets.filter(t => t.drawDate === selectedDate).length;
    if (!isPremium && ticketsForThisDraw >= FREE_TICKET_LIMIT) {
      toast.warning("Free tier limit reached for this draw.", {
        description: "Upgrade to Premium for unlimited tickets.",
        action: {
          label: 'Upgrade',
          onClick: () => router.push('/premium')
        }
      });
      return;
    }

    const { error } = await addTicket(game, selectedDate, currentNumbers);
    if (!error) {
      setCurrentNumbers([]);
      toast.success('1 Ticket Added');
    } else {
      toast.error('Failed to save ticket');
    }
  };

  const handleMultiQuickPick = async () => {
    if (!user) { router.push('/login'); return; }
    const ticketsForThisDraw = myTickets.filter(t => t.drawDate === selectedDate).length;
    
    const { data, error } = await addQuickPicks(game, selectedDate, quickPickQty, ticketsForThisDraw, FREE_TICKET_LIMIT);
    if (error === 'Limit reached') {
      toast.warning("Free tier limit reached for this draw.", {
        description: "Upgrade to Premium for unlimited tickets.",
        action: {
          label: 'Upgrade',
          onClick: () => router.push('/premium')
        }
      });
    } else if (!error && data) {
      toast.success(`${data.length} Tickets Added`);
    } else if (error) {
      toast.error('Failed to add tickets');
    }
  };

  const handleDeleteDateGroup = async (date: string) => {
    if (!window.confirm(`Delete all ${game} tickets for ${date}?`)) return;
    const { error } = await deleteTicketsByDate(game, date);
    if (!error) toast.success('Tickets deleted');
    else toast.error('Failed to delete tickets');
  };

  const handleDeleteSingleTicket = async (id: string) => {
    const { error } = await deleteSingleTicket(id);
    if (!error) toast.success('Ticket deleted');
    else toast.error('Failed to delete ticket');
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

  if (isAuthLoading) return <div className={`min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 font-black ${brandStyles.text} animate-pulse uppercase tracking-widest`}>Loading...</div>;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950 pb-24 transition-colors duration-500 text-gray-900 dark:text-gray-100 overflow-x-hidden text-left">
      <Navbar />

      <header className="relative py-12 sm:py-20 px-4 sm:px-6 mb-8 sm:mb-12 overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[120px] opacity-20 transition-colors duration-1000 ${isOz ? 'bg-emerald-500' : isTatts ? 'bg-red-500' : 'bg-indigo-500'}`} />
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] dark:opacity-[0.07]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-end justify-between gap-8 md:gap-12">
          
          <div className="text-left space-y-4 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center gap-3">
              <span className={`h-px w-8 sm:w-12 ${brandStyles.bg}`} />
              <h2 className="text-xs sm:text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">Official Results Sync</h2>
            </div>
            
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-[0.9]">
              Track My <br />
              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isOz ? 'from-emerald-500 to-teal-400' : isTatts ? 'from-red-500 to-orange-400' : 'from-indigo-500 to-purple-400'} italic`}>Luck</span>
            </h1>
            
            <p className="text-sm sm:text-lg font-medium text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed">
              Simulate your entries against official draw results without spending a dime. <span className={`${brandStyles.text} font-bold`}>Zero risk, pure thrill.</span>
            </p>
          </div>

          <div className="w-full md:w-auto animate-in fade-in slide-in-from-right-8 duration-1000 delay-100">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-2 rounded-[2rem] border border-gray-200/50 dark:border-white/10 shadow-2xl shadow-gray-200/50 dark:shadow-black/50 flex flex-col sm:flex-row gap-2">
              {(['Oz Lotto', 'Powerball', 'Tatts Lotto'] as const).map((g) => (
                <button 
                  key={g} 
                  onClick={() => handleGameChange(g)} 
                  className={`relative px-6 sm:px-8 py-4 sm:py-5 rounded-[1.5rem] text-xs sm:text-sm font-black uppercase tracking-widest transition-all duration-500 overflow-hidden group ${
                    game === g 
                      ? 'text-white shadow-lg transform scale-[1.02]' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  {game === g && (
                    <div className={`absolute inset-0 ${g === 'Oz Lotto' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : g === 'Tatts Lotto' ? 'bg-gradient-to-br from-red-500 to-orange-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} transition-all duration-500`} />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {g}
                    {game === g && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  </span>
                </button>
              ))}
              <button onClick={() => setIsRulesModalOpen(true)} className="hidden sm:flex w-14 items-center justify-center rounded-[1.5rem] hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-16 px-4 sm:px-6 relative z-10">
        <div className="lg:col-span-5 space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          
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
            {/* Header with Simple Prize Text */}
            <div className="flex justify-between items-start mb-10 px-2">
              <div className="space-y-1 text-left">
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Create Tickets</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manual or Quick Pick selection</p>
              </div>
              {selectedJackpot !== null && (
                <div className="text-right animate-in fade-in slide-in-from-right-4">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimated Prize</p>
                  <p className={`text-xl sm:text-2xl font-black ${brandStyles.text} tracking-tighter leading-none`}>{formatJackpot(selectedJackpot)}</p>
                </div>
              )}
            </div>

            <div className="space-y-10">
              {/* Date Selection - Slider Style */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-2 text-left">1. Select Draw Date</p>
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                  {upcomingDates.map((date) => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 px-6 py-4 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${
                        selectedDate === date 
                          ? `${brandStyles.border.replace('text-', 'border-')} ${brandStyles.text} ${brandStyles.bgLight} scale-105 shadow-lg` 
                          : 'border-transparent bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                    >
                      {date}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number Picker Area */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-2 text-left">2. Pick Your Numbers</p>
                <LottoLinePicker lineId="luck-picker" displayIndex={1} selectedNumbers={currentNumbers} onNumbersChange={(_, numbers) => setCurrentNumbers(numbers)} onDeleteLine={() => setCurrentNumbers([])} game={game} />
              </div>
              
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
          

          <div className={`rounded-[2.5rem] p-8 sm:p-10 border shadow-2xl relative overflow-hidden ${!isPremium ? 'bg-gray-50/50 dark:bg-white/5 grayscale-[0.5] border-gray-100 dark:border-white/5' : ((autoTrackGames[game] || 0) > 0 ? 'bg-white dark:bg-gray-900 border-amber-400 dark:border-amber-500/50 shadow-amber-500/10' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-white/5')}`}>
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
                  onClick={() => updateAutoTrack(game, (autoTrackGames[game] || 0) > 0 ? 0 : 10, true)}
                  disabled={isUpdatingPrefs}
                  className={`w-14 h-8 rounded-full transition-all duration-500 relative flex-shrink-0 ${((autoTrackGames[game] || 0) > 0) ? 'bg-amber-50 shadow-lg shadow-amber-500/30' : 'bg-gray-200 dark:bg-gray-800'}`}
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
                      onChange={(e) => updateAutoTrack(game, parseInt(e.target.value), true)}
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
              {isTicketsLoading || isDataLoading ? (
                <div className="py-40 flex flex-col items-center gap-6 animate-pulse"><div className={`w-16 h-16 border-[6px] ${brandStyles.text.replace('text-', 'border-')} border-t-transparent rounded-full animate-spin`} /><p className="text-gray-400 font-black uppercase tracking-[0.4em] text-xs italic">Syncing History...</p></div>
              ) : Object.keys(ticketsByDate).length === 0 ? (
                <div className="bg-white dark:bg-gray-900 p-24 sm:p-32 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-white/5 text-center group hover:border-indigo-500/30 transition-all duration-700">
                  <p className="text-lg text-gray-400 dark:text-gray-500 font-black italic mb-8 uppercase tracking-widest">No history found</p>
                  <button onClick={handleMultiQuickPick} className={`text-xs font-black ${brandStyles.text} uppercase tracking-[0.4em] border-b-2 border-current pb-2 hover:opacity-70 transition-all`}>Begin Tracking Now</button>
                </div>
              ) : (
                Object.entries(ticketsByDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, tickets], idx) => {
                  const isExpanded = expandedDates.has(date);
                  const res = drawResultsList.find(r => r.drawDate === date);
                  let totalPrize = 0;
                  let div1Win = false;
                  if (res) {
                    tickets.forEach(t => {
                      const c = compareNumbers(t.numbers, res.numbers, res.bonus, game as any);
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
                    <div key={date} className={`bg-white dark:bg-gray-900 rounded-[2rem] sm:rounded-[3rem] border transition-all duration-500 ${isWinner ? `border-${brandColor}-200 dark:border-${brandColor}-500 shadow-2xl` : 'border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl'} overflow-hidden animate-in fade-in slide-in-from-bottom-4`} style={{ transitionDelay: `${idx * 100}ms` }}>
                      <div className="flex items-center pr-4 sm:pr-6 group/row">
                        <button onClick={() => { const next = new Set(expandedDates); if (next.has(date)) next.delete(date); else next.add(date); setExpandedDates(next); }} className="flex-1 p-6 sm:p-10 flex items-center justify-between text-left gap-4 sm:gap-10">
                          <div className="flex items-center gap-4 sm:gap-10">
                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-lg sm:text-xl transition-all duration-500 group-hover/row:rotate-12 ${isWinner ? brandStyles.bg + ' text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500'}`}>{tickets.length}</div>
                            <div className="truncate">
                              <p className={`text-[9px] sm:text-[11px] font-black ${brandStyles.text} uppercase mb-1 sm:mb-2`}>Draw: {date}</p>
                              <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white tracking-tighter truncate uppercase italic">
                                {res ? (div1Win ? 'JACKPOT!' : (isWinner ? 'WIN!' : 'NO WIN')) : 'AWAITING'}
                              </p>
                            </div>
                          </div>
                          {res ? (
                            <div className="text-right flex-shrink-0">
                              <p className={`text-xl sm:text-3xl font-black tracking-tighter ${isWinner ? brandStyles.text : 'text-gray-300 dark:text-gray-700'}`}>{formatJackpot(totalPrize)}</p>
                            </div>
                          ) : (
                            <div className="text-right flex-shrink-0 hidden sm:block"><Countdown targetDate={date} /></div>
                          )}
                        </button>
                        <button onClick={() => handleDeleteDateGroup(date)} className="text-gray-200 dark:text-gray-800 hover:text-red-500 p-2 sm:p-3 transition-all transform hover:scale-125 duration-300"><TrashIcon /></button>
                      </div>
                      
                      {isExpanded && (
                        <div className={`p-6 sm:p-10 border-t dark:border-white/5 animate-in slide-in-from-top-4 duration-500 ${isWinner ? `${brandStyles.bgLight}` : 'bg-gray-50/30'}`}>
                          
                          {/* Mini Stats for this Draw */}
                          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
                            <div className="bg-white/50 dark:bg-black/20 p-3 sm:p-4 rounded-2xl border border-white dark:border-white/5">
                              <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Spent</p>
                              <p className="text-xs sm:text-sm font-black">{formatCurrency(tickets.length * TICKET_COST)}</p>
                            </div>
                            <div className="bg-white/50 dark:bg-black/20 p-3 sm:p-4 rounded-2xl border border-white dark:border-white/5">
                              <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Won</p>
                              <p className={`text-xs sm:text-sm font-black ${totalPrize > 0 ? 'text-emerald-500' : ''}`}>{formatCurrency(totalPrize)}</p>
                            </div>
                            <div className={`p-3 sm:p-4 rounded-2xl border ${totalPrize - (tickets.length * TICKET_COST) >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'}`}>
                              <p className="text-[8px] font-black uppercase mb-1 opacity-60">Net</p>
                              <p className="text-xs sm:text-sm font-black">{formatCurrency(totalPrize - (tickets.length * TICKET_COST))}</p>
                            </div>
                          </div>

                          {res && (
                            <div className="mb-8 sm:mb-10 bg-white/80 dark:bg-gray-800/50 p-6 sm:p-8 rounded-[2rem] border border-white dark:border-white/5 flex flex-col items-center shadow-inner relative overflow-hidden group">
                              <p className="text-[8px] font-black text-gray-400 uppercase mb-6 tracking-[0.4em]">Official Draw Results</p>
                              <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center">
                                {res.numbers.map((n: number, i: number) => (<span key={n} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${brandStyles.bg} text-white flex items-center justify-center font-black border-b-[3px] border-black/20 shadow-md text-xs sm:text-sm transform hover:-translate-y-1 transition-transform`} style={{ transitionDelay: `${i * 50}ms` }}>{n}</span>))}
                                <div className="w-px h-8 sm:h-10 bg-gray-200 dark:bg-white/10 mx-1" />
                                {res.bonus.map((n: number, i: number) => (<span key={n} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black border-b-[3px] border-amber-600 shadow-md text-xs sm:text-sm transform hover:-translate-y-1 transition-transform" style={{ transitionDelay: `${(res.numbers.length + i) * 50}ms` }}>{n}</span>))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {tickets.map((t, tidx) => {
                              const c = res ? compareNumbers(t.numbers, res.numbers, res.bonus, game as any) : null;
                              let prize = (c && res) ? (res.prizes[c.prizeTier] || 0) : 0;
                              const ticketWon = prize > 0 || c?.prizeTier === 'Division 1';
                              return (
                                <div key={t.id} className={`p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-500 ${ticketWon ? 'bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-500 shadow-xl scale-[1.02]' : 'bg-white/40 dark:bg-white/5 border-gray-100 dark:border-white/5 opacity-80 hover:opacity-100'}`}>
                                  <div className="flex justify-between items-center mb-4">
                                    <span className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase italic">Set #{tidx + 1}</span>
                                    {c && <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${ticketWon ? 'bg-amber-400 text-amber-950' : 'bg-gray-50 dark:bg-white/10 text-gray-400'}`}>{c.prizeTier}</span>}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {t.numbers.map(n => { 
                                      const isMainMatch = res && res.numbers.includes(n);
                                      const isBonusMatch = res && res.bonus.includes(n);
                                      return <span key={n} className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-[10px] font-black border-b-2 transition-all duration-500 ${isMainMatch ? brandStyles.bg + ' text-white' : isBonusMatch ? 'bg-amber-400 text-amber-950' : 'bg-gray-100 dark:bg-white/10 text-gray-400'}`}>{n}</span>; 
                                    })}
                                  </div>
                                  <div className="flex justify-between items-center mt-4">
                                    <p className={`text-[10px] font-black ${ticketWon ? brandStyles.text : 'text-transparent'}`}>{ticketWon ? `+${formatCurrency(prize)}` : ''}</p>
                                    <button onClick={() => handleDeleteSingleTicket(t.id)} className="text-[10px] text-gray-300 hover:text-red-500 font-bold uppercase tracking-widest transition-colors flex items-center gap-1">Delete</button>
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
