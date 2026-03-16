'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface UserPreferences {
  email_notifications: boolean;
  email_results: boolean;
  auto_track_games: { [key: string]: number };
}

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, isPremium, upgradeToPro, manageSubscription, subscriptionInfo, refreshPremiumStatus } = useAuth();
  const [prefs, setPreferences] = useState<UserPreferences>({
    email_notifications: true,
    email_results: true,
    auto_track_games: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchPreferences();
    }
  }, [isOpen, user]);

  const fetchPreferences = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_preferences')
      .select('email_notifications, email_results, auto_track_games')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (data) {
      setPreferences({
        email_notifications: data.email_notifications ?? true,
        email_results: data.email_results ?? true,
        auto_track_games: data.auto_track_games || {},
      });
    } else if (error) {
      console.error('Error fetching preferences:', error.message);
    }
    setIsLoading(false);
  };

  const handleUpdate = async (field: keyof UserPreferences, value: any) => {
    const updated = { ...prefs, [field]: value };
    setPreferences(updated);
    
    setIsSubmitting(true);
    const { error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: user?.id, ...updated }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating preferences:', error.message);
      alert('Failed to save preferences.');
    } else {
      refreshPremiumStatus();
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 w-full h-full z-[1000000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 w-full h-full bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/5 overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col max-h-[85vh]">
        
        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5 flex-shrink-0">
          <h2 className="text-xl font-black uppercase tracking-tighter italic text-gray-900 dark:text-white leading-none">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-10 space-y-10 overflow-y-auto">
          {isLoading ? (
            <div className="py-10 text-center animate-pulse">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading preferences...</p>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="flex items-center justify-between group">
                <div className="text-left pr-4">
                  <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1 text-base">Draw Reminders</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Get notified before the big draws.</p>
                </div>
                <button 
                  onClick={() => handleUpdate('email_notifications', !prefs.email_notifications)}
                  disabled={isSubmitting}
                  className={`w-14 h-8 rounded-full transition-colors relative flex-shrink-0 ${prefs.email_notifications ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${prefs.email_notifications ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between group">
                <div className="text-left pr-4">
                  <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1 text-base">Draw Results</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">See how your numbers did instantly.</p>
                </div>
                <button 
                  onClick={() => handleUpdate('email_results', !prefs.email_results)}
                  disabled={isSubmitting}
                  className={`w-14 h-8 rounded-full transition-colors relative flex-shrink-0 ${prefs.email_results ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${prefs.email_results ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Premium Auto-Tracker Section */}
              <div className={`pt-8 border-t border-gray-100 dark:border-white/5 space-y-8 ${!isPremium ? 'opacity-50 grayscale' : ''}`}>
                {isPremium && subscriptionInfo && (
                  <div className="bg-indigo-50/50 dark:bg-indigo-500/5 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-500/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Membership Status</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${subscriptionInfo.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                        {subscriptionInfo.planType === 'lifetime' ? 'Lifetime' : (subscriptionInfo.status || 'Active')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">{subscriptionInfo.planType === 'lifetime' ? 'Status' : 'Next Billing / Expiry'}</p>
                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                          {subscriptionInfo.planType === 'lifetime' ? 'Permanent' : (subscriptionInfo.currentPeriodEnd ? new Date(subscriptionInfo.currentPeriodEnd).toLocaleDateString() : 'N/A')}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Auto-Renew</p>
                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                          {subscriptionInfo.planType === 'monthly' ? (subscriptionInfo.cancelAtPeriodEnd ? 'OFF' : 'ON') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="text-left pr-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-base">Auto-Tracker</h3>
                      <span className="text-[8px] font-black bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-md">PRO</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Automatically track new games. Set ticket quantities per game.</p>
                  </div>
                </div>

                {isPremium && (
                  <div className="space-y-8 animate-in slide-in-from-top-2 duration-300">
                    {['Oz Lotto', 'Powerball', 'Tatts Lotto'].map(game => {
                      const isEnabled = (prefs.auto_track_games?.[game] || 0) > 0;
                      const currentQty = prefs.auto_track_games?.[game] || 0;

                      return (
                        <div key={game} className="space-y-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-amber-500/20 transition-all">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">{game}</label>
                            <button 
                              onClick={() => {
                                const newQty = isEnabled ? 0 : 10; // 켜질 때 기본값 10
                                const newGames = { ...prefs.auto_track_games, [game]: newQty };
                                handleUpdate('auto_track_games', newGames);
                              }}
                              disabled={isSubmitting}
                              className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${isEnabled ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-800'}`}
                            >
                              <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                          
                          {isEnabled && (
                            <div className="pt-2 animate-in zoom-in-95 duration-200">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter">Quantity per draw</span>
                                <span className="text-xs font-black text-gray-900 dark:text-white">{currentQty} Tickets</span>
                              </div>
                              <input 
                                type="range" 
                                min="5" 
                                max="50" 
                                step="5"
                                value={currentQty} 
                                onChange={(e) => {
                                  const newGames = { ...prefs.auto_track_games, [game]: parseInt(e.target.value) };
                                  handleUpdate('auto_track_games', newGames);
                                }}
                                className="w-full accent-amber-500 h-1 bg-gray-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <p className="text-[10px] text-gray-400 font-medium italic text-left px-2">
                      Auto-Tracker generates quick picks for you before every official draw.
                    </p>
                  </div>
                )}

                {!isPremium && (
                  <div className="bg-amber-50 dark:bg-amber-500/10 p-6 rounded-3xl border border-amber-100 dark:border-amber-500/20 text-center space-y-4">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                      Upgrade to PRO to unlock the <strong>Auto-Tracker</strong>. Never miss a draw again!
                    </p>
                    <Link 
                      href="/premium/"
                      onClick={onClose}
                      className="block w-full py-3 bg-amber-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-amber-200 dark:shadow-none hover:bg-amber-600 transition-all text-center"
                    >
                      View Pricing Plans
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-gray-50 dark:bg-white/5 text-center flex-shrink-0 border-t border-gray-100 dark:border-white/5 space-y-4">
          {isPremium && (
            <Link 
              href="/billing/"
              onClick={onClose}
              className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline cursor-pointer block w-full mb-2"
            >
              Manage Billing & Subscription
            </Link>
          )}
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
            Preferences are synced across all your devices.
          </p>
        </div>
      </div>
    </div>
  );
}
