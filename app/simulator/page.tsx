// lotto-project/app/simulator/page.tsx
import { Suspense } from 'react';
import SimulatorContent from '../../components/SimulatorContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Turbo Lotto Simulation | Run 1000+ Draws per Second",
  description: "Experience the fastest Australian Lotto Simulation. Real-time Monte Carlo results for Powerball, Oz Lotto and Tatts Lotto. Discover the math behind the game.",
  keywords: ["Lotto Simulation", "Australian Lotto Simulator", "Turbo Simulation", "Monte Carlo Lotto", "Powerball Simulation"],
};

export default function SimulatorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center font-black animate-pulse uppercase tracking-widest text-sm text-gray-400">Loading Simulation Engine...</div>}>
      <SimulatorContent />
    </Suspense>
  );
}
