import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <header className="bg-gradient-to-br from-blue-700 to-indigo-900 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            WOULD HAVE <br className="sm:hidden" /><span className="text-yellow-400 font-serif italic">I WON?</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            The world's most accurate Oz Lotto simulator. Test your numbers against official results without spending a single cent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/luck" 
              className="px-10 py-4 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-black rounded-full text-lg shadow-lg hover:scale-105 transition-all uppercase tracking-wider"
            >
              Try Your Luck
            </Link>
            <Link 
              href="/simulator" 
              className="px-10 py-4 bg-transparent border-2 border-white/30 hover:border-white hover:bg-white/10 text-white font-bold rounded-full text-lg transition-all"
            >
              Open Simulator
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Section - AdSense High Quality Content */}
      <main className="max-w-6xl mx-auto px-4 py-20">
        
        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
          <div className="text-center group">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl group-hover:bg-blue-600 group-hover:text-white transition-all">
              🎰
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Real Official Data</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              We sync with thelott.com every Tuesday night to bring you genuine Oz Lotto winning numbers and prize dividends.
            </p>
          </div>
          <div className="text-center group">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl group-hover:bg-green-600 group-hover:text-white transition-all">
              💾
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Permanent Sync</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Sign in with Google to save your ticket history forever. Track your "What-If" performance across any device.
            </p>
          </div>
          <div className="text-center group">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl group-hover:bg-purple-600 group-hover:text-white transition-all">
              📉
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Educational Odds</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Learn the mathematical reality behind 1 in 45 million. Our simulator helps visualize probability in a safe environment.
            </p>
          </div>
        </section>

        {/* Informational Text Block - Crucial for AdSense */}
        <section className="bg-white rounded-3xl p-8 md:p-16 border border-gray-100 shadow-xl shadow-gray-200/50 mb-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-black text-gray-900 mb-8 text-center uppercase tracking-tighter">Why Use Would Have I Won?</h2>
            <div className="prose prose-blue max-w-none text-gray-700 space-y-6">
              <p>
                Have you ever wondered if your "lucky numbers" would have actually won you the Division 1 jackpot? Or perhaps you've spent years playing the same set of numbers and wanted to see their performance over time? 
              </p>
              <p>
                <strong>Would Have I Won?</strong> was built to solve these curiosities without the financial commitment. Our Oz Lotto simulator is designed for entertainment and educational purposes, allowing you to explore the world of probability in a beautiful, user-friendly interface.
              </p>
              <div className="bg-gray-50 p-6 rounded-2xl italic border-l-4 border-blue-600">
                "Our mission is to provide a transparent, data-driven experience that promotes responsible play through simulation."
              </div>
              <p>
                Whether you're a math enthusiast interested in the 7/47 structure of Oz Lotto, or just someone looking for a bit of fun on Tuesday nights, our platform provides the tools you need to visualize your luck.
              </p>
            </div>
          </div>
        </section>

        {/* Interactive CTA */}
        <section className="bg-indigo-900 rounded-[3rem] p-12 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to test your luck?</h2>
            <p className="text-indigo-200 mb-8 max-w-lg mx-auto">It only takes a few seconds to pick your first set of simulated tickets.</p>
            <Link 
              href="/luck" 
              className="inline-block px-12 py-4 bg-white text-indigo-900 font-black rounded-full hover:bg-indigo-50 transition-all uppercase tracking-widest text-sm"
            >
              Get Started for Free
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
        </section>

      </main>
    </div>
  );
}
