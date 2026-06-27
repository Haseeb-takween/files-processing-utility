'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';

interface AuthRequiredToastProps {
  show: boolean;
  loginHref: string;
  onClose: () => void;
}

export default function AuthRequiredToast({
  show,
  loginHref,
  onClose,
}: AuthRequiredToastProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <motion.div
        role="alert"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25 }}
        className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-amber-200 bg-white p-4 shadow-lg shadow-slate-900/10"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Account required</p>
            <p className="mt-1 text-sm text-slate-600">
              Please register or sign in to process files. Only logged-in users can use this tool.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-1 text-slate-400 hover:text-slate-600"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>

        <div className="flex gap-2">
          <Link
            href={loginHref}
            className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-slate-700"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Register
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
