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
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-2xl font-bold">Create your account</h1>
      <form onSubmit={submit} className="space-y-3 rounded-xl border bg-white p-6">
        {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          {(['CUSTOMER', 'RESTAURANT_OWNER'] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => update('role', role)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                form.role === role
                  ? 'border-brand bg-brand text-white'
                  : 'border-slate-300 bg-white text-slate-600'
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
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          placeholder="Phone (optional, e.g. +77011234567)"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="mt-3 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
