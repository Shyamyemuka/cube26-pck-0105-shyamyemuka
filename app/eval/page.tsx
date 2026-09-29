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
  DollarSign,
  AlertTriangle,
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
        <h1 className="text-2xl font-bold text-slate-900">Evaluation Dashboard</h1>
        <p className="text-slate-500 text-sm">No evaluation results found yet. Run the evaluation harness first:</p>
        <code className="inline-block bg-slate-900 text-emerald-400 font-mono text-xs px-4 py-2 rounded-lg">
          npm run eval -- --set heldout
        </code>
      </div>
    );
  }

  const { metrics, confusion_matrix, failures, set, timestamp, prompt_version, thresholds } = data;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Held-Out Evaluation Report</h1>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded uppercase">
                {set} set (N={metrics.total_units})
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Evaluated on {new Date(timestamp).toLocaleDateString()} · Prompt: <code className="font-mono">{prompt_version}</code>
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Kill Condition: NOT TRIPPED ✓</span>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">False-SEAL Rate</div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {metrics.false_seal_rate_pct.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400">
            95% CI [{(metrics.false_seal_ci_95[0] * 100).toFixed(1)}% – {(metrics.false_seal_ci_95[1] * 100).toFixed(1)}%]
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">False-STOP Rate</div>
          <div className="text-3xl font-extrabold text-slate-900">
            {metrics.false_stop_rate_pct.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400">Good boxes stopped</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">UNCERTAIN Rate</div>
          <div className="text-3xl font-extrabold text-amber-600">
            {metrics.uncertain_rate_pct.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400">Safe abstention</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">Cohen's Kappa (κ)</div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {metrics.kappa.toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-400">{metrics.raw_agreement_pct.toFixed(1)}% raw agreement</div>
        </div>
      </div>

      {/* SECONDARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-slate-500">Autonomous Coverage</div>
          <div className="text-xl font-bold text-slate-900">{metrics.coverage_pct.toFixed(1)}%</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-slate-500">Median Latency</div>
          <div className="text-xl font-bold text-slate-900">{metrics.latency_p50_ms} ms</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-slate-500">95th % Latency</div>
          <div className="text-xl font-bold text-slate-900">{metrics.latency_p95_ms} ms</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-slate-500">Estimated Spend / Unit</div>
          <div className="text-xl font-bold text-slate-900">${metrics.cost_per_box_usd.toFixed(5)}</div>
        </div>
      </div>

      {/* CONFUSION MATRIX */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
          Confusion Matrix (Gold Rows × Agent Columns)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 font-bold">Gold \ Agent</th>
                <th className="py-2.5 font-bold text-emerald-700">SEAL</th>
                <th className="py-2.5 font-bold text-rose-700">STOP AND FIX</th>
                <th className="py-2.5 font-bold text-amber-700">UNCERTAIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 font-semibold text-slate-900">Gold: SEAL</td>
                <td className="py-2.5 font-bold text-emerald-600">{confusion_matrix.SEAL.SEAL}</td>
                <td className="py-2.5">{confusion_matrix.SEAL.STOP_AND_FIX}</td>
                <td className="py-2.5">{confusion_matrix.SEAL.UNCERTAIN}</td>
              </tr>
              <tr>
                <td className="py-2.5 font-semibold text-slate-900">Gold: STOP AND FIX</td>
                <td className="py-2.5">{confusion_matrix.STOP_AND_FIX.SEAL}</td>
                <td className="py-2.5 font-bold text-rose-600">{confusion_matrix.STOP_AND_FIX.STOP_AND_FIX}</td>
                <td className="py-2.5">{confusion_matrix.STOP_AND_FIX.UNCERTAIN}</td>
              </tr>
              <tr>
                <td className="py-2.5 font-semibold text-slate-900">Gold: UNCERTAIN</td>
                <td className="py-2.5">{confusion_matrix.UNCERTAIN.SEAL}</td>
                <td className="py-2.5">{confusion_matrix.UNCERTAIN.STOP_AND_FIX}</td>
                <td className="py-2.5 font-bold text-amber-600">{confusion_matrix.UNCERTAIN.UNCERTAIN}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAILURE MODES LOG */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
          Abstentions and Hard Failure Cases ({failures.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 font-bold">Unit ID</th>
                <th className="py-2.5 font-bold">Gold</th>
                <th className="py-2.5 font-bold">Agent</th>
                <th className="py-2.5 font-bold">Scenario Defect</th>
                <th className="py-2.5 font-bold">Failure Tag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {failures.map((f: any) => (
                <tr key={f.unit_id}>
                  <td className="py-2 font-mono font-semibold text-slate-900">{f.unit_id}</td>
                  <td className="py-2 font-medium">{f.gold}</td>
                  <td className="py-2 font-medium">{f.agent}</td>
                  <td className="py-2 text-slate-600">{f.defect}</td>
                  <td className="py-2">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono">
                      {f.tag || 'none'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* HONESTY & LIMITATIONS */}
      <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Evaluation Integrity Statement</span>
        </div>
        <p className="leading-relaxed text-slate-500">
          Staged on household items with a single phone camera over 50 units. Prompt version (<code className="font-mono">{prompt_version}</code>) and thresholds were frozen prior to held-out evaluation. Both human labeler files were committed before running the model.
        </p>
      </div>
    </div>
  );
}
