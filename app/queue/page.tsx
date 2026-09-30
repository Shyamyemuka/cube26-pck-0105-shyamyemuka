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
  Layers,
  Inbox,
} from 'lucide-react';
import { StoreUnit } from '@/lib/data/store';

export default function QueuePage() {
  const [orgId, setOrgId] = useState('org_demo_alpha');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [orders, setOrders] = useState<StoreUnit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async (currentOrg: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/units?org_id=${encodeURIComponent(currentOrg)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.units)) {
        setOrders(data.units);
      } else {
        setOrders([]);
      }
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let savedOrg = 'org_demo_alpha';
    if (typeof window !== 'undefined') {
      savedOrg = localStorage.getItem('pack_operator_org') || 'org_demo_alpha';
      setOrgId(savedOrg);
    }
    fetchOrders(savedOrg);
  }, []);

  const handleOrgSwitch = (newOrg: string) => {
    setOrgId(newOrg);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pack_operator_org', newOrg);
    }
    fetchOrders(newOrg);
  };

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.order_id.toLowerCase().includes(search.toLowerCase()) ||
      o.unit_id.toLowerCase().includes(search.toLowerCase()) ||
      o.order_lines.some((l) => l.sku.toLowerCase().includes(search.toLowerCase()));

    const matchFilter = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const getStatusBadge = (status: StoreUnit['status']) => {
    switch (status) {
      case 'sealed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#23201D] text-[#FFFFFF] neu-flat-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#A3E635]" />
            SEALED
          </span>
        );
      case 'stopped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#381E18] text-[#FFFFFF] neu-flat-sm">
            <XCircle className="w-3.5 h-3.5 text-[#F87171]" />
            STOP & FIX
          </span>
        );
      case 'uncertain':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#3D2C1A] text-[#FFFFFF] neu-flat-sm">
            <HelpCircle className="w-3.5 h-3.5 text-[#FBBF24]" />
            UNCERTAIN
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#2A3038] text-[#FFFFFF] neu-flat-sm">
            <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
            PENDING
          </span>
        );
      case 'overridden':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#5A3E2B] text-[#FFFFFF] neu-flat-sm">
            <RotateCcw className="w-3.5 h-3.5 text-[#FDE68A]" />
            OVERRIDDEN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#D4DCE6] text-[#1C2024] neu-flat-sm">
            OPEN
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Tenant Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1C2024] tracking-tight">
              Packing Station Queue
            </h1>
            <span className="px-3 py-1 rounded-xl neu-pressed-sm text-xs font-bold text-[#5A3E2B] uppercase">
              {orgId}
            </span>
          </div>
          <p className="text-sm font-medium text-[#4A545E] mt-1">
            Real orders awaiting pre-seal photo audit. Select a box to capture and verify.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tenant Switcher */}
          <div className="flex items-center gap-1.5 rounded-2xl neu-pressed-sm p-1 bg-[#E0E5EC]">
            <button
              onClick={() => handleOrgSwitch('org_demo_alpha')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                orgId === 'org_demo_alpha' ? 'neu-btn-primary' : 'text-[#4A545E] hover:text-[#1C2024]'
              }`}
            >
              Alpha
            </button>
            <button
              onClick={() => handleOrgSwitch('org_demo_bravo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                orgId === 'org_demo_bravo' ? 'neu-btn-primary' : 'text-[#4A545E] hover:text-[#1C2024]'
              }`}
            >
              Bravo
            </button>
          </div>

          <Link
            href="/queue/import"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl neu-btn-primary text-xs font-bold tracking-wide uppercase transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Import Order</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="rounded-[28px] neu-flat p-4 sm:p-5 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-[#606C78] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order ID, unit ID, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl neu-input text-sm font-semibold text-[#1C2024]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['all', 'open', 'sealed', 'stopped', 'uncertain'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filterStatus === st
                  ? 'neu-pressed text-[#1C2024]'
                  : 'neu-flat-sm text-[#4A545E] hover:text-[#1C2024]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List or Empty State */}
      {loading ? (
        <div className="rounded-[32px] neu-flat p-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl neu-icon-well mx-auto flex items-center justify-center text-[#5A3E2B] animate-pulse">
            <Clock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <p className="text-sm font-bold text-[#1C2024]">Loading real tenant queue...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-[32px] neu-flat p-16 text-center space-y-5">
          <div className="w-16 h-16 rounded-[24px] neu-icon-well mx-auto flex items-center justify-center text-[#5A3E2B]">
            <Inbox className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-display font-extrabold text-xl text-[#1C2024]">
              {orders.length === 0 ? 'No Orders in Queue' : 'No Matching Orders Found'}
            </h3>
            <p className="text-xs font-medium text-[#4A545E]">
              {orders.length === 0
                ? `Tenant ${orgId} has no active orders awaiting audit. Import your orders to begin.`
                : 'Try adjusting your search criteria or filter status.'}
            </p>
          </div>
          {orders.length === 0 && (
            <div className="pt-2">
              <Link
                href="/queue/import"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl neu-btn-primary font-display font-bold text-xs uppercase tracking-wide"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Import First Order</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const totalItems = order.order_lines.reduce((acc, l) => acc + l.qty, 0);
            return (
              <div
                key={order.unit_id}
                className="rounded-[32px] neu-flat p-6 sm:p-7 flex flex-col justify-between neu-flat-hover"
              >
                <div>
                  <div className="flex items-center justify-between pb-3">
                    <span className="font-mono text-xs font-bold text-[#5A3E2B] bg-[#D4DCE6] px-2.5 py-1 rounded-xl">
                      {order.unit_id}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>

                  <h3 className="font-display font-extrabold text-lg text-[#1C2024] tracking-tight">
                    {order.order_id}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#4A545E] mt-1">
                    <span className="capitalize">{order.channel.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{totalItems} total {totalItems === 1 ? 'item' : 'items'}</span>
                  </div>

                  {/* Order lines preview well */}
                  <div className="mt-4 rounded-2xl neu-pressed-sm p-3.5 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#606C78] block">
                      Target Contents:
                    </span>
                    {order.order_lines.slice(0, 3).map((l, i) => (
                      <div key={i} className="flex items-center justify-between text-xs font-mono font-medium">
                        <span className="text-[#1C2024] truncate mr-2">{l.sku}</span>
                        <span className="text-[#5A3E2B] font-bold">x{l.qty}</span>
                      </div>
                    ))}
                    {order.order_lines.length > 3 && (
                      <div className="text-[11px] text-[#606C78] font-bold pt-1">
                        + {order.order_lines.length - 3} more items...
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 mt-2 flex items-center gap-2">
                  <Link
                    href={`/units/${order.unit_id}/capture`}
                    className="flex-1 py-3 rounded-2xl neu-btn-primary font-display font-bold text-xs uppercase tracking-wide text-center flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4 stroke-[2.2]" />
                    <span>Audit Unit</span>
                  </Link>

                  <Link
                    href={`/units/${order.unit_id}/record`}
                    title="View Evidence Record"
                    className="w-12 h-12 rounded-2xl neu-btn-secondary flex items-center justify-center text-[#3D4852] hover:text-[#5A3E2B]"
                  >
                    <FileText className="w-4 h-4 stroke-[2.2]" />
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
