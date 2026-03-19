// lotto-project/app/simulator/page.tsx
'use client';

import { Suspense } from 'react';
import SimulatorContent from '../../components/SimulatorContent';

export default function SimulatorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center font-black animate-pulse uppercase tracking-widest text-sm">Loading Simulator...</div>}>
      <SimulatorContent />
    </Suspense>
  );
}
