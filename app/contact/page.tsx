'use client';

import Navbar from '../../components/Navbar';

export default function ContactPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 animate-in fade-in slide-in-from-top-8 duration-1000">
          Get in <span className="text-indigo-600 dark:text-indigo-400 italic">Touch</span>
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium mb-20">
          Have questions about our simulation engine or suggestions for new features? We'd love to hear from you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
          <section className="bg-gray-50 dark:bg-white/5 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-inner transition-all hover:scale-[1.02] duration-500">
            <h2 className="text-2xl font-black mb-6 uppercase italic tracking-tight">Support & Feedback</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-10 leading-relaxed">
              Our team is dedicated to providing the most accurate lottery simulation experience in Australia. If you encounter any data discrepancies or technical issues, please reach out.
            </p>
            <div className="space-y-4">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Address</p>
              <a href="mailto:support@whatiflotto.com" className="text-xl font-black text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition-opacity">support@whatiflotto.com</a>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-xl transition-all hover:scale-[1.02] duration-500">
            <h2 className="text-2xl font-black mb-6 uppercase italic tracking-tight">Business Inquiries</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-10 leading-relaxed">
              For partnership opportunities, media inquiries, or data integration requests, please contact our administrative department.
            </p>
            <div className="space-y-4">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">General Inquiries</p>
              <a href="mailto:hello@whatiflotto.com" className="text-xl font-black text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition-opacity">hello@whatiflotto.com</a>
            </div>
          </section>
        </div>

        <div className="mt-32 p-12 bg-gray-950 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -ml-32 -mt-32" />
            <h3 className="text-3xl font-black mb-6 tracking-tight uppercase">Address</h3>
            <p className="text-gray-400 text-lg font-medium max-w-sm mx-auto leading-relaxed italic">
                WhatIFLotto Australia <br />
                Sydney, Australia <br />
               
            </p>
        </div>
      </main>
    </div>
  );
}
