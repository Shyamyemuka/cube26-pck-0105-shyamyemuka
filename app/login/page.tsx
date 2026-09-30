'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('operator.alpha@example.test');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orgId = email.includes('bravo') ? 'org_demo_bravo' : 'org_demo_alpha';
      if (typeof window !== 'undefined') {
        localStorage.setItem('pack_operator_email', email);
        localStorage.setItem('pack_operator_org', orgId);
      }
      router.push('/queue');
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    const orgId = demoEmail.includes('bravo') ? 'org_demo_bravo' : 'org_demo_alpha';
    if (typeof window !== 'undefined') {
      localStorage.setItem('pack_operator_email', demoEmail);
      localStorage.setItem('pack_operator_org', orgId);
    }
    router.push('/queue');
  };

  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-[24px] neu-icon-well mx-auto flex items-center justify-center text-[#5A3E2B]">
          <Package className="w-8 h-8 stroke-[2.2]" />
        </div>
        <h1 className="font-display font-extrabold text-2xl text-[#1C2024] tracking-tight">
          Operator Sign In
        </h1>
        <p className="text-xs font-medium text-[#4A545E]">
          Select an organization to switch tenancy and view its isolated queue
        </p>
      </div>

      <div className="rounded-[32px] neu-flat p-8 space-y-6">
        {error && (
          <div className="p-3.5 rounded-2xl neu-pressed bg-[#E0E5EC] text-[#6B2D1C] text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#3D4852] uppercase tracking-wider block">
              Operator Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#606C78] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl neu-input text-sm font-semibold text-[#1C2024]"
                placeholder="operator@example.test"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#3D4852] uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#606C78] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl neu-input text-sm font-semibold text-[#1C2024]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl neu-btn-primary font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In To Station'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        <div className="border-t border-[#D4DCE6]/50 pt-5 space-y-3">
          <div className="text-[11px] font-bold text-[#606C78] uppercase tracking-wider text-center">
            Switch Active Tenant
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleQuickLogin('operator.alpha@example.test')}
              className="p-3.5 rounded-2xl neu-flat-sm hover:neu-flat-hover transition-all text-left group"
            >
              <div className="font-display font-bold text-xs text-[#1C2024] group-hover:text-[#5A3E2B]">
                Alpha Tenant
              </div>
              <div className="text-[10px] font-mono text-[#606C78] truncate">org_demo_alpha</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('operator.bravo@example.test')}
              className="p-3.5 rounded-2xl neu-flat-sm hover:neu-flat-hover transition-all text-left group"
            >
              <div className="font-display font-bold text-xs text-[#1C2024] group-hover:text-[#5A3E2B]">
                Bravo Tenant
              </div>
              <div className="text-[10px] font-mono text-[#606C78] truncate">org_demo_bravo</div>
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-xs font-medium text-[#4A545E] flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-[#5A3E2B]" />
        <span>Org-scoped tenancy enforced by PostgreSQL Row-Level Security</span>
      </div>
    </div>
  );
}
