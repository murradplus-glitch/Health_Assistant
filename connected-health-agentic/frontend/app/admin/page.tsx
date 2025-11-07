'use client';

import useSWR from 'swr';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AnalyticsSummary {
  totalInteractions: number;
  triageDistribution: Record<string, number>;
  hotspotFlags: Array<{ id: number; district?: string; tehsil?: string; cases?: number; condition?: string; windowHours?: number; createdAt?: string }>;
}

export default function AdminPage() {
  const { data } = useSWR<AnalyticsSummary>(`${API_BASE}/api/analytics/summary`, fetcher, {
    refreshInterval: 10000,
  });

  const triageLevels = data ? Object.entries(data.triageDistribution) : [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-6">
      <h2 className="text-2xl font-semibold text-primary">Admin Analytics Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-500 uppercase">Total interactions</h3>
          <p className="text-3xl font-bold text-slate-900">{data?.totalInteractions ?? '—'}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-500 uppercase">Triage distribution</h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            {triageLevels.map(([level, count]) => (
              <li key={level} className="flex justify-between">
                <span className="capitalize">{level}</span>
                <span>{count}</span>
              </li>
            ))}
            {triageLevels.length === 0 && <li>No data</li>}
          </ul>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-slate-800">Hotspot alerts</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="py-2">District</th>
                <th className="py-2">Tehsil</th>
                <th className="py-2">Condition</th>
                <th className="py-2">Cases (24h)</th>
                <th className="py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {data?.hotspotFlags?.map((flag) => (
                <tr key={flag.id} className="border-t border-slate-100">
                  <td className="py-2">{flag.district || '—'}</td>
                  <td className="py-2">{flag.tehsil || '—'}</td>
                  <td className="py-2">{flag.condition || '—'}</td>
                  <td className="py-2">{flag.cases ?? '—'}</td>
                  <td className="py-2">{flag.createdAt ? new Date(flag.createdAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {(!data || data.hotspotFlags.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">No hotspot alerts detected.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
