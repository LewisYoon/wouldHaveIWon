'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/navigation';

export default function PremiumPage() {
  const { user, isPremium, upgradeToPro, isLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'lifetime'>('monthly');
  const router = useRouter();

  if (isPremium) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="max-w-3xl mx-auto py-40 px-6 text-center">
          <h1 className="text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic mb-6">You're already PRO!</h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 font-medium mb-10">Enjoy your unlimited access and auto-tracker features.</p>
          <button onClick={() => router.push('/luck')} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">Go to My Luck</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 selection:bg-indigo-500 selection:text-white transition-colors duration-500">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-20 sm:py-32 px-6">
        <div className="text-center mb-20 sm:mb-32">
          <h2 className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.4em] text-[10px] sm:text-xs mb-6 animate-in fade-in slide-in-from-bottom-4">Pricing Plans</h2>
          <h1 className="text-5xl sm:text-8xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic leading-none mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700">Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500 dark:from-indigo-400 dark:to-purple-400">Fortune</span></h1>
          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Unlock the full potential of Australian Lotto simulation. No risk, all the math, pure data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Monthly Plan */}
          <div 
            onClick={() => setSelectedPlan('monthly')}
            className={`relative p-10 sm:p-16 rounded-[3rem] border-2 transition-all duration-500 cursor-pointer group ${selectedPlan === 'monthly' ? 'bg-white dark:bg-gray-900 border-indigo-500 shadow-2xl shadow-indigo-500/10 scale-[1.02]' : 'bg-gray-100/50 dark:bg-white/5 border-transparent opacity-60 hover:opacity-100'}`}
          >
            <div className="flex justify-between items-start mb-12">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic mb-2">Monthly</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Subscription</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">$2.99</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Per Month</p>
              </div>
            </div>

            <ul className="space-y-6 mb-16">
              {['Auto-Track Every Game', 'Up to 1,000 Tickets/Draw', 'Detailed Profit Analytics', 'Priority Support'].map((feat) => (
                <li key={feat} className="flex items-center gap-4 text-gray-600 dark:text-gray-300 font-bold text-sm sm:text-base">
                  <svg className="text-indigo-500 flex-shrink-0" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  {feat}
                </li>
              ))}
            </ul>

            {selectedPlan === 'monthly' && (
              <button 
                onClick={(e) => { e.stopPropagation(); upgradeToPro('monthly'); }}
                disabled={isLoading}
                className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Subscribe Now'}
              </button>
            )}
          </div>

          {/* Lifetime Plan */}
          <div 
            onClick={() => setSelectedPlan('lifetime')}
            className={`relative p-10 sm:p-16 rounded-[3rem] border-2 transition-all duration-500 cursor-pointer group ${selectedPlan === 'lifetime' ? 'bg-white dark:bg-gray-900 border-amber-500 shadow-2xl shadow-amber-500/10 scale-[1.02]' : 'bg-gray-100/50 dark:bg-white/5 border-transparent opacity-60 hover:opacity-100'}`}
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">Most Popular</div>
            
            <div className="flex justify-between items-start mb-12">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic mb-2">Lifetime</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">One-time payment</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">$19.99</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Forever</p>
              </div>
            </div>

            <ul className="space-y-6 mb-16">
              {['Everything in Monthly', 'Lifetime Access', 'Never Pay Again', 'Special Founder Badge'].map((feat) => (
                <li key={feat} className="flex items-center gap-4 text-gray-600 dark:text-gray-300 font-bold text-sm sm:text-base">
                  <svg className="text-amber-500 flex-shrink-0" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  {feat}
                </li>
              ))}
            </ul>

            {selectedPlan === 'lifetime' && (
              <button 
                onClick={(e) => { e.stopPropagation(); upgradeToPro('lifetime'); }}
                disabled={isLoading}
                className="w-full py-5 bg-amber-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Get Lifetime Access'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-20 text-center">
          <p className="text-sm text-gray-400 font-bold italic">Secure payment processing by Stripe. Cancel monthly anytime.</p>
        </div>
      </main>
    </div>
  );
}
