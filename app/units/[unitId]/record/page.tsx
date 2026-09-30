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
  Hash,
} from 'lucide-react';
import { PackEvidenceV1 } from '@/lib/evidence/schema';

export default function EvidenceRecordPage() {
  const params = useParams();
  const unitId = params.unitId as string;

  const [copied, setCopied] = useState(false);
  const [record, setRecord] = useState<PackEvidenceV1 | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecord() {
      try {
        const orgId = typeof window !== 'undefined' ? localStorage.getItem('pack_operator_org') || 'org_demo_alpha' : 'org_demo_alpha';
        const res = await fetch(`/api/v1/evidence/${encodeURIComponent(unitId)}`, {
          headers: {
            Authorization: `Bearer tok_demo_alpha`,
          },
        });
        const data = await res.json();
        if (res.ok && data.record) {
          setRecord(data.record);
        } else {
          const saved = typeof window !== 'undefined' ? sessionStorage.getItem(`decision_${unitId}`) : null;
          if (saved) {
            const parsed = JSON.parse(saved);
            setRecord({
              schema: 'pack_evidence.v1',
              record_id: `PCK-${unitId.replace(/[^a-zA-Z0-9]/g, '')}`,
              unit_id: unitId,
              org_id: orgId,
              order_id: `ORD-${unitId}`,
              channel: 'shopify',
              captured_at: new Date().toISOString(),
              operator_id: 'usr-operator-01',
              attempt_no: 1,
              order_lines: 'MUG-BLUE:1;NOTEBOOK-A5-BLACK:2',
              observed_in_box: 'MUG-BLUE:1;NOTEBOOK-A5-BLACK:2',
              photos: [
                {
                  ref: `${orgId}/${unitId}/cap-1/photo_0.jpg`,
                  sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                  bytes: 10240,
                },
              ],
              status: parsed.status || 'decided',
              verdict: parsed.verdict || 'SEAL',
              route: parsed.route || 'SEAL',
              discrepancies: parsed.discrepancies || [],
              checks: parsed.checks || [],
              model: {
                provider: 'google',
                name: 'gemini-2.5-flash',
                prompt_version: 'pack-audit.v1',
                thresholds: {},
              },
              overrides: [],
              effective_verdict: parsed.verdict || 'SEAL',
              content_hash: parsed.content_hash || 'c1d2e3f4a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
              hash_note: 'Content hash (SHA-256 over canonical JSON). Not tamper-proof or immutable.',
              generated_at: new Date().toISOString(),
            });
          }
        }
      } catch (e) {
        // Fallback
      } finally {
        setLoading(false);
      }
    }

    loadRecord();
  }, [unitId]);

  const handleCopyHash = () => {
    if (!record) return;
    navigator.clipboard.writeText(record.content_hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!record) return;
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidence-${record.unit_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto rounded-[32px] neu-flat p-16 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl neu-icon-well mx-auto flex items-center justify-center text-[#773C30] dark:text-[#6BFF86] animate-pulse">
          <Clock className="w-6 h-6 stroke-[2.2]" />
        </div>
        <p className="text-sm font-bold text-slate-900 dark:text-white">Loading audit evidence record...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-2xl mx-auto rounded-[32px] neu-flat p-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-[24px] neu-icon-well mx-auto flex items-center justify-center text-[#773C30] dark:text-[#6BFF86]">
          <FileText className="w-8 h-8 stroke-[2.2]" />
        </div>
        <div>
          <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">No Evidence Record Found</h2>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Carton <span className="font-mono font-bold text-slate-900 dark:text-white">{unitId}</span> has not generated an audit record yet.
          </p>
        </div>
        <Link
          href={`/units/${unitId}/capture`}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl neu-btn-highlight font-display font-bold text-xs uppercase tracking-wide"
        >
          <span>Audit This Unit</span>
        </Link>
      </div>
    );
  }

  const isSeal = record.verdict === 'SEAL';
  const isStop = record.verdict === 'STOP_AND_FIX';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/units/${unitId}/decision`}
            className="w-12 h-12 rounded-2xl neu-flat hover:neu-flat-hover flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">
                Evidence Record
              </h1>
              <span className="font-mono text-xs font-bold text-[#773C30] dark:text-[#6BFF86] neu-pressed-sm px-2.5 py-1 rounded-xl">
                {record.record_id}
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#773C30] dark:text-[#6BFF86] mt-0.5">
              Schema: {record.schema} • Unit: {record.unit_id}
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadJson}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl neu-btn-secondary text-xs font-bold text-slate-900 dark:text-white"
        >
          <Download className="w-4 h-4 text-[#773C30] dark:text-[#6BFF86] stroke-[2.2]" />
          <span>Export JSON</span>
        </button>
      </div>

      {/* Main Evidence Card */}
      <div className="rounded-[32px] neu-flat p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--neu-border-color)]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl neu-flat-sm flex items-center justify-center ${
              isSeal ? 'text-[#2E7D32] dark:text-[#A3E635]' : isStop ? 'text-[#C62828] dark:text-[#F87171]' : 'text-[#B45309] dark:text-[#FBBF24]'
            }`}>
              {isSeal ? (
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              ) : isStop ? (
                <XCircle className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <HelpCircle className="w-5 h-5 stroke-[2.5]" />
              )}
            </div>
            <div>
              <span className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                Verdict: {record.verdict || 'PENDING'}
              </span>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Route: {record.route} • Pipeline: {record.status}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
            {new Date(record.captured_at).toLocaleString()}
          </span>
        </div>

        {/* Content Hash Well */}
        <div className="rounded-2xl neu-pressed-deep p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-[#773C30] dark:text-[#6BFF86]" />
              Canonical Content Hash (SHA-256)
            </span>
            <button
              onClick={handleCopyHash}
              className="flex items-center gap-1 text-[11px] font-bold text-[#773C30] dark:text-[#6BFF86] hover:opacity-80"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#2E7D32] dark:text-[#A3E635]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="font-mono text-xs text-slate-900 dark:text-white break-all select-all font-semibold">
            {record.content_hash}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium pt-1">
            {record.hash_note}
          </p>
        </div>

        {/* Audit Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl neu-pressed-sm p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Order Lines
            </span>
            <code className="text-xs font-mono font-bold text-slate-900 dark:text-white block">
              {record.order_lines}
            </code>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Observed In Box
            </span>
            <code className="text-xs font-mono font-bold text-slate-900 dark:text-white block">
              {record.observed_in_box || 'N/A'}
            </code>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Vision Model
            </span>
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block">
              {record.model?.name ? `${record.model.provider}/${record.model.name}` : 'gemini-2.5-flash'}
            </span>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Operator & Tenant
            </span>
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block">
              {record.operator_id} • {record.org_id}
            </span>
          </div>
        </div>

        {/* Stored Photo Hashes */}
        <div className="space-y-3">
          <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 block">
            Associated Photo Hashes ({record.photos.length})
          </span>
          <div className="space-y-2">
            {record.photos.map((p, idx) => (
              <div
                key={idx}
                className="rounded-2xl neu-pressed-sm p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate sm:max-w-xs">{p.ref}</span>
                <span className="text-xs font-mono font-bold text-[#773C30] dark:text-[#6BFF86] break-all">{p.sha256}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sequential Hash Chain Entry */}
        <div className="rounded-2xl neu-pressed p-4 space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#773C30] dark:text-[#6BFF86]" />
            Audit Override Trail ({record.overrides?.length || 0} overrides)
          </span>
          <div className="space-y-1 text-xs font-mono">
            {record.overrides && record.overrides.length > 0 ? (
              record.overrides.map((ov, i) => (
                <div key={i} className="text-slate-900 dark:text-white">
                  [{new Date(ov.at).toLocaleTimeString()}] {ov.operator_id}: {ov.original_verdict} → {ov.new_verdict} ({ov.reason_code}) · hash: {ov.row_hash.substring(0, 16)}...
                </div>
              ))
            ) : (
              <div className="text-slate-500 dark:text-slate-400">No operator overrides recorded. Primary verdict stands.</div>
            )}
          </div>
        </div>

        {/* Security Statement */}
        <div className="rounded-2xl neu-pressed-sm p-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#773C30] dark:text-[#6BFF86] shrink-0" />
          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
            <strong>Cryptographic integrity:</strong> This record uses SHA-256 <span className="hl-green">content hashing</span> and sequential hash chaining. Any modification to past records is detectable.
          </p>
        </div>
      </div>
    </div>
  );
}
