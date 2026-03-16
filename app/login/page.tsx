'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

type AuthMode = 'signin' | 'signup' | 'reset' | 'update';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/luck';

  // 비밀번호 재설정 링크 감지
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery'))) {
      setMode('update');
      setMessage("Please enter your new password below.");
    }
  }, []);

  // 실시간 인증 상태 동기화 (PC-모바일 연동)
  useEffect(() => {
    if (mode === 'signup' && message && email) {
      const channel = supabase.channel(`auth-sync:${email.toLowerCase()}`)
        .on('broadcast', { event: 'verified' }, () => {
          console.log("Cross-device verification detected!");
          setMode('signin');
          setMessage("Email verified! You can now sign in with your password.");
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [mode, message, email]);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);
  const strengthColor = strength <= 1 ? 'bg-red-500' : strength === 2 ? 'bg-orange-500' : strength === 3 ? 'bg-blue-500' : 'bg-emerald-500';
  const strengthText = strength <= 1 ? 'Weak' : strength === 2 ? 'Fair' : strength === 3 ? 'Good' : 'Strong';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (mode === 'signup' || mode === 'update') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes('already registered')) {
            throw new Error('This email is already registered. Please sign in instead.');
          }
          throw error;
        }
        setMessage('Verification link sent! Check your email to confirm registration.');
      } else if (mode === 'signin') {
        const { error } = await signIn({ email, password });
        if (error) throw error;
        
        // [강조] 로그인이 성공하면 명시적으로 returnTo로 이동
        console.log(`LoginForm: Redirecting to ${returnTo}`);
        router.push(returnTo);
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setMessage('Password reset link sent! Please check your email.');
      } else if (mode === 'update') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage('Password updated successfully! You can now sign in.');
        setTimeout(() => setMode('signin'), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col lg:flex-row">
      {/* Left Section: Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 dark:bg-indigo-950 relative overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        <div className="relative z-10 max-w-lg text-left">
          <h2 className="text-white/60 font-black uppercase tracking-[0.4em] text-xs mb-8">WhatIFLotto Australia</h2>
          <h1 className="text-6xl xl:text-7xl font-black text-white uppercase tracking-tighter italic leading-[0.9] mb-10">
            Track Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">Fortune</span> <br />
            Risk-Free.
          </h1>
          <div className="space-y-8 mt-16">
            {[
              { title: 'Real-Time Tracking', desc: 'Auto-sync with official Oz, Powerball, and Tatts results.' },
              { title: 'Advanced Analytics', desc: 'Visualize the financial impact of your simulation.' },
              { title: 'PRO Auto-Tracker', desc: 'Never miss a draw with automatic ticket generation.' }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 items-start group">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white font-black text-xl group-hover:bg-white group-hover:text-indigo-600 transition-all duration-500 shadow-xl">{idx + 1}</div>
                <div>
                  <h4 className="text-white font-black uppercase tracking-tight text-lg mb-1">{item.title}</h4>
                  <p className="text-indigo-100/60 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Section: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-20 bg-gray-50 dark:bg-gray-950 relative">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-1000">
          <div className="text-left mb-12">
            <h3 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic mb-4">
              {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Join Now' : mode === 'reset' ? 'Reset' : 'Update'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {mode === 'signin' ? 'Welcome back. Access your tracked luck.' : mode === 'signup' ? 'Start your risk-free journey today.' : mode === 'reset' ? 'Recover your account access.' : 'Secure your account with a new password.'}
            </p>
          </div>

          <div className="space-y-8">
            {mode !== 'reset' && mode !== 'update' && (
              <>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 flex items-center justify-center gap-4 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-white/5 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-300 transform active:scale-95 disabled:opacity-50 shadow-sm font-black uppercase tracking-widest text-xs text-gray-700 dark:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/></svg>
                  Continue with Google
                </button>
                <div className="flex items-center">
                  <div className="flex-grow border-t border-gray-200 dark:border-white/5"></div>
                  <span className="flex-shrink mx-6 text-gray-300 dark:text-gray-700 text-[10px] font-black uppercase tracking-widest">Or Secure Login</span>
                  <div className="flex-grow border-t border-gray-200 dark:border-white/5"></div>
                </div>
              </>
            )}

            <form onSubmit={handleAuth} className="space-y-6">
              {mode !== 'update' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Email</label>
                  <input
                    required type="email" placeholder="name@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-5 bg-white dark:bg-gray-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-base text-gray-900 dark:text-white outline-none transition-all font-bold shadow-sm"
                  />
                </div>
              )}

              {mode !== 'reset' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{mode === 'update' ? 'New Password' : 'Password'}</label>
                    {mode === 'signin' && (
                      <button type="button" onClick={() => setMode('reset')} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline">Forgot?</button>
                    )}
                  </div>
                  <input
                    required type="password" placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    className="w-full p-5 bg-white dark:bg-gray-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-base text-gray-900 dark:text-white outline-none transition-all font-bold shadow-sm"
                  />
                  {(mode === 'signup' || mode === 'update') && password.length > 0 && (
                    <div className="px-1 pt-2 animate-in fade-in slide-in-from-top-1">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Strength: <span className={strengthColor.replace('bg-', 'text-')}>{strengthText}</span></p>
                      </div>
                      <div className="h-1 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className={`h-full flex-1 transition-all duration-500 ${i <= strength ? strengthColor : 'bg-transparent'}`} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(mode === 'signup' || mode === 'update') && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-500">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">{mode === 'update' ? 'Confirm New Password' : 'Confirm Password'}</label>
                  <input
                    required type="password" placeholder="••••••••" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-5 bg-white dark:bg-gray-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-base text-gray-900 dark:text-white outline-none transition-all font-bold shadow-sm"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 p-4 rounded-2xl border border-red-100 dark:border-red-500/20 text-red-500 text-xs font-bold italic">
                  {error}
                </div>
              )}
              
              {message && (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold italic">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all duration-300 transform active:scale-95 disabled:opacity-50 shadow-xl shadow-indigo-500/20 uppercase tracking-widest text-sm"
              >
                {isSubmitting ? 'Syncing...' : (mode === 'signin' ? 'Access Account' : mode === 'signup' ? 'Create Profile' : mode === 'reset' ? 'Send Recovery Link' : 'Set New Password')}
              </button>
            </form>

            <div className="pt-10 text-center border-t border-gray-100 dark:border-white/5">
              {mode === 'signin' ? (
                <p className="text-sm font-bold text-gray-400">
                  New member? <button onClick={() => setMode('signup')} className="text-indigo-500 hover:underline">Sign Up Free</button>
                </p>
              ) : (
                <p className="text-sm font-bold text-gray-400">
                  {mode === 'update' ? 'Never mind?' : 'Already registered?'} <button onClick={() => setMode('signin')} className="text-indigo-500 hover:underline">Sign In Instead</button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 selection:bg-indigo-500 selection:text-white transition-colors duration-500 overflow-hidden">
      <Navbar />
      <Suspense fallback={
        <div className="flex-grow flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Syncing environment...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
