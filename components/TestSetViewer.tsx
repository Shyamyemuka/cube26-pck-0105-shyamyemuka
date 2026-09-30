'use client';

import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, Eye, EyeOff, Search } from 'lucide-react';

interface BenchmarkUnit {
  unit_id: string;
  order_id: string;
  channel: string;
  order_lines: string;
  defect_type: string;
  description: string;
}

export default function TestSetViewer({ units }: { units: BenchmarkUnit[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [defectFilter, setDefectFilter] = useState('ALL');

  const downloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(units, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'benchmark_test_set_50_units.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadCSV = () => {
    const headers = ['unit_id', 'order_id', 'channel', 'order_lines', 'defect_type', 'description'];
    const rows = units.map(u => [
      u.unit_id,
      u.order_id,
      u.channel,
      `"${u.order_lines}"`,
      u.defect_type,
      `"${u.description.replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement('a');
    a.setAttribute('href', encodedUri);
    a.setAttribute('download', 'benchmark_test_set_50_units.csv');
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const filteredUnits = units.filter(u => {
    const matchesSearch =
      u.unit_id.toLowerCase().includes(search.toLowerCase()) ||
      u.order_id.toLowerCase().includes(search.toLowerCase()) ||
      u.order_lines.toLowerCase().includes(search.toLowerCase()) ||
      u.description.toLowerCase().includes(search.toLowerCase());

    const matchesDefect = defectFilter === 'ALL' || u.defect_type === defectFilter;
    return matchesSearch && matchesDefect;
  });

  const defectTypes = ['ALL', ...Array.from(new Set(units.map(u => u.defect_type)))];

  return (
    <div className="rounded-[32px] neu-flat p-6 sm:p-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <span>Standardized Held-Out Benchmark Dataset</span>
            <span className="text-[11px] neu-pressed-sm px-2.5 py-0.5 rounded-full font-mono text-[#773C30] dark:text-[#6BFF86]">
              {units.length} Standardized Units
            </span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Ground-truth labeled test suite evaluated across multi-channel carton packing configurations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={downloadJSON}
            className="px-3.5 py-2 rounded-xl neu-flat-sm hover:neu-flat-hover text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 transition-all"
            title="Download full benchmark set as JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-blue-600" />
            <span>Download JSON</span>
          </button>

          <button
            type="button"
            onClick={downloadCSV}
            className="px-3.5 py-2 rounded-xl neu-flat-sm hover:neu-flat-hover text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 transition-all"
            title="Download full benchmark set as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-3.5 py-2 rounded-xl neu-btn-primary text-xs font-bold text-white flex items-center gap-1.5 transition-all"
          >
            {isOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isOpen ? 'Hide Dataset' : 'View 50 Units'}</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-4 pt-2 border-t border-[var(--neu-border-color)]">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search unit, item, description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3.5 py-2 pl-9 rounded-xl neu-pressed-sm text-xs font-medium focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Defect:</span>
              {defectTypes.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDefectFilter(d)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    defectFilter === d
                      ? 'neu-btn-primary text-white'
                      : 'neu-pressed-sm text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl neu-pressed-sm p-3 overflow-x-auto max-h-96">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[var(--neu-border-color)] text-slate-500 dark:text-slate-400">
                  <th className="py-2 px-2 font-bold">Unit ID</th>
                  <th className="py-2 px-2 font-bold">Order ID</th>
                  <th className="py-2 px-2 font-bold">Channel</th>
                  <th className="py-2 px-2 font-bold">Expected Order Items</th>
                  <th className="py-2 px-2 font-bold">Defect Class</th>
                  <th className="py-2 px-2 font-bold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y border-[var(--neu-border-color)]">
                {filteredUnits.map(u => (
                  <tr key={u.unit_id} className="hover:bg-slate-500/5">
                    <td className="py-2 px-2 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {u.unit_id}
                    </td>
                    <td className="py-2 px-2 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {u.order_id}
                    </td>
                    <td className="py-2 px-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md neu-flat-sm font-semibold uppercase">
                        {u.channel}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-mono text-[11px] text-slate-700 dark:text-slate-200">
                      {u.order_lines}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.defect_type === 'none'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : u.defect_type.startsWith('ambiguous')
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {u.defect_type}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-slate-600 dark:text-slate-300 text-[11px]">
                      {u.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-[11px] text-slate-500 font-medium text-right">
            Showing {filteredUnits.length} of {units.length} units
          </div>
        </div>
      )}
    </div>
  );
}
