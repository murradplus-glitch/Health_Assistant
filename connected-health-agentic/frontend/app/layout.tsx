import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Connected Health Agentic Assistant',
  description: 'Agentic AI prototype for Pakistan’s connected health ecosystem',
  manifest: '/manifest.json'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen flex flex-col">
          <header className="px-6 py-4 bg-white/80 backdrop-blur border-b border-slate-200">
            <div className="max-w-5xl mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold text-primary">Connected Health Agentic</h1>
                <p className="text-sm text-slate-600">This is a decision-support tool, not a doctor. In case of severe symptoms or doubt, go to the nearest emergency facility immediately.</p>
              </div>
              <div className="text-xs text-right text-slate-500">
                Multi-language · Offline aware · Auditable tools
              </div>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="px-6 py-4 text-xs text-center text-slate-500 bg-white/60 border-t border-slate-200">
            &copy; {new Date().getFullYear()} Connected Health Agentic Prototype. All data is mock.
          </footer>
        </div>
      </body>
    </html>
  );
}
