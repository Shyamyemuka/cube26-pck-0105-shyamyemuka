'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Package,
  Loader2,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react';
import { sha256Hex } from '@/lib/evidence/hash';

interface PhotoItem {
  dataUrl: string;
  sha256: string;
  sizeKb: number;
}

export default function CapturePage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.unitId as string;

  const [orgId, setOrgId] = useState('org_demo_alpha');
  const [orderId, setOrderId] = useState(`ORD-${unitId}`);
  const [channel, setChannel] = useState('shopify');
  const [lines, setLines] = useState<Array<{ sku: string; qty: number; name?: string }>>([]);
  const [loadingUnit, setLoadingUnit] = useState(true);

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let savedOrg = 'org_demo_alpha';
    if (typeof window !== 'undefined') {
      savedOrg = localStorage.getItem('pack_operator_org') || 'org_demo_alpha';
      setOrgId(savedOrg);
    }

    async function loadUnit() {
      try {
        const res = await fetch(`/api/units/${encodeURIComponent(unitId)}?org_id=${encodeURIComponent(savedOrg)}`);
        const data = await res.json();
        if (res.ok && data.unit) {
          setOrderId(data.unit.order_id);
          setChannel(data.unit.channel);
          setLines(data.unit.order_lines || []);
        } else {
          // If unit not in store, fallback to unitId
          setOrderId(`ORD-${unitId}`);
        }
      } catch (e) {
        // Fallback
      } finally {
        setLoadingUnit(false);
      }
    }

    loadUnit();
  }, [unitId]);

  // Client-side downscaling and SHA-256 hashing
  const processImageFile = async (file: File): Promise<PhotoItem> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        // Downscale to max 1600px long edge per APP_FLOW.md §3.4
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        // Compute real SHA-256
        const base64 = dataUrl.split(',')[1];
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

        crypto.subtle.digest('SHA-256', bytes).then((hashBuffer) => {
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
          resolve({
            dataUrl,
            sha256: hashHex,
            sizeKb: Math.round(bytes.length / 1024),
          });
        }).catch(reject);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 3) {
      setError('Maximum 3 photos per pack audit attempt.');
      return;
    }

    try {
      const newItems: PhotoItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const item = await processImageFile(files[i]);
        newItems.push(item);
      }
      setPhotos((prev) => [...prev, ...newItems]);
      setError('');
    } catch (err: unknown) {
      const e = err as Error;
      setError(`Error processing image: ${e.message}`);
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAnalyze = async () => {
    if (photos.length === 0) {
      setError('Please capture at least 1 photo before checking the box.');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const res = await fetch(`/api/units/${encodeURIComponent(unitId)}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          order_id: orderId,
          channel,
          order_lines: lines,
          photos: photos.map((p) => ({ dataUrl: p.dataUrl })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Audit analysis failed');
      }

      // Save result in sessionStorage for decision view
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`decision_${unitId}`, JSON.stringify(data));
      }
      router.push(`/units/${unitId}/decision`);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Analysis error');
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/queue"
            className="w-12 h-12 rounded-2xl neu-flat hover:neu-flat-hover flex items-center justify-center text-[#3D4852] hover:text-[#1C2024] transition-all"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display font-extrabold text-2xl text-[#1C2024] tracking-tight">
                {orderId}
              </h1>
              <span className="font-mono text-xs font-bold text-[#5A3E2B] bg-[#D4DCE6] px-2.5 py-1 rounded-xl">
                {unitId}
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6E492F] mt-0.5">
              Channel: {channel.replace('_', ' ')} • Tenant: {orgId}
            </p>
          </div>
        </div>

        <div className="w-11 h-11 rounded-2xl neu-icon-well flex items-center justify-center text-[#5A3E2B]">
          <Camera className="w-6 h-6 stroke-[2.2]" />
        </div>
      </div>

      {/* Target Items Checklist */}
      <div className="rounded-[32px] neu-flat p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-1">
          <span className="font-display font-bold text-sm text-[#1C2024] uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-[#5A3E2B]" />
            Order Packing Manifest
          </span>
          <span className="text-xs font-bold text-[#4A545E]">
            {lines.length} {lines.length === 1 ? 'Line Item' : 'Line Items'}
          </span>
        </div>

        {lines.length === 0 ? (
          <div className="rounded-2xl neu-pressed p-4 text-xs font-semibold text-[#606C78]">
            No pre-defined SKU lines found for this unit. You can still photograph the open box to evaluate packaging integrity.
          </div>
        ) : (
          <div className="space-y-2">
            {lines.map((l, idx) => (
              <div
                key={idx}
                className="rounded-2xl neu-pressed-sm p-4 flex items-center justify-between"
              >
                <div>
                  <span className="font-mono font-bold text-sm text-[#1C2024]">{l.sku}</span>
                  {l.name && <p className="text-xs font-medium text-[#4A545E]">{l.name}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#606C78]">Target Qty:</span>
                  <span className="px-3 py-1 rounded-xl neu-flat-sm text-xs font-mono font-extrabold text-[#5A3E2B]">
                    {l.qty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-2xl neu-flat bg-[#E0E5EC] flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl neu-icon-well flex items-center justify-center text-[#6B2D1C]">
            <AlertCircle className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-xs font-bold text-[#6B2D1C]">{error}</span>
        </div>
      )}

      {/* Photo Capture Section */}
      <div className="rounded-[32px] neu-flat p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="font-display font-extrabold text-base text-[#1C2024]">
            Pre-Seal Photos ({photos.length}/3)
          </h2>
          <p className="text-xs font-medium text-[#4A545E] mt-0.5">
            Capture 1 to 3 real photos: recommended top-down inside the carton, 45-degree angle, or close-up.
          </p>
        </div>

        {/* Hidden native camera & file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFilesSelected}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesSelected}
          className="hidden"
        />

        {/* Photo Wells Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((idx) => {
            const photo = photos[idx];
            return (
              <div
                key={idx}
                className="aspect-square rounded-[28px] neu-pressed-deep relative overflow-hidden flex flex-col items-center justify-center p-3 text-center"
              >
                {photo ? (
                  <>
                    <img
                      src={photo.dataUrl}
                      alt={`Box Photo ${idx + 1}`}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      disabled={analyzing}
                      className="absolute top-3 right-3 w-8 h-8 rounded-xl neu-btn-primary flex items-center justify-center text-[#FFFFFF] hover:bg-[#6B2D1C] transition-all"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2.2]" />
                    </button>
                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-lg bg-[#23201D]/80 backdrop-blur-sm text-[9px] font-mono text-white truncate text-center">
                      SHA: {photo.sha256.substring(0, 12)}...
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 text-[#606C78]">
                    <div className="w-10 h-10 rounded-2xl neu-icon-well mx-auto flex items-center justify-center text-[#5A3E2B]">
                      <ImageIcon className="w-5 h-5 stroke-[2]" />
                    </div>
                    <span className="text-xs font-bold block text-[#4A545E]">
                      Angle {idx + 1}
                    </span>
                    <span className="text-[10px] text-[#606C78] block">Empty Slot</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={photos.length >= 3 || analyzing}
            className="py-3.5 px-4 rounded-2xl neu-btn-secondary font-display font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Camera className="w-4 h-4 text-[#5A3E2B] stroke-[2.2]" />
            <span>Open Camera</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photos.length >= 3 || analyzing}
            className="py-3.5 px-4 rounded-2xl neu-btn-secondary font-display font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-[#5A3E2B] stroke-[2.2]" />
            <span>Upload Photo File</span>
          </button>
        </div>

        {/* Main Audit Trigger */}
        <div className="pt-4 border-t border-[#D4DCE6]/40">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={photos.length === 0 || analyzing}
            className="w-full py-4 rounded-2xl neu-btn-primary font-display font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-3 disabled:opacity-40 transition-all"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#FFFFFF]" />
                <span>Running Fail-Open Package Audit...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-[#A3E635] stroke-[2.5]" />
                <span>Audit Box & Generate Decision</span>
              </>
            )}
          </button>
          <p className="text-[11px] font-medium text-[#606C78] text-center mt-2.5">
            Exactly one model call • Photos hashed and persisted fail-open • Verdicts evaluated by pure deterministic rules
          </p>
        </div>
      </div>
    </div>
  );
}
