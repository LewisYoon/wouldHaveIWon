'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import LottoLinePicker from '../../components/LottoLinePicker'; // This component had build issues, will use local grid instead
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

// Build-error-free Number Grid component
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
            const mainSelection = isPB ? selectedNumbers.slice(0, 7) : selectedNumbers;
            const isSelected = mainSelection.includes(n);
            return (
              <button key={n} type="button" onClick={() => onNumberClick(n)}
                className={`aspect-square rounded-xl text-xs font-black transition-all transform active:scale-90 shadow-sm border-b-2 ${ isSelected ? `${brandStyles} border-black/20 scale-105 shadow-md` : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10'}`}>
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
              const isSelected = selectedNumbers.length > 7 && selectedNumbers[7] === n;
              return (
                <button key={n} type="button" onClick={() => onNumberClick(n)}
                  className={`aspect-square rounded-xl text-xs font-black transition-all transform active:scale-90 shadow-sm border-b-2 ${ isSelected ? 'bg-amber-400 text-amber-950 border-amber-600 scale-105 shadow-md' : 'bg-amber-50/50 dark:bg-amber-500/5 text-amber-600/40 dark:text-amber-400/40 border-amber-100/50 dark:border-white/5 hover:bg-amber-100/50'}`}>
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
    border: isOz ? 'border-emerald-100 dark:border-emerald-500/20' : isTatts ? 'border-red-100 dark:border-red-500/20' : 'border-indigo-100 dark:border-indigo-500/20',
    shadow: isOz ? 'shadow-emerald-500/20' : isTatts ? 'shadow-red-500/20' : 'shadow-indigo-500/20',
  };

  const stats = useMemo(() => {
    let totalMissedPrize = 0;
    myTickets.forEach(t => {
      const res = drawResultsList.find(r => r.drawDate === t.drawDate && r.game === t.game);
      if (res) {
        const c = compareNumbers(t.numbers, res.numbers, res.bonus, t.game as any);
        let prize = res.prizes[c.prizeTier] || 0;
        if (c.prizeTier === 'Division 1' && prize === 0) {
          const ledgerMatch = upcomingLedger.find(l => l.game?.toLowerCase().includes(t.game.toLowerCase().split(' ')[0]) && l.draw_date === t.drawDate);
          if (ledgerMatch) prize = ledgerMatch.jackpot;
        }
        totalMissedPrize += prize;
      }
    });
    return { totalMissedPrize };
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

  const handleNumberClick = (n: number) => {
    const isPB = game === 'Powerball';
    const mainNumbers = isPB ? currentNumbers.slice(0, 7) : currentNumbers;
    const powerball = isPB ? currentNumbers[7] : undefined;

    if (isPB) {
      if (n <= 35) { // Main number clicked
        const updatedMain = mainNumbers.includes(n) ? mainNumbers.filter(num => num !== n) : [...mainNumbers, n];
        if (updatedMain.length > 7) return;
        setCurrentNumbers([...updatedMain.sort((a,b)=>a-b), powerball || 0]);
      } else { // Powerball clicked
        setCurrentNumbers([...mainNumbers, n]);
      }
    } else {
      const max = game === 'Oz Lotto' ? 7 : 6;
      const updatedNumbers = currentNumbers.includes(n) ? currentNumbers.filter(num => num !== n) : [...currentNumbers, n];
      if (updatedNumbers.length > max) return;
      setCurrentNumbers(updatedNumbers.sort((a,b)=>a-b));
    }
  };

  const handleSaveTicket = async () => {
    if (!user) { router.push('/login'); return; }
    const required = game === 'Powerball' ? 8 : game === 'Oz Lotto' ? 7 : 6;
    if (currentNumbers.length < required) { alert(`Please select all ${required} numbers.`); return; }
    if (!isPremium && myTickets.filter(t => t.drawDate === selectedDate).length >= FREE_TICKET_LIMIT) {
      alert("Free tier limit reached for this draw."); return;
    }
    const { data, error } = await supabase.from('tickets').insert([{ user_id: user.id, draw_date: selectedDate, numbers: currentNumbers, game: game }]).select();
    if (!error && data) {
      setMyTickets([{ id: data[0].id, drawDate: data[0].draw_date, numbers: data[0].numbers, game: data[0].game }, ...myTickets]);
      setCurrentNumbers([]);
    }
  };
  
  // Other handlers remain the same...
  const handleQuickPick = () => setCurrentNumbers(generateQuickPick(game));
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
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16">
        {/* ... Header and Game Selection ... */}
        <div className="grid lg:col-span-12 grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
          <div className="lg:col-span-5 ...">
            {/* Number Picker Section */}
            <div className={`...`}>
              {/* ... Draw Date Selection ... */}
              <div className="mt-10 sm:mt-12 space-y-8">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-sm font-black ...">Choose Numbers</h3>
                  <button onClick={handleQuickPick} className={`${brandStyles.text} ...`}>Quick Pick</button>
                </div>
                {/* This is the part that caused error, now replaced with a working version */}
                <NumberGrid game={game} selectedNumbers={currentNumbers} onNumberClick={handleNumberClick} brandColor={brandColor} />
              </div>
              {/* ... Free Tier & Save buttons ... */}
            </div>
          </div>
          <div className="lg:col-span-7 space-y-8 sm:space-y-10 ...">
            {/* Auto-Tracker Card - THIS IS THE PART TO MODIFY */}
            <div className={`rounded-[2rem] ... border shadow-xl ... ${!isPremium ? 'grayscale...' : ((autoTrackGames[game] || 0) > 0 ? 'border-amber-400' : 'border-gray-100')}`}>
              <div className="flex justify-between items-start mb-8 sm:mb-10">
                <div>
                  <h3 className="... italic">Auto-Tracker</h3>
                  {/* ... other text ... */}
                </div>
                {!isPremium ? (
                  <Link href="/premium/" className="...">Upgrade</Link>
                ) : (
                  <button 
                    onClick={() => handleUpdateAutoTrack(game, (autoTrackGames[game] || 0) > 0 ? 0 : 10)}
                    disabled={isUpdatingPrefs}
                    className={`w-12 h-7 rounded-full ... ${((autoTrackGames[game] || 0) > 0) ? 'bg-amber-500' : 'bg-gray-200'}`}>
                    <div className={`... ${((autoTrackGames[game] || 0) > 0) ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                )}
              </div>
              {isPremium && (
                <div className="space-y-8 ...">
                  {((autoTrackGames[game] || 0) > 0) && (
                    <div className="space-y-4 ...">
                      <div className="flex justify-between items-center px-1">
                        <label className="...">... Quantity</label>
                        <span className="...">{autoTrackGames[game] || 0} Tickets</span>
                      </div>
                      <input 
                        type="range" min="5" max="100" step="5"
                        value={autoTrackGames[game] || 0} 
                        onChange={(e) => handleUpdateAutoTrack(game, parseInt(e.target.value))}
                        className="w-full accent-amber-500 ..."
                      />
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl ... ${((autoTrackGames[game] || 0) > 0) ? 'bg-amber-50' : 'bg-gray-50'}`}>
                    <p className={`... ${((autoTrackGames[game] || 0) > 0) ? 'text-amber-700' : 'text-gray-400'}`}>
                      {((autoTrackGames[game] || 0) > 0) 
                        ? `We will automatically generate ${autoTrackGames[game]} random tickets...`
                        : `Auto-Tracker is currently disabled for ${game}.`}
                    </p>
                  </div>
                </div>
              )}
              {!isPremium && ( /* Fallback for non-pro users */
                <div className="..."><p>...</p></div>
              )}
            </div>
            {/* "Your Archive" Section - This needs to be the original correct version */}
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] ...">
              {/* ... Header ... */}
              {isDataLoading ? (
                <div className="py-20 text-center animate-pulse ...">...</div>
              ) : myTickets.length === 0 ? (
                <div className="py-20 sm:py-32 text-center">...</div>
              ) : (
                <div className="space-y-4">
                  {Array.from(new Set(myTickets.map(t => t.drawDate))).map(date => {
                    const ticketsForDate = myTickets.filter(t => t.drawDate === date);
                    const result = drawResultsList.find(r => r.drawDate === date && r.game === game);
                    return (
                      <div key={date} className="border ...">
                        {/* ... Date Header ... */}
                        <div className="px-5 sm:px-6 pb-6 space-y-3 ...">
                          {ticketsForDate.map((ticket) => {
                            const comparison = result ? compareNumbers(ticket.numbers, result.numbers, result.bonus, ticket.game as any) : null;
                            return (
                              <div key={ticket.id} className="flex items-center ...">
                                <div className="flex flex-wrap ...">
                                  {ticket.numbers.map((n, i) => {
                                    const isMatch = result?.numbers.includes(n);
                                    const isBonusMatch = comparison?.matchedBonusNumbers.includes(n);
                                    return <span key={i} className={`... ${isMatch ? brandStyles.bg : '...'} ...`}>{n}</span>;
                                  })}
                                </div>
                                {/* ... Prize tier and delete button ... */}
                              </div>
                            );
                          })}
                        </div>
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
    <Suspense fallback={<div>Loading...</div>}>
      <LuckContent />
    </Suspense>
  );
}
