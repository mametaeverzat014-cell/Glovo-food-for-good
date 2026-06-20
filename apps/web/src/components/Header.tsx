'use client';

import Link from 'next/link';
import { useAuth } from '@/store/auth';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand">
          <span aria-hidden>🥗</span> FoodSave
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-slate-600 hover:text-brand">
            Marketplace
          </Link>

          {user ? (
            <>
              {(user.role === 'RESTAURANT_OWNER' || user.role === 'ADMIN') && (
                <Link href="/dashboard" className="text-slate-600 hover:text-brand">
                  Dashboard
                </Link>
              )}
              <Link href="/orders" className="text-slate-600 hover:text-brand">
                My Orders
              </Link>
              <span className="hidden text-slate-400 sm:inline">·</span>
              <span className="hidden text-slate-700 sm:inline">{user.name}</span>
              <button
                onClick={logout}
                className="rounded-md border border-slate-300 px-3 py-1 text-slate-600 hover:bg-slate-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-600 hover:text-brand">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-dark"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
