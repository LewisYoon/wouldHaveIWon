'use client';

import Navbar from '../../components/Navbar';

export default function PrivacyPolicy() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 py-24 text-left">
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-12">
          Privacy <span className="text-indigo-600 dark:text-indigo-400 italic">Policy</span>
        </h1>

        <div className="prose prose-indigo dark:prose-invert max-w-none space-y-10 text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
          <section>
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Last Updated: March 6, 2026</p>
            <p>
              At WhatIFLotto, accessible from whatiflotto.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by WhatIFLotto and how we use it.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">1. Information We Collect</h2>
            <p>
              If you create an account, we collect your email address and authentication data via Supabase/Google OAuth. For anonymous users, we may store simulation data locally on your device (Local Storage). We do not collect personal financial information as no real-money transactions occur on this platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">2. How We Use Your Information</h2>
            <p>We use the information we collect in various ways, including to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, operate, and maintain our website and lotto simulation engine.</li>
              <li>Improve, personalize, and expand our website features.</li>
              <li>Understand and analyze how you use our website.</li>
              <li>Send you automated lottery result notifications if you have opted-in.</li>
              <li>Detect and prevent fraudulent use of our simulation tools.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">3. Log Files & Cookies</h2>
            <p>
              WhatIFLotto follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">4. Google DoubleClick DART Cookie</h2>
            <p>
              Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">5. Third Party Privacy Policies</h2>
            <p>
              WhatIFLotto's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">6. Data Protection Rights (GDPR/CPRA)</h2>
            <p>
              We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following: The right to access, the right to rectification, the right to erasure, the right to restrict processing, and the right to data portability.
            </p>
          </section>

          <section className="p-8 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase mb-4">Contact Us</h2>
            <p className="text-base">
              If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at support@whatiflotto.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
