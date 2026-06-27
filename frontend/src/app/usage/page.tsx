'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest, ApiRequestError } from '@/lib/api';
import { UsageSummary } from '@/types';

const TOOL_LABELS: Record<string, string> = {
  merge: 'Merge',
  split: 'Split',
  compress: 'Compress',
  convert: 'Convert',
  pages: 'Add / Remove Pages',
  watermark: 'Watermark',
};

export default function UsagePage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<UsageSummary>('/api/usage/me')
      .then(setSummary)
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 401) {
          setError('Please log in to view your usage history.');
        } else {
          setError('Could not load usage history.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Your usage history</h1>
      <p className="mt-1 text-sm text-slate-600">
        Every successful tool run is recorded here.
      </p>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading…</p>}

      {!loading && error && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {error}{' '}
          <Link href="/login?next=/usage" className="font-medium text-teal-700 hover:text-teal-800">
            Log in
          </Link>
        </div>
      )}

      {!loading && summary && (
        <>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-2xl font-semibold text-slate-900">{summary.total}</div>
              <div className="text-xs text-slate-500">total runs</div>
            </div>
            {Object.entries(summary.byTool).map(([tool, count]) => (
              <div key={tool} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="text-2xl font-semibold text-slate-900">{count}</div>
                <div className="text-xs text-slate-500">{TOOL_LABELS[tool] ?? tool}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Tool</th>
                  <th className="px-4 py-2">File(s)</th>
                  <th className="px-4 py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {summary.logs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                      No activity yet. Try one of the tools.
                    </td>
                  </tr>
                ) : (
                  summary.logs.map((log) => (
                    <tr key={log._id} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-medium text-slate-800">
                        {TOOL_LABELS[log.tool] ?? log.tool}
                      </td>
                      <td className="max-w-xs truncate px-4 py-2 text-slate-600" title={log.originalFileName}>
                        {log.originalFileName}
                      </td>
                      <td className="px-4 py-2 text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
