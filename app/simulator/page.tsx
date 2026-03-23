// app/simulator/page.tsx
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
      <SimulatorContent />
      
      <section className="mt-20 p-8 bg-white dark:bg-gray-900 rounded-3xl max-w-4xl mx-auto border border-gray-100 dark:border-white/5 mb-20">
        <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">How the Australian Lotto Simulator Works</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
          Our Lotto Simulator uses high-speed Monte Carlo algorithms to replicate the exact mechanical draws of Australia’s leading lottery games. By running millions of simulations in seconds, you can visualize the statistical reality of hitting Division 1.
        </p>
        <h3 className="text-xl font-bold mb-2">Powerball & Oz Lotto Odds Explained</h3>
        <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
          Whether you are playing Powerball, Oz Lotto, or Tatts Lotto, the odds remain fixed by the physical constraints of the draw. This tool helps you understand that "Quick Pick" and "Lucky Numbers" have the same mathematical probability. Use our tracker to see if your numbers would have won in past Australian lottery results.
        </p>
      </section>
    </>
  );
}
