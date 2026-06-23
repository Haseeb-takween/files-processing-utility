'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ToolLayout from '@/components/tools/ToolLayout';
import FileUpload from '@/components/tools/FileUpload';
import AuthRequiredToast from '@/components/tools/AuthRequiredToast';
import { apiRequest, ApiRequestError } from '@/lib/api';
import { AuthMeResponse } from '@/types';

interface ToolPageProps {
  title: string;
  description: string;
  endpoint: string;
  multiple?: boolean;
}

export default function ToolPage({
  title,
  description,
  endpoint,
  multiple = false,
}: ToolPageProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [files, setFiles] = useState<FileList | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAuthToast, setShowAuthToast] = useState(false);

  const loginHref = `/login?next=${encodeURIComponent(pathname)}`;

  const checkAuth = async (): Promise<boolean> => {
    try {
      await apiRequest<AuthMeResponse>('/api/auth/me');
      return true;
    } catch {
      return false;
    }
  };

  const handleProcess = async () => {
    if (!files?.length) {
      setMessage('Please select a file first.');
      return;
    }

    setMessage('');
    const isAuthenticated = await checkAuth();

    if (!isAuthenticated) {
      setShowAuthToast(true);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));

      const response = await apiRequest<{ message?: string }>(`/api/pdf/${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      setMessage(response.message || 'Request sent successfully. PDF processing will be implemented next.');
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setShowAuthToast(true);
        return;
      }
      setMessage(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToolLayout title={title} description={description}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Browse freely — sign in or register when you&apos;re ready to process a file.
          </p>

          <FileUpload multiple={multiple} onChange={setFiles} />

          <motion.button
            type="button"
            onClick={handleProcess}
            disabled={loading}
            whileHover={shouldReduceMotion ? undefined : { scale: loading ? 1 : 1.01 }}
            whileTap={shouldReduceMotion ? undefined : { scale: loading ? 1 : 0.98 }}
            className="rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Process'}
          </motion.button>

          {message && (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {message}
            </p>
          )}

          <p className="text-sm text-slate-500">
            Need an account?{' '}
            <Link href="/register" className="font-medium text-teal-700 hover:text-teal-800">
              Register
            </Link>
          </p>
        </div>
      </ToolLayout>

      <AuthRequiredToast
        show={showAuthToast}
        loginHref={loginHref}
        onClose={() => setShowAuthToast(false)}
      />
    </>
  );
}
