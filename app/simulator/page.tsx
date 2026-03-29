// app/simulator/page.tsx
import { Suspense } from 'react';
import { Metadata } from 'next';
import SimulatorContent from '../../components/SimulatorContent';

export const metadata = {
  title: "Free Lotto Simulator Australia | Test Your Winning Odds Instantly",
  description:
    "Simulate Powerball, Oz Lotto and Tatts Lotto instantly. See your real chances of winning and test your numbers for free.",
  keywords: [
    "lotto simulator australia",
    "powerball simulator",
    "oz lotto odds",
    "lotto probability calculator",
    "what if lotto"
  ],
  alternates: {
    canonical: "https://whatiflotto.com/simulator",
  },
};

export default function SimulatorPage() {
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "WhatIFLotto Simulator",
  "url": "https://whatiflotto.com/simulator",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web",
  "description":
    "Free Australian lotto simulator. Test your Powerball, Oz Lotto and Tatts Lotto numbers and see your real winning probability.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "AUD"
  }
};

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Simulator...</div>}>
        <SimulatorContent />
      </Suspense>
      
      <section className="mt-20 p-10 bg-white dark:bg-gray-900 rounded-[3rem] max-w-4xl mx-auto border border-gray-100 dark:border-white/5 mb-20 shadow-xl text-left">
        <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter italic border-b-4 border-indigo-500 inline-block">The Science Behind Our Lotto Simulator</h2>
        
        <div className="prose dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">Understanding Monte Carlo Simulation</h3>
            <p>
              Our tool utilizes the <strong>Monte Carlo Method</strong>, a mathematical technique used to model the probability of different outcomes in a process that cannot easily be predicted due to the intervention of random variables. In the context of the Australian Powerball and Oz Lotto, we use this algorithm to run thousands of virtual draws in milliseconds, providing a statistically significant sample size to visualize long-term outcomes.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">The Mathematical Reality of Australian Lotteries</h3>
            <p>
              Winning the Division 1 prize in <strong>Australian Powerball</strong> requires matching 7 numbers from a pool of 35, plus the Powerball from a pool of 20. The odds are approximately <strong>1 in 134,490,400</strong>. For <strong>Oz Lotto</strong>, matching 7 numbers from 47 yields odds of <strong>1 in 45,379,620</strong>. Our simulator demonstrates that while individual draws are random, the aggregate result of millions of plays consistently aligns with these mathematical laws.
            </p>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-950/20 p-8 rounded-3xl border-2 border-indigo-500/10">
            <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 uppercase mb-4">Why Simulate Before You Play?</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Risk-Free Visualization:</strong> Experience the "cost vs. win" reality without spending a single dollar.</li>
              <li><strong>Strategy Testing:</strong> Compare the long-term performance of "Lucky Numbers" versus "Quick Picks."</li>
              <li><strong>Reality Check:</strong> Understand the frequency of lower-division wins compared to the elusive jackpot.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4">Lotto Simulator FAQ</h3>
            <div className="space-y-6">
              <details className="group border-b border-gray-100 dark:border-white/5 pb-4">
                <summary className="font-black text-gray-800 dark:text-gray-200 cursor-pointer list-none flex justify-between items-center">
                  Is this lotto simulator accurate?
                  <span className="group-open:rotate-180 transition-transform">↓</span>
                </summary>
                <p className="mt-4 text-sm">Yes. We use the exact draw mechanics and prize division rules as specified by official Australian lottery providers. The simulation logic is reviewed periodically to ensure alignment with current game formats.</p>
              </details>
              
              <details className="group border-b border-gray-100 dark:border-white/5 pb-4">
                <summary className="font-black text-gray-800 dark:text-gray-200 cursor-pointer list-none flex justify-between items-center">
                  Can a simulator help me win the real lotto?
                  <span className="group-open:rotate-180 transition-transform">↓</span>
                </summary>
                <p className="mt-4 text-sm">Mathematically, no. Every draw is independent. However, a simulator helps you understand the odds so you can make more informed decisions about your gambling habits and expectations.</p>
              </details>

              <details className="group border-b border-gray-100 dark:border-white/5 pb-4">
                <summary className="font-black text-gray-800 dark:text-gray-200 cursor-pointer list-none flex justify-between items-center">
                  What are "Hot" and "Cold" numbers?
                  <span className="group-open:rotate-180 transition-transform">↓</span>
                </summary>
                <p className="mt-4 text-sm">In statistics, these are numbers that have appeared more or less frequently in the past. While interesting to track, they do not influence future random draws due to the law of independent trials.</p>
              </details>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-white/5 pt-8 text-xs italic text-gray-400">
            WhatIFLotto is committed to responsible play. This simulation tool is for educational and entertainment purposes only. If you or someone you know is struggling with gambling, please contact Gambling Help Online at 1800 858 858.
          </div>
        </div>
      </section>
    </>
  );
}
