'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="w-full bg-gray-700 p-4 text-white shadow-md border-b border-gray-600">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link href="/" className="text-2xl font-extrabold tracking-wide">Lotto App</Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-gray-300">Hello, {user.email}</span>
              <button
                onClick={logout}
                className="text-sm bg-red-600 hover:bg-red-500 px-3 py-1 rounded transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded transition">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
