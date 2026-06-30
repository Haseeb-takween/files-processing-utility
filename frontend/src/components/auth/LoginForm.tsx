'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { apiRequest } from '@/lib/api';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const next = searchParams.get('next');
      const dest = next?.startsWith('/') ? next : '/';
      // Hard navigation (not router.push) so the middleware re-runs with the
      // freshly-set auth cookie. A soft navigation would reuse the prefetched
      // logged-out redirect cached for /tools/* and bounce back to /login.
      window.location.assign(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <motion.p
          initial={shouldReduceMotion ? false : { x: 0 }}
          animate={shouldReduceMotion ? undefined : { x: [0, -8, 8, -6, 6, 0] }}
          transition={{ duration: 0.4 }}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </motion.p>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={shouldReduceMotion ? undefined : { scale: loading ? 1 : 1.01 }}
        whileTap={shouldReduceMotion ? undefined : { scale: loading ? 1 : 0.98 }}
        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-teal-600/20 transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </motion.button>
    </form>
  );
}
