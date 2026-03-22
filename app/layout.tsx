import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { Toaster } from 'sonner';
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
  metadataBase: new URL('https://whatiflotto.com'),
  title: {
    default: "WhatIFLotto | #1 Australian Lotto Simulation & Results Tracker",
    template: "%s | Lotto Simulation"
  },
  description: "Experience the most advanced Lotto Simulation for Oz Lotto, Powerball, and Tatts Lotto. Run thousands of simulations in seconds with our Turbo Lotto Simulator and track official results risk-free.",
  keywords: ["Lotto Simulation", "Lottery Simulator", "Oz Lotto Simulation", "Powerball Simulator Australia", "Lotto Results Tracker", "Free Lottery Simulation", "Lotto Odds Calculator"],
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "WhatIFLotto | Ultimate Lotto Simulation Platform",
    description: "What if you actually won? Run real-time lotto simulations against official Australian draws without any financial risk.",
    url: "https://whatiflotto.com",
    siteName: "WhatIFLotto Simulation",
    images: [
      {
        url: 'https://whatiflotto.com/icon.png',
        width: 512,
        height: 512,
        alt: 'WhatIFLotto Simulation Logo',
      },
    ],
    locale: "en_AU",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-4486035001722503" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "WhatIFLotto Simulation",
              "url": "https://whatiflotto.com",
              "applicationCategory": "GameApplication",
              "operatingSystem": "Web, iOS, Android",
              "description": "Premium Australian Lotto Simulation tool. High-speed Monte Carlo simulations for Oz Lotto, Powerball, and Tatts Lotto.",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "AUD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "1250"
              },
              "publisher": {
                "@type": "Organization",
                "name": "WhatIFLotto Australia",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://whatiflotto.com/icon.png"
                }
              }
            })
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-950 transition-colors duration-500`}>
        <Toaster position="top-center" richColors />
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <div className="flex-grow">
              {children}
            </div>
            
            <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-white/5 py-20 px-6">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
                  <div className="col-span-1 md:col-span-2">
                    <div className="mb-6"><Logo /></div>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm font-medium leading-relaxed">
                      Australia's most advanced risk-free lottery simulation and tracking platform. We help you visualize the math behind the luck, providing verified official data and high-speed simulation technology.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs mb-6">Lotto Simulation</h4>
                    <ul className="space-y-4 text-sm font-bold text-gray-400 uppercase tracking-tighter">
                      <li><Link href="/luck" className="hover:text-indigo-500 transition-colors">Track My Luck</Link></li>
                      <li><Link href="/simulator" className="hover:text-indigo-600 transition-colors">Turbo Lotto Simulation</Link></li>
                      <li><Link href="/odds" className="hover:text-indigo-600 transition-colors">Winning Odds</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs mb-6">Information</h4>
                    <ul className="space-y-4 text-sm font-bold text-gray-400 uppercase tracking-tighter">
                      <li><Link href="/how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</Link></li>
                      <li><Link href="/contact" className="hover:text-indigo-600 transition-colors">Contact Us</Link></li>
                      <li><Link href="/responsible-play" className="hover:text-indigo-600 transition-colors">Responsible Play</Link></li>
                      <li><Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link></li>
                      <li><Link href="/refund-policy" className="hover:text-indigo-600 transition-colors">Refund Policy</Link></li>
                      <li><Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link></li>
                    </ul>
                  </div>
                </div>
                <div className="pt-10 border-t border-gray-200 dark:border-white/5 text-center">
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">© 2026 WhatIFLotto Australia</p>
                  <p className="text-gray-500 dark:text-gray-500 text-[10px] leading-relaxed max-w-3xl mx-auto font-medium">
                    Disclaimer: WhatIFLotto is an independent lotto simulation platform and is not affiliated with, endorsed by, or sponsored by any official lottery provider. For simulation purposes only. No real money or gambling occurs on this platform.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
