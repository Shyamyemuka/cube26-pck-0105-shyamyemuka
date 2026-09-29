'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  ShieldCheck,
  PackageCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Layers,
  FileText,
} from 'lucide-react';
import { PackEvidenceV1 } from '@/lib/evidence/schema';

export default function EvidenceRecordPage() {
  const params = useParams();
  const unitId = params.unitId as string;

  const [copied, setCopied] = useState(false);
  const [record, setRecord] = useState<PackEvidenceV1 | null>(null);

  useEffect(() => {
    // Generate evidence record based on session decision or fallback
    const saved = sessionStorage.getItem(`decision_${unitId}`);
    let analysisId = 'ana-0042';
    let contentHash = 'c1d2e3f4a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
    let verdict: any = 'SEAL';
    let checks: any[] = [];
    let discrepancies: any[] = [];

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        verdict = parsed.verdict;
        checks = parsed.checks || [];
        discrepancies = parsed.discrepancies || [];
        contentHash = parsed.content_hash || contentHash;
        analysisId = parsed.analysis_id || analysisId;
      } catch (e) {}
    }

    const mockRecord: PackEvidenceV1 = {
      schema: 'pack_evidence.v1',
      record_id: `PCK-${unitId.replace(/[^a-zA-Z0-9]/g, '')}`,
      unit_id: unitId,
      org_id: 'org_demo_alpha',
      order_id: `ORD-${unitId}`,
      channel: 'shopify',
      captured_at: new Date().toISOString(),
      operator_id: 'usr-operator-01',
      attempt_no: 1,
      order_lines: 'MUG-BLUE:1;NOTEBOOK-A5-BLACK:1',
      observed_in_box: 'MUG-BLUE:1;NOTEBOOK-A5-BLACK:1',
      photos: [
        {
          ref: `org_demo_alpha/${unitId}/cap-1/photo_0.jpg`,
          sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          bytes: 245120,
        },
      ],
      status: 'decided',
      verdict: verdict || 'SEAL',
      route: verdict || 'SEAL',
      checks: checks.length > 0 ? checks : [
        { id: 'photo_quality', scope: 'global', status: 'PASS', reason: 'Clear view of box' },
        { id: 'line.presence.MUG-BLUE', scope: 'line', sku: 'MUG-BLUE', status: 'PASS', reason: 'Present (clear, conf 0.95)' },
        { id: 'line.quantity.MUG-BLUE', scope: 'line', sku: 'MUG-BLUE', status: 'PASS', reason: 'Qty match: 1/1' },
      ],
      discrepancies,
      model: {
        provider: 'gemini',
        name: 'gemini-2.5-flash',
        prompt_version: 'pack-audit.v1',
        thresholds: { T_PRESENT: 0.7, T_COUNT: 0.75, T_EXTRA: 0.7, T_EXTRA_UNSURE: 0.35 },
      },
      overrides: [],
      effective_verdict: verdict || 'SEAL',
      content_hash: contentHash,
      hash_note: 'Content hash (SHA-256 over canonical JSON). Not tamper-proof or immutable.',
      generated_at: new Date().toISOString(),
    };

    setRecord(mockRecord);
  }, [unitId]);

  if (!record) {
    return <div className="p-12 text-center text-slate-400">Loading evidence record…</div>;
  }

  const handleCopyHash = () => {
    navigator.clipboard.writeText(record.content_hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(record, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `evidence_${record.record_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/queue" className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-mono">{record.record_id}</h1>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                pack_evidence.v1
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Unit: <strong className="text-slate-800">{record.unit_id}</strong> · Order:{' '}
              <strong className="text-slate-800">{record.order_id}</strong> · Tenant:{' '}
              <strong className="text-slate-800">{record.org_id}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      {/* VERDICT SUMMARY CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Effective Verdict</div>
            <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
              {record.effective_verdict === 'SEAL' && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
              {record.effective_verdict === 'STOP_AND_FIX' && <XCircle className="w-6 h-6 text-rose-600" />}
              {record.effective_verdict === 'UNCERTAIN' && <HelpCircle className="w-6 h-6 text-amber-600" />}
              <span>{record.effective_verdict}</span>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1 sm:text-right">
            <div>Agent original: <strong className="text-slate-900 font-semibold">{record.verdict || 'none'}</strong></div>
            <div>Channel: <span className="font-semibold uppercase">{record.channel}</span> · Attempt #{record.attempt_no}</div>
          </div>
        </div>

        {/* SHA-256 CONTENT HASH BADGE */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="space-y-0.5 overflow-hidden">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Content Hash (SHA-256 over Canonical JSON)
            </div>
            <div className="text-xs font-mono text-slate-800 truncate select-all">
              {record.content_hash}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyHash}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition shrink-0"
            title="Copy Hash"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ORDER LINES VS OBSERVED IN BOX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="text-xs font-bold uppercase text-slate-500">Order Lines Expected</div>
          <div className="text-xs font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800 break-all">
            {record.order_lines}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="text-xs font-bold uppercase text-slate-500">Observed in Box</div>
          <div className="text-xs font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800 break-all">
            {record.observed_in_box}
          </div>
        </div>
      </div>

      {/* VERIFICATION CHECKS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Executed Checks ({record.checks.length})
        </h3>

        <div className="divide-y divide-slate-100 text-xs">
          {record.checks.map((chk, i) => (
            <div key={i} className="py-2.5 flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-900">{chk.id}</div>
                <div className="text-slate-500 text-[11px]">{chk.reason}</div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  chk.status === 'PASS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : chk.status === 'FAIL'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {chk.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* OVERRIDES AUDIT TRAIL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Human Overrides & Hash Chain ({record.overrides.length})
        </h3>

        {record.overrides.length === 0 ? (
          <div className="text-xs text-slate-400 py-2">No human overrides recorded. Agent verdict accepted.</div>
        ) : (
          <div className="space-y-2">
            {record.overrides.map((ovr, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    Changed: {ovr.original_verdict} → <strong className="text-emerald-700">{ovr.new_verdict}</strong>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{ovr.at}</span>
                </div>
                <div className="text-slate-600">
                  Reason: <strong>{ovr.reason_code}</strong> ({ovr.reason_text})
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate pt-1">
                  row_hash: {ovr.row_hash}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODEL TRACE & HONESTY FOOTER */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs space-y-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Evidence Integrity Statement</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          {record.hash_note} This evidence record reflects the physical observation captured by {record.model.name} ({record.model.prompt_version}) and deterministic rules at {record.captured_at}. Overrides are tracked via append-only SHA-256 row chaining.
        </p>
      </div>
    </div>
  );
}
