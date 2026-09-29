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
    // Read from sessionStorage or fallback
    const saved = sessionStorage.getItem(`decision_${unitId}`);
    if (saved) {
      try {
        setResult(JSON.parse(saved));
        return;
      } catch (e) {}
    }

    // Default mock result for direct view
    setResult({
      status: 'decided',
      verdict: 'SEAL',
      route: 'SEAL',
      checks: [
        { id: 'photo_quality', scope: 'global', status: 'PASS', reason: 'Clear view of box interior' },
        { id: 'line.presence.MUG-BLUE', scope: 'line', sku: 'MUG-BLUE', status: 'PASS', reason: 'Present (clear, conf 0.95)' },
        { id: 'line.quantity.MUG-BLUE', scope: 'line', sku: 'MUG-BLUE', status: 'PASS', reason: 'Qty match: 1/1' },
        { id: 'line.presence.NOTEBOOK-A5-BLACK', scope: 'line', sku: 'NOTEBOOK-A5-BLACK', status: 'PASS', reason: 'Present (clear, conf 0.92)' },
        { id: 'line.quantity.NOTEBOOK-A5-BLACK', scope: 'line', sku: 'NOTEBOOK-A5-BLACK', status: 'PASS', reason: 'Qty match: 1/1' },
        { id: 'no_extra_items', scope: 'global', status: 'PASS', reason: 'No extra items detected' },
        { id: 'no_wrong_items', scope: 'global', status: 'PASS', reason: 'No substitutions detected' },
      ],
      discrepancies: [],
      observation: {
        photo_assessment: { usable: true, whole_box_visible: true, issues: [], notes: 'Clear view' },
        lines: [
          { sku: 'MUG-BLUE', matched_item_visible: true, observed_qty: 1, count_confidence: 0.95, visibility: 'clear', photo_indexes: [0], evidence: 'Blue ceramic mug' },
          { sku: 'NOTEBOOK-A5-BLACK', matched_item_visible: true, observed_qty: 1, count_confidence: 0.92, visibility: 'clear', photo_indexes: [0], evidence: 'Black hardcover journal' },
        ],
        unlisted_items: [],
        overall_notes: 'Box is packed correctly',
      },
      trace: {
        model: 'gemini-2.5-flash',
        prompt_version: 'pack-audit.v1',
        thresholds: { T_PRESENT: 0.7, T_COUNT: 0.75, T_EXTRA: 0.7, T_EXTRA_UNSURE: 0.35 },
        latency_ms: 1420,
        reference_images_used: 0,
        photo_count: 1,
      },
    });
  }, [unitId]);

  if (!result) {
    return <div className="p-12 text-center text-slate-400">Loading audit decision…</div>;
  }

  const { verdict, route, status, checks, discrepancies, trace } = result;

  const handleConfirmSeal = () => {
    router.push(`/units/${unitId}/record`);
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOverrideSubmitting(true);

    try {
      const orgId = typeof window !== 'undefined' ? localStorage.getItem('pack_operator_org') || 'org_demo_alpha' : 'org_demo_alpha';

      const res = await fetch(`/api/units/${unitId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          new_verdict: overrideVerdict,
          reason_code: overrideReasonCode,
          reason_text: overrideReasonText,
          operator_id: 'usr-operator-01',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit override');
      }

      setOverrideSuccess(true);
      setTimeout(() => {
        router.push(`/units/${unitId}/record`);
      }, 800);
    } catch (err: unknown) {
      const e = err as Error;
      alert(`Override error: ${e.message}`);
    } finally {
      setOverrideSubmitting(false);
    }
  };

  // Render Verdict Banner per UX_SPEC.md §2 & §3
  const renderVerdictBanner = () => {
    if (status === 'pending') {
      return (
        <div className="w-full bg-slate-100 border border-slate-300 text-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-600 text-white flex items-center justify-center font-bold">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">PENDING</div>
              <div className="text-xs text-slate-600">Check unavailable. Photos saved safely.</div>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Route: PENDING
          </div>
        </div>
      );
    }

    if (verdict === 'SEAL') {
      return (
        <div className="w-full bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-emerald-950">SEAL</div>
              <div className="text-xs font-semibold text-emerald-800">Box matches the order.</div>
            </div>
          </div>
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider hidden sm:block">
            Route: SEAL
          </div>
        </div>
      );
    }

    if (verdict === 'STOP_AND_FIX') {
      return (
        <div className="w-full bg-rose-50 border border-rose-300 text-rose-950 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
              <XCircle className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-rose-950">STOP AND FIX</div>
              <div className="text-xs font-semibold text-rose-800">Fix before sealing. Discrepancies detected.</div>
            </div>
          </div>
          <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider hidden sm:block">
            Route: STOP_AND_FIX
          </div>
        </div>
      );
    }

    return (
      <div className="w-full bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
            <HelpCircle className="w-7 h-7" />
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-amber-950">UNCERTAIN</div>
            <div className="text-xs font-semibold text-amber-800">
              Can’t tell from this photo. Retake, or check by hand.
            </div>
          </div>
        </div>
        <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider hidden sm:block">
          Route: HOLD_RECAPTURE_OR_REVIEW
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* TOP NAV */}
      <div className="flex items-center justify-between">
        <Link href={`/units/${unitId}/capture`} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition">
          <Camera className="w-4 h-4" />
          <span>Retake Photo</span>
        </Link>

        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {unitId}
        </span>
      </div>

      {/* 1. VERDICT BANNER */}
      {renderVerdictBanner()}

      {/* 2. FIX LIST (for STOP_AND_FIX) */}
      {discrepancies.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Items to Fix Before Sealing:</span>
          </div>
          <ul className="space-y-2 text-xs text-rose-800 font-medium">
            {discrepancies.map((d, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-white/60 p-2.5 rounded-lg border border-rose-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                <div>
                  <strong className="uppercase font-bold tracking-wider">{d.type.replace('_', ' ')}: </strong>
                  <span>{d.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. PER-LINE & GLOBAL CHECKS TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Verification Trace
        </h2>

        <div className="divide-y divide-slate-100 text-xs">
          {checks.map((check) => {
            const isPass = check.status === 'PASS';
            const isFail = check.status === 'FAIL';

            return (
              <div key={check.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>{check.id}</span>
                    {check.sku && (
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                        {check.sku}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 text-[11px]">{check.reason}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  {check.confidence !== undefined && (
                    <span className="text-[10px] font-mono text-slate-400">
                      conf {(check.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isPass
                        ? 'bg-emerald-100 text-emerald-800'
                        : isFail
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isPass && <CheckCircle2 className="w-3 h-3" />}
                    {isFail && <XCircle className="w-3 h-3" />}
                    {!isPass && !isFail && <HelpCircle className="w-3 h-3" />}
                    <span>{check.status}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {verdict === 'SEAL' ? (
          <button
            type="button"
            onClick={handleConfirmSeal}
            className="sm:col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-sm transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Seal Box</span>
          </button>
        ) : (
          <Link
            href={`/units/${unitId}/capture`}
            className="sm:col-span-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-sm transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{verdict === 'STOP_AND_FIX' ? 'Fixed — Retake & Recheck' : 'Retake Box Photo'}</span>
          </Link>
        )}

        <button
          type="button"
          onClick={() => setShowOverrideModal(true)}
          className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-xl text-sm shadow-sm transition flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>Override…</span>
        </button>
      </div>

      {/* 5. FOOTER & WHY THIS VERDICT EXPANDER */}
      <div className="border-t border-slate-200 pt-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Checked in {((trace.latency_ms || 1400) / 1000).toFixed(1)} s · Model: {trace.model} ({trace.prompt_version})
          </div>
          <button
            type="button"
            onClick={() => setShowWhyExpander(!showWhyExpander)}
            className="text-emerald-700 font-semibold flex items-center gap-1 hover:underline self-start sm:self-auto"
          >
            <span>Why this verdict?</span>
            {showWhyExpander ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showWhyExpander && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2">
            <div className="font-bold text-slate-900">Deterministic Rule Precedence (lib/agent/rules.ts):</div>
            <ol className="list-decimal pl-4 space-y-1 text-slate-600">
              <li><strong>Rule 0 (Photo Gate):</strong> Rejects dark, blurry, cut off or unusable photos into UNCERTAIN.</li>
              <li><strong>Rule 1 (Confirmed Defects):</strong> Any FAIL in presence, quantity, extra items, or wrong items triggers STOP_AND_FIX.</li>
              <li><strong>Rule 2 (Uncertainty):</strong> Any non-PASS (or confidence &lt; threshold) triggers UNCERTAIN. Code never guesses.</li>
              <li><strong>Rule 3 (Seal):</strong> Only boxes with 100% PASS across all checks output SEAL.</li>
            </ol>
            <div className="text-[11px] text-slate-500 font-mono pt-1">
              Active Thresholds: T_PRESENT={trace.thresholds.T_PRESENT} · T_COUNT={trace.thresholds.T_COUNT} · T_EXTRA={trace.thresholds.T_EXTRA}
            </div>
          </div>
        )}
      </div>

      {/* OVERRIDE MODAL */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Operator Override</h3>
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              The agent’s original verdict will be preserved in the audit log and evidence record.
            </p>

            <form onSubmit={handleOverrideSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">New Verdict</label>
                <select
                  value={overrideVerdict}
                  onChange={(e) => setOverrideVerdict(e.target.value as 'SEAL' | 'STOP_AND_FIX')}
                  className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="SEAL">SEAL (Confirm & Seal)</option>
                  <option value="STOP_AND_FIX">STOP AND FIX</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Reason Category</label>
                <select
                  value={overrideReasonCode}
                  onChange={(e) => setOverrideReasonCode(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="agent_wrong_count">Agent miscounted quantity</option>
                  <option value="agent_wrong_item">Agent misidentified product</option>
                  <option value="photo_unclear_but_ok">Photo unclear but verified by hand</option>
                  <option value="model_unavailable">Model unavailable / manual pack</option>
                  <option value="other">Other reason (explain below)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Notes / Explanation {overrideReasonCode === 'other' && <span className="text-rose-600">*</span>}
                </label>
                <textarea
                  rows={2}
                  required={overrideReasonCode === 'other'}
                  value={overrideReasonText}
                  onChange={(e) => setOverrideReasonText(e.target.value)}
                  placeholder="What did you see that the check missed?"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-sm"
                >
                  {overrideSubmitting ? 'Saving…' : 'Save Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
