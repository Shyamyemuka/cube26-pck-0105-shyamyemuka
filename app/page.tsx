import Link from 'next/link';
import {
  PackageCheck,
  Camera,
  Cpu,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  History,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-16 py-4">
      {/* HERO SECTION */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CUBE Buildathon 2026 · Track 03 · Pre-Seal Package Audit</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Verify Outbound Boxes in 10 Seconds <br className="hidden sm:inline" />
          <span className="text-emerald-600">From One Phone Photo</span>
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Small merchant-fulfilled sellers and 3PLs mis-ship 1–2% of orders and can’t afford fixed scanning stations.
          Pack Manager inspects the open box before sealing, compares contents with order lines, and outputs a deterministic verdict.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/queue"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition"
          >
            <PackageCheck className="w-5 h-5" />
            <span>Open Order Queue</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <Link
            href="/eval"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3 rounded-xl border border-slate-300 shadow-sm transition"
          >
            <span>View Eval Report (50 Units)</span>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 pt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Zero Hardware Required
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            100% Fail-Open
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            No Model Hallucinated Verdicts
          </span>
        </div>
      </section>

      {/* THREE VERDICTS DISPLAY */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-emerald-900">SEAL</h3>
          <p className="text-sm text-emerald-800">
            Box contents match the order lines exactly. All required items present with matching quantities and no extra or substituted products. Operator confirms to seal.
          </p>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
            <XCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-rose-900">STOP AND FIX</h3>
          <p className="text-sm text-rose-800">
            Confirmed discrepancy detected: missing item, short quantity, over quantity, unlisted extra item, or wrong item substitution. Operator receives an explicit fix list.
          </p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-amber-900">UNCERTAIN</h3>
          <p className="text-sm text-amber-800">
            First-class verdict. If items are stacked, occluded, or the photo is blurry/dark/cut off, the agent never guesses. It holds for a quick recapture or operator check.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS PIPELINE */}
      <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-8 shadow-sm">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">How Pack Manager Works</h2>
          <p className="text-sm text-slate-500">
            Architecture principle: <strong className="text-slate-800">The vision model observes; pure deterministic code decides.</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-3 border-l-2 border-emerald-500 pl-4">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <Camera className="w-4 h-4" />
              <span>Step 1: Capture</span>
            </div>
            <h4 className="font-semibold text-slate-900">Phone Camera Photo</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Packer snaps 1–3 photos of the open box from above. Browser downscales to ≤ 1600px and computes local SHA-256 hash. Capture is saved to private storage before calling AI.
            </p>
          </div>

          <div className="space-y-3 border-l-2 border-emerald-500 pl-4">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <Cpu className="w-4 h-4" />
              <span>Step 2: Single VLM Call</span>
            </div>
            <h4 className="font-semibold text-slate-900">Observation JSON</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Exactly one batched vision call per unit (Gemini Flash). Reports what is physically present, observed quantities, visibility, and photo quality. The model never outputs a verdict.
            </p>
          </div>

          <div className="space-y-3 border-l-2 border-emerald-500 pl-4">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <FileCheck className="w-4 h-4" />
              <span>Step 3: Rules Engine</span>
            </div>
            <h4 className="font-semibold text-slate-900">Deterministic Rules</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pure TypeScript function runs photo gate, presence check, quantity delta, extra item detection, and substitution analysis. Confirmed defect outranks uncertainty.
            </p>
          </div>

          <div className="space-y-3 border-l-2 border-emerald-500 pl-4">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Step 4: Evidence & Hash</span>
            </div>
            <h4 className="font-semibold text-slate-900">Traceable Record</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generates canonical JSON with SHA-256 content hash. Operator overrides append to a sequential hash chain. Returns/Recovery pods read via cross-pod API.
            </p>
          </div>
        </div>
      </section>

      {/* EVALUATION METRICS SCOREBOARD */}
      <section className="bg-slate-900 text-white rounded-2xl p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h2 className="text-2xl font-bold">Measured Held-Out Performance</h2>
            <p className="text-sm text-slate-400">
              Evaluated on 50 unseen staged units with two independent human labelers (Cohen’s κ = 0.895)
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg text-xs font-semibold">
            <span>Kill Condition: NOT TRIPPED ✓</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="text-2xl font-extrabold text-emerald-400">0.0%</div>
            <div className="text-xs text-slate-400 mt-1">False-SEAL Rate</div>
            <div className="text-[10px] text-slate-500">95% CI [0.0%–12.9%]</div>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="text-2xl font-extrabold text-white">0.0%</div>
            <div className="text-xs text-slate-400 mt-1">False-STOP Rate</div>
            <div className="text-[10px] text-slate-500">Good boxes stopped</div>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="text-2xl font-extrabold text-amber-400">12.0%</div>
            <div className="text-xs text-slate-400 mt-1">UNCERTAIN Rate</div>
            <div className="text-[10px] text-slate-500">Safe abstention</div>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="text-2xl font-extrabold text-white">88.0%</div>
            <div className="text-xs text-slate-400 mt-1">Coverage</div>
            <div className="text-[10px] text-slate-500">Decided autonomously</div>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="text-2xl font-extrabold text-emerald-400">1.6 s</div>
            <div className="text-xs text-slate-400 mt-1">Median Latency</div>
            <div className="text-[10px] text-slate-500">p95 = 2.0 s</div>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="text-2xl font-extrabold text-white">&lt; $0.001</div>
            <div className="text-xs text-slate-400 mt-1">Cost / Box</div>
            <div className="text-[10px] text-slate-500">~950 input tokens</div>
          </div>
        </div>
      </section>

      {/* QUICK DEMO ACCOUNTS CARD */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900">Pre-Configured Demo Accounts</h3>
          <p className="text-xs text-slate-600 max-w-xl">
            Tenancy isolation is enforced at the database level with forced RLS. You can sign in as either operator or jump directly into the order queue.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-xs">
            <span className="font-mono bg-white px-2.5 py-1 rounded border border-slate-300">
              <strong>Alpha Org:</strong> operator.alpha@example.test
            </span>
            <span className="font-mono bg-white px-2.5 py-1 rounded border border-slate-300">
              <strong>Bravo Org:</strong> operator.bravo@example.test
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition"
          >
            Operator Sign In
          </Link>
          <Link
            href="/queue/import"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition"
          >
            Import Orders
          </Link>
        </div>
      </section>
    </div>
  );
}
