import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Package, ShieldCheck, BarChart3, Database, Layers, ArrowRight } from 'lucide-react';

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col min-h-screen bg-[#E0E5EC] text-[#1C2024] antialiased">
        {/* Sticky Neumorphic Header */}
        <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <div className="max-w-7xl mx-auto rounded-[28px] neu-flat px-6 h-18 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl neu-icon-well flex items-center justify-center text-[#382417] group-hover:scale-105 transition-transform duration-300">
                <Package className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-lg tracking-tight text-[#1C2024]">
                  Pack Manager
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E492F]">
                  CUBE 2026 · Track 03
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-2 sm:gap-4 text-sm font-semibold">
              <Link
                href="/queue"
                className="px-4 py-2 rounded-2xl text-[#3D4852] hover:text-[#1C2024] neu-flat-sm hover:translate-y-[-1px] transition-all"
              >
                Queue
              </Link>
              <Link
                href="/queue/import"
                className="px-4 py-2 rounded-2xl text-[#3D4852] hover:text-[#1C2024] neu-flat-sm hover:translate-y-[-1px] transition-all"
              >
                Import
              </Link>
              <Link
                href="/eval"
                className="px-4 py-2 rounded-2xl text-[#3D4852] hover:text-[#1C2024] neu-flat-sm hover:translate-y-[-1px] transition-all flex items-center gap-1.5"
              >
                <BarChart3 className="w-4 h-4 text-[#6E492F]" />
                <span>Eval</span>
              </Link>
              <Link
                href="/api/v1/evidence"
                target="_blank"
                className="px-4 py-2 rounded-2xl text-[#3D4852] hover:text-[#1C2024] neu-flat-sm hover:translate-y-[-1px] transition-all hidden sm:flex items-center gap-1.5"
              >
                <Database className="w-4 h-4 text-[#6E492F]" />
                <span>API</span>
              </Link>
              <Link
                href="/login"
                className="px-5 py-2 rounded-2xl neu-btn-primary font-bold text-xs tracking-wide uppercase"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Soft Neumorphic Footer */}
        <footer className="mt-auto px-4 sm:px-6 lg:px-8 pb-6 pt-10">
          <div className="max-w-7xl mx-auto rounded-[32px] neu-pressed p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#525B66]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full neu-flat-sm flex items-center justify-center text-[#5A3E2B]">
                <ShieldCheck className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="font-medium text-[#4A545E]">
                Content hash only. Edits detectable by us. Not tamper-proof or blockchain.
              </span>
            </div>
            <div className="font-medium text-[#525B66] text-center sm:text-right">
              CUBE Buildathon 2026 · Track 03 (Pack Manager) · Participant: <span className="font-bold text-[#1C2024]">Shyamyemuka</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
