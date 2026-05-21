import { calculateNightPreview } from '../utils/calculations';
import { formatUnits, formatCost } from '../utils/formatters';

interface NightShiftPreviewProps {
  prevClosingMeter: number;
  nextOpeningMeter: number | null;
  isWeekend: boolean;
  rate: number;
}

export function NightShiftPreview({ prevClosingMeter, nextOpeningMeter, isWeekend, rate }: NightShiftPreviewProps) {
  const valid = nextOpeningMeter !== null && nextOpeningMeter > prevClosingMeter;
  const preview = valid
    ? calculateNightPreview(prevClosingMeter, nextOpeningMeter!, rate)
    : { night_units: null, night_cost: null };

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
        Night Shift — Auto Calculation Preview
      </p>
      <div className="grid grid-cols-2 gap-y-1.5 text-sm">
        <span className="text-primary/80">Prev Closing Meter</span>
        <span className="font-bold text-right text-ink">{prevClosingMeter}</span>
        <span className="text-primary/80">This Opening Meter</span>
        <span className="font-bold text-right text-ink">{nextOpeningMeter ?? '—'}</span>
        <span className="text-primary/80">Night Usage</span>
        <span className="font-bold text-right text-ink">{valid ? formatUnits(preview.night_units!) : '—'}</span>
        <span className="text-primary font-medium">{isWeekend ? 'Cost ÷ 4 members' : 'Cost (1 night member)'}</span>
        <span className="font-bold text-right text-primary">{valid ? formatCost(preview.night_cost!) : '—'}</span>
      </div>
      {valid && (
        <p className="text-[11px] text-primary/70 font-medium mt-1">
          This will be auto-created when you submit the Opening Meter
        </p>
      )}
    </div>
  );
}
