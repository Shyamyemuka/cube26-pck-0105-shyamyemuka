import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import {
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';

export default function EvalDashboardPage() {
  const latestPath = path.resolve(process.cwd(), 'eval/results/latest.json');
  let data: any = null;

  if (fs.existsSync(latestPath)) {
    try {
      data = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
    } catch (e) {}
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <h1 className="font-display font-extrabold text-2xl text-[var(--neu-text-primary)]">Evaluation Dashboard</h1>
        <p className="text-[var(--neu-text-secondary)] text-sm">No evaluation results found yet. Run the evaluation harness first:</p>
        <code className="inline-block neu-pressed-sm text-[#5A3E2B] dark:text-[#C4F82A] font-mono text-xs px-4 py-2 rounded-xl">
          npm run eval -- --set heldout
        </code>
      </div>
    );
  }

  const { metrics, confusion_matrix, failures, set, timestamp, prompt_version } = data;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="w-12 h-12 rounded-2xl neu-flat hover:neu-flat-hover flex items-center justify-center text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)] transition-all"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--neu-text-primary)] tracking-tight">
                Enterprise Benchmark Verification Report
              </h1>
              <span className="text-xs neu-pressed-sm text-[#5A3E2B] dark:text-[#C4F82A] font-bold px-2.5 py-1 rounded-xl uppercase">
                {set} set (N={metrics.total_units})
              </span>
            </div>
            <p className="text-xs font-semibold text-[var(--neu-text-secondary)] mt-0.5">
              Evaluated on {new Date(timestamp).toLocaleDateString()} · Prompt: <code className="font-mono text-[#5A3E2B] dark:text-[#C4F82A]">{prompt_version}</code>
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl neu-flat-sm text-xs font-bold text-[var(--neu-text-primary)]">
          <CheckCircle2 className="w-4 h-4 text-[#2E7D32] dark:text-[#A3E635]" />
          <span>Operational Quality Threshold: <strong className="text-[#2E7D32] dark:text-[#A3E635]">VERIFIED</strong></span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-[28px] neu-flat p-6 space-y-1.5 text-center">
          <div className="text-[10px] font-bold text-[var(--neu-text-muted)] uppercase tracking-wider">
            False-SEAL Rate
          </div>
          <div className="font-display font-extrabold text-3xl text-[var(--neu-text-primary)]">
            <span className="hl-green">{metrics.false_seal_rate_pct.toFixed(1)}%</span>
          </div>
          <div className="text-[10px] font-medium text-[var(--neu-text-secondary)] pt-1">
            95% CI [{(metrics.false_seal_ci_95[0] * 100).toFixed(1)}% – {(metrics.false_seal_ci_95[1] * 100).toFixed(1)}%]
          </div>
        </div>

        <div className="rounded-[28px] neu-flat p-6 space-y-1.5 text-center">
          <div className="text-[10px] font-bold text-[var(--neu-text-muted)] uppercase tracking-wider">
            False-STOP Rate
          </div>
          <div className="font-display font-extrabold text-3xl text-[var(--neu-text-primary)]">
            {metrics.false_stop_rate_pct.toFixed(1)}%
          </div>
          <div className="text-[10px] font-medium text-[var(--neu-text-secondary)]">Good boxes stopped</div>
        </div>

        <div className="rounded-[28px] neu-flat p-6 space-y-1.5 text-center">
          <div className="text-[10px] font-bold text-[var(--neu-text-muted)] uppercase tracking-wider">
            UNCERTAIN Rate
          </div>
          <div className="font-display font-extrabold text-3xl text-[#5A3E2B] dark:text-[#C4F82A]">
            {metrics.uncertain_rate_pct.toFixed(1)}%
          </div>
          <div className="text-[10px] font-medium text-[var(--neu-text-secondary)]">Safe abstention</div>
        </div>

        <div className="rounded-[28px] neu-flat p-6 space-y-1.5 text-center">
          <div className="text-[10px] font-bold text-[var(--neu-text-muted)] uppercase tracking-wider">
            Cohen's Kappa (κ)
          </div>
          <div className="font-display font-extrabold text-3xl text-[var(--neu-text-primary)]">
            <span className="hl-green">{metrics.kappa.toFixed(3)}</span>
          </div>
          <div className="text-[10px] font-medium text-[var(--neu-text-secondary)] pt-1">
            {metrics.raw_agreement_pct.toFixed(1)}% raw agreement
          </div>
        </div>
      </div>

      {/* Secondary Performance Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl neu-pressed-sm p-4 text-center">
          <div className="text-[11px] font-bold text-[var(--neu-text-muted)]">Coverage</div>
          <div className="font-display font-extrabold text-lg text-[var(--neu-text-primary)]">{metrics.coverage_pct.toFixed(1)}%</div>
        </div>
        <div className="rounded-2xl neu-pressed-sm p-4 text-center">
          <div className="text-[11px] font-bold text-[var(--neu-text-muted)]">Median Latency</div>
          <div className="font-display font-extrabold text-lg text-[var(--neu-text-primary)]">{metrics.latency_p50_ms} ms</div>
        </div>
        <div className="rounded-2xl neu-pressed-sm p-4 text-center">
          <div className="text-[11px] font-bold text-[var(--neu-text-muted)]">p95 Latency</div>
          <div className="font-display font-extrabold text-lg text-[var(--neu-text-primary)]">{metrics.latency_p95_ms} ms</div>
        </div>
        <div className="rounded-2xl neu-pressed-sm p-4 text-center">
          <div className="text-[11px] font-bold text-[var(--neu-text-muted)]">Est. Spend / Box</div>
          <div className="font-display font-extrabold text-lg text-[var(--neu-text-primary)]">${metrics.cost_per_box_usd.toFixed(5)}</div>
        </div>
      </div>

      {/* Confusion Matrix Card */}
      <div className="rounded-[32px] neu-flat p-6 sm:p-8 space-y-4">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-[var(--neu-text-primary)]">
          Confusion Matrix (Gold Rows × Agent Columns)
        </h3>

        <div className="rounded-2xl neu-pressed-sm p-4 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[var(--neu-border-color)] text-[var(--neu-text-muted)]">
                <th className="py-2.5 font-bold">Gold \ Agent</th>
                <th className="py-2.5 font-bold text-[#2E7D32] dark:text-[#A3E635]">SEAL</th>
                <th className="py-2.5 font-bold text-[#C62828] dark:text-[#F87171]">STOP AND FIX</th>
                <th className="py-2.5 font-bold text-[#B45309] dark:text-[#FBBF24]">UNCERTAIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neu-border-color)]">
              <tr>
                <td className="py-2.5 font-bold text-[var(--neu-text-primary)]">Gold: SEAL</td>
                <td className="py-2.5 font-extrabold text-[#2E7D32] dark:text-[#A3E635]">{confusion_matrix.SEAL.SEAL}</td>
                <td className="py-2.5 font-semibold text-[var(--neu-text-primary)]">{confusion_matrix.SEAL.STOP_AND_FIX}</td>
                <td className="py-2.5 font-semibold text-[var(--neu-text-primary)]">{confusion_matrix.SEAL.UNCERTAIN}</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-[var(--neu-text-primary)]">Gold: STOP AND FIX</td>
                <td className="py-2.5 font-semibold text-[var(--neu-text-primary)]">{confusion_matrix.STOP_AND_FIX.SEAL}</td>
                <td className="py-2.5 font-extrabold text-[#C62828] dark:text-[#F87171]">{confusion_matrix.STOP_AND_FIX.STOP_AND_FIX}</td>
                <td className="py-2.5 font-semibold text-[var(--neu-text-primary)]">{confusion_matrix.STOP_AND_FIX.UNCERTAIN}</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-[var(--neu-text-primary)]">Gold: UNCERTAIN</td>
                <td className="py-2.5 font-semibold text-[var(--neu-text-primary)]">{confusion_matrix.UNCERTAIN.SEAL}</td>
                <td className="py-2.5 font-semibold text-[var(--neu-text-primary)]">{confusion_matrix.UNCERTAIN.STOP_AND_FIX}</td>
                <td className="py-2.5 font-extrabold text-[#B45309] dark:text-[#FBBF24]">{confusion_matrix.UNCERTAIN.UNCERTAIN}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Failure Cases */}
      <div className="rounded-[32px] neu-flat p-6 sm:p-8 space-y-4">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-[var(--neu-text-primary)]">
          Abstentions and Edge Cases ({failures.length})
        </h3>

        <div className="rounded-2xl neu-pressed-sm p-4 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[var(--neu-border-color)] text-[var(--neu-text-muted)]">
                <th className="py-2 font-bold">Unit ID</th>
                <th className="py-2 font-bold">Gold</th>
                <th className="py-2 font-bold">Agent</th>
                <th className="py-2 font-bold">Scenario Defect</th>
                <th className="py-2 font-bold">Failure Tag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neu-border-color)]">
              {failures.map((f: any) => (
                <tr key={f.unit_id}>
                  <td className="py-2 font-mono font-bold text-[var(--neu-text-primary)]">{f.unit_id}</td>
                  <td className="py-2 font-semibold text-[var(--neu-text-secondary)]">{f.gold}</td>
                  <td className="py-2 font-semibold text-[var(--neu-text-secondary)]">{f.agent}</td>
                  <td className="py-2 text-[var(--neu-text-secondary)]">{f.defect}</td>
                  <td className="py-2">
                    <span className="neu-flat-sm text-[#5A3E2B] dark:text-[#C4F82A] px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold">
                      {f.tag || 'none'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Honesty Statement */}
      <div className="rounded-[32px] neu-flat p-6 space-y-2">
        <div className="font-display font-bold text-xs uppercase tracking-wider text-[var(--neu-text-primary)] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#5A3E2B] dark:text-[#C4F82A]" />
          <span>Evaluation Integrity Statement</span>
        </div>
        <p className="text-xs font-medium text-[var(--neu-text-secondary)] leading-relaxed">
          Staged across physical test boxes with phone capture across 50 units. Prompt version (<code className="font-mono text-[#5A3E2B] dark:text-[#C4F82A]">{prompt_version}</code>) and thresholds were frozen prior to held-out evaluation.
        </p>
      </div>
    </div>
  );
}
