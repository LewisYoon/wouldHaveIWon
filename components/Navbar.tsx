'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { name: 'Luck', href: '/luck' },
    { name: 'Simulator', href: '/simulator' },
  ];

  return (
    <nav className="sticky top-0 w-full z-[100] transition-all duration-300 glass border-b border-white/20 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-20 px-6">
        <Link href="/" className="group flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
            <span className="text-white font-black text-xl">W</span>
          </div>
          <span className="text-2xl font-black tracking-tighter text-gray-900 uppercase">
            WhatIF<span className="text-indigo-600">Lotto</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                pathname === link.href ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4 bg-gray-100/50 p-1.5 pl-4 rounded-2xl border border-gray-200">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter hidden sm:block truncate max-w-[120px]">
                {user.email}
              </span>
              <button
                onClick={() => logout()}
                className="text-xs bg-white text-red-500 font-bold px-4 py-2 rounded-xl shadow-sm border border-red-50 hover:bg-red-50 transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="text-xs bg-indigo-600 text-white font-black px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all uppercase tracking-widest"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
