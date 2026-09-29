import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Package, ShieldCheck, BarChart3, Database } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pack Manager — Pre-Seal Package Audit',
  description: 'AI-assisted pre-seal package audit agent from one phone photo. CUBE Buildathon 2026 Track 03.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white hover:text-emerald-400 transition">
              <Package className="w-6 h-6 text-emerald-400" />
              <span>Pack Manager</span>
              <span className="text-xs font-normal text-emerald-400/80 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 ml-1">
                Track 03
              </span>
            </Link>

            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link href="/queue" className="text-slate-300 hover:text-white px-2 py-1 transition">
                Queue
              </Link>
              <Link href="/queue/import" className="text-slate-300 hover:text-white px-2 py-1 transition">
                Import
              </Link>
              <Link href="/eval" className="text-slate-300 hover:text-white px-2 py-1 transition flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                <span>Eval</span>
              </Link>
              <Link href="/api/v1/evidence" className="text-slate-300 hover:text-white px-2 py-1 transition hidden sm:flex items-center gap-1">
                <Database className="w-4 h-4" />
                <span>API</span>
              </Link>
              <Link
                href="/login"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        <footer className="bg-slate-900 border-t border-slate-800 py-6 text-slate-400 text-xs mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Content hash only. Not tamper-proof or immutable.</span>
            </div>
            <div>
              CUBE Buildathon 2026 · Track 03 (Pack Manager) · By Shyam (`Shyamyemuka`)
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
