'use client';

import { useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error loading session:', error.message);
        router.push('/login?error=auth_failed');
        return;
      }
      
      if (data.session) {
        router.push('/luck');
      } else {
        // If no session yet, wait a bit or let onAuthStateChange handle it in the context
        // but here we want to make sure we redirect once we're done.
        // Supabase often processes the hash/query params on initialization.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            router.push('/luck');
            subscription.unsubscribe();
          }
        });
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 font-black text-indigo-600 animate-pulse uppercase tracking-widest text-sm">
      Finalizing Authentication...
    </div>
  );
}
