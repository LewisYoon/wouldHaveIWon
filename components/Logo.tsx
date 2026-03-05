'use client';

interface LogoProps {
  className?: string;
  isDark?: boolean;
}

export default function Logo({ className = '', isDark }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:rotate-12 shrink-0">
        <span className="text-white font-black text-xl">W</span>
      </div>
      <span className={`text-2xl font-black tracking-tighter uppercase transition-colors duration-300 ${
        isDark === true ? 'text-white' : 
        isDark === false ? 'text-gray-900' : 
        'text-gray-900 dark:text-white'
      }`}>
        WhatIF<span className="text-indigo-600">Lotto</span>
      </span>
    </div>
  );
}
