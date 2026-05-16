import React from 'react';
import type { MeterEntry, Role } from '../types/app.types';
import { formatUnits, formatCost, formatTimestamp } from '../utils/formatters';
import { getSplitCount, COST_PER_UNIT } from '../utils/calculations';
import { Trash2, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface HistoryTableProps {
  entries: MeterEntry[];
  role: Role | null;
  onDelete: (id: string) => Promise<void>;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ entries, role, onDelete }) => {
  const isEditor = role === 'editor';

  const sortedEntries = [...entries].sort((a, b) => {
    if (a.status === 'open' && b.status !== 'open') return -1;
    if (a.status !== 'open' && b.status === 'open') return 1;
    return 0;
  });

  if (entries.length === 0) {
    return (
      <div className="glass-lg rounded-3xl p-8 sm:p-12 text-center border-dashed bg-surface-container-lowest/30">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-xl border border-hairline">
          <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-muted-soft" />
        </div>
        <h3 className="text-base sm:text-lg font-black text-ink tracking-tight">No History Records</h3>
        <p className="text-sm text-muted mt-2 max-w-xs mx-auto font-medium">
          Start adding meter readings to see your electricity consumption patterns here.
        </p>
      </div>
    );
  }

  return (
      <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-muted uppercase tracking-widest">Entry History</h2>
        <span className="text-xs text-muted font-medium">{entries.length} total</span>
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        {/* ── Desktop table (md+) ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-hairline bg-surface-container-low/50">
                <th className="px-5 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Status</th>
                <th className="px-5 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Type</th>
                <th className="px-5 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Start</th>
                <th className="px-5 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">End</th>
                <th className="px-5 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Usage</th>
                <th className="px-5 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Cost/Person</th>
                {isEditor && <th className="px-5 py-4 text-[10px] font-bold text-muted uppercase tracking-widest text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {sortedEntries.map((entry) => {
                const splitCount = getSplitCount(entry.entry_type, entry.is_weekend);
                const perPersonCost = entry.usage_units ? (entry.usage_units / splitCount) * COST_PER_UNIT : 0;
                return (
                  <tr key={entry.id} className={`hover:bg-ink/[0.02] transition-colors group ${entry.status === 'open' ? 'bg-tertiary/5' : ''}`}>
                    <td className="px-5 py-4">
                      {entry.status === 'open' ? (
                        <div className="flex items-center gap-2 text-tertiary">
                          <Clock className="w-4 h-4 animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Open</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-secondary">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Closed</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        <span className={`badge ${entry.entry_type === 'day_shift' ? 'badge-amber' : 'badge-blue'}`}>
                          {entry.entry_type === 'day_shift' ? 'Day Shift' : 'Night (Auto)'}
                        </span>
                        {entry.is_auto && (
                          <span className="badge badge-blue">Auto</span>
                        )}
                        {entry.is_weekend && (
                          <span className="badge badge-purple">Weekend</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-bold text-ink">{entry.start_meter}</div>
                      <div className="text-[10px] text-muted font-bold">{formatTimestamp(entry.opening_at)}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-bold text-ink">{entry.end_meter ?? '—'}</div>
                      <div className="text-[10px] text-muted font-bold">{entry.closing_at ? formatTimestamp(entry.closing_at) : '—'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-black text-ink">{entry.usage_units ? formatUnits(entry.usage_units) : '—'}</div>
                      <div className="text-[10px] text-muted font-bold">÷{splitCount}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-black text-primary">{entry.status === 'closed' ? formatCost(perPersonCost) : '—'}</div>
                    </td>
                    {isEditor && (
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => onDelete(entry.id)}
                          className="p-2 text-muted-soft hover:text-error hover:bg-error/10 rounded-xl transition-all min-h-[44px] min-w-[44px]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Mobile cards (< md) ── */}
        <div className="md:hidden divide-y divide-hairline">
          {sortedEntries.map((entry) => {
            const splitCount = getSplitCount(entry.entry_type, entry.is_weekend);
            const perPersonCost = entry.usage_units ? (entry.usage_units / splitCount) * COST_PER_UNIT : 0;
            const isOpen = entry.status === 'open';

            return (
              <div
                key={entry.id}
                className={`p-4 space-y-3 transition-colors ${isOpen ? 'bg-tertiary/5' : 'hover:bg-ink/[0.02]'}`}
              >
                {/* Row 1: badges + delete */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`badge ${entry.entry_type === 'day_shift' ? 'badge-amber' : 'badge-blue'}`}>
                      {entry.entry_type === 'day_shift' ? 'Day Shift' : 'Night (Auto)'}
                    </span>
                    {isOpen ? (
                      <span className="badge badge-amber flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 animate-pulse" /> Open
                      </span>
                    ) : (
                      <span className="badge badge-green flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Closed
                      </span>
                    )}
                    {entry.is_auto && <span className="badge badge-blue">Auto</span>}
                    {entry.is_weekend && <span className="badge badge-purple">Weekend</span>}
                  </div>
                  {isEditor && (
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="text-muted-soft hover:text-error hover:bg-error/10 p-2 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Row 2: meter reading → arrow → end + cost */}
                <div className="flex items-center justify-between gap-3">
                  {/* Meter readings */}
                  <div className="min-w-0">
                    <p className="text-[9px] text-muted uppercase font-bold tracking-widest mb-1">Meter Reading</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-ink">{entry.start_meter}</span>
                      <ArrowRight className="w-3 h-3 text-muted-soft shrink-0" />
                      <span className={`text-sm font-bold ${entry.end_meter ? 'text-ink' : 'text-muted-soft'}`}>
                        {entry.end_meter ?? '···'}
                      </span>
                    </div>
                    <p className="text-[9px] text-muted font-medium mt-0.5">{formatTimestamp(entry.opening_at)}</p>
                  </div>

                  {/* Cost / status */}
                  <div className="text-right shrink-0">
                    {entry.status === 'closed' ? (
                      <>
                        <p className="text-[9px] text-muted uppercase font-bold tracking-widest mb-0.5">Cost / Person</p>
                        <p className="text-base font-black text-primary">{formatCost(perPersonCost)}</p>
                        <p className="text-[9px] text-muted font-bold">{formatUnits(entry.usage_units!)} ÷{splitCount}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[9px] text-muted uppercase font-bold tracking-widest mb-1">Status</p>
                        <p className="text-xs text-tertiary font-bold italic">Awaiting Closing</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
