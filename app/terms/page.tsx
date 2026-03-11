import Navbar from '../../components/Navbar';
import { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Terms of Service | WhatIFLotto',
  description: 'Terms and conditions for using WhatIFLotto Australian Lotto Simulator and Tracking services.',
};

export default function Terms() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-24 text-left">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter mb-8 sm:mb-12 leading-tight">
          Terms of <span className="text-indigo-600 dark:text-indigo-400 italic">Service</span>
        </h1>

        <div className="prose prose-base sm:prose-lg prose-indigo dark:prose-invert max-w-none space-y-8 sm:space-y-10 text-base sm:text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
          <section>
            <p className="text-[10px] sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 sm:mb-4">Effective Date: March 10, 2026</p>
            <p>
              Welcome to WhatIFLotto. By accessing this website (https://whatiflotto.com), we assume you accept these terms and conditions. Do not continue to use WhatIFLotto if you do not agree to all of the terms and conditions stated on this page.
            </p>
          </section>

          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">1. Non-Gambling Disclaimer</h2>
            <div className="p-5 sm:p-6 bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 rounded-r-2xl italic font-bold text-sm sm:text-base">
              Important: WhatIFLotto is NOT a gambling site. We do not facilitate any real-money transactions, wagering, or betting. This platform is purely a simulation and historical analysis tool designed for entertainment and educational purposes.
            </div>
            <p>
              All currency symbols ($) used within the simulation engine represent "Virtual Credits" or theoretical calculations and have no real-world monetary value.
            </p>
          </section>

          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">2. Use of Simulation Tools</h2>
            <p>
              The "Track My Luck" and "Turbo Simulator" tools use mathematically accurate logic based on official Australian lottery rules. While we strive for absolute accuracy, WhatIFLotto makes no guarantee that simulated results will reflect real-world outcomes in any actual lottery draws.
            </p>
          </section>

          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">3. User Accounts</h2>
            <p>
              When you create an account, you must provide us with information that is accurate and complete at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
            </p>
          </section>

          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">4. Data Accuracy</h2>
            <p>
              We fetch official lottery data through automated third-party integrations. While we monitor these feeds daily, we are not responsible for delays, errors, or omissions in the official data provided by lottery providers.
            </p>
          </section>

          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">5. Limitation of Liability</h2>
            <p>
              In no event shall WhatIFLotto, nor its directors, employees, or partners, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>

          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">6. Responsible Play</h2>
            <p>
              We encourage all users to treat this tool as a perspective-shifting awareness platform. If your use of this simulation causes you distress or if you choose to participate in real gambling, please seek professional help via our Responsible Play resources.
            </p>
          </section>

          <section className="p-6 sm:p-8 bg-gray-50 dark:bg-white/5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/5 mt-8">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase mb-3 sm:mb-4">Termination</h2>
            <p className="text-sm sm:text-base font-bold italic">
              We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
