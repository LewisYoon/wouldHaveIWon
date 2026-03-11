import Navbar from '../../../components/Navbar';
import Link from 'next/link';

const postData: Record<string, any> = {
  'mathematics-of-powerball': {
    title: 'The Mathematics of Powerball: Why 1 in 134 Million Matters',
    category: 'Analysis',
    date: 'March 8, 2026',
    content: `
      <p>Australian Powerball is a game of chance that captures the imagination of millions. But behind the glitz and glamour of the jackpot lies a cold, hard mathematical reality. To understand your chances, we need to look at the combinatorics of picking 7 numbers from a pool of 35, plus a Powerball from a pool of 20.</p>
      
      <h3>The Combination Formula</h3>
      <p>The number of ways to choose 7 main numbers from 35 is calculated using the combination formula (35 choose 7), which equals 6,724,520. When you multiply this by the 20 possible Powerball numbers, you arrive at the staggering odds of 1 in 134,490,400.</p>
      
      <h3>Why Does This Matter?</h3>
      <p>Visualizing 134 million is nearly impossible for the human brain. If you were to lay 134 million $1 coins side by side, they would stretch from Sydney to Perth and halfway back again. Only one of those coins is the winner.</p>
      
      <h3>Probability vs. Possibility</h3>
      <p>Many players fall into the "Gambler's Fallacy"—the belief that because a number hasn't come up recently, it is "due." In reality, every draw is an independent event. The machine doesn't remember the previous week. Our simulation engine helps players witness this randomness first-hand, without the financial burden of learning the hard way.</p>
    `
  },
  'history-of-oz-lotto': {
    title: 'Oz Lotto: From 6 Numbers to 47 Balls',
    category: 'History',
    date: 'March 5, 2026',
    content: `
      <p>Oz Lotto has been a cornerstone of Australian culture since its debut in 1994. Originally launched as a 6/45 game, it was indistinguishable from the traditional Saturday Lotto. However, in 2005, the game underwent its first major transformation by adding a 7th number to the main draw.</p>
      
      <h3>The Emerald Evolution</h3>
      <p>The addition of the 7th number wasn't just for show—it drastically increased the odds of winning Division 1, which in turn allowed jackpots to roll over more frequently and reach higher totals. This change created the "Big Jackpot" identity that Oz Lotto is famous for today.</p>
      
      <h3>The 2022 Update</h3>
      <p>In May 2022, the game evolved again. The ball pool was expanded from 45 to 47. While this made the odds of winning harder (moving from 1 in 45 million to 1 in 62 million), it also allowed for even larger prize pools and more winners in the lower divisions.</p>
    `
  },
  'benefits-of-simulation': {
    title: 'How Lottery Simulation Can Improve Financial Literacy',
    category: 'Education',
    date: 'March 2, 2026',
    content: `
      <p>At WhatIFLotto, we believe that simulation is the ultimate educational tool. Traditional gambling warnings often use abstract statistics that fail to resonate. Simulation, however, provides an experiential form of learning.</p>
      
      <h3>Witnessing the House Edge</h3>
      <p>When you use our "Turbo Simulator" to play 1,000 years of lotto in 10 seconds, you see more than just numbers. You see the rapid depletion of your virtual "bankroll." For most players, the simulation ends with a net loss of hundreds of thousands of virtual dollars.</p>
      
      <h3>The Psychological Pivot</h3>
      <p>By shifting the focus from "winning money" to "testing math," players can enjoy the thrill of the draw without the risk. Many of our users report that after using our Luck Tracker, their urge to participate in real-money games decreases as they gain a more grounded perspective on the reality of the odds.</p>
    `
  }
};

// Required for static export (output: 'export')
export function generateStaticParams() {
  return Object.keys(postData).map((slug) => ({
    slug: slug,
  }));
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = postData[slug];

  if (!post) return <div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest text-gray-400">Post Not Found</div>;

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <header className="mb-10 sm:mb-16 text-left">
          <Link href="/blog" className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 mb-6 sm:mb-8 block hover:translate-x-[-4px] transition-transform">← Back to Blog</Link>
          <div className="flex items-center gap-4 mb-4 sm:mb-6">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500">{post.category}</span>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{post.date}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] sm:leading-tight">{post.title}</h1>
        </header>

        <div 
          className="prose prose-base sm:prose-lg prose-indigo dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 font-medium leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <footer className="mt-16 sm:mt-24 pt-12 sm:pt-16 border-t border-gray-100 dark:border-white/5">
            <div className="bg-indigo-50 dark:bg-indigo-500/10 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] text-center">
                <h4 className="text-xl sm:text-2xl font-black mb-3 sm:mb-4 tracking-tight italic">Try the Simulation</h4>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-8 sm:mb-10 max-w-md mx-auto">Experience the mathematics discussed in this article first-hand with our risk-free simulator.</p>
                <div className="flex justify-center">
                    <Link href="/simulator" className="w-full sm:w-auto bg-indigo-600 text-white font-black uppercase tracking-widest px-8 sm:px-10 py-4 rounded-2xl text-[10px] sm:text-sm hover:bg-indigo-500 shadow-xl transition-all active:scale-95 text-center">Launch Simulator</Link>
                </div>
            </div>
        </footer>
      </main>
    </div>
  );
}
