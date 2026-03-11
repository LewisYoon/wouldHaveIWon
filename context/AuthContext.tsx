'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  const fetchPremiumStatus = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('is_premium')
        .eq('user_id', userId)
        .single();
      
      if (data) {
        setIsPremium(data.is_premium);
      } else if (error && error.code === 'PGRST116') {
        // RLS might be preventing access or row doesn't exist. Default to false.
        console.warn("User preference record not found. Defaulting to non-premium.");
        setIsPremium(false);
      } else if (error) {
        throw error;
      }
    } catch (err) {
      console.error("Critical error fetching premium status:", err);
      setIsPremium(false); // Default to false on error to prevent locking out users
    }
  }, []);

  const refreshPremiumStatus = useCallback(async () => {
    if (user) await fetchPremiumStatus(user.id);
  }, [user, fetchPremiumStatus]);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      
      setUser(currentUser);
      if (currentUser) {
        await fetchPremiumStatus(currentUser.id);
      } else {
        setIsPremium(false);
      }
      
      setIsLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          if (currentUser) {
             await fetchPremiumStatus(currentUser.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setIsPremium(false);
        }
        
        if (event === 'SIGNED_IN' && window.location.pathname === '/login') {
            router.push('/luck');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, fetchPremiumStatus]);


  const signIn = async (credentials: SignInWithPasswordCredentials) => {
    const { error } = await supabase.auth.signInWithPassword(credentials);
    return { error };
  };

  const signUp = async (credentials: SignUpWithPasswordCredentials) => {
    const { error } = await supabase.auth.signUp(credentials);
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return { error };
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsPremium(false);
    router.push('/');
    setIsLoading(false);
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
