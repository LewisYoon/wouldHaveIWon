'use client';

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

const posts = [
  {
    slug: 'mathematics-of-powerball',
    title: 'The Mathematics of Powerball: Why 1 in 134 Million Matters',
    excerpt: 'Deep dive into the combinatorics behind Australia\'s biggest jackpot game and what the odds really mean for the average player.',
    date: 'March 8, 2026',
    category: 'Analysis',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10'
  },
  {
    slug: 'history-of-oz-lotto',
    title: 'Oz Lotto: From 6 Numbers to 47 Balls',
    excerpt: 'Exploring the 30-year evolution of Oz Lotto and how format changes have impacted jackpot sizes and winning frequencies.',
    date: 'March 5, 2026',
    category: 'History',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10'
  },
  {
    slug: 'benefits-of-simulation',
    title: 'How Lottery Simulation Can Improve Financial Literacy',
    excerpt: 'Why "playing" for free can provide a powerful psychological reality check and help Australians manage their entertainment budgets better.',
    date: 'March 2, 2026',
    category: 'Education',
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-500/10'
  },
  {
    slug: 'the-gamblers-fallacy-explained',
    title: "The Gambler's Fallacy: Why 'Due' Numbers Don't Exist",
    excerpt: 'Understand why past draw history has no influence on future results and how to avoid the common psychological traps of lottery play.',
    date: 'March 10, 2026',
    category: 'Psychology',
    color: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-500/10'
  },
  {
    slug: 'system-entries-vs-standard',
    title: 'System Entries vs. Standard Games: Is it Worth the Cost?',
    excerpt: 'A comprehensive cost-benefit analysis of Australian System entries. Does the increased probability justify the exponential price hike?',
    date: 'March 12, 2026',
    category: 'Analysis',
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-500/10'
  },
  {
    slug: 'quick-pick-vs-manual-selection',
    title: 'Quick Pick vs. Manual Selection: The Statistical Verdict',
    excerpt: 'Do human-chosen lucky numbers perform better than machine-generated sets? We look at the statistics and the impact of human bias.',
    date: 'March 15, 2026',
    category: 'Statistics',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-500/10'
  },
  {
    slug: 'history-of-lottery-australia',
    title: 'A Brief History of the Lottery in Australia',
    excerpt: 'From funding colonial hospitals to modern multi-million dollar digital draws, discover the cultural impact of lotteries in Australia.',
    date: 'March 18, 2026',
    category: 'History',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10'
  },
  {
    slug: 'understanding-house-edge',
    title: 'Understanding the House Edge in Lottery Games',
    excerpt: 'Learn how the "House Always Wins" applies to the lottery and where your ticket money actually goes in the Australian system.',
    date: 'March 20, 2026',
    category: 'Economics',
    color: 'text-slate-600',
    bg: 'bg-slate-50 dark:bg-slate-500/10'
  },
  {
    slug: 'how-to-read-lotto-stats',
    title: 'How to Read and Interpret Lottery Statistics',
    excerpt: 'Frequency charts, overdue numbers, and standard deviations. A guide to making sense of lottery data without falling for the myths.',
    date: 'March 22, 2026',
    category: 'Guide',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10'
  },
  {
    slug: 'responsible-play-guide',
    title: 'A Guide to Responsible Play and Entertainment',
    excerpt: 'Strategies for keeping lottery play fun and risk-free. Learn how to set boundaries and use simulation as a tool for responsible habits.',
    date: 'March 24, 2026',
    category: 'Education',
    color: 'text-teal-600',
    bg: 'bg-teal-50 dark:bg-teal-500/10'
  }
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  
  const categories = ['All', ...Array.from(new Set(posts.map(p => p.category)))];
  
  const filteredPosts = activeCategory === 'All' 
    ? posts 
    : posts.filter(p => p.category === activeCategory);

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <header className="text-center mb-16 sm:mb-24 animate-in fade-in slide-in-from-top-8 duration-1000">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase tracking-tighter mb-6 sm:mb-8 leading-[0.95] sm:leading-tight">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500 dark:from-indigo-400 dark:to-emerald-400">Knowledge</span> Base
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto font-medium leading-relaxed px-4">
            In-depth analysis, historical archives, and mathematical guides to the Australian lottery landscape.
          </p>
        </header>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-12 sm:mb-20">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2.5 sm:px-8 sm:py-3 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                activeCategory === category 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 scale-105' 
                  : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
          {filteredPosts.map((post) => (
            <article key={post.slug} className="group flex flex-col bg-white dark:bg-gray-900 rounded-[2.5rem] sm:rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-xl overflow-hidden hover:-translate-y-2 transition-all duration-500 text-left">
              <div className={`h-48 sm:h-64 ${post.bg} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10 group-hover:scale-110 transition-transform duration-1000 bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:20px_20px]" />
                <span className="text-5xl sm:text-6xl group-hover:rotate-12 transition-transform duration-500">
                    {post.category === 'Analysis' ? '📊' : post.category === 'History' ? '🇦🇺' : post.category === 'Education' ? '🛡️' : post.category === 'Statistics' ? '🔢' : post.category === 'Psychology' ? '🧠' : '🏷️'}
                </span>
              </div>
              <div className="p-8 sm:p-10 flex-grow flex flex-col text-left">
                <div className="flex items-center gap-4 mb-4 sm:mb-6">
                  <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${post.bg} ${post.color}`}>{post.category}</span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{post.date}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                  {post.title}
                </h2>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium mb-8 sm:mb-10 leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                <Link href={`/blog/${post.slug}`} className="mt-auto inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white border-b-2 border-black/10 dark:border-white/10 hover:border-indigo-500 pb-1 w-fit transition-all">
                  Read Full Article
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              </div>
            </article>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="py-20 text-center bg-gray-50 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-white/10">
            <p className="text-gray-400 font-black italic uppercase tracking-widest">No articles found in this category.</p>
          </div>
        )}

        <section className="mt-24 sm:mt-40 bg-gray-950 rounded-[2.5rem] sm:rounded-[4rem] p-8 sm:p-12 md:p-20 text-white shadow-2xl relative overflow-hidden border border-white/5 mx-2">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -mr-48 -mt-48" />
            <div className="relative z-10 max-w-2xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-black mb-6 sm:mb-8 uppercase tracking-tighter italic">Stay Informed</h2>
                <p className="text-gray-400 text-base sm:text-lg mb-8 sm:mb-12 font-medium leading-relaxed">
                    We regularly update our knowledge base with the latest statistical trends and historical analysis of Australian lotto games. Join our community of data-driven players.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <input type="email" placeholder="Enter your email" className="w-full sm:flex-grow bg-white/5 border border-white/10 rounded-2xl px-6 sm:px-8 py-4 sm:py-5 outline-none focus:border-indigo-500 transition-all font-medium text-white placeholder:text-gray-600 text-sm sm:text-base" />
                    <button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest px-8 sm:px-10 py-4 sm:py-5 rounded-2xl transition-all shadow-xl active:scale-95 text-xs sm:text-sm">Subscribe</button>
                </div>
            </div>
        </section>
      </main>
    </div>
  );
}
