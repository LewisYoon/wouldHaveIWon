import Navbar from '../../components/Navbar';

export default function HowItWorksPage() {
  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8 text-center">How It Works</h1>
        
        <div className="space-y-12">
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">1. Pick Your Numbers</h2>
            <p className="text-gray-700 leading-relaxed">
              Use our interactive number picker to select your 7 lucky numbers for the upcoming Oz Lotto draw. You can pick them manually or use our "Quick Pick" generator to simulate a random selection.
            </p>
          </section>

          <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 text-green-600">2. Real-Time Result Sync</h2>
            <p className="text-gray-700 leading-relaxed">
              Our system automatically fetches official Oz Lotto draw results every Tuesday at 10 PM Sydney time. Your saved "What-If" tickets are instantly compared against these official winning numbers.
            </p>
          </section>

          <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 text-purple-600">3. Check Your Winnings</h2>
            <p className="text-gray-700 leading-relaxed">
              Visit the "Try Your Luck" section to see a visual breakdown of your results. We highlight matching main numbers in green and supplementary (bonus) numbers in yellow. We even calculate the "Division" you would have placed in based on official prize structures.
            </p>
          </section>

          <section className="bg-blue-50 p-8 rounded-2xl border border-blue-100">
            <h2 className="text-xl font-bold mb-2">Why use a simulator?</h2>
            <p className="text-sm text-blue-800">
              The simulator provides an educational perspective on the probability of winning. It allows users to experience the "excitement" of the draw without the financial risk associated with actual gambling.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
