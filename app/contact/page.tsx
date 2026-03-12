'use client';

import { useState } from 'react';
import Navbar from '../../components/Navbar';

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');
    
    try {
      const response = await fetch('/api/contact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        const err = await response.json();
        throw new Error(err.error || 'Failed to send message');
      }
    } catch (err: any) {
      console.error('Submission Error:', err);
      setStatus('error');
      alert(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-500">
      <Navbar />
      
      <main className="max-w-5xl mx-auto py-20 sm:py-32 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          
          {/* Left: Info */}
          <div className="text-left">
            <h2 className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.4em] text-[10px] mb-4">Get in Touch</h2>
            <h1 className="text-5xl sm:text-7xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic leading-none mb-10">Contact <span className="text-gray-400">Support</span></h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 font-medium mb-12 leading-relaxed">
              Have questions about your subscription, a technical issue, or a suggestion for a new feature? Our team is here to help.
            </p>

            <div className="space-y-10">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-900 shadow-lg flex items-center justify-center text-indigo-500 border border-gray-100 dark:border-white/5">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Us</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white italic">support@whatiflotto.com</p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-900 shadow-lg flex items-center justify-center text-amber-500 border border-gray-100 dark:border-white/5">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Response Time</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white italic">Within 24-48 Hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-10 sm:p-12 border border-gray-100 dark:border-white/5 shadow-2xl relative overflow-hidden">
            {status === 'success' ? (
              <div className="py-20 text-center animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
                  <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic mb-4">Message Sent!</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">Thanks for reaching out. We'll get back to you shortly.</p>
                <button onClick={() => setStatus('idle')} className="text-indigo-500 font-black uppercase text-xs tracking-widest border-b-2 border-indigo-500 pb-1">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Name</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Your Name" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 sm:p-5 font-bold text-gray-900 dark:text-white outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email</label>
                    <input 
                      required 
                      type="email" 
                      placeholder="email@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 sm:p-5 font-bold text-gray-900 dark:text-white outline-none transition-all" 
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Subject</label>
                  <select 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 sm:p-5 font-bold text-gray-900 dark:text-white outline-none transition-all cursor-pointer appearance-none"
                  >
                    <option>General Inquiry</option>
                    <option>Billing & Subscription</option>
                    <option>Technical Issue</option>
                    <option>Feature Suggestion</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Message</label>
                  <textarea 
                    required 
                    rows={5} 
                    placeholder="How can we help you?" 
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 sm:p-5 font-bold text-gray-900 dark:text-white outline-none transition-all resize-none"
                  ></textarea>
                </div>
                
                <button 
                  disabled={status === 'sending'}
                  className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
