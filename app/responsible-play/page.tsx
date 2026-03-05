import Navbar from '../../components/Navbar';
import Link from 'next/link';

export default function ResponsiblePlayPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-red-600 dark:from-amber-400 dark:to-red-400">
            Play Responsibly
          </h1>
          <p className="mt-6 text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            WhatIFLotto is a simulation tool for entertainment. It's important to remember that real lotteries are a game of chance.
          </p>
        </div>

        <div className="prose dark:prose-invert prose-lg mx-auto">
          <h2>Understanding the Odds</h2>
          <p>
            Winning a major lottery prize is an event with extremely low probability. For example, the odds of winning Division 1 in Oz Lotto are approximately 1 in 62,891,499. It's fun to dream, but it's crucial to treat lottery games as a form of entertainment, not a reliable way to make money.
          </p>
          <p>
            Our simulator is designed to help you understand these odds in a fun, risk-free environment. By running many simulations, you can get a clearer picture of how difficult it is to win, which can help you make more informed decisions about playing with real money.
          </p>

          <h2>Tips for Healthy Play</h2>
          <ul>
            <li><strong>Play for fun, not to make money:</strong> Treat any money you spend on lottery tickets as a cost for entertainment.</li>
            <li><strong>Set a budget:</strong> Only spend what you can comfortably afford to lose. Never borrow money to play.</li>
            <li><strong>Know the odds:</strong> Understand that the chances of winning are very low.</li>
            <li><strong>Keep it in perspective:</strong> Don't let lottery play interfere with your daily responsibilities, relationships, or financial stability.</li>
          </ul>

          <h2>Getting Help</h2>
          <p>
            If you feel that your gambling is no longer fun or is becoming a problem for you or someone you know, help is available. There are free, confidential support services available 24/7.
          </p>
          <p>
            Please reach out to one of the following official Australian support services:
          </p>
          <ul>
            <li>
              <strong>Gambling Help Online:</strong> Visit{' '}
              <a href="https://www.gamblinghelponline.org.au" target="_blank" rel="noopener noreferrer" className="text-indigo-500 font-bold underline">
                www.gamblinghelponline.org.au
              </a>{' '}
              or call <strong>1800 858 858</strong>.
            </li>
            <li>
              <strong>Lifeline Australia:</strong> Call <strong>13 11 14</strong> for 24/7 crisis support.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
