import Navbar from '../../components/Navbar';

export default function TermsPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400">
            Terms of Service
          </h1>
          <p className="mt-4 text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            These terms govern your use of WhatIFLotto. Please read them carefully.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Last updated: March 08, 2026</p>
        </div>

        <div className="space-y-12">
          
          <section className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-white/5">
            <h2 className="text-3xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-3">
              <span className="text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
              </span>
              Acceptance of Terms
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              By accessing or using WhatIFLotto (the "Service"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you are prohibited from using our Service. WhatIFLotto is a free-to-use platform provided solely for entertainment and informational purposes.
            </p>
          </section>

          <section className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-white/5">
            <h2 className="text-3xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-3">
              <span className="text-emerald-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M21.17 8.02c-.34 3.79-1.37 7.03-3 9.77c-.82 1.35-1.74 2.5-2.75 3.4L12 22l-3.42-2.81c-1.01-.9-1.93-2.05-2.75-3.4c-1.63-2.74-2.66-5.98-3-9.77c.34-3.79 1.37-7.03 3-9.77c.82-1.35 1.74-2.5 2.75-3.4L12 2l3.42 2.81c1.01.9 1.93 2.05 2.75 3.4c1.63 2.74 2.66 5.98 3 9.77z"/></svg>
              </span>
              No Real Money, No Gambling
            </h2>
            <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>
                <strong>Crucial Information:</strong> WhatIFLotto is NOT a gambling platform. We do not facilitate the purchase of actual lottery tickets, nor do we offer any real monetary prizes or winnings. All simulations, "winnings," and statistical data presented on our Service are purely for entertainment and informational purposes. They reflect theoretical outcomes based on official lottery rules but hold no actual cash value. Your participation is entirely risk-free and focused on tracking and analysis.
              </p>
            </div>
          </section>

          <section className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-white/5">
            <h2 className="text-3xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-3">
              <span className="text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              User Accounts & Responsibilities
            </h2>
            <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              <ul>
                <li>
                  <strong>Account Creation:</strong> When registering, you must provide accurate, complete, and current information. Failure to do so may lead to the termination of your account.
                </li>
                <li>
                  <strong>Security:</strong> You are solely responsible for maintaining the confidentiality of your account password and for all activities that occur under your account. Notify us immediately of any unauthorized use.
                </li>
                <li>
                  <strong>Usage:</strong> Our service is intended for personal, non-commercial use only. You agree not to use the Service for any unlawful purpose or in any way that violates these Terms.
                </li>
              </ul>
            </div>
          </section>

          <section className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-white/5">
            <h2 className="text-3xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-3">
              <span className="text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </span>
              Data Accuracy & Service Limitations
            </h2>
            <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>
                While we strive for the utmost accuracy, WhatIFLotto relies on third-party official lottery data feeds. Therefore, we cannot guarantee that the results displayed will be 100% free of errors, omissions, or delays. The Service is provided on an "as is" and "as available" basis without any warranties, express or implied. Your reliance on any information provided by the Service is solely at your own risk.
              </p>
            </div>
          </section>
          
          <section className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-white/5">
            <h2 className="text-3xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-3">
              <span className="text-orange-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.4 12H6.78a2 2 0 0 1-1.8-3.03l3.4-6.32c.36-.67 1.43-.67 1.79 0l3.4 6.32a2 2 0 0 1-1.8 3.03H13.6c-.63 0-1.25-.19-1.76-.55L9.4 6.18c-.35-.68-1.4-.68-1.75 0L4.35 12.87c-.63 1.17-.03 2.63 1.34 3.07l3.77 1.25c.34.11.75.11 1.09 0l4.33-1.44c1.37-.44 1.97-1.9.89-3.07z"/></svg>
              </span>
              Limitation of Liability
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              To the fullest extent permitted by applicable law, WhatIFLotto, its directors, employees, partners, agents, suppliers, or affiliates, shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage.
            </p>
          </section>

          <section className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-white/5">
            <h2 className="text-3xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-3">
              <span className="text-purple-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/><line x1="20" y1="22" x2="20" y2="15"/></svg>
              </span>
              Governing Law & Changes
            </h2>
            <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>
                These Terms shall be governed and construed in accordance with the laws of Australia, without regard to its conflict of law provisions. We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will endeavor to provide reasonable notice (e.g., 30 days) prior to any new terms taking effect. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
              </p>
            </div>
          </section>

          <section className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-white/5">
            <h2 className="text-3xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-3">
              <span className="text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </span>
              Contact Us
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Should you have any questions, concerns, or require clarification regarding these Terms of Service, please do not hesitate to contact our support team via the designated contact page on our website.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
