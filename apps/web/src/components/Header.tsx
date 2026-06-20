'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/store/auth';

const NAV = [
  { href: '/', label: 'Marketplace' },
  { href: '/#how', label: 'How it works' },
  { href: '/#impact', label: 'Impact' },
];

export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold tracking-tight text-ink">
            FoodSave
          </span>
          <span className="hidden text-[10px] uppercase tracking-widest text-muted sm:inline">
            est. 2026
          </span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[13px] uppercase tracking-[0.14em] transition-colors hover:text-ink ${
                pathname === item.href ? 'text-ink' : 'text-muted'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-[13px]">
          {user ? (
            <>
              {(user.role === 'RESTAURANT_OWNER' || user.role === 'ADMIN') && (
                <Link
                  href="/dashboard"
                  className="hidden uppercase tracking-[0.14em] text-muted hover:text-ink sm:inline"
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/orders"
                className="hidden uppercase tracking-[0.14em] text-muted hover:text-ink sm:inline"
              >
                Orders
              </Link>
              <button
                onClick={logout}
                className="btn-pill border border-ink/20 px-5 py-2 text-ink hover:bg-ink hover:text-cream"
              >
                {user.name.split(' ')[0]} · Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="uppercase tracking-[0.14em] text-muted hover:text-ink"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="btn-pill bg-ink px-5 py-2 text-cream hover:bg-espresso"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
