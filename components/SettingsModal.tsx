'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface UserPreferences {
  email_notifications: boolean;
  email_results: boolean;
}

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [prefs, setPreferences] = useState<UserPreferences>({
    email_notifications: true,
    email_results: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchPreferences();
    }
  }, [isOpen, user]);

  const fetchPreferences = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_preferences')
      .select('email_notifications, email_results')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (data) {
      setPreferences(data);
    } else if (error) {
      console.error('Error fetching preferences:', error.message);
    }
    setIsLoading(false);
  };

  const handleUpdate = async (field: keyof UserPreferences, value: boolean) => {
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
          <h2 className="text-xl font-black uppercase tracking-tighter italic">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-10 space-y-10">
          {isLoading ? (
            <div className="py-10 text-center animate-pulse">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading preferences...</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between group">
                <div className="text-left">
                  <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">Draw Reminders</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Get notified before the big draws.</p>
                </div>
                <button 
                  onClick={() => handleUpdate('email_notifications', !prefs.email_notifications)}
                  disabled={isSaving}
                  className={`w-14 h-8 rounded-full transition-colors relative ${prefs.email_notifications ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${prefs.email_notifications ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between group">
                <div className="text-left">
                  <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">Draw Results</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">See how your numbers did instantly.</p>
                </div>
                <button 
                  onClick={() => handleUpdate('email_results', !prefs.email_results)}
                  disabled={isSubmitting}
                  className={`w-14 h-8 rounded-full transition-colors relative ${prefs.email_results ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-800'}`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${prefs.email_results ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-gray-50 dark:bg-white/5 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
            Preferences are synced across all your devices.
          </p>
        </div>
      </div>
    </div>
  );
}
