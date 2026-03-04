'use client';

import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50">
      <Navbar />

      <main className="flex w-full flex-1 flex-col items-center px-4 md:px-20 text-center pt-16 pb-32">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-12 text-gray-900 tracking-tight">
          Would I Have Won Lotto?
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Try Your Luck Card */}
          <Link href="/luck" className="group bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 group-hover:bg-green-200">
              <span className="text-3xl text-green-600 font-bold">$</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Try your luck with $0 cost</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Experience the thrill of picking numbers and checking results against actual draws for free.
            </p>
            <span className="mt-auto px-8 py-3 bg-green-600 text-white font-bold rounded-xl uppercase tracking-wider text-sm shadow-lg shadow-green-200 transition-colors duration-300 group-hover:bg-green-700">
              Try Your Luck
            </span>
          </Link>

          {/* Simulator Card */}
          <Link href="/simulator" className="group bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 group-hover:bg-blue-200">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">OZ Lotto Simulator</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Check your saved numbers against real historical draw results and see if you would have won!
            </p>
            <span className="mt-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl uppercase tracking-wider text-sm shadow-lg shadow-blue-200 transition-colors duration-300 group-hover:bg-blue-700">
              Start Simulator
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
