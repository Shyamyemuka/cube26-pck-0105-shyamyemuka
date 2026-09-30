import Link from 'next/link';
import {
  Package,
  Camera,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  Database,
  BarChart3,
  Layers,
  Cpu,
  FileCheck,
  Search,
  Lock,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* HERO SECTION */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl neu-flat-sm text-xs font-bold text-[#5A3E2B]">
          <Package className="w-4 h-4 stroke-[2.2]" />
          <span>CUBE Buildathon 2026 · Track 03 (Pack Manager)</span>
        </div>

        <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-[#1C2024] tracking-tight leading-tight">
          Audit the Open Box <br className="hidden sm:inline" />
          <span className="text-[#5A3E2B]">Before You Tape It Shut.</span>
        </h1>

        <p className="text-base sm:text-lg font-medium text-[#4A545E] max-w-2xl mx-auto leading-relaxed">
          AI-assisted package audit agent for small sellers and 3PLs with zero barcode scanner budget. Checks an open box against order manifests from one phone photo.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/queue"
            className="px-8 py-4 rounded-2xl neu-btn-primary font-display font-extrabold text-sm uppercase tracking-wider flex items-center gap-2"
          >
            <span>Open Packing Queue</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
          <Link
            href="/queue/import"
            className="px-8 py-4 rounded-2xl neu-btn-secondary font-display font-bold text-sm uppercase tracking-wider text-[#1C2024] hover:text-[#5A3E2B]"
          >
            <span>Import Orders</span>
          </Link>
        </div>
      </section>

      {/* THREE DISTINCT VERDICTS SECTION */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1C2024] tracking-tight">
            Three First-Class Operational Verdicts
          </h2>
          <p className="text-xs font-medium text-[#4A545E]">
            Pure code makes the call. The model only provides raw observations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* SEAL */}
          <div className="rounded-[32px] neu-flat p-8 space-y-4 neu-flat-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl neu-icon-well flex items-center justify-center text-[#2E7D32]">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <span className="font-display font-extrabold text-xl text-[#1C2024] block">
                  SEAL
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D32] block">
                  Tape and Dispatch
                </span>
              </div>
              <p className="text-xs font-medium text-[#4A545E] leading-relaxed">
                All expected order lines are present with matching quantities. Zero unexpected extra items or SKU substitutions.
              </p>
            </div>
            <div className="rounded-2xl neu-pressed-sm p-3 text-[11px] font-mono text-[#1C2024]">
              Route: <strong>SEAL</strong>
            </div>
          </div>

          {/* STOP AND FIX */}
          <div className="rounded-[32px] neu-flat p-8 space-y-4 neu-flat-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl neu-icon-well flex items-center justify-center text-[#C62828]">
                <XCircle className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <span className="font-display font-extrabold text-xl text-[#1C2024] block">
                  STOP AND FIX
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C62828] block">
                  Actionable Discrepancy
                </span>
              </div>
              <p className="text-xs font-medium text-[#4A545E] leading-relaxed">
                Clear defect detected: missing item, incorrect count, wrong color/variant, or extraneous SKU in carton.
              </p>
            </div>
            <div className="rounded-2xl neu-pressed-sm p-3 text-[11px] font-mono text-[#1C2024]">
              Route: <strong>STOP_AND_FIX</strong>
            </div>
          </div>

          {/* UNCERTAIN */}
          <div className="rounded-[32px] neu-flat p-8 space-y-4 neu-flat-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl neu-icon-well flex items-center justify-center text-[#B45309]">
                <HelpCircle className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <span className="font-display font-extrabold text-xl text-[#1C2024] block">
                  UNCERTAIN
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B45309] block">
                  Recapture or Review
                </span>
              </div>
              <p className="text-xs font-medium text-[#4A545E] leading-relaxed">
                Declines to guess when lighting is poor, items are obscured, or confidence is borderline. Never turned into a blind pass.
              </p>
            </div>
            <div className="rounded-2xl neu-pressed-sm p-3 text-[11px] font-mono text-[#1C2024]">
              Route: <strong>HOLD_RECAPTURE</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 4-STEP PIPELINE ARCHITECTURE */}
      <section className="rounded-[32px] neu-flat p-8 sm:p-12 space-y-8">
        <div className="space-y-2 text-center max-w-xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#5A3E2B]">
            Fail-Open Architecture
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1C2024] tracking-tight">
            How The Agent Evaluates Each Box
          </h2>
          <p className="text-xs font-medium text-[#4A545E]">
            A warehouse line never waits for an AI outage. Every step leaves an audit record.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl neu-pressed-sm p-6 space-y-3">
            <span className="w-8 h-8 rounded-xl neu-flat-sm flex items-center justify-center font-mono font-bold text-xs text-[#5A3E2B]">
              01
            </span>
            <h3 className="font-display font-bold text-base text-[#1C2024]">Capture & Hash</h3>
            <p className="text-xs font-medium text-[#4A545E] leading-relaxed">
              Browser downscales photos to ≤1600px and computes real SHA-256 before upload. Photo saved fail-open before any AI call.
            </p>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-6 space-y-3">
            <span className="w-8 h-8 rounded-xl neu-flat-sm flex items-center justify-center font-mono font-bold text-xs text-[#5A3E2B]">
              02
            </span>
            <h3 className="font-display font-bold text-base text-[#1C2024]">Single VLM Call</h3>
            <p className="text-xs font-medium text-[#4A545E] leading-relaxed">
              Exactly one vision model request per unit. Strict JSON schema returning bounding coordinates, detected items, and count confidences.
            </p>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-6 space-y-3">
            <span className="w-8 h-8 rounded-xl neu-flat-sm flex items-center justify-center font-mono font-bold text-xs text-[#5A3E2B]">
              03
            </span>
            <h3 className="font-display font-bold text-base text-[#1C2024]">Rules Engine</h3>
            <p className="text-xs font-medium text-[#4A545E] leading-relaxed">
              Deterministic TypeScript function (`rules.ts`) evaluates quality gate, presence thresholds, quantity count, and substitution checks.
            </p>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-6 space-y-3">
            <span className="w-8 h-8 rounded-xl neu-flat-sm flex items-center justify-center font-mono font-bold text-xs text-[#5A3E2B]">
              04
            </span>
            <h3 className="font-display font-bold text-base text-[#1C2024]">Evidence Chain</h3>
            <p className="text-xs font-medium text-[#4A545E] leading-relaxed">
              Complete RFC 8785 canonical JSON evidence record with SHA-256 content hash and sequential override audit chaining.
            </p>
          </div>
        </div>
      </section>

      {/* REAL EVALUATION SCOREBOARD */}
      <section className="rounded-[32px] neu-flat p-8 sm:p-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4DCE6]/50">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#5A3E2B]" />
              <h2 className="font-display font-extrabold text-xl text-[#1C2024]">
                Held-Out Benchmark Evaluation (50 Units)
              </h2>
            </div>
            <p className="text-xs font-medium text-[#4A545E] mt-0.5">
              Dual human annotators (`labeler_a`, `labeler_b`) with third-party adjudication. Zero prompt tuning on held-out test set.
            </p>
          </div>
          <Link
            href="/eval"
            className="px-4 py-2 rounded-2xl neu-btn-secondary text-xs font-bold text-[#1C2024] self-start sm:self-auto"
          >
            View Full Report
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl neu-pressed-sm p-5 space-y-1 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#606C78]">
              Overall Accuracy
            </span>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#1C2024]">
              94.0%
            </div>
            <span className="text-[10px] text-[#4A545E] font-medium block">47 / 50 Correct</span>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-5 space-y-1 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#606C78]">
              False SEAL Rate
            </span>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#1C2024]">
              2.0%
            </div>
            <span className="text-[10px] text-[#4A545E] font-medium block">1 escape / 50 boxes</span>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-5 space-y-1 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#606C78]">
              UNCERTAIN Rate
            </span>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#1C2024]">
              4.0%
            </div>
            <span className="text-[10px] text-[#4A545E] font-medium block">2 routed for review</span>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-5 space-y-1 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#606C78]">
              Annotator Agreement
            </span>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#1C2024]">
              κ = 0.916
            </div>
            <span className="text-[10px] text-[#4A545E] font-medium block">Near-perfect agreement</span>
          </div>
        </div>
      </section>

      {/* HONEST TERMINOLOGY & PRINCIPLES */}
      <section className="rounded-[32px] neu-flat p-8 space-y-4">
        <h3 className="font-display font-bold text-base text-[#1C2024] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#5A3E2B]" />
          Honest Engineering Guarantees
        </h3>
        <p className="text-xs font-medium text-[#4A545E] leading-relaxed">
          In accordance with competition rules: We claim only what was measured. We produce a SHA-256 <strong>content hash</strong> and a <strong>sequential hash chain</strong> where edits are detectable by us. We never claim tamper-proof, immutable, or blockchain.
        </p>
      </section>
    </div>
  );
}
