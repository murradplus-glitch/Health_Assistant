'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function CitizenPage() {
  const [sessionId] = useState(() => `citizen-${Date.now()}`);
  const [language, setLanguage] = useState<'en' | 'ur'>('ur');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [triage, setTriage] = useState<any>(null);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [degraded, setDegraded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setError(null);
    const newMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userRole: 'citizen',
          language,
          message: newMessage.content,
          patientContext: {
            age: 4,
            gender: 'male',
            district: 'Rawalpindi',
            tehsil: 'Rawalpindi',
            hasMockSehatCard: true,
          },
        }),
      });
      if (!response.ok) {
        throw new Error('Backend unavailable');
      }
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      setTriage(data.triageResult);
      setFacilities(data.facilities || []);
      setPrograms(data.programs || []);
      setReminders(data.remindersPreview || []);
      setDegraded(Boolean(data.degradedMode));
    } catch (err: any) {
      setError(err.message);
      setDegraded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-6">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold text-primary">Citizen Care Assistant</h2>
        <div className="flex gap-2">
          <button className={`btn-outline ${language === 'en' ? 'bg-primary/10' : ''}`} onClick={() => setLanguage('en')}>
            English
          </button>
          <button className={`btn-outline ${language === 'ur' ? 'bg-primary/10' : ''}`} onClick={() => setLanguage('ur')}>
            اردو
          </button>
        </div>
      </div>

      {degraded && (
        <div className="banner">
          Offline / limited mode: Recommendations may be basic. For emergencies, go to the nearest hospital immediately.
        </div>
      )}

      {error && <div className="banner bg-red-100 border-red-300 text-red-800">{error}</div>}

      <div className="card flex flex-col gap-4">
        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-sm text-slate-500">Start the conversation by describing symptoms in Urdu, Roman Urdu, or English.</p>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`p-3 rounded-xl text-sm ${message.role === 'user' ? 'bg-primary/10 text-primary self-end' : 'bg-slate-100 text-slate-800 self-start'}`}>
              {message.content}
            </div>
          ))}
          {loading && <p className="text-sm text-slate-500">Thinking...</p>}
        </div>
        <div className="flex gap-3">
          <textarea
            className="flex-1 rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-primary"
            rows={2}
            placeholder="Example: Bachay ko bukhar aur khansi hai"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={loading}
          />
          <button className="btn-primary" onClick={sendMessage} disabled={loading}>
            Send
          </button>
        </div>
      </div>

      {triage && (
        <div className="card">
          <div className="flex items-center gap-2">
            <span className={`badge ${triage.level === 'emergency' ? 'badge-danger' : 'badge-warning'}`}>{triage.level}</span>
            <h3 className="text-lg font-semibold">Triage assessment</h3>
          </div>
          <p className="text-sm text-slate-600 mt-2">{triage.reason}</p>
          <p className="text-sm text-slate-600 mt-1">Urgency: {triage.recommendedUrgency}</p>
          <p className="text-xs text-slate-500 mt-2">{triage.disclaimer}</p>
        </div>
      )}

      {facilities.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-primary">Recommended facilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facilities.map((facility, index) => (
              <div key={index} className="card">
                <h4 className="text-base font-semibold text-slate-800">{facility.name}</h4>
                <p className="text-xs text-slate-500">{facility.type}</p>
                {facility.distanceKm && <p className="text-xs text-slate-500">Distance: {facility.distanceKm} km</p>}
                <p className="text-xs text-slate-500">Status: {facility.isOpen ? 'Open' : 'Closed'}</p>
                {facility.servicesSummary && (
                  <p className="text-xs text-slate-500 mt-2">Services: {facility.servicesSummary.join(', ')}</p>
                )}
                {facility.stockAlerts && facility.stockAlerts.length > 0 && (
                  <p className="text-xs text-danger mt-2">Stock alerts: {facility.stockAlerts.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {programs.length > 0 && (
        <section className="card">
          <h3 className="text-lg font-semibold text-primary">Program eligibility</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {programs.map((program, index) => (
              <li key={index}>
                <span className="font-semibold">{program.name}</span> – {program.reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      {reminders.length > 0 && (
        <section className="card">
          <h3 className="text-lg font-semibold text-primary">Reminders scheduled</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {reminders.map((reminder, index) => (
              <li key={index}>{reminder.message} – {new Date(reminder.scheduledAt).toLocaleString()}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
