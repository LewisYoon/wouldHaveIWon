'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import SettingsModal from './SettingsModal';

export default function Navbar() {
  const { user, logout, isPremium } = useAuth();
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Luck', href: '/luck/' },
    { name: 'Simulator', href: '/simulator/' },
    { name: 'Analytics', href: '/analytics/' },
    { name: 'Hall of Fame', href: '/leaderboard/' },
    { name: 'Stats', href: '/dashboard/', authOnly: true },
    { name: 'Guides', href: '/blog/' },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <nav className="sticky top-0 w-full z-[9999] transition-all duration-300 border-b border-gray-100 dark:border-white/10 shadow-sm bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-20 px-6">
          <Link href="/" className="group flex items-center gap-2" onClick={closeMobileMenu}>
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              if (link.authOnly && !user) return null;
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                    pathname === link.href ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            
            {user ? (
              <div className="flex items-center gap-2 sm:gap-4 bg-gray-100 dark:bg-white/5 p-1 sm:p-1.5 sm:pl-4 rounded-2xl border border-gray-200 dark:border-white/10">
                <div className="hidden lg:flex flex-col items-start leading-none pr-2">
                  <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tighter truncate max-w-[120px]">
                    {user.email}
                  </span>
                  {isPremium ? (
                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-0.5">PRO Member</span>
                  ) : (
                    <Link href="/dashboard" className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-0.5 hover:underline transition-all">Upgrade to PRO</Link>
                  )}
                </div>
                <div className="flex gap-1 sm:gap-2">
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 text-gray-400 hover:text-indigo-500 transition-colors"
                    title="Settings"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
                  <button
                    onClick={() => logout()}
                    className="text-[10px] sm:text-xs bg-white dark:bg-gray-900 text-red-500 font-bold px-3 sm:px-4 py-2 rounded-xl shadow-sm border border-red-50 dark:border-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="text-[10px] sm:text-xs bg-indigo-600 text-white font-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 hover:-translate-y-0.5 transition-all uppercase tracking-widest"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-white/5 animate-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col p-6 space-y-4">
              {!isPremium && (
                <Link 
                  href="/dashboard" 
                  onClick={closeMobileMenu}
                  className="bg-gradient-to-r from-amber-400 to-orange-500 p-4 rounded-2xl text-center shadow-lg transform active:scale-95 transition-all"
                >
                  <span className="text-sm font-black text-white uppercase tracking-widest">🚀 Upgrade to PRO</span>
                </Link>
              )}
              {navLinks.map((link) => {
                if (link.authOnly && !user) return null;
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={`text-base font-black uppercase tracking-[0.2em] py-4 border-b border-gray-50 dark:border-white/5 last:border-0 ${
                      pathname === link.href ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <div className="pt-4 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Theme Mode</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </nav>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
