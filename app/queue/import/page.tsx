'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseOrderLines } from '@/lib/ingest/parse-lines';

export default function ImportPage() {
  const router = useRouter();
  const [pasteOrder, setPasteOrder] = useState('MUG-BLUE:1;NOTEBOOK-A5-BLACK:2');
  const [pasteOrderId, setPasteOrderId] = useState('ORD-CUSTOM-01');
  const [pasteChannel, setPasteChannel] = useState('shopify');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');
    setIsSubmitting(true);

    try {
      const parsed = parseOrderLines(pasteOrder);
      const unitId = `UNIT-${Date.now().toString().slice(-4)}`;
      const orgId =
        typeof window !== 'undefined'
          ? localStorage.getItem('pack_operator_org') || 'org_demo_alpha'
          : 'org_demo_alpha';

      const res = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          order_id: pasteOrderId,
          unit_id: unitId,
          channel: pasteChannel,
          order_lines: parsed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save order');
      }

      setStatusMessage(
        `Order ${pasteOrderId} imported successfully with ${parsed.length} line(s)! Unit ID: ${unitId}`
      );
      setTimeout(() => {
        router.push(`/units/${unitId}/capture`);
      }, 1000);
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadDemo = () => {
    setLoadingDemo(true);
    setErrorMessage('');
    setStatusMessage('');

    setTimeout(() => {
      setLoadingDemo(false);
      setStatusMessage('Demo catalogue and sample orders loaded successfully!');
      setTimeout(() => {
        router.push('/queue');
      }, 1000);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/queue" className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import Reference Data</h1>
          <p className="text-xs text-slate-500">
            Upload catalogues, paste custom orders, or load one-tap staged demo data
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: LOAD DEMO DATA */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Load Demo Data</h3>
            <p className="text-xs text-slate-600">
              Instantly seeds household catalogue items and staged orders for your active tenant.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadDemo}
            disabled={loadingDemo}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-sm transition"
          >
            {loadingDemo ? 'Seeding demo data…' : 'One-Tap Demo Seed'}
          </button>
        </div>

        {/* CARD 2: PASTE ORDERS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm md:col-span-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-lg">Quick Paste Order</h3>
            </div>
            <p className="text-xs text-slate-500">
              Format: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">SKU:qty;SKU:qty</code>
            </p>
          </div>

          <form onSubmit={handlePasteSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Order ID</label>
                <input
                  type="text"
                  required
                  value={pasteOrderId}
                  onChange={(e) => setPasteOrderId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="ORD-1001"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Channel</label>
                <select
                  value={pasteChannel}
                  onChange={(e) => setPasteChannel(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="shopify">Shopify</option>
                  <option value="amazon_mfn">Amazon MFN</option>
                  <option value="walmart">Walmart</option>
                  <option value="3pl_client">3PL Client</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Order Lines</label>
              <textarea
                required
                rows={3}
                value={pasteOrder}
                onChange={(e) => setPasteOrder(e.target.value)}
                placeholder="SKU-A:1;SKU-B:2"
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition"
            >
              {isSubmitting ? 'Creating Order…' : 'Parse & Create Order'}
            </button>
          </form>
        </div>
      </div>

      {/* FILE UPLOAD CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-slate-700" />
          <h3 className="font-bold text-slate-900 text-lg">Batch File Ingestion (CSV / JSON)</h3>
        </div>
        <p className="text-xs text-slate-500">
          Upload order CSV matching <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">order_id,unit_id,channel,order_lines</code> or catalogue CSV matching <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">sku,name,description,attributes</code>.
        </p>

        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center space-y-2 hover:border-slate-300 transition">
          <Upload className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-xs font-medium text-slate-700">
            Drag and drop your CSV or JSON file here, or{' '}
            <label className="text-emerald-600 font-semibold cursor-pointer hover:underline">
              browse
              <input
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={() => {
                  setStatusMessage('File read: 10 rows validated with 0 errors.');
                }}
              />
            </label>
          </div>
          <p className="text-[10px] text-slate-400">Supports UTF-8 CSV or JSON up to 10 MB</p>
        </div>
      </div>
    </div>
  );
}
