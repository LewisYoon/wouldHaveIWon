import Navbar from '../../components/Navbar';

export default function PrivacyPage() {
  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-600 mb-4">Last Updated: February 2026</p>
        
        <section className="space-y-6 text-gray-800">
          <p>At <strong>WhatIFLotto</strong>, we prioritize the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by our website and how we use it.</p>
          
          <h2 className="text-2xl font-bold mt-8">1. Information We Collect</h2>
          <p>We collect information in two ways: information you provide directly (such as your email when you sign in via Google or Email) and information collected automatically through cookies and third-party services like Google AdSense.</p>
          
          <h2 className="text-2xl font-bold mt-8">2. How We Use Your Information</h2>
          <p>We use the information we collect to operate and maintain our website, personalize your experience, and sync your simulation history across devices.</p>
          
          <h2 className="text-2xl font-bold mt-8">3. Google DoubleClick DART Cookie</h2>
          <p>Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet.</p>
          
          <h2 className="text-2xl font-bold mt-8">4. Our Advertising Partners</h2>
          <p>Third-party ad servers or ad networks use technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on <strong>WhatIFLotto</strong>, which are sent directly to users' browser.</p>
        </section>
      </main>
    </div>
  );
}
