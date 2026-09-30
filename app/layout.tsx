import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Package, ShieldCheck, BarChart3 } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import AuroraBackground from '@/components/AuroraBackground';

export const metadata: Metadata = {
  title: 'Pack Manager — Autonomous Pre-Seal Package Audit',
  description: 'Industrial-grade pre-seal carton audit engine from phone photos. Enterprise package integrity and manifest verification.',
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
      <body className="flex flex-col min-h-screen antialiased text-slate-900 dark:text-white">
        <AuroraBackground />
        {/* Brush-stroke SVG filter — referenced by .hl-green::before in globals.css */}
        <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <defs>
            <filter id="brush-stroke-filter" x="-20%" y="-80%" width="140%" height="260%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.03 0.14" numOctaves="4" seed="9" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="11" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
        {/* Sticky Neumorphic Header */}
        <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <div className="max-w-7xl mx-auto rounded-[28px] neu-flat px-6 h-18 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl neu-icon-well flex items-center justify-center text-[#773C30] dark:text-[#6BFF86] group-hover:scale-105 transition-transform duration-300">
                <Package className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  Pack Manager
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#773C30] dark:text-[#6BFF86]">
                  Pre-Seal Audit Intelligence
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-2 sm:gap-4 text-sm font-semibold">
              <Link
                href="/queue"
                className="px-4 py-2 rounded-2xl text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white neu-flat-sm hover:translate-y-[-1px] transition-all"
              >
                Queue
              </Link>
              <Link
                href="/queue/import"
                className="px-4 py-2 rounded-2xl text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white neu-flat-sm hover:translate-y-[-1px] transition-all"
              >
                Import
              </Link>
              <Link
                href="/eval"
                className="px-4 py-2 rounded-2xl text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white neu-flat-sm hover:translate-y-[-1px] transition-all flex items-center gap-1.5"
              >
                <BarChart3 className="w-4 h-4 text-[#773C30] dark:text-[#6BFF86]" />
                <span>Benchmarks</span>
              </Link>

              {/* Theme Toggle Button */}

              <ThemeToggle />

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
          <div className="max-w-7xl mx-auto rounded-[32px] neu-pressed p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full neu-flat-sm flex items-center justify-center text-[#773C30] dark:text-[#6BFF86]">
                <ShieldCheck className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                Cryptographic Content Hash (SHA-256) & Sequential Audit Chain Verification.
              </span>
            </div>
            <div className="font-medium text-slate-500 dark:text-slate-400 text-center sm:text-right">
              Pack Manager Enterprise Platform · Autonomous Packaging Integrity
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
