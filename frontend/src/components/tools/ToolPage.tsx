'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ToolLayout from '@/components/tools/ToolLayout';
import FileUpload from '@/components/tools/FileUpload';
import AuthRequiredToast from '@/components/tools/AuthRequiredToast';
import { apiRequest } from '@/lib/api';
import { AuthMeResponse } from '@/types';

export interface ToolField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  help?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface ToolPageProps {
  title: string;
  description: string;
  endpoint: string;
  multiple?: boolean;
  accept?: string;
  fields?: ToolField[];
}

export default function ToolPage({
  title,
  description,
  endpoint,
  multiple = false,
  accept,
  fields = [],
}: ToolPageProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [files, setFiles] = useState<FileList | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? '']))
  );
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

    const missing = fields.find(
      (f) => f.required && !fieldValues[f.name]?.trim()
    );
    if (missing) {
      setMessage(`Please fill in "${missing.label}".`);
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
      fields.forEach((f) => formData.append(f.name, fieldValues[f.name] ?? ''));

      const response = await fetch(`/api/pdf/${endpoint}`, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setShowAuthToast(true);
          return;
        }
        let errorMessage = 'Processing failed. Please try again.';
        try {
          const data = await response.json();
          if (data?.message) errorMessage = data.message;
        } catch {
          // non-JSON error body; keep the default message
        }
        setMessage(errorMessage);
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      const filename =
        disposition?.match(/filename="?([^";]+)"?/)?.[1] ?? 'download.pdf';

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      const original = Number(response.headers.get('X-Original-Size'));
      const result = Number(response.headers.get('X-Compressed-Size'));
      if (original > 0 && result > 0) {
        const pct = Math.max(0, Math.round((1 - result / original) * 100));
        setMessage(
          pct > 0
            ? `Done. Reduced ${formatBytes(original)} → ${formatBytes(result)} (${pct}% smaller). Downloaded "${filename}".`
            : `Done. This PDF was already optimised (${formatBytes(original)}), so no size reduction was possible. Downloaded "${filename}".`
        );
      } else {
        setMessage(`Done. Downloaded "${filename}".`);
      }
    } catch (err) {
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

          <FileUpload multiple={multiple} accept={accept} onChange={setFiles} />

          {fields.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                {field.label}
              </label>
              {field.type === 'select' ? (
                <select
                  id={field.name}
                  value={fieldValues[field.name] ?? ''}
                  onChange={(e) =>
                    setFieldValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                  }
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={field.name}
                  type={field.type}
                  value={fieldValues[field.name] ?? ''}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  onChange={(e) =>
                    setFieldValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                  }
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              )}
              {field.help && (
                <p className="mt-1 text-xs text-slate-500">{field.help}</p>
              )}
            </div>
          ))}

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
