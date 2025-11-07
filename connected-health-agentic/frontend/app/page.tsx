'use client';

import Link from 'next/link';
import { useState } from 'react';

const translations = {
  en: {
    title: 'Choose your role',
    citizen: 'Citizen / شہری',
    lhw: 'Lady Health Worker',
    doctor: 'Doctor / Admin',
    reminders: 'Reminders',
    tagline: 'Multi-agent support for Pakistan’s connected health ecosystem',
  },
  ur: {
    title: 'Apna kirdar muntakhib karein',
    citizen: 'Shehri / Citizen',
    lhw: 'Lady Health Worker',
    doctor: 'Doctor / Admin',
    reminders: 'Yaadashtain',
    tagline: 'Pakistan ke connected health nizaam ke liye zaroori rehnumai',
  }
};

type LanguageKey = keyof typeof translations;

export default function LandingPage() {
  const [language, setLanguage] = useState<LanguageKey>('en');
  const t = translations[language];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-10">
      <div className="flex items-start justify-between flex-col sm:flex-row gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{t.title}</h2>
          <p className="text-slate-600 mt-2 max-w-xl">{t.tagline}</p>
        </div>
        <div className="flex gap-2">
          <button
            className={`btn-outline ${language === 'en' ? 'bg-primary/10' : ''}`}
            onClick={() => setLanguage('en')}
          >
            English
          </button>
          <button
            className={`btn-outline ${language === 'ur' ? 'bg-primary/10' : ''}`}
            onClick={() => setLanguage('ur')}
          >
            اردو
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RoleCard href="/citizen" title={t.citizen} description="Citizen-friendly AI chat for triage, facilities, and programs." />
        <RoleCard href="/lhw" title={t.lhw} description="Household roster, quick triage, and reminder setup." />
        <RoleCard href="/admin" title={t.doctor} description="Analytics flags and hotspot monitoring." />
        <RoleCard href="/reminders" title={t.reminders} description="View and update scheduled reminders." />
      </div>
    </div>
  );
}

function RoleCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="card hover:shadow-lg transition-shadow">
      <div className="flex flex-col gap-3">
        <h3 className="text-xl font-semibold text-primary">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
        <span className="text-sm text-primary font-medium">Start &rarr;</span>
      </div>
    </Link>
  );
}
