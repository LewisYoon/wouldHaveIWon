import Navbar from '../../components/Navbar';
import { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Contact Us | WhatIFLotto',
  description: 'Get in touch with the WhatIFLotto Australia team for support or inquiries.',
};

export default function ContactPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 selection:bg-indigo-500 selection:text-white transition-colors duration-500">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 py-32 text-center">
        <header className="mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-8 leading-tight">
                Get in <span className="text-indigo-600 dark:text-indigo-400 italic">Touch</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
                Have questions about our simulation logic or need support? We're here to help.
            </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
            <div className="p-12 bg-gray-50 dark:bg-white/5 rounded-[3rem] border border-gray-100 dark:border-white/5 hover:-translate-y-1 transition-all duration-500 group text-left">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/20 group-hover:rotate-12 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <h3 className="text-2xl font-black uppercase mb-2">Email Us</h3>
                <p className="text-gray-500 dark:text-gray-400 font-bold mb-6">General inquiries & support</p>
                <a href="mailto:support@whatiflotto.com" className="text-xl font-black text-indigo-600 dark:text-indigo-400 underline decoration-indigo-500/30 hover:decoration-indigo-500 transition-all">
                    support@whatiflotto.com
                </a>
            </div>

            <div className="p-12 bg-gray-50 dark:bg-white/5 rounded-[3rem] border border-gray-100 dark:border-white/5 hover:-translate-y-1 transition-all duration-500 group text-left">
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/20 group-hover:rotate-12 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                <h3 className="text-2xl font-black uppercase mb-2">Location</h3>
                <p className="text-gray-500 dark:text-gray-400 font-bold mb-6">Proudly Australian</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">
                    Sydney, NSW <br /> Australia
                </p>
            </div>
        </div>

        <div className="max-w-2xl auto pt-16 border-t border-gray-100 dark:border-white/5">
            <p className="text-gray-400 text-lg font-medium leading-relaxed italic">
                "We usually respond within 24-48 business hours. Thank you for using Australia's most advanced risk-free lottery tracker."
            </p>
        </div>
      </main>
    </div>
  );
}
