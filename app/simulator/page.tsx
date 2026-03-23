// app/simulator/page.tsx
import { Metadata } from 'next';
import SimulatorContent from '../../components/SimulatorContent';

export const metadata: Metadata = {
  title: "Australian Lotto Simulator: Test Powerball & Oz Lotto Odds",
  description: "Run millions of lotto draws in seconds. Test your lucky numbers against official Australian history for free. See the real probability of winning Division 1.",
  keywords: ["Lotto Simulator Australia", "Powerball Odds Calculator", "Oz Lotto Simulation", "Lotto Probability Tool"],
  alternates: {
    canonical: 'https://whatiflotto.com/simulator',
  },
};

export default function SimulatorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "WhatIFLotto Turbo Simulator",
    "applicationCategory": "GameApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "AUD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "1284"
    },
    "description": "High-speed Australian lotto simulation engine to test winning probability for Powerball, Oz Lotto, and Tatts Lotto."
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
