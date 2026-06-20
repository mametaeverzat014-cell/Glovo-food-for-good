'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/store/auth';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-24">
      <p className="eyebrow">Welcome back</p>
      <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-ink">Sign in</h1>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-4xl border border-line bg-cream p-8">
        {error && (
          <p className="rounded-2xl bg-clay/10 px-4 py-3 text-sm text-clay">{error}</p>
        )}
        <div>
          <label className="eyebrow mb-2 block">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink focus:border-taupe focus:outline-none"
          />
        </div>
        <div>
          <label className="eyebrow mb-2 block">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink focus:border-taupe focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-pill w-full bg-ink py-3 text-cream hover:bg-espresso disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New here?{' '}
        <Link href="/register" className="text-clay underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
