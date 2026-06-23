'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import ToolLayout from '@/components/tools/ToolLayout';
import FileUpload from '@/components/tools/FileUpload';
import { apiRequest } from '@/lib/api';

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
  const shouldReduceMotion = useReducedMotion();
  const [files, setFiles] = useState<FileList | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!files?.length) {
      setMessage('Please select a file first.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));

      const response = await apiRequest<{ message?: string }>(`/api/pdf/${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      setMessage(response.message || 'Request sent successfully. PDF processing will be implemented next.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolLayout title={title} description={description}>
      <div className="space-y-4">
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
      </div>
    </ToolLayout>
  );
}
