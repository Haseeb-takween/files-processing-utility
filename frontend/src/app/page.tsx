'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { PDF_TOOLS } from '@/lib/tools';

export default function HomePage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">PDF Tools</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Browse tools freely. Sign in only when you&apos;re ready to process a file.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PDF_TOOLS.map((tool, index) => (
          <motion.div
            key={tool.slug}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Link
              href={tool.href}
              className="group block h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
            >
              <h2 className="text-lg font-medium text-slate-900 group-hover:text-teal-700">
                {tool.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{tool.description}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
