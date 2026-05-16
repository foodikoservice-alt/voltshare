import type { MeterEntry } from '../types/app.types';
import { formatTimestamp } from '../utils/formatters';

interface OpenDayEntryCardProps {
  entry: MeterEntry;
  selected: boolean;
  onClick: () => void;
}

export function OpenDayEntryCard({ entry, selected, onClick }: OpenDayEntryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all min-h-[44px] active:scale-[0.98] ${
        selected
          ? 'border-primary/50 bg-primary/10'
          : 'border-white/5 bg-surface-container-low hover:border-white/10'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="badge badge-amber">Day Shift — Open</span>
          {entry.is_weekend && (
            <span className="badge badge-blue">Weekend</span>
          )}
        </div>
        {selected && <span className="text-primary text-lg font-bold">✓</span>}
      </div>
      <p className="text-sm font-bold text-slate-100 mt-2">Opening Meter: {entry.start_meter}</p>
      <p className="text-[11px] text-text-muted font-medium mt-0.5">{formatTimestamp(entry.opening_at)}</p>
    </button>
  );
}
