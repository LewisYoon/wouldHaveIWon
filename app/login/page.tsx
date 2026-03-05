'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await signUp({ email, password });
        if (error) throw error;
        setMessage('Success! Please check your email for a confirmation link to complete your registration.');
      } else {
        const { error } = await signIn({ email, password });
        if (error) throw error;
        router.push('/luck');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred with Google Sign-In.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-white/5 p-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">{isSignUp ? 'Create Account' : 'Sign In'}</h1>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              {isSignUp 
                ? 'Join to permanently save your lucky numbers and track your stats across devices.' 
                : 'Welcome back! Sign in to access your saved numbers and history.'}
            </p>
          </div>
          
          <div className="space-y-6">
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-4 px-6 flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/></svg>
              <span className="font-bold text-gray-700 dark:text-white">Sign in with Google</span>
            </button>
            
            <div className="flex items-center">
              <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase">Or</span>
              <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  className="w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  className="w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
              {message && <p className="text-green-500 text-sm font-bold">{message}</p>}
              <div>
                <button
                  type="submit"
                  className="w-full py-4 px-6 mt-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition uppercase tracking-widest"
                >
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </button>
              </div>
            </form>

          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              className="text-sm font-bold text-indigo-500 hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
