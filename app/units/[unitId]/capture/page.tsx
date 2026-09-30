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
  HelpCircle,
  Package,
  Loader2,
} from 'lucide-react';

interface PhotoItem {
  dataUrl: string;
  sha256: string;
  sizeKb: number;
}

export default function CapturePage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.unitId as string;

  const [orderId, setOrderId] = useState(`ORD-${unitId}`);
  const [channel, setChannel] = useState('shopify');
  const [lines, setLines] = useState<Array<{ sku: string; qty: number; name: string }>>([
    { sku: 'MUG-BLUE', qty: 1, name: 'Ceramic Blue Coffee Mug' },
    { sku: 'NOTEBOOK-A5-BLACK', qty: 1, name: 'Hardcover A5 Notebook - Black' },
  ]);

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let orgId = 'org_demo_alpha';
    if (typeof window !== 'undefined') {
      const savedOrg = localStorage.getItem('pack_operator_org');
      if (savedOrg) orgId = savedOrg;
    }

    async function loadUnitDetails() {
      try {
        const res = await fetch(`/api/units/${encodeURIComponent(unitId)}?org_id=${encodeURIComponent(orgId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.unit) {
            if (data.unit.order_id) setOrderId(data.unit.order_id);
            if (data.unit.channel) setChannel(data.unit.channel);
            if (Array.isArray(data.unit.order_lines) && data.unit.order_lines.length > 0) {
              setLines(
                data.unit.order_lines.map((l: { sku: string; qty: number; name?: string }) => ({
                  sku: l.sku,
                  qty: l.qty,
                  name: l.name || l.sku,
                }))
              );
            }
          }
        }
      } catch (err) {
        console.error('Failed to load unit details:', err);
      }
    }

    if (unitId) {
      loadUnitDetails();
    }
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
        if (!ctx) return reject(new Error('Canvas context unavailable'));

        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG quality 0.8
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

        // SHA-256 computation in browser
        crypto.subtle.digest('SHA-256', bytes).then((hashBuffer) => {
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

          resolve({
            dataUrl,
            sha256: hashHex,
            sizeKb: Math.round(bytes.length / 1024),
          });
        });
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleAddSampleBoxPhoto = () => {
    // Generates a mock canvas photo of an open box for easy testing
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;

    // Draw carton
    ctx.fillStyle = '#d2b48c'; // cardboard color
    ctx.fillRect(20, 20, 560, 360);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#8b5a2b';
    ctx.strokeRect(20, 20, 560, 360);

    // Draw box contents
    ctx.fillStyle = '#2563eb'; // blue mug
    ctx.beginPath();
    ctx.arc(180, 200, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText('MUG-BLUE', 135, 205);

    ctx.fillStyle = '#1e293b'; // black notebook
    ctx.fillRect(320, 120, 160, 160);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('NOTEBOOK', 345, 205);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrl.split(',')[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    crypto.subtle.digest('SHA-256', bytes).then((hashBuffer) => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setPhotos((prev) => [
        ...prev,
        {
          dataUrl,
          sha256: hashHex,
          sizeKb: Math.round(bytes.length / 1024),
        },
      ]);
    });
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
      const orgId = typeof window !== 'undefined' ? localStorage.getItem('pack_operator_org') || 'org_demo_alpha' : 'org_demo_alpha';

      const res = await fetch(`/api/units/${unitId}/analyze`, {
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
      sessionStorage.setItem(`decision_${unitId}`, JSON.stringify(data));
      router.push(`/units/${unitId}/decision`);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Analysis error');
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/queue" className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{orderId}</h1>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {unitId}
              </span>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Channel: {channel}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* EXPECTED LINES CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Expected Order Items
          </h2>
          <span className="text-xs text-slate-500 font-medium">{lines.length} lines</span>
        </div>

        <div className="divide-y divide-slate-100">
          {lines.map((l) => (
            <div key={l.sku} className="py-2.5 flex items-center justify-between text-sm">
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-900">{l.name}</div>
                <div className="font-mono text-xs text-slate-500">{l.sku}</div>
              </div>
              <div className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg text-xs">
                Qty: {l.qty}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CAPTURE GUIDANCE */}
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong>Guidance:</strong> Open box from above. Whole box in frame. Spread items if you can.
        </div>
      </div>

      {/* PHOTO TRAY (1-3 slots) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Box Photos ({photos.length}/3)
          </h2>
          {photos.length < 3 && (
            <button
              type="button"
              onClick={handleAddSampleBoxPhoto}
              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 transition"
            >
              + Add Sample Box Image
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo, idx) => (
            <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 group bg-slate-100 aspect-square">
              <img
                src={photo.dataUrl}
                alt={`Box photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemovePhoto(idx)}
                className="absolute top-1.5 right-1.5 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow transition"
                title="Remove photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[10px] px-1.5 py-0.5 truncate font-mono">
                {photo.sizeKb} KB · {photo.sha256.substring(0, 8)}…
              </div>
            </div>
          ))}

          {photos.length < 3 && (
            <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center gap-1.5 p-3 text-slate-500 hover:text-emerald-600 cursor-pointer transition aspect-square">
              <Camera className="w-6 h-6" />
              <span className="text-[11px] font-semibold text-center leading-tight">
                Take Photo
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* AUDIT CTA */}
      <button
        type="button"
        disabled={photos.length === 0 || analyzing}
        onClick={handleAnalyze}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl text-base shadow-sm transition flex items-center justify-center gap-2"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Checking box…</span>
          </>
        ) : (
          <>
            <Package className="w-5 h-5" />
            <span>Check Box</span>
          </>
        )}
      </button>
    </div>
  );
}
