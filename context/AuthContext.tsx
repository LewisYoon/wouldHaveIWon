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
  const initialized = useRef(false);

  const fetchPremiumStatus = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('is_premium')
        .eq('user_id', userId)
        .maybeSingle();
      
      setIsPremium(!!data?.is_premium);
    } catch (err) {
      console.error("Premium check error:", err);
      setIsPremium(false);
    }
  }, []);

  const refreshPremiumStatus = useCallback(async () => {
    if (user) await fetchPremiumStatus(user.id);
  }, [user, fetchPremiumStatus]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 초기 세션 동기 확인
    const setupAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const initialUser = session?.user ?? null;
        
        if (initialUser) {
          setUser(initialUser);
          await fetchPremiumStatus(initialUser.id);
        }
      } catch (err) {
        console.error("Auth setup error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    setupAuth();

    // 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      
      // 유저가 바뀌었을 때만 로직 실행 (무한 루프 핵심 방지)
      if (currentUser?.id !== user?.id) {
        setUser(currentUser);
        if (currentUser) {
          await fetchPremiumStatus(currentUser.id);
        } else {
          setIsPremium(false);
        }
      }

      if (event === 'SIGNED_IN' && window.location.pathname === '/login') {
        router.push('/luck');
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, fetchPremiumStatus, router]);

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
