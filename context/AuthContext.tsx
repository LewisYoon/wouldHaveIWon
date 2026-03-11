'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, AuthError, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isPremium: boolean;
  signIn: (credentials: SignInWithPasswordCredentials) => Promise<{ error: AuthError | null }>;
  signUp: (credentials: SignUpWithPasswordCredentials) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshPremiumStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchPremiumStatus = useCallback(async (userId: string, retryCount = 0) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('is_premium')
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

      setIsPremium(!!data?.is_premium);
    } catch (err) {
      console.error("Premium check unexpected error:", err);
      setIsPremium(false);
    }
  }, []);

  const refreshPremiumStatus = useCallback(async () => {
    if (user) await fetchPremiumStatus(user.id);
  }, [user, fetchPremiumStatus]);

  useEffect(() => {
    // 1. 초기 세션 확인 및 구독 설정
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      
      // 유저 상태 업데이트
      setUser(currentUser);
      
      if (currentUser) {
        // 프리미엄 상태 확인
        await fetchPremiumStatus(currentUser.id);
      } else {
        setIsPremium(false);
      }

      if (event === 'SIGNED_IN' && window.location.pathname === '/login') {
        router.push('/luck');
      }

      if (mounted) {
        setIsLoading(false);
      }
    });

    // Supabase Auth의 초기화가 늦어지는 경우를 대비해 수동으로 한번 더 확인 (Fallback)
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted && session?.user) {
        setUser(session.user);
        await fetchPremiumStatus(session.user.id);
        setIsLoading(false);
      } else if (mounted && !session) {
        // onAuthStateChange가 먼저 처리될 것이므로 여기서의 처리는 보조적임
        // 다만 어떤 이유로든 이벤트가 안 올 경우를 대비해 일정 시간 후 로딩 해제
        setTimeout(() => {
          if (mounted) setIsLoading(false);
        }, 2000);
      }
    };

    checkInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchPremiumStatus, router]);

  const signIn = async (credentials: SignInWithPasswordCredentials) => {
    return await supabase.auth.signInWithPassword(credentials);
  };

  const signUp = async (credentials: SignUpWithPasswordCredentials) => {
    return await supabase.auth.signUp(credentials);
  };

  const signInWithGoogle = async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : '',
      },
    });
  };

  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : '',
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

  return (
    <AuthContext.Provider value={{ user, isPremium, signIn, signUp, signInWithGoogle, resetPassword, logout, isLoading, refreshPremiumStatus }}>
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
