'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface UserPreferences {
  email_notifications: boolean;
  email_results: boolean;
  auto_track_qty: number;
  is_auto_track_enabled: boolean;
}

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, isPremium, upgradeToPro } = useAuth();
  const [prefs, setPreferences] = useState<UserPreferences>({
    email_notifications: true,
    email_results: true,
    auto_track_qty: 0,
    is_auto_track_enabled: false,
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
      .select('email_notifications, email_results, auto_track_qty, is_auto_track_enabled')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (data) {
      setPreferences({
        email_notifications: data.email_notifications ?? true,
        email_results: data.email_results ?? true,
        auto_track_qty: data.auto_track_qty ?? 0,
        is_auto_track_enabled: data.is_auto_track_enabled ?? false
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
      .upsert({ user_id: user?.id, ...updated });

    if (error) {
      console.error('Error updating preferences:', error.message);
      alert('Failed to save preferences.');
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
                <div className="flex items-center justify-between">
                  <div className="text-left pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-base">Auto-Tracker</h3>
                      <span className="text-[8px] font-black bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-md">PRO</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Automatically track every new game.</p>
                  </div>
                  <button 
                    onClick={() => isPremium && handleUpdate('is_auto_track_enabled', !prefs.is_auto_track_enabled)}
                    disabled={isSubmitting || !isPremium}
                    className={`w-14 h-8 rounded-full transition-colors relative flex-shrink-0 ${prefs.is_auto_track_enabled ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-800'}`}
                  >
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${prefs.is_auto_track_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {isPremium && prefs.is_auto_track_enabled && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Tickets per draw: {prefs.auto_track_qty}</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="50" 
                      value={prefs.auto_track_qty} 
                      onChange={(e) => handleUpdate('auto_track_qty', parseInt(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full appearance-none cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-400 font-medium italic text-left">
                      Our systems will generate random tickets for you as soon as new draws are announced.
                    </p>
                  </div>
                )}

                {!isPremium && (
                  <div className="bg-amber-50 dark:bg-amber-500/10 p-6 rounded-3xl border border-amber-100 dark:border-amber-500/20 text-center space-y-4">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                      Upgrade to PRO to unlock the <strong>Auto-Tracker</strong>. Never miss a draw again!
                    </p>
                    <button 
                      onClick={upgradeToPro}
                      className="w-full py-3 bg-amber-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-amber-200 dark:shadow-none hover:bg-amber-600 transition-all cursor-pointer"
                    >
                      Upgrade to PRO
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-gray-50 dark:bg-white/5 text-center flex-shrink-0 border-t border-gray-100 dark:border-white/5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
            Preferences are synced across all your devices.
          </p>
        </div>
      </div>
    </div>
  );
}
