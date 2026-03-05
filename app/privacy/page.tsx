import Navbar from '../../components/Navbar';

export default function PrivacyPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            Privacy Policy
          </h1>
          <p className="mt-4 text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Your privacy is important to us. This policy outlines how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Last updated: March 08, 2026</p>
        </div>

        <div className="space-y-12">
          
          <section className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-white/5">
            <h2 className="text-3xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-3">
              <span className="text-indigo-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
              </span>
              Introduction & Our Commitment
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              At WhatIFLotto, we are deeply committed to protecting your personal privacy. This Privacy Policy is designed to clearly explain how we collect, use, process, and safeguard the information you provide when using our website and services. We handle your data with the utmost care and transparency, ensuring your trust is maintained.
            </p>
          </section>

          <section className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-white/5">
            <h2 className="text-3xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-3">
              <span className="text-emerald-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v6"/><path d="m15 15-3 3-3-3"/></svg>
              </span>
              Information We Collect & Why
            </h2>
            <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>We collect essential information to provide and enhance your WhatIFLotto experience:</p>
              <ul>
                <li>
                  <strong>Information you provide directly:</strong> When you create an account, you provide your email address. When you use the "Luck Tracker," you provide your chosen lottery numbers and associated draw dates. This data is used solely to manage your account and perform the core service of comparing your numbers to official draw results.
                </li>
                <li>
                  <strong>Automatically collected information:</strong> To maintain security and optimize performance, we log standard technical details such as your IP address, browser type, and operating system. Our backend provider, Supabase, assists in the collection of this operational data.
                </li>
                <li>
                  <strong>Cookies for functionality:</strong> We utilize small text files called cookies to ensure basic website functions work correctly. These include keeping you securely logged in and remembering your preferences, such as your choice of light or dark mode. You can manage cookie preferences in your browser settings.
                </li>
              </ul>
            </div>
          </section>

          <section className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-white/5">
            <h2 className="text-3xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-3">
              <span className="text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </span>
              How & With Whom We Share Your Data
            </h2>
            <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>Your trust is paramount. We explicitly state:</p>
              <ul>
                <li><strong>We do NOT sell your personal data to anyone.</strong></li>
                <li>
                  <strong>Essential Service Providers:</strong> We collaborate with select third parties strictly for operational purposes:
                  <ul>
                    <li><strong>Supabase:</strong> Handles our secure user authentication and database management, storing your account details and tracked numbers.</li>
                    <li><strong>Resend:</strong> Manages our transactional email system, delivering your draw reminders and result notifications. Your email is shared exclusively for this purpose.</li>
                  </ul>
                </li>
              </ul>
              <p>We ensure that all third-party partners adhere to strict data protection standards, maintaining the confidentiality and integrity of your information.</p>
            </div>
          </section>

          <section className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-white/5">
            <h2 className="text-3xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-3">
              <span className="text-yellow-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
              </span>
              Your Privacy Rights & Choices
            </h2>
            <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>You have full control over your data on WhatIFLotto:</p>
              <ul>
                <li><strong>Access and Correction:</strong> You can view and update most of your personal information (like tracked numbers) directly within your account.</li>
                <li><strong>Deletion:</strong> Should you wish to remove your data or close your account, please contact our support team. We will promptly process your request, subject to any legal obligations.</li>
                <li><strong>Managing Communications:</strong> You can adjust your email notification preferences or unsubscribe from our transactional alerts at any time via links provided in our emails or within your account settings (if applicable).</li>
              </ul>
            </div>
          </section>

          <section className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-white/5">
            <h2 className="text-3xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-3">
              <span className="text-purple-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
              </span>
              Contact Us
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              If you have any questions or concerns regarding this Privacy Policy or your data, please don't hesitate to reach out. You can find our contact details on the dedicated contact page of our website. We're here to help.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
