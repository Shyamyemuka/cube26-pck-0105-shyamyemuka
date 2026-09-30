'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, User } from 'lucide-react';

export default function HeaderAuth() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userOrg, setUserOrg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateAuth = () => {
      const email = localStorage.getItem('pack_operator_email');
      const org = localStorage.getItem('pack_operator_org');
      setUserEmail(email);
      setUserOrg(org);
    };

    updateAuth();
    window.addEventListener('storage', updateAuth);
    window.addEventListener('auth_state_changed', updateAuth);
    return () => {
      window.removeEventListener('storage', updateAuth);
      window.removeEventListener('auth_state_changed', updateAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('pack_operator_email');
    localStorage.removeItem('pack_operator_token');
    setUserEmail(null);
    setUserOrg(null);
    window.dispatchEvent(new Event('auth_state_changed'));
  };

  if (!mounted) {
    return (
      <Link
        href="/login"
        className="px-5 py-2 rounded-2xl neu-btn-primary font-bold text-xs tracking-wide uppercase"
      >
        Sign In
      </Link>
    );
  }

  if (userEmail) {
    return (
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-pressed-sm text-xs font-bold text-slate-800 dark:text-slate-200">
          <User className="w-3.5 h-3.5 text-[#773C30] dark:text-[#6BFF86]" />
          <span className="truncate max-w-[120px]">{userEmail.split('@')[0]}</span>
          {userOrg && (
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 ml-1">
              {userOrg.replace('org_demo_', '')}
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 rounded-xl neu-flat-sm text-slate-600 dark:text-slate-300 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="px-5 py-2 rounded-2xl neu-btn-primary font-bold text-xs tracking-wide uppercase"
    >
      Sign In
    </Link>
  );
}
