'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, UserPlus, LogIn, Building2, User, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Form fields
  const [email, setEmail] = useState('operator.alpha@example.test');
  const [password, setPassword] = useState('Password123!');
  const [displayName, setDisplayName] = useState('');
  const [orgId, setOrgId] = useState('org_demo_alpha');
  const [customOrg, setCustomOrg] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'signup') {
        const finalOrgId = orgId === 'custom' ? (customOrg.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'org_custom') : orgId;
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            display_name: displayName,
            org_id: finalOrgId,
            org_name: orgId === 'custom' ? customOrg : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create account');
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('pack_operator_email', data.user.email);
          localStorage.setItem('pack_operator_org', data.user.org_id);
          window.dispatchEvent(new Event('auth_state_changed'));
        }

        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => {
          router.push('/queue');
        }, 800);
      } else {
        // Sign In
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Invalid credentials');
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('pack_operator_email', data.user.email);
          localStorage.setItem('pack_operator_org', data.user.org_id);
          if (data.session?.access_token) {
            localStorage.setItem('pack_operator_token', data.session.access_token);
          }
          window.dispatchEvent(new Event('auth_state_changed'));
        }

        router.push('/queue');
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string, demoOrg: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setOrgId(demoOrg);
    setMode('signin');
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-[24px] neu-icon-well mx-auto flex items-center justify-center p-2 overflow-hidden">
          <img src="/icon.png" alt="Pack Manager" className="w-full h-full object-contain" />
        </div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">
          {mode === 'signin' ? 'Operator Sign In' : 'Create Operator Account'}
        </h1>
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {mode === 'signin'
            ? 'Access your fulfillment queue and pre-seal audit station'
            : 'Register a new warehouse operator account backed by Supabase Auth'}
        </p>
      </div>

      {/* Tabs */}
      <div className="p-1 rounded-2xl neu-pressed-sm grid grid-cols-2 gap-1 text-center">
        <button
          type="button"
          onClick={() => { setMode('signin'); setError(''); }}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mode === 'signin'
              ? 'neu-btn-primary'
              : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </button>
        <button
          type="button"
          onClick={() => { setMode('signup'); setError(''); }}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mode === 'signup'
              ? 'neu-btn-primary'
              : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Create Account</span>
        </button>
      </div>

      <div className="rounded-[32px] neu-flat p-8 space-y-6">
        {error && (
          <div className="p-3.5 rounded-2xl neu-pressed text-[#C62828] text-xs font-bold">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl neu-pressed text-emerald-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                Full Name / Display Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. John Packer"
                  className="w-full px-4 py-3 pl-10 rounded-2xl neu-pressed-sm text-xs font-medium focus:outline-none"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
              Work Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@company.com"
                className="w-full px-4 py-3 pl-10 rounded-2xl neu-pressed-sm text-xs font-medium focus:outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-3 pl-10 rounded-2xl neu-pressed-sm text-xs font-medium focus:outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                Assigned Organization (Tenant)
              </label>
              <div className="relative">
                <select
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-2xl neu-pressed-sm text-xs font-medium focus:outline-none appearance-none"
                >
                  <option value="org_demo_alpha">Alpha Logistics & Packs (org_demo_alpha)</option>
                  <option value="org_demo_bravo">Bravo Fulfillment 3PL (org_demo_bravo)</option>
                  <option value="custom">Other / Custom Organization</option>
                </select>
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>

              {orgId === 'custom' && (
                <div className="pt-2">
                  <input
                    type="text"
                    required
                    value={customOrg}
                    onChange={(e) => setCustomOrg(e.target.value)}
                    placeholder="Enter your organization name"
                    className="w-full px-4 py-2.5 rounded-2xl neu-pressed-sm text-xs font-medium focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl neu-btn-primary font-display font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 text-white disabled:opacity-50 transition-all mt-4"
          >
            <span>{loading ? 'Please wait...' : mode === 'signin' ? 'Sign In to Station' : 'Create & Store Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {mode === 'signin' && (
          <div className="pt-4 border-t border-[var(--neu-border-color)] space-y-3">
            <span className="text-[11px] font-bold text-slate-600 block text-center uppercase tracking-wider">
              Quick Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('operator.alpha@example.test', 'org_demo_alpha')}
                className="p-2.5 rounded-xl neu-flat-sm text-left hover:scale-[1.01] transition-transform"
              >
                <div className="font-bold text-[11px] text-slate-800">Alpha Operator</div>
                <div className="text-[10px] text-slate-500 font-mono">operator.alpha@...</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('operator.bravo@example.test', 'org_demo_bravo')}
                className="p-2.5 rounded-xl neu-flat-sm text-left hover:scale-[1.01] transition-transform"
              >
                <div className="font-bold text-[11px] text-slate-800">Bravo Operator</div>
                <div className="text-[10px] text-slate-500 font-mono">operator.bravo@...</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
