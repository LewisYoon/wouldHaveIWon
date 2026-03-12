'use client';

import Navbar from '../../components/Navbar';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-500">
      <Navbar />
      
      <main className="max-w-4xl mx-auto py-20 sm:py-32 px-6">
        <div className="text-left mb-16">
          <h2 className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.4em] text-[10px] mb-4">Terms & Conditions</h2>
          <h1 className="text-5xl sm:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic leading-none">Refund <span className="text-gray-400">Policy</span></h1>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-10 sm:p-16 border border-gray-100 dark:border-white/5 shadow-xl prose dark:prose-invert prose-indigo max-w-none">
          <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-10">
            At WhatIFLotto, we strive to provide the most accurate and high-speed Australian Lotto simulation experience. Please read our refund policy carefully before making a purchase.
          </p>

          <section className="mb-12">
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">1. Digital Nature of Service</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Due to the nature of digital content and immediate access to premium features (including Auto-Tracker and Turbo Simulation), all sales of WhatIFLotto PRO (Monthly and Lifetime) are generally final and non-refundable once the service has been accessed or used.
            </p>
          </section>

          <section className="mb-12">
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">2. Subscription Cancellation</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              You may cancel your Monthly PRO subscription at any time through your <a href="/billing" className="text-indigo-500 font-bold underline">Billing Dashboard</a>.
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>Upon cancellation, you will continue to have access to PRO features until the end of your current billing period.</li>
              <li>We do not provide pro-rated refunds for partial months of service.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">3. Exceptional Refunds</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              We may issue refunds under the following exceptional circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li><strong>Duplicate Purchase:</strong> If you accidentally purchased the same plan twice.</li>
              <li><strong>Technical Failure:</strong> If a technical issue on our end prevented you from accessing the service for a significant period.</li>
              <li><strong>Legal Requirements:</strong> As required by Australian Consumer Law.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">4. How to Request a Refund</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              To request a refund, please contact us within 7 days of the transaction via our <a href="/contact" className="text-indigo-500 font-bold underline">Contact Page</a> or email us directly at <strong>support@whatiflotto.com</strong>. Please include your account email and transaction ID.
            </p>
          </section>

          <div className="pt-10 border-t border-gray-100 dark:border-white/5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
              Last Updated: March 12, 2026. WhatIFLotto Australia reserves the right to modify this policy at any time.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
