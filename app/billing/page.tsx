'use client';

import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BillingPage() {
  const { user, isPremium, subscriptionInfo, manageSubscription, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center py-40">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 selection:bg-indigo-500 selection:text-white transition-colors duration-500">
      <Navbar />
      
      <main className="max-w-4xl mx-auto py-20 px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="text-left">
            <h2 className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.4em] text-[10px] mb-4">Account Management</h2>
            <h1 className="text-5xl sm:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Billing <span className="text-gray-400">&</span> Plan</h1>
          </div>
          <Link href="/dashboard" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-500 transition-colors border-b-2 border-transparent hover:border-indigo-500 pb-1">Back to Stats</Link>
        </div>

        {!isPremium ? (
          <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-12 text-center border border-gray-100 dark:border-white/5 shadow-xl">
            <p className="text-lg text-gray-500 dark:text-gray-400 font-medium mb-8">You are currently on the <span className="font-black text-gray-900 dark:text-white uppercase">Free Tier</span>.</p>
            <Link href="/premium" className="inline-block bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">Upgrade to PRO</Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Current Plan Card */}
            <div className="bg-white dark:bg-gray-900 rounded-[3rem] overflow-hidden border border-gray-100 dark:border-white/5 shadow-xl">
              <div className="p-10 sm:p-16">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12">
                  <div className="text-left">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Active</span>
                      <span className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Current Plan</span>
                    </div>
                    <h3 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                      PRO {subscriptionInfo?.planType === 'lifetime' ? 'Lifetime' : 'Monthly'}
                    </h3>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                      {subscriptionInfo?.planType === 'lifetime' ? '$19.99' : '$2.99'}
                    </p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                      {subscriptionInfo?.planType === 'lifetime' ? 'One-time' : 'per month'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-10 border-y border-gray-100 dark:border-white/5">
                  <div className="text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Next Billing Date</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                      {subscriptionInfo?.currentPeriodEnd ? new Date(subscriptionInfo.currentPeriodEnd).toLocaleDateString('en-AU', { dateStyle: 'long' }) : 'Permanent Access'}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Auto-Renewal</p>
                    <p className={`text-xl font-black uppercase tracking-tight ${subscriptionInfo?.cancelAtPeriodEnd ? 'text-orange-500' : 'text-emerald-500'}`}>
                      {subscriptionInfo?.planType === 'lifetime' ? 'N/A' : (subscriptionInfo?.cancelAtPeriodEnd ? 'Scheduled to End' : 'On (Active)')}
                    </p>
                  </div>
                </div>

                <div className="mt-12 flex flex-wrap gap-4">
                  <button 
                    onClick={manageSubscription}
                    className="flex-1 min-w-[200px] py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-gray-500/10"
                  >
                    Update Payment Method
                  </button>
                  <button 
                    onClick={manageSubscription}
                    className="flex-1 min-w-[200px] py-5 bg-white dark:bg-gray-800 text-red-500 font-black uppercase tracking-widest rounded-2xl border-2 border-red-50 dark:border-red-500/10 hover:bg-red-50 transition-all active:scale-95"
                  >
                    {subscriptionInfo?.cancelAtPeriodEnd ? 'Renew Subscription' : 'Cancel Subscription'}
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-white/5 p-8 text-center border-t border-gray-100 dark:border-white/5">
                <p className="text-[10px] text-gray-400 font-bold italic">
                  All billing operations are securely handled by Stripe. You will be redirected briefly to confirm sensitive changes.
                </p>
              </div>
            </div>

            {/* Feature List Re-confirmation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Auto-Tracker', desc: 'Active' },
                { title: 'Unlimited Sets', desc: 'Unlocked' },
                { title: 'Pro Analytics', desc: 'Enabled' }
              ].map((f) => (
                <div key={f.title} className="bg-white dark:bg-gray-900/50 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{f.title}</p>
                  <p className="text-sm font-black text-indigo-500 uppercase italic">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
