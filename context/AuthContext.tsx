'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, AuthError, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isPremium: boolean;
  subscriptionInfo: {
    status: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    planType: string | null;
  } | null;
  signIn: (credentials: SignInWithPasswordCredentials) => Promise<{ error: AuthError | null }>;
  signUp: (credentials: SignUpWithPasswordCredentials) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  upgradeToPro: (planType?: 'monthly' | 'lifetime') => Promise<void>;
  manageSubscription: () => Promise<void>;
  refreshPremiumStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<AuthContextType['subscriptionInfo']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchPremiumStatus = useCallback(async (userId: string, retryCount = 0) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('is_premium, subscription_status, current_period_end, cancel_at_period_end, plan_type')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Premium check error:", error);
        // RLS error인 경우 재시도 (최대 1회)
        if (retryCount < 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
          return fetchPremiumStatus(userId, retryCount + 1);
        }
        setIsPremium(false);
        return;
      }
      
      // 만약 data가 null인데 user는 있는 경우, RLS 때문에 못 가져왔을 가능성이 있음
      if (!data && retryCount < 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchPremiumStatus(userId, retryCount + 1);
      }

      if (data) {
        const isPremiumUser = !!data.is_premium;
        console.log(`Premium Status for ${userId}:`, isPremiumUser);

        setIsPremium(isPremiumUser);
        setSubscriptionInfo({
          status: data.subscription_status || null,
          currentPeriodEnd: data.current_period_end || null,
          cancelAtPeriodEnd: !!data.cancel_at_period_end,
          planType: data.plan_type || (isPremiumUser ? 'monthly' : null), // Fallback to monthly if premium but type is missing
        });
      }
 else {
        console.log(`No preferences found for ${userId}, defaulting to non-premium.`);
        setIsPremium(false);
        setSubscriptionInfo(null);
      }
    } catch (err) {
      console.error("Premium check unexpected error:", err);
      setIsPremium(false);
    }
  }, []);

  const refreshPremiumStatus = useCallback(async () => {
    if (user) await fetchPremiumStatus(user.id);
  }, [user, fetchPremiumStatus]);

  useEffect(() => {
    let mounted = true;

    // 1. 로딩 세이프티 타이머 (최대 2초 후에는 무조건 로딩 해제)
    const failsafeTimer = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 2000);

    // 2. 초기 세션 체크
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        const initialUser = session?.user ?? null;
        setUser(initialUser);

        if (initialUser) {
          // 프리미엄 체크는 백그라운드에서 수행 (await 하지 않음)
          fetchPremiumStatus(initialUser.id);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // 3. 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        fetchPremiumStatus(currentUser.id);
      } else {
        setIsPremium(false);
      }

      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        setIsLoading(false);
      }

      if (event === 'SIGNED_IN' && window.location.pathname === '/login') {
        router.push('/luck');
      }

      // 결제 성공 후 돌아온 경우 즉시 상태 갱신 시도 (약간의 지연시간 부여하여 웹훅 처리 대기)
      if (currentUser && typeof window !== 'undefined' && (window.location.search.includes('session_id=') || window.location.search.includes('source=stripe'))) {
        console.log("Stripe return detected, refreshing status with delay...");
        setTimeout(() => {
          fetchPremiumStatus(currentUser.id);
        }, 3000); // 3초 대기 (웹훅과 DB 동기화 충분히 보장)
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(failsafeTimer);
    };
  }, [fetchPremiumStatus, router]);

  const signIn = async (credentials: SignInWithPasswordCredentials) => {
    return await supabase.auth.signInWithPassword(credentials);
  };

  const signUp = async (credentials: SignUpWithPasswordCredentials) => {
    return await supabase.auth.signUp(credentials);
  };

  const signInWithGoogle = async () => {
    // Determine the redirect URL dynamically based on current location
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/luck/` : '';
    
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
      },
    });
  };

  const resetPassword = async (email: string) => {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/login/` : '';
    
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsPremium(false);
      router.push('/');
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeToPro = async (planType: 'monthly' | 'lifetime' = 'monthly') => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userEmail: user.email, planType }),
      });

      const { url, error } = await response.json();
      if (error) throw new Error(error);

      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      console.error('Upgrade Error:', err);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const manageSubscription = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/portal/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const { url, error } = await response.json();
      if (error) throw new Error(error);

      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      console.error('Portal Error:', err);
      alert(err.message || 'Failed to open billing portal.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isPremium, subscriptionInfo, signIn, signUp, signInWithGoogle, resetPassword, logout, isLoading, refreshPremiumStatus, upgradeToPro, manageSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
