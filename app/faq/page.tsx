import Navbar from '../../components/Navbar';
import Link from 'next/link';

const faqs = [
  {
    question: "Is WhatIFLotto a gambling site?",
    answer: "No. WhatIFLotto is a simulation and tracking platform only. We do not sell lottery tickets, we do not handle real money for bets, and no gambling occurs on our platform. All 'winnings' are purely virtual."
  },
  {
    question: "How accurate is the simulator?",
    answer: "Our simulator uses the exact mathematical mechanics, draw rules, and prize division structures of the official Australian Powerball, Oz Lotto, and Tatts Lotto games. While individual results are random, long-term simulations align perfectly with official odds."
  },
  {
    question: "Where do the draw results come from?",
    answer: "We synchronize our database with verified historical records of official Australian lottery draws. We update our data shortly after each official draw (Tuesday for Oz Lotto, Thursday for Powerball, Saturday for Tatts Lotto)."
  },
  {
    question: "Can this help me pick winning numbers?",
    answer: "Mathematically, no. Every lottery draw is an independent event. Past draws have no influence on future results. Our tools are designed for entertainment, statistical analysis, and to demonstrate the reality of lottery odds."
  },
  {
    question: "What is the 'Luck Tracker'?",
    answer: "The Luck Tracker allows you to save your chosen number sequences and see how they would have performed against past and future official draws. It's a way to experience the thrill of the game without financial risk."
  },
  {
    question: "Is WhatIFLotto affiliated with official lottery providers?",
    answer: "No. We are an independent platform dedicated to data analysis and simulation. We are not associated with, endorsed by, or affiliated with the Lott, Tatts, or any state-run lottery commission."
  }
];

export default function FAQPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 selection:bg-indigo-500 transition-colors duration-500">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 py-20 sm:py-32">
        <header className="text-center mb-16 sm:mb-24 animate-in fade-in slide-in-from-top-8 duration-1000">
          <h2 className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.4em] text-[10px] mb-4">FAQ</h2>
          <h1 className="text-5xl sm:text-7xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic leading-none mb-10">Frequently Asked <span className="text-gray-400">Questions</span></h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto">
            Find answers to common questions about our simulation technology, data sources, and our mission of responsible play.
          </p>
        </header>

        <section className="space-y-6 sm:space-y-8 mb-32">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-gray-50 dark:bg-white/5 p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all text-left group">
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight italic mb-4 group-hover:text-indigo-500 transition-colors">{faq.question}</h3>
                <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </section>

        <section className="bg-indigo-600 rounded-[3rem] p-10 sm:p-16 text-white text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-800" />
            <div className="relative z-10">
                <h2 className="text-3xl font-black mb-6 uppercase tracking-tight italic">Still have questions?</h2>
                <p className="text-indigo-100 mb-10 font-medium max-w-lg mx-auto leading-relaxed">Our support team is happy to help with any inquiries regarding our platform or simulation mechanics.</p>
                <Link href="/contact" className="px-12 py-5 bg-white text-indigo-600 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-gray-100 transition-all active:scale-95 shadow-xl">Contact Support</Link>
            </div>
        </section>
      </main>
    </div>
  );
}
