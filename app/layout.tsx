import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import Link from 'next/link';
import Logo from "../components/Logo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhatIFLotto | Oz Lotto & Powerball Simulator",
  description: "The ultimate risk-free way to test your lottery luck. Track your numbers against official Oz Lotto and Powerball results and see if you hit the jackpot.",
  keywords: "Oz Lotto, Powerball, WhatIFLotto, Lotto Simulator, Luck Tracker, Lucky Numbers Australia",
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
        <meta name="google-adsense-account" content="ca-pub-4486035001722503" />
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4486035001722503"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white dark:bg-gray-950 transition-colors duration-500 flex flex-col`}>
        <AuthProvider>
          <div className="flex-grow">
            {children}
          </div>
          
          <footer className="py-24 text-center border-t border-gray-100 dark:border-white/5 transition-colors duration-500 bg-gray-50 dark:bg-gray-900/30 mt-auto px-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-12 flex justify-center opacity-50 grayscale hover:opacity-100 transition-all duration-500">
                <Logo />
              </div>
              
              <div className="flex justify-center flex-wrap gap-x-12 gap-y-6 mb-12 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                <Link href="/how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">How It Works</Link>
                <Link href="/odds" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Odds</Link>
                <Link href="/responsible-play" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Responsible Play</Link>
                <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms</Link>
              </div>

              <div className="max-w-2xl mx-auto">
                <p className="text-[10px] text-gray-400 dark:text-gray-600 font-medium uppercase tracking-widest leading-relaxed">
                  © {currentYear} WhatIFLotto Australia. Not affiliated with any official lottery provider. For simulation purposes only. No real money or gambling occurs on this platform.
                </p>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
