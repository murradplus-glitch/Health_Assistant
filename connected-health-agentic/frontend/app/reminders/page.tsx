'use client';

import { useState } from 'react';
import useSWR from 'swr';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Reminder {
  id: number;
  patientId: number;
  type: string;
  message: string;
  scheduledAt: string;
  status: string;
}

export default function RemindersPage() {
  const [patientId, setPatientId] = useState<number | undefined>();
  const { data: reminders, mutate } = useSWR<Reminder[]>(() => `${API_BASE}/api/reminders${patientId ? `?patientId=${patientId}` : ''}`, fetcher);

  const updateReminder = async (id: number, status: 'done' | 'missed') => {
    await fetch(`${API_BASE}/api/reminders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    mutate();
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-primary">Reminder Hub</h2>
        <div className="flex gap-2 text-sm">
          <label className="flex items-center gap-2">
            Filter by patient ID
            <input
              type="number"
              className="w-24 rounded-lg border border-slate-300 px-2 py-1"
              value={patientId ?? ''}
              onChange={(event) => setPatientId(event.target.value ? Number(event.target.value) : undefined)}
            />
          </label>
        </div>
      </div>

      <div className="card divide-y divide-slate-100">
        {reminders?.map((reminder) => (
          <div key={reminder.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-800">{reminder.message}</div>
              <div className="text-xs text-slate-500">Due: {new Date(reminder.scheduledAt).toLocaleString()} · Patient #{reminder.patientId}</div>
              <div className="text-xs text-slate-500 capitalize">Type: {reminder.type}</div>
            </div>
            <div className="flex gap-2">
              <span className="badge badge-warning capitalize">{reminder.status}</span>
              <button className="btn-outline" onClick={() => updateReminder(reminder.id, 'done')}>
                Done
              </button>
              <button className="btn-outline" onClick={() => updateReminder(reminder.id, 'missed')}>
                Missed
              </button>
            </div>
          </div>
        )) || <p className="text-sm text-slate-500 py-6">No reminders found.</p>}
      </div>
    </div>
  );
}
