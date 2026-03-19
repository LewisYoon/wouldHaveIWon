import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useUserPreferences(user: any, isAuthLoading: boolean, subscriptionInfo: any, refreshPremiumStatus: () => void) {
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

  const updateAutoTrack = async (gameName: string, qty: number, isPremium: boolean) => {
    if (!user || !isPremium) return;
    const newGames = { ...autoTrackGames, [gameName]: qty };
    setAutoTrackGames(newGames);
    setIsUpdatingPrefs(true);
    const { error } = await supabase.from('user_preferences').upsert({ user_id: user.id, auto_track_games: newGames }, { onConflict: 'user_id' });
    if (!error) refreshPremiumStatus();
    setIsUpdatingPrefs(false);
    return { error };
  };

  return { autoTrackGames, isUpdatingPrefs, updateAutoTrack };
}
