'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertCircle, PackagePlus, Eye } from 'lucide-react';
import { parseOrderLines } from '@/lib/ingest/parse-lines';

export default function ImportPage() {
  const router = useRouter();

  // Active tenant
  const [orgId, setOrgId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pack_operator_org') || 'org_demo_alpha';
    }
    return 'org_demo_alpha';
  });

  const [unitId, setUnitId] = useState(`UNIT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [orderId, setOrderId] = useState(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [channel, setChannel] = useState<'shopify' | 'amazon_mfn' | 'walmart' | '3pl_client'>('shopify');
  const [orderLinesInput, setOrderLinesInput] = useState('MUG-BLUE:1;NOTEBOOK-A5-BLACK:2');
  
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live parsed lines preview
  let parsedPreview: Array<{ sku: string; qty: number }> = [];
  let previewError = '';
  try {
    if (orderLinesInput.trim()) {
      parsedPreview = parseOrderLines(orderLinesInput);
    }
  } catch (err: unknown) {
    previewError = (err as Error).message;
  }

  const handleOrgChange = (newOrg: string) => {
    setOrgId(newOrg);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pack_operator_org', newOrg);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    if (!unitId.trim()) {
      setErrorMessage('Please specify a valid Unit ID.');
      return;
    }

    if (!orderId.trim()) {
      setErrorMessage('Please specify a valid Order ID.');
      return;
    }

    if (parsedPreview.length === 0) {
      setErrorMessage(previewError || 'Please provide at least one valid order line.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          unit_id: unitId.trim(),
          order_id: orderId.trim(),
          channel,
          order_lines: parsedPreview.map((line) => ({
            sku: line.sku,
            qty: line.qty,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save order to tenant store.');
      }

      setStatusMessage(`Order ${orderId} (${unitId}) successfully saved to ${orgId}! Redirecting to queue...`);
      setTimeout(() => {
        router.push('/queue');
      }, 1000);
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Import failed.');
      setIsSubmitting(false);
    }
  };

  // CSV file drag & upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setStatusMessage('');
    setIsSubmitting(true);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error('CSV file is empty or missing data rows.');
      }

      // Check header
      const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
      const orderIdIdx = header.indexOf('order_id');
      const unitIdIdx = header.indexOf('unit_id');
      const channelIdx = header.indexOf('channel');
      const linesIdx = header.indexOf('order_lines');

      if (orderIdIdx === -1 || linesIdx === -1) {
        throw new Error('CSV must contain "order_id" and "order_lines" columns.');
      }

      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 2) continue;

        const rowOrderId = cols[orderIdIdx];
        const rowUnitId = unitIdIdx !== -1 && cols[unitIdIdx] ? cols[unitIdIdx] : `UNIT-${rowOrderId}`;
        const rowChannel = channelIdx !== -1 && cols[channelIdx] ? (cols[channelIdx] as any) : 'shopify';
        const rowLinesStr = cols[linesIdx];

        if (!rowOrderId || !rowLinesStr) continue;

        const parsed = parseOrderLines(rowLinesStr);
        await fetch('/api/units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            org_id: orgId,
            unit_id: rowUnitId,
            order_id: rowOrderId,
            channel: rowChannel,
            order_lines: parsed,
          }),
        });
        importedCount++;
      }

      setStatusMessage(`Successfully imported ${importedCount} real orders into ${orgId}!`);
      setTimeout(() => {
        router.push('/queue');
      }, 1200);
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'CSV import error.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/queue"
            className="w-12 h-12 rounded-2xl neu-flat hover:neu-flat-hover flex items-center justify-center text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)] transition-all"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </Link>
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--neu-text-primary)] tracking-tight">
              Import Orders
            </h1>
            <p className="text-sm font-medium text-[var(--neu-text-secondary)] mt-0.5">
              Enter customer manifests to populate the active tenant audit queue.
            </p>
          </div>
        </div>

        {/* Tenant Pill Selector */}
        <div className="flex items-center gap-2 rounded-2xl neu-pressed-sm p-1.5">
          <button
            type="button"
            onClick={() => handleOrgChange('org_demo_alpha')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              orgId === 'org_demo_alpha'
                ? 'neu-btn-primary'
                : 'text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)]'
            }`}
          >
            Alpha Tenant
          </button>
          <button
            type="button"
            onClick={() => handleOrgChange('org_demo_bravo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              orgId === 'org_demo_bravo'
                ? 'neu-btn-primary'
                : 'text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)]'
            }`}
          >
            Bravo Tenant
          </button>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div className="p-5 rounded-2xl neu-flat flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl neu-icon-well flex items-center justify-center text-[#2E7D32] dark:text-[#A3E635]">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-sm font-bold text-[var(--neu-text-primary)]">{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-5 rounded-2xl neu-flat flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl neu-icon-well flex items-center justify-center text-[#C62828] dark:text-[#F87171]">
            <AlertCircle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-sm font-bold text-[#C62828] dark:text-[#F87171]">{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Manual Import Form */}
        <div className="lg:col-span-2 rounded-[32px] neu-flat p-8 sm:p-10 space-y-6">
          <div className="flex items-center gap-3 pb-2">
            <div className="w-10 h-10 rounded-2xl neu-icon-well flex items-center justify-center text-[#5A3E2B] dark:text-[#C4F82A]">
              <PackagePlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-[var(--neu-text-primary)]">Single Unit Manifest</h2>
              <p className="text-xs font-medium text-[var(--neu-text-secondary)]">Define exact order requirements and target SKUs</p>
            </div>
          </div>

          <form onSubmit={handleImportSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--neu-text-secondary)] uppercase tracking-wider mb-2">
                  Order ID
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. ORD-1001"
                  required
                  className="w-full px-4 py-3.5 rounded-2xl neu-input text-sm font-semibold text-[var(--neu-text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--neu-text-secondary)] uppercase tracking-wider mb-2">
                  Unit ID (Physical Box)
                </label>
                <input
                  type="text"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  placeholder="e.g. UNIT-1001"
                  required
                  className="w-full px-4 py-3.5 rounded-2xl neu-input text-sm font-semibold text-[var(--neu-text-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--neu-text-secondary)] uppercase tracking-wider mb-2">
                Sales Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full px-4 py-3.5 rounded-2xl neu-input text-sm font-semibold text-[var(--neu-text-primary)] cursor-pointer"
              >
                <option value="shopify">Shopify Store</option>
                <option value="amazon_mfn">Amazon Merchant Fulfilled (MFN)</option>
                <option value="walmart">Walmart Marketplace</option>
                <option value="3pl_client">3PL Direct Client</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[var(--neu-text-secondary)] uppercase tracking-wider">
                  Order Lines (<span className="hl-green">SKU:qty;SKU:qty</span>)
                </label>
                <span className="text-[11px] font-bold text-[#5A3E2B] dark:text-[#C4F82A]">Format: SKU:quantity</span>
              </div>
              <textarea
                rows={3}
                value={orderLinesInput}
                onChange={(e) => setOrderLinesInput(e.target.value)}
                placeholder="e.g. MUG-BLUE:1;NOTEBOOK-A5-BLACK:2"
                required
                className="w-full p-4 rounded-2xl neu-input text-sm font-mono text-[var(--neu-text-primary)]"
              />
              <p className="text-[11px] font-medium text-[var(--neu-text-muted)] mt-1.5">
                Separate multiple lines with semicolons (;). Whitespace around SKUs and counts is automatically trimmed.
              </p>
            </div>

            {/* Parsed Live Preview */}
            <div className="rounded-2xl neu-pressed-deep p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--neu-text-secondary)] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#5A3E2B] dark:text-[#C4F82A]" />
                  Verified Line Items ({parsedPreview.length})
                </span>
                {previewError && (
                  <span className="text-xs font-bold text-[#C62828] dark:text-[#F87171]">{previewError}</span>
                )}
              </div>

              {parsedPreview.length === 0 ? (
                <p className="text-xs text-[var(--neu-text-muted)] italic">No valid lines parsed yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {parsedPreview.map((line, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 rounded-xl neu-flat-sm text-xs font-mono font-bold text-[var(--neu-text-primary)] flex items-center gap-2"
                    >
                      <span className="text-[#5A3E2B] dark:text-[#C4F82A]">{line.sku}</span>
                      <span className="text-[var(--neu-text-secondary)] neu-pressed-sm px-1.5 py-0.5 rounded-md text-[10px]">
                        x{line.qty}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || parsedPreview.length === 0}
              className="w-full py-4 rounded-2xl neu-btn-highlight font-display font-bold text-sm tracking-wide uppercase transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving to Tenant Queue...' : 'Import Order Into Queue'}
            </button>
          </form>
        </div>

        {/* Right Sidebar: Bulk CSV Upload & Information */}
        <div className="space-y-6">
          {/* CSV File Drop */}
          <div className="rounded-[32px] neu-flat p-8 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl neu-icon-well mx-auto flex items-center justify-center text-[#5A3E2B] dark:text-[#C4F82A]">
              <Upload className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[var(--neu-text-primary)]">Bulk CSV Ingest</h3>
              <p className="text-xs font-medium text-[var(--neu-text-secondary)] mt-1">
                Upload customer shipment manifest spreadsheets.
              </p>
            </div>

            <label className="block cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isSubmitting}
                className="hidden"
              />
              <div className="py-3 px-4 rounded-2xl neu-btn-secondary text-xs font-bold text-[var(--neu-text-primary)] hover:text-[#5A3E2B] dark:hover:text-[#C4F82A] transition-all">
                Select CSV File
              </div>
            </label>

            <div className="rounded-2xl neu-pressed p-3 text-left">
              <span className="text-[11px] font-bold text-[var(--neu-text-secondary)] block mb-1">Expected CSV columns:</span>
              <code className="text-[10px] text-[var(--neu-text-muted)] font-mono block">
                order_id,unit_id,channel,order_lines
              </code>
            </div>
          </div>

          {/* Tenancy Guarantee Pill */}
          <div className="rounded-[32px] neu-flat p-6 space-y-3">
            <h4 className="font-display font-bold text-sm text-[var(--neu-text-primary)] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#5A3E2B] dark:text-[#C4F82A]" />
              Enterprise Tenancy Guarantee
            </h4>
            <p className="text-xs font-medium text-[var(--neu-text-secondary)] leading-relaxed">
              Every imported unit is securely isolated under tenant <strong className="text-[var(--neu-text-primary)]">{orgId}</strong>.
              Operators of other tenants cannot access or view these units.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
