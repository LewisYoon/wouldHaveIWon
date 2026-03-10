'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { name: 'Luck', href: '/luck' },
    { name: 'Simulator', href: '/simulator' },
    { name: 'Guides', href: '/blog' },
  ];

  return (
    <nav className="sticky top-0 w-full z-[100] transition-all duration-300 border-b border-gray-100 dark:border-white/10 shadow-sm bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-20 px-6">
        <Link href="/" className="group flex items-center gap-2">
          <Logo />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                pathname === link.href ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-4 bg-gray-100 dark:bg-white/5 p-1.5 pl-4 rounded-2xl border border-gray-200 dark:border-white/10">
              <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tighter hidden sm:block truncate max-w-[120px]">
                {user.email}
              </span>
              <button
                onClick={() => logout()}
                className="text-xs bg-white dark:bg-gray-900 text-red-500 font-bold px-4 py-2 rounded-xl shadow-sm border border-red-50 dark:border-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="text-xs bg-indigo-600 text-white font-black px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 hover:-translate-y-0.5 transition-all uppercase tracking-widest"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
