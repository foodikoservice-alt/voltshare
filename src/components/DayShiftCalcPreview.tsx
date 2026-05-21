import { calculateUsage, calculatePerPerson, calculateCost } from '../utils/calculations';
import { formatUnits, formatCost } from '../utils/formatters';

interface DayShiftCalcPreviewProps {
  openingMeter: number;
  closingMeter: number | null;
  isWeekend: boolean;
  rate: number;
}

export function DayShiftCalcPreview({ openingMeter, closingMeter, isWeekend, rate }: DayShiftCalcPreviewProps) {
  const valid = closingMeter !== null && closingMeter > openingMeter;
  const usage = valid ? calculateUsage(openingMeter, closingMeter!) : 0;
  const perPerson = valid ? calculatePerPerson(usage, 'day_shift', isWeekend) : 0;
  const cost = valid ? calculateCost(perPerson, rate) : 0;

  return (
    <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 space-y-2">
      <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">
        Day Shift — Usage Preview
      </p>
      <div className="grid grid-cols-2 gap-y-1.5 text-sm">
        <span className="text-secondary/80">Opening Meter</span>
        <span className="font-bold text-right text-ink">{openingMeter}</span>
        <span className="text-secondary/80">Closing Meter</span>
        <span className="font-bold text-right text-ink">{closingMeter ?? '—'}</span>
        <span className="text-secondary/80">Day Usage</span>
        <span className="font-bold text-right text-ink">{valid ? formatUnits(usage) : '—'}</span>
        <span className="text-secondary/80">Split</span>
        <span className="font-bold text-right text-ink">{isWeekend ? '÷ 4 members' : '÷ 3 day members'}</span>
        <span className="text-secondary/80">Per person</span>
        <span className="font-bold text-right text-ink">{valid ? formatUnits(perPerson) : '—'}</span>
        <span className="text-secondary font-bold">Cost / person</span>
        <span className="font-bold text-right text-secondary">{valid ? formatCost(cost) : '—'}</span>
      </div>
    </div>
  );
}
