'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  Camera,
  FileText,
  Filter,
} from 'lucide-react';

interface QueueItem {
  order_id: string;
  unit_id: string;
  channel: string;
  status: 'open' | 'analyzing' | 'sealed' | 'stopped' | 'uncertain' | 'pending' | 'overridden';
  order_lines: Array<{ sku: string; qty: number; name?: string }>;
  analysesCount?: number;
}

export default function QueuePage() {
  const [orgId, setOrgId] = useState('org_demo_alpha');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [orders, setOrders] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activeOrg = 'org_demo_alpha';
    if (typeof window !== 'undefined') {
      const savedOrg = localStorage.getItem('pack_operator_org');
      if (savedOrg) {
        activeOrg = savedOrg;
        setOrgId(savedOrg);
      }
    }

    async function loadOrders() {
      try {
        setLoading(true);
        const res = await fetch(`/api/units?org_id=${encodeURIComponent(activeOrg)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.units)) {
            setOrders(data.units);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching queue units:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [orgId]);

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.order_id.toLowerCase().includes(search.toLowerCase()) ||
      o.unit_id.toLowerCase().includes(search.toLowerCase()) ||
      o.order_lines.some((l) => l.sku.toLowerCase().includes(search.toLowerCase()));

    const matchFilter = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const getStatusChip = (status: QueueItem['status']) => {
    switch (status) {
      case 'sealed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> SEALED
          </span>
        );
      case 'stopped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" /> STOPPED
          </span>
        );
      case 'uncertain':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <HelpCircle className="w-3.5 h-3.5" /> UNCERTAIN
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-800 border border-slate-300">
            <Clock className="w-3.5 h-3.5" /> PENDING
          </span>
        );
      case 'overridden':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <RotateCcw className="w-3.5 h-3.5" /> OVERRIDDEN
          </span>
        );
      case 'analyzing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3.5 h-3.5 animate-spin" /> CHECKING…
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            OPEN
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pack Queue</h1>
          <p className="text-xs text-slate-500">
            Active tenant: <strong className="text-slate-800 font-mono">{orgId}</strong>
          </p>
        </div>

        <Link
          href="/queue/import"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Import Orders</span>
        </Link>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, unit ID, or SKU…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="sealed">Sealed</option>
            <option value="stopped">Stopped</option>
            <option value="uncertain">Uncertain</option>
            <option value="overridden">Overridden</option>
          </select>
        </div>
      </div>

      {/* ORDERS LIST */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading queue…</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-3">
          <div className="text-slate-400 font-semibold text-base">No matching orders found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have no open orders matching this criteria. Import catalogue items and order batches to get started.
          </p>
          <Link
            href="/queue/import"
            className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg"
          >
            <span>Import Now</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const totalItems = order.order_lines.reduce((acc, l) => acc + l.qty, 0);

            return (
              <div
                key={order.unit_id}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-base">{order.order_id}</span>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {order.unit_id}
                    </span>
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                      {order.channel}
                    </span>
                    {getStatusChip(order.status)}
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-700">
                      {order.order_lines.length} SKU{order.order_lines.length > 1 ? 's' : ''} ({totalItems} total pcs):
                    </span>
                    <span>
                      {order.order_lines.map((l) => `${l.sku} ×${l.qty}`).join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/units/${order.unit_id}/capture`}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-sm transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Audit Box</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/units/${order.unit_id}/record`}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-2.5 rounded-xl transition"
                    title="View Evidence Record"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Record</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
