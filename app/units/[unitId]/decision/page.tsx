'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  Camera,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { AgentResult } from '@/lib/agent/pipeline';

export default function DecisionPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.unitId as string;

  const [result, setResult] = useState<AgentResult | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideVerdict, setOverrideVerdict] = useState<'SEAL' | 'STOP_AND_FIX'>('SEAL');
  const [overrideReasonCode, setOverrideReasonCode] = useState('agent_wrong_count');
  const [overrideReasonText, setOverrideReasonText] = useState('');
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState(false);
  const [showWhyExpander, setShowWhyExpander] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`decision_${unitId}`);
      if (saved) {
        try {
          setResult(JSON.parse(saved));
        } catch (e) {
          // Parse error
        }
      }
    }
  }, [unitId]);

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;
    setOverrideSubmitting(true);

    try {
      const orgId = typeof window !== 'undefined' ? localStorage.getItem('pack_operator_org') || 'org_demo_alpha' : 'org_demo_alpha';
      const res = await fetch(`/api/units/${encodeURIComponent(unitId)}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          original_verdict: result.verdict,
          original_route: result.route,
          new_verdict: overrideVerdict,
          reason_code: overrideReasonCode,
          reason_text: overrideReasonText,
          operator_id: 'usr-operator-01',
        }),
      });

      if (!res.ok) throw new Error('Failed to record override');

      setOverrideSuccess(true);
      setShowOverrideModal(false);
      const updated: AgentResult = {
        ...result,
        verdict: overrideVerdict,
        route: overrideVerdict === 'SEAL' ? 'SEAL' : 'STOP_AND_FIX',
      };
      setResult(updated);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`decision_${unitId}`, JSON.stringify(updated));
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Override error');
    } finally {
      setOverrideSubmitting(false);
    }
  };

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto rounded-[32px] neu-flat p-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-[24px] neu-icon-well mx-auto flex items-center justify-center text-[#5A3E2B] dark:text-[#C4F82A]">
          <Package className="w-8 h-8 stroke-[2.2]" />
        </div>
        <div>
          <h2 className="font-display font-extrabold text-2xl text-[var(--neu-text-primary)]">No Audit Run Yet</h2>
          <p className="text-sm font-medium text-[var(--neu-text-secondary)] mt-1">
            Carton <span className="font-mono font-bold text-[var(--neu-text-primary)]">{unitId}</span> has not been photographed or evaluated yet.
          </p>
        </div>
        <div>
          <Link
            href={`/units/${unitId}/capture`}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl neu-btn-highlight font-display font-bold text-xs uppercase tracking-wide"
          >
            <Camera className="w-4 h-4 stroke-[2.2]" />
            <span>Proceed to Photo Capture</span>
          </Link>
        </div>
      </div>
    );
  }

  const isSeal = result.verdict === 'SEAL';
  const isStop = result.verdict === 'STOP_AND_FIX';
  const isUncertain = result.verdict === 'UNCERTAIN';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/units/${unitId}/capture`}
            className="w-12 h-12 rounded-2xl neu-flat hover:neu-flat-hover flex items-center justify-center text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)] transition-all"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.2]" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display font-extrabold text-2xl text-[var(--neu-text-primary)] tracking-tight">
                Package Audit Verdict
              </h1>
              <span className="font-mono text-xs font-bold text-[#5A3E2B] dark:text-[#C4F82A] neu-pressed-sm px-2.5 py-1 rounded-xl">
                {unitId}
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6E492F] dark:text-[#C4F82A] mt-0.5">
              Route: {result.route} • Pipeline: {result.status}
            </p>
          </div>
        </div>

        <Link
          href={`/units/${unitId}/record`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl neu-btn-secondary text-xs font-bold text-[var(--neu-text-primary)]"
        >
          <FileText className="w-4 h-4 text-[#5A3E2B] dark:text-[#C4F82A] stroke-[2.2]" />
          <span>Evidence Record</span>
        </Link>
      </div>

      {overrideSuccess && (
        <div className="p-5 rounded-2xl neu-flat flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl neu-icon-well flex items-center justify-center text-[#2E7D32] dark:text-[#A3E635]">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-sm font-bold text-[var(--neu-text-primary)]">
            Operator override logged and securely appended to sequential hash chain!
          </span>
        </div>
      )}

      {/* Main Verdict Card */}
      <div className="rounded-[32px] neu-flat p-8 sm:p-10 space-y-6 text-center">
        {isSeal && (
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-[28px] neu-icon-well mx-auto flex items-center justify-center text-[#2E7D32] dark:text-[#A3E635]">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <div>
              <div className="inline-block px-5 py-2 rounded-2xl bg-[#142618] text-[#A3E635] border border-[#27502B] font-display font-extrabold text-2xl tracking-wide neu-flat-sm">
                SEAL CARTON
              </div>
              <p className="text-sm font-semibold text-[var(--neu-text-secondary)] mt-3">
                All manifest lines verified. Quantities match. No extra or substituted items.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/queue"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl neu-btn-highlight font-display font-extrabold text-sm uppercase tracking-wider"
              >
                <span>Tape & Next Order</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </div>
        )}

        {isStop && (
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-[28px] neu-icon-well mx-auto flex items-center justify-center text-[#C62828] dark:text-[#F87171]">
              <XCircle className="w-10 h-10 stroke-[2.5]" />
            </div>
            <div>
              <div className="inline-block px-5 py-2 rounded-2xl bg-[#3A1715] text-[#F87171] border border-[#5C2320] font-display font-extrabold text-2xl tracking-wide neu-flat-sm">
                STOP AND FIX
              </div>
              <p className="text-sm font-semibold text-[var(--neu-text-secondary)] mt-3">
                Discrepancy detected between box contents and customer manifest. Do not seal!
              </p>
            </div>
          </div>
        )}

        {isUncertain && (
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-[28px] neu-icon-well mx-auto flex items-center justify-center text-[#B45309] dark:text-[#FBBF24]">
              <HelpCircle className="w-10 h-10 stroke-[2.5]" />
            </div>
            <div>
              <div className="inline-block px-5 py-2 rounded-2xl bg-[#3B2915] text-[#FBBF24] border border-[#5C3F1E] font-display font-extrabold text-2xl tracking-wide neu-flat-sm">
                UNCERTAIN — RECAPTURE OR REVIEW
              </div>
              <p className="text-sm font-semibold text-[var(--neu-text-secondary)] mt-3">
                Model declined to judge due to lighting, angle, or low confidence. Safe operational abstention.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href={`/units/${unitId}/capture`}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl neu-btn-secondary font-display font-bold text-xs uppercase tracking-wide"
              >
                <Camera className="w-4 h-4 stroke-[2.2] text-[#5A3E2B] dark:text-[#C4F82A]" />
                <span>Recapture Photos</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Discrepancies / Fix List */}
      {result.discrepancies && result.discrepancies.length > 0 && (
        <div className="rounded-[32px] neu-flat p-6 sm:p-8 space-y-4">
          <h2 className="font-display font-bold text-base text-[var(--neu-text-primary)] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#C62828] dark:text-[#F87171]" />
            Required Corrections ({result.discrepancies.length})
          </h2>
          <div className="space-y-3">
            {result.discrepancies.map((d: any, idx: number) => (
              <div
                key={idx}
                className="rounded-2xl neu-pressed-sm p-4 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[var(--neu-text-primary)]">{d.sku || d.kind}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#3A1715] text-[#F87171]">
                      {d.kind}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[var(--neu-text-secondary)]">
                    Expected: <strong className="text-[var(--neu-text-primary)]">{d.expected_qty ?? 'N/A'}</strong> • Detected: <strong className="text-[var(--neu-text-primary)]">{d.detected_qty ?? 'N/A'}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Checks Trace */}
      <div className="rounded-[32px] neu-flat p-6 sm:p-8 space-y-4">
        <h2 className="font-display font-bold text-base text-[var(--neu-text-primary)]">
          Deterministic Rule Verification Checks
        </h2>
        <div className="space-y-2">
          {result.checks.map((chk: any, idx: number) => {
            const isPass = chk.status === 'PASS';
            const isFail = chk.status === 'FAIL';
            return (
              <div
                key={idx}
                className="rounded-2xl neu-pressed-sm p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl neu-flat-sm flex items-center justify-center ${
                    isPass ? 'text-[#2E7D32] dark:text-[#A3E635]' : isFail ? 'text-[#C62828] dark:text-[#F87171]' : 'text-[#B45309] dark:text-[#FBBF24]'
                  }`}>
                    {isPass ? (
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    ) : isFail ? (
                      <XCircle className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <HelpCircle className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-[var(--neu-text-primary)] block">
                      {chk.id}
                    </span>
                    <span className="text-xs font-medium text-[var(--neu-text-secondary)] block">
                      {chk.reason}
                    </span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-extrabold ${
                  isPass ? 'bg-[#142618] text-[#A3E635]' : isFail ? 'bg-[#3A1715] text-[#F87171]' : 'bg-[#3B2915] text-[#FBBF24]'
                }`}>
                  {chk.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Why This Verdict Accordion */}
      <div className="rounded-[32px] neu-flat p-6">
        <button
          type="button"
          onClick={() => setShowWhyExpander(!showWhyExpander)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="font-display font-bold text-sm text-[var(--neu-text-primary)] flex items-center gap-2">
            <Info className="w-4 h-4 text-[#5A3E2B] dark:text-[#C4F82A]" />
            Why this verdict? (Rule Logic & Thresholds)
          </span>
          {showWhyExpander ? (
            <ChevronUp className="w-4 h-4 text-[var(--neu-text-secondary)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--neu-text-secondary)]" />
          )}
        </button>

        {showWhyExpander && (
          <div className="mt-4 pt-4 border-t border-[var(--neu-border-color)] space-y-3 text-xs text-[var(--neu-text-secondary)]">
            <p>
              The vision model returns raw observations (bounding coordinates, confidence ratings). The final verdict is determined by deterministic code:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Photo Gate: Requires clarity confidence ≥ 0.70</li>
              <li>Item Presence: Requires presence confidence ≥ 0.70</li>
              <li>Quantity: Requires count confidence ≥ 0.75</li>
              <li>Precedence: Photo Gate Fail → STOP_AND_FIX → UNCERTAIN → SEAL</li>
            </ul>
          </div>
        )}
      </div>

      {/* Operator Override Trigger */}
      <div className="rounded-[32px] neu-flat p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-sm text-[var(--neu-text-primary)]">Dispute or Override Agent Verdict</h3>
          <p className="text-xs font-medium text-[var(--neu-text-secondary)] mt-0.5">
            Overrides are data. Never discarded. Appended to the sequential audit hash chain.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowOverrideModal(true)}
          className="px-5 py-2.5 rounded-2xl neu-btn-secondary text-xs font-bold text-[var(--neu-text-primary)] hover:text-[#5A3E2B] dark:hover:text-[#C4F82A] transition-all whitespace-nowrap"
        >
          Override Verdict
        </button>
      </div>

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] neu-flat p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-[var(--neu-text-primary)]">Operator Override</h3>
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="text-xs font-bold text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)]"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--neu-text-secondary)] uppercase tracking-wider mb-2">
                  New Verdict
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOverrideVerdict('SEAL')}
                    className={`py-3 rounded-2xl text-xs font-bold transition-all ${
                      overrideVerdict === 'SEAL' ? 'neu-btn-highlight' : 'neu-btn-secondary'
                    }`}
                  >
                    SEAL
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideVerdict('STOP_AND_FIX')}
                    className={`py-3 rounded-2xl text-xs font-bold transition-all ${
                      overrideVerdict === 'STOP_AND_FIX' ? 'neu-btn-primary' : 'neu-btn-secondary'
                    }`}
                  >
                    STOP AND FIX
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--neu-text-secondary)] uppercase tracking-wider mb-2">
                  Reason Code
                </label>
                <select
                  value={overrideReasonCode}
                  onChange={(e) => setOverrideReasonCode(e.target.value)}
                  className="w-full p-3.5 rounded-2xl neu-input text-xs font-semibold text-[var(--neu-text-primary)]"
                >
                  <option value="agent_wrong_count">Agent miscounted items</option>
                  <option value="agent_wrong_item">Agent misidentified an item</option>
                  <option value="photo_unclear_but_ok">Photo unclear but verified physically</option>
                  <option value="model_unavailable">Model timeout or unavailable</option>
                  <option value="other">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--neu-text-secondary)] uppercase tracking-wider mb-2">
                  Operator Notes (Mandatory)
                </label>
                <textarea
                  rows={3}
                  required
                  value={overrideReasonText}
                  onChange={(e) => setOverrideReasonText(e.target.value)}
                  placeholder="Explain why the agent's decision was overridden..."
                  className="w-full p-3.5 rounded-2xl neu-input text-xs font-medium text-[var(--neu-text-primary)]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={overrideSubmitting || !overrideReasonText.trim()}
                  className="w-full py-3.5 rounded-2xl neu-btn-highlight font-display font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {overrideSubmitting ? 'Recording Override...' : 'Confirm & Log Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
