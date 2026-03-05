import Navbar from '../../components/Navbar';

export default function OddsPage() {
  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16 text-gray-800">
        <h1 className="text-4xl font-bold mb-8">Oz Lotto Winning Odds</h1>
        <p className="text-lg mb-8">Understanding the probability of your 7-number selection is key to enjoying the simulator responsibly.</p>
        
        <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm mb-12">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase">Division</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase">Matches Required</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase">Odds per Game</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 font-bold">Division 1</td>
                <td className="px-6 py-4">7 Main Numbers</td>
                <td className="px-6 py-4">1 in 45,379,620</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold">Division 2</td>
                <td className="px-6 py-4">6 Main + 1 Supp</td>
                <td className="px-6 py-4">1 in 2,160,935</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold">Division 3</td>
                <td className="px-6 py-4">6 Main Numbers</td>
                <td className="px-6 py-4">1 in 180,078</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold">Division 7</td>
                <td className="px-6 py-4">3 Main + 1 Supp</td>
                <td className="px-6 py-4">1 in 71</td>
              </tr>
            </tbody>
          </table>
        </div>

        <section className="bg-white p-8 rounded-2xl border border-gray-100">
          <h2 className="text-2xl font-bold mb-4">How are these calculated?</h2>
          <p className="leading-relaxed mb-4">
            Oz Lotto is a 7/47 game. The odds are calculated using combinatorial mathematics. 
            For Division 1, the number of ways to pick 7 numbers out of 47 is given by the formula:
          </p>
          <code className="block bg-gray-100 p-4 rounded text-center font-mono">
            47! / (7! * (47-7)!) = 45,379,620
          </code>
        </section>
      </main>
    </div>
  );
}
