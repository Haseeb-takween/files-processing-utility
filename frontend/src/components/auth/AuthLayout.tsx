'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-[calc(100vh-0px)] flex-1 items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.16),_transparent_40%)]" />
      <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/60 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur-md"
      >
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-teal-700">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-xs font-bold text-white">
            FP
          </span>
          File Processing Utility
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        </div>

        {children}

        <div className="mt-6 text-sm text-slate-600">{footer}</div>
      </motion.div>
    </div>
  );
}
