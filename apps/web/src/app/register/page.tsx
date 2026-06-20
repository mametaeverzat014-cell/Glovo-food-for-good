'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/store/auth';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuth((s) => s.register);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CUSTOMER' as 'CUSTOMER' | 'RESTAURANT_OWNER',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        role: form.role,
      });
      router.push(form.role === 'RESTAURANT_OWNER' ? '/dashboard' : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-24">
      <p className="eyebrow">Join FoodSave</p>
      <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-ink">
        Create your account
      </h1>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-4xl border border-line bg-cream p-8">
        {error && <p className="rounded-2xl bg-clay/10 px-4 py-3 text-sm text-clay">{error}</p>}

        <div className="grid grid-cols-2 gap-2 rounded-full border border-line bg-paper p-1">
          {(['CUSTOMER', 'RESTAURANT_OWNER'] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => update('role', role)}
              className={`rounded-full py-2 text-sm font-medium transition-colors ${
                form.role === role ? 'bg-ink text-cream' : 'text-muted hover:text-ink'
              }`}
            >
              {role === 'CUSTOMER' ? 'Customer' : 'Restaurant'}
            </button>
          ))}
        </div>

        <input
          placeholder="Full name"
          required
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink focus:border-taupe focus:outline-none"
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink focus:border-taupe focus:outline-none"
        />
        <input
          placeholder="Phone (optional, e.g. +77011234567)"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink focus:border-taupe focus:outline-none"
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink focus:border-taupe focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-pill w-full bg-ink py-3 text-cream hover:bg-espresso disabled:opacity-60"
        >
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-clay underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
