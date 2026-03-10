'use client';

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
  }
];

export default function BlogPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-6 py-24">
        <header className="text-center mb-24 animate-in fade-in slide-in-from-top-8 duration-1000">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-8 leading-tight">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500 dark:from-indigo-400 dark:to-emerald-400">Knowledge</span> Base
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto font-medium leading-relaxed">
            In-depth analysis, historical archives, and mathematical guides to the Australian lottery landscape.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {posts.map((post, i) => (
            <article key={post.slug} className="group flex flex-col bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-xl overflow-hidden hover:-translate-y-2 transition-all duration-500">
              <div className={`h-64 ${post.bg} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10 group-hover:scale-110 transition-transform duration-1000 bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:20px_20px]" />
                <span className="text-6xl group-hover:rotate-12 transition-transform duration-500">
                    {post.category === 'Analysis' ? '📊' : post.category === 'History' ? '🇦🇺' : '🛡️'}
                </span>
              </div>
              <div className="p-10 flex-grow flex flex-col text-left">
                <div className="flex items-center gap-4 mb-6">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${post.bg} ${post.color}`}>{post.category}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{post.date}</span>
                </div>
                <h2 className="text-2xl font-black mb-6 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                  {post.title}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                <Link href={`/blog/${post.slug}`} className="mt-auto inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white border-b-2 border-black/10 dark:border-white/10 hover:border-indigo-500 pb-1 w-fit transition-all">
                  Read Full Article
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter / Static Content */}
        <section className="mt-40 bg-gray-950 rounded-[4rem] p-12 md:p-20 text-white shadow-2xl relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -mr-48 -mt-48" />
            <div className="relative z-10 max-w-2xl mx-auto text-center">
                <h2 className="text-4xl font-black mb-8 uppercase tracking-tighter italic">Stay Informed</h2>
                <p className="text-gray-400 text-lg mb-12 font-medium leading-relaxed">
                    We regularly update our knowledge base with the latest statistical trends and historical analysis of Australian lotto games. Join our community of data-driven players.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <input type="email" placeholder="Enter your email" className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-8 py-5 outline-none focus:border-indigo-500 transition-all font-medium text-white placeholder:text-gray-600" />
                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest px-10 py-5 rounded-2xl transition-all shadow-xl active:scale-95">Subscribe</button>
                </div>
            </div>
        </section>
      </main>
    </div>
  );
}
