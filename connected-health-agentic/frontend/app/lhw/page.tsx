'use client';

import { useState } from 'react';
import useSWR from 'swr';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Patient {
  id: number;
  fullName: string;
  age: number;
  gender: string;
  pregnancyStatus?: string | null;
  address?: string | null;
}

export default function LhwPage() {
  const { data: patients } = useSWR<Patient[]>(`${API_BASE}/api/patients`, fetcher);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [note, setNote] = useState('Patient ko bukhar aur zara sa rash hai.');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [degraded, setDegraded] = useState(false);

  const handleQuickTriage = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    try {
      const result = await fetch(`${API_BASE}/api/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `lhw-${selectedPatient.id}-${Date.now()}`,
          userRole: 'lhw',
          language: 'ur',
          message: note,
          patientContext: {
            id: selectedPatient.id,
            age: selectedPatient.age,
            gender: selectedPatient.gender,
            district: 'Rawalpindi',
            tehsil: 'Rawalpindi',
          },
        }),
      });
      const payload = await result.json();
      setResponse(payload.reply);
      setDegraded(Boolean(payload.degradedMode));
    } catch (error) {
      setResponse('Offline guidance: Observe patient, refer to nearest clinic if symptoms persist.');
      setDegraded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-primary">Lady Health Worker Console</h2>
        {degraded && (
          <span className="banner">Offline / limited mode active. Use printed guidelines as backup.</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 card flex flex-col gap-3 max-h-[520px] overflow-y-auto">
          <h3 className="text-lg font-semibold">Households</h3>
          {patients?.map((patient) => (
            <button
              key={patient.id}
              className={`text-left rounded-xl border px-3 py-2 transition-colors ${selectedPatient?.id === patient.id ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-slate-50'}`}
              onClick={() => {
                setSelectedPatient(patient);
                setResponse('');
              }}
            >
              <div className="font-medium text-slate-800">{patient.fullName}</div>
              <div className="text-xs text-slate-500">Age {patient.age}, {patient.gender}</div>
              {patient.pregnancyStatus && <div className="text-xs text-amber-600">{patient.pregnancyStatus}</div>}
            </button>
          ))}
        </div>

        <div className="md:col-span-2 card flex flex-col gap-4">
          {selectedPatient ? (
            <>
              <div>
                <h3 className="text-xl font-semibold text-slate-800">{selectedPatient.fullName}</h3>
                <p className="text-sm text-slate-500">{selectedPatient.address || 'No address recorded'}</p>
              </div>
              <textarea
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <button className="btn-primary w-full" onClick={handleQuickTriage} disabled={loading}>
                {loading ? 'Checking...' : 'Run quick triage'}
              </button>
              {response && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 whitespace-pre-line">
                  {response}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">Select a household to begin triage.</p>
          )}
        </div>
      </div>
    </div>
  );
}
