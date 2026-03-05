import Navbar from '../../components/Navbar';

export default function TermsPage() {
  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16 text-gray-800">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="mb-6 italic">Last Updated: February 2026</p>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptable Use</h2>
            <p><strong>WhatIFLotto</strong> is a simulation platform intended for entertainment and educational purposes only. You agree not to use the site for any illegal activities.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. No Real Gambling</h2>
            <p>This website does not facilitate real-money gambling. No real currency can be won or lost on this platform. All "winnings" are strictly simulated based on historical or current lottery results.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Accuracy of Data</h2>
            <p>While we strive to fetch accurate data from official sources, we cannot guarantee the 100% accuracy or timeliness of the results displayed. Always check official lottery providers for valid results.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
