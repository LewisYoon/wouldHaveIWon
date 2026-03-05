import Navbar from '../../components/Navbar';

export default function ResponsiblePlayPage() {
  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16 text-gray-800">
        <h1 className="text-4xl font-bold mb-8 text-center text-green-700">Responsible Play</h1>
        
        <div className="bg-green-50 p-8 rounded-2xl border border-green-100 mb-12">
          <p className="text-xl text-green-900 leading-relaxed text-center">
            "The best way to play the lotto is to simulate it for free."
          </p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Why We Built This Simulator</h2>
            <p>We created <strong>WhatIFLotto</strong> to provide a safe space for people to explore their interest in the lottery. By seeing the actual odds in action, we hope to educate users on the highly improbable nature of winning major prizes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Signs of Problem Gambling</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Spending more money or time on gambling than intended.</li>
              <li>Feeling guilty or anxious after gambling.</li>
              <li>Borrowing money to gamble.</li>
              <li>Gambling to win back losses.</li>
            </ul>
          </section>

          <section className="bg-white p-8 rounded-2xl border border-gray-200">
            <h2 className="text-2xl font-bold mb-4">Seek Help</h2>
            <p className="mb-4">If you or someone you know is struggling with gambling, free and confidential support is available:</p>
            <p className="font-bold text-lg text-blue-600">Gambling Help Online: 1800 858 858</p>
            <p className="text-sm text-gray-500 italic mt-2">Available 24/7 in Australia.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
