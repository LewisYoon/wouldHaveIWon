import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import Link from 'next/link';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Would Have I Won? | Oz Lotto Simulator & Result Tracker",
  description: "The ultimate risk-free Oz Lotto simulator. Check your lucky numbers against official results, track your 'what-if' winnings, and explore lotto probabilities.",
  keywords: "Oz Lotto, Lotto Simulator, Lottery Results, Lucky Numbers, Australia Lotto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="en">
      <head>
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4486035001722503"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-gray-50`}>
        <AuthProvider>
          <div className="flex-grow">
            {children}
          </div>
          
          <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-white text-lg font-bold mb-4 italic">Would Have I Won?</h3>
                  <p className="text-sm leading-relaxed max-w-md">
                    We provide a fun, risk-free environment to test your lottery luck. 
                    Our simulator uses official Oz Lotto data to help you visualize 
                    the reality of the game without spending a cent.
                  </p>
                </div>
                <div>
                  <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Resources</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link href="/how-it-works" className="hover:text-white transition">How It Works</Link></li>
                    <li><Link href="/odds" className="hover:text-white transition">Oz Lotto Odds</Link></li>
                    <li><Link href="/responsible-play" className="hover:text-white transition">Responsible Play</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Legal</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                    <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                  </ul>
                </div>
              </div>
              <div className="mt-12 pt-8 border-t border-gray-800 text-center text-xs">
                <p>&copy; {currentYear} Would Have I Won. Not affiliated with any official lottery provider.</p>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
