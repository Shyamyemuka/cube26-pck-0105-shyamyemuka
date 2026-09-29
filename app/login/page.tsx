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
      // In full Supabase deployment:
      // const supabase = createClient();
      // const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      // if (authErr) throw authErr;

      // Store active demo operator in localStorage / cookie for demo navigation
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
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-100 text-emerald-700">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Operator Sign In</h1>
        <p className="text-xs text-slate-500">
          Sign in to access your organization’s packing queue
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="operator@example.test"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Signing in…' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="border-t border-slate-200 pt-4 space-y-2">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">
            One-Click Demo Operators
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('operator.alpha@example.test')}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-left"
            >
              <div className="font-bold text-slate-900">Alpha Org</div>
              <div className="text-[10px] text-slate-500 truncate">operator.alpha</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('operator.bravo@example.test')}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-left"
            >
              <div className="font-bold text-slate-900">Bravo Org</div>
              <div className="text-[10px] text-slate-500 truncate">operator.bravo</div>
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Org-scoped tenancy enforced by row-level security</span>
      </div>
    </div>
  );
}
