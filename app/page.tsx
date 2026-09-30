import Link from 'next/link';
import {
  Package,
  Camera,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  BarChart3,
  ScanLine,
  ClipboardList,
  Boxes,
  Warehouse,
  ShoppingCart,
  Repeat2,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* HERO SECTION */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-slate-900 dark:text-white tracking-tight leading-tight">
          Audit the Open Box{' '}
          <br className="hidden sm:inline" />
          <span className="hl-green">Before You Tape It Shut.</span>
        </h1>

        <p className="text-base sm:text-lg font-medium text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Pack Manager catches packing errors before they reach your customer — using a single photo
          of the open box, no barcode scanners, no dedicated hardware.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/queue"
            className="px-8 py-4 rounded-2xl neu-btn-highlight font-display font-extrabold text-sm uppercase tracking-wider flex items-center gap-2"
          >
            <span>Open Packing Queue</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
          <Link
            href="/queue/import"
            className="px-8 py-4 rounded-2xl neu-btn-secondary font-display font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white hover:text-[#773C30] dark:hover:text-[#6BFF86]"
          >
            <span>Import Orders</span>
          </Link>
        </div>
      </section>

      {/* WHAT IS PACK MANAGER */}
      <section className="rounded-[32px] neu-flat p-8 sm:p-12 space-y-6 max-w-4xl mx-auto">
        <div className="space-y-2">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
            What Is Pack Manager?
          </h2>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            Pack Manager is a packing verification tool for ecommerce sellers and fulfillment
            centers. Before a box is sealed and dispatched, a warehouse operator photographs the
            open carton. Pack Manager compares that photo against the expected order — every SKU,
            every quantity — and returns an instant verdict: safe to ship, needs fixing, or needs a
            better photo.
          </p>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            The result is a logged, auditable record of every box decision. If a dispute arises,
            you can trace exactly what was in the carton at the moment it was sealed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <div className="rounded-2xl neu-pressed-sm p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl neu-flat-sm flex items-center justify-center text-[#773C30] dark:text-[#6BFF86]">
              <Camera className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              One Photo Per Box
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Any smartphone camera is enough. No barcode gun, no dedicated scanning station, no
              extra software on the packing floor.
            </p>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl neu-flat-sm flex items-center justify-center text-[#773C30] dark:text-[#6BFF86]">
              <ClipboardList className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Matches Real Orders
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Paste or import your order lines (SKU + quantity) before packing starts. The system
              checks the photo against exactly what should be in that carton.
            </p>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl neu-flat-sm flex items-center justify-center text-[#773C30] dark:text-[#6BFF86]">
              <ShieldCheck className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Full Audit Trail
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Every verdict is permanently recorded with a cryptographic hash. Disputes, re-checks,
              and manual overrides all leave a traceable log entry.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — USER WALKTHROUGH */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
            How It Works
          </h2>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Four steps from an open carton on the packing bench to a sealed, verified shipment.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl neu-flat p-6 space-y-3 neu-flat-hover">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl neu-pressed-sm flex items-center justify-center font-mono font-bold text-xs text-[#773C30] dark:text-[#6BFF86]">
                01
              </span>
              <div className="w-8 h-8 rounded-xl neu-flat-sm flex items-center justify-center text-[#773C30] dark:text-[#6BFF86]">
                <ClipboardList className="w-4 h-4 stroke-[2]" />
              </div>
            </div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Import Your Orders
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Go to <strong className="text-slate-900 dark:text-white">Import Orders</strong> and
              paste your order lines in{' '}
              <code className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1 rounded">
                SKU:QTY;SKU:QTY
              </code>{' '}
              format. Each line becomes a unit in the packing queue.
            </p>
          </div>

          <div className="rounded-2xl neu-flat p-6 space-y-3 neu-flat-hover">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl neu-pressed-sm flex items-center justify-center font-mono font-bold text-xs text-[#773C30] dark:text-[#6BFF86]">
                02
              </span>
              <div className="w-8 h-8 rounded-xl neu-flat-sm flex items-center justify-center text-[#773C30] dark:text-[#6BFF86]">
                <Boxes className="w-4 h-4 stroke-[2]" />
              </div>
            </div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Pick the Order to Pack
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Open the <strong className="text-slate-900 dark:text-white">Packing Queue</strong>.
              Each card shows an order waiting to be packed. Tap one to start packing it.
            </p>
          </div>

          <div className="rounded-2xl neu-flat p-6 space-y-3 neu-flat-hover">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl neu-pressed-sm flex items-center justify-center font-mono font-bold text-xs text-[#773C30] dark:text-[#6BFF86]">
                03
              </span>
              <div className="w-8 h-8 rounded-xl neu-flat-sm flex items-center justify-center text-[#773C30] dark:text-[#6BFF86]">
                <Camera className="w-4 h-4 stroke-[2]" />
              </div>
            </div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Photograph the Open Box
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              With all items placed inside, take a photo of the open carton before sealing. Upload
              it directly from your phone or desktop camera.
            </p>
          </div>

          <div className="rounded-2xl neu-flat p-6 space-y-3 neu-flat-hover">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl neu-pressed-sm flex items-center justify-center font-mono font-bold text-xs text-[#773C30] dark:text-[#6BFF86]">
                04
              </span>
              <div className="w-8 h-8 rounded-xl neu-flat-sm flex items-center justify-center text-[#773C30] dark:text-[#6BFF86]">
                <ScanLine className="w-4 h-4 stroke-[2]" />
              </div>
            </div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Get an Instant Verdict
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Within seconds, Pack Manager returns{' '}
              <span className="hl-green">SEAL</span>,{' '}
              <strong className="text-slate-900 dark:text-white">STOP&nbsp;&amp;&nbsp;FIX</strong>,
              or <strong className="text-slate-900 dark:text-white">UNCERTAIN</strong>. The result
              and photo are logged automatically.
            </p>
          </div>
        </div>
      </section>

      {/* THREE DISTINCT VERDICTS SECTION */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
            Three Clear Outcomes
          </h2>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Every audit ends in one of three verdicts. No grey areas, no silent passes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* SEAL */}
          <div className="rounded-[32px] neu-flat p-8 space-y-4 neu-flat-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl neu-icon-well flex items-center justify-center text-[#2E7D32] dark:text-[#A3E635]">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <span className="font-display font-extrabold text-xl text-slate-900 dark:text-white block">
                  SEAL
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D32] dark:text-[#A3E635] block">
                  Tape and Dispatch
                </span>
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                All expected items are present in the correct quantities. No unexpected extras. The
                box is ready to seal and ship.
              </p>
            </div>
            <div className="rounded-2xl neu-pressed-sm p-3 text-[11px] font-mono text-slate-900 dark:text-white">
              Verdict: <strong>SEAL</strong>
            </div>
          </div>

          {/* STOP AND FIX */}
          <div className="rounded-[32px] neu-flat p-8 space-y-4 neu-flat-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl neu-icon-well flex items-center justify-center text-[#C62828] dark:text-[#F87171]">
                <XCircle className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <span className="font-display font-extrabold text-xl text-slate-900 dark:text-white block">
                  STOP AND FIX
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C62828] dark:text-[#F87171] block">
                  Actionable Discrepancy
                </span>
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                A clear problem was found: a missing item, wrong quantity, incorrect variant, or
                an extra SKU that shouldn&apos;t be there. Fix the box before sealing.
              </p>
            </div>
            <div className="rounded-2xl neu-pressed-sm p-3 text-[11px] font-mono text-slate-900 dark:text-white">
              Verdict: <strong>STOP_AND_FIX</strong>
            </div>
          </div>

          {/* UNCERTAIN */}
          <div className="rounded-[32px] neu-flat p-8 space-y-4 neu-flat-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl neu-icon-well flex items-center justify-center text-[#B45309] dark:text-[#FBBF24]">
                <HelpCircle className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <span className="font-display font-extrabold text-xl text-slate-900 dark:text-white block">
                  UNCERTAIN
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B45309] dark:text-[#FBBF24] block">
                  Retake or Manually Review
                </span>
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                The photo was too dark, items were obscured, or confidence was too low to call
                it either way. Retake the photo or have a supervisor review the box.
              </p>
            </div>
            <div className="rounded-2xl neu-pressed-sm p-3 text-[11px] font-mono text-slate-900 dark:text-white">
              Verdict: <strong>HOLD_RECAPTURE</strong>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IS IT FOR */}
      <section className="rounded-[32px] neu-flat p-8 sm:p-12 space-y-6">
        <div className="space-y-1">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
            Who Uses Pack Manager
          </h2>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Built for teams where every wrong shipment is a real cost.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-2xl neu-pressed-sm p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl neu-flat-sm flex items-center justify-center text-[#773C30] dark:text-[#6BFF86]">
              <ShoppingCart className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Ecommerce Sellers
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Small and mid-size sellers who ship from a home office, garage, or small warehouse
              and want an affordable safety net without investing in expensive scanning equipment.
            </p>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl neu-flat-sm flex items-center justify-center text-[#773C30] dark:text-[#6BFF86]">
              <Warehouse className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              3PL Fulfillment Centers
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Third-party logistics providers handling multi-client orders who need a lightweight
              verification layer that operates across product categories and doesn&apos;t require
              per-SKU barcode setup.
            </p>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl neu-flat-sm flex items-center justify-center text-[#773C30] dark:text-[#6BFF86]">
              <Repeat2 className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Subscription Box Operators
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Teams curating monthly boxes with multiple SKUs per order where one wrong item causes
              a customer complaint and a costly re-ship.
            </p>
          </div>
        </div>
      </section>

      {/* GETTING STARTED */}
      <section className="rounded-[32px] neu-flat p-8 sm:p-12 space-y-6">
        <div className="space-y-1 text-center max-w-xl mx-auto">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
            Get Started in Minutes
          </h2>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
            No setup wizard, no onboarding call required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="rounded-2xl neu-pressed-sm p-6 space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#773C30] dark:text-[#6BFF86]">Step 1</span>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Import your first order
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Go to <Link href="/queue/import" className="underline underline-offset-2 text-[#773C30] dark:text-[#6BFF86]">Import Orders</Link> and
              paste a line like{' '}
              <code className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1 rounded">
                MUG-BLUE:1;NOTEBOOK-A5:2
              </code>
              . Hit Import. Your order appears in the queue instantly.
            </p>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-6 space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#773C30] dark:text-[#6BFF86]">Step 2</span>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Pack the box, then photograph it
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Open the order in the <Link href="/queue" className="underline underline-offset-2 text-[#773C30] dark:text-[#6BFF86]">Queue</Link>,
              place all items in the carton, then upload a clear overhead photo before taping it shut.
            </p>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-6 space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#773C30] dark:text-[#6BFF86]">Step 3</span>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Act on the verdict
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="hl-green">SEAL</span> → tape and ship.{' '}
              <strong className="text-slate-900 dark:text-white">STOP AND FIX</strong> → correct the box and re-photograph.{' '}
              <strong className="text-slate-900 dark:text-white">UNCERTAIN</strong> → retake in better light or flag for review.
            </p>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-6 space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#773C30] dark:text-[#6BFF86]">Step 4</span>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Review your audit log
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Every decision is logged with a timestamp, photo hash, and verdict reason. Use the{' '}
              <Link href="/eval" className="underline underline-offset-2 text-[#773C30] dark:text-[#6BFF86]">Benchmark Report</Link> to
              track accuracy over time across your team.
            </p>
          </div>
        </div>
      </section>

      {/* REAL EVALUATION SCOREBOARD */}
      <section className="rounded-[32px] neu-flat p-8 sm:p-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--neu-border-color)]">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#773C30] dark:text-[#6BFF86]" />
              <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
                Verified Accuracy — 50 Box Audit
              </h2>
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
              Results from a controlled run with two independent human reviewers and third-party adjudication.
            </p>
          </div>
          <Link
            href="/eval"
            className="px-4 py-2 rounded-2xl neu-btn-secondary text-xs font-bold text-slate-900 dark:text-white self-start sm:self-auto"
          >
            View Full Report
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl neu-pressed-sm p-5 space-y-1 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Overall Accuracy
            </span>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
              <span className="hl-green">94.0%</span>
            </div>
            <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium block pt-1">
              47 / 50 Validated
            </span>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-5 space-y-1 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              False SEAL Rate
            </span>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
              2.0%
            </div>
            <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium block">
              1 defect escape
            </span>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-5 space-y-1 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              UNCERTAIN Rate
            </span>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#773C30] dark:text-[#6BFF86]">
              4.0%
            </div>
            <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium block">
              Safe review abstention
            </span>
          </div>

          <div className="rounded-2xl neu-pressed-sm p-5 space-y-1 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Reviewer Agreement
            </span>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
              κ = 0.916
            </div>
            <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium block">
              Near-perfect inter-rater
            </span>
          </div>
        </div>
      </section>

      {/* AUDIT PRINCIPLES */}
      <section className="rounded-[32px] neu-flat p-8 space-y-4">
        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#773C30] dark:text-[#6BFF86]" />
          Audit Integrity
        </h3>
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
          Every pack decision produces a{' '}
          <span className="hl-green">cryptographic content hash</span> and joins an{' '}
          <span className="hl-green">append-only audit chain</span>. Operator overrides and
          manual re-checks are recorded alongside the original verdict — nothing is silently
          altered. If a shipment is disputed, the full decision history is retrievable.
        </p>
      </section>
    </div>
  );
}
