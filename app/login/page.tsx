'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

type AuthMode = 'signin' | 'signup' | 'reset';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp({ email, password });
        if (error) throw error;
        setMessage('Verification link sent! Check your email to confirm registration.');
      } else if (mode === 'signin') {
        const { error } = await signIn({ email, password });
        if (error) throw error;
        router.push('/luck');
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setMessage('Password reset link sent! Please check your email.');
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

  const getTitle = () => {
    if (mode === 'signin') return 'Welcome Back';
    if (mode === 'signup') return 'Create Account';
    return 'Reset Password';
  };

  const getSubtitle = () => {
    if (mode === 'signin') return 'Sign in to access your saved lucky numbers and history.';
    if (mode === 'signup') return 'Join WhatIFLotto to track your luck risk-free across any device.';
    return 'Enter your email and we\'ll send you a link to reset your password.';
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 selection:bg-indigo-500 selection:text-white transition-colors duration-500">
      <Navbar />
      
      <div className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/5 p-10 md:p-14 relative z-10 animate-in fade-in zoom-in-95 duration-700">
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-4 italic">{getTitle()}</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              {getSubtitle()}
            </p>
          </div>
          
          <div className="space-y-8">
            {mode !== 'reset' && (
              <>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 flex items-center justify-center gap-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/10 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 transform active:scale-95 disabled:opacity-50 shadow-sm font-black uppercase tracking-widest text-xs"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/></svg>
                  <span className="text-gray-700 dark:text-white">Continue with Google</span>
                </button>
                
                <div className="flex items-center">
                  <div className="flex-grow border-t border-gray-100 dark:border-white/5"></div>
                  <span className="flex-shrink mx-4 text-gray-300 dark:text-gray-600 text-[10px] font-black uppercase tracking-widest">Or email</span>
                  <div className="flex-grow border-t border-gray-100 dark:border-white/5"></div>
                </div>
              </>
            )}

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  className="w-full p-5 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl text-gray-900 dark:text-white outline-none transition-all font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {mode !== 'reset' && (
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center pr-4">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4" htmlFor="password">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button 
                        type="button"
                        onClick={() => setMode('reset')}
                        className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <input
                    id="password"
                    className="w-full p-5 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl text-gray-900 dark:text-white outline-none transition-all font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 p-4 rounded-xl border border-red-100 dark:border-red-500/20 animate-in fade-in slide-in-from-top-2">
                  <p className="text-red-500 text-xs font-bold text-left italic">Error: {error}</p>
                </div>
              )}
              
              {message && (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20 animate-in fade-in slide-in-from-top-2">
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs font-bold text-left italic">{message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 transition-all duration-300 transform active:scale-95 disabled:opacity-50 shadow-xl shadow-indigo-500/20 uppercase tracking-widest text-sm relative overflow-hidden"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing...
                  </span>
                ) : (
                  mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'
                )}
              </button>
            </form>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/5 text-center">
            {mode === 'signin' ? (
              <p className="text-sm font-bold text-gray-400">
                New to WhatIFLotto?{' '}
                <button onClick={() => setMode('signup')} className="text-indigo-500 hover:underline">Sign Up Free</button>
              </p>
            ) : (
              <p className="text-sm font-bold text-gray-400">
                Back to basics?{' '}
                <button onClick={() => setMode('signin')} className="text-indigo-500 hover:underline">Sign In Instead</button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
