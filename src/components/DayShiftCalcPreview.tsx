import { calculateUsage, calculatePerPerson, calculateCost } from '../utils/calculations';
import { formatUnits, formatCost } from '../utils/formatters';

interface DayShiftCalcPreviewProps {
  openingMeter: number;
  closingMeter: number | null;
  isWeekend: boolean;
}

export function DayShiftCalcPreview({ openingMeter, closingMeter, isWeekend }: DayShiftCalcPreviewProps) {
  const valid = closingMeter !== null && closingMeter > openingMeter;
  const usage = valid ? calculateUsage(openingMeter, closingMeter!) : 0;
  const perPerson = valid ? calculatePerPerson(usage, 'day_shift', isWeekend) : 0;
  const cost = valid ? calculateCost(perPerson) : 0;

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-2">
      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
        Day Shift — Usage Preview
      </p>
      <div className="grid grid-cols-2 gap-y-1.5 text-sm">
        <span className="text-emerald-400/80">Opening Meter</span>
        <span className="font-bold text-right text-slate-100">{openingMeter}</span>
        <span className="text-emerald-400/80">Closing Meter</span>
        <span className="font-bold text-right text-slate-100">{closingMeter ?? '—'}</span>
        <span className="text-emerald-400/80">Day Usage</span>
        <span className="font-bold text-right text-slate-100">{valid ? formatUnits(usage) : '—'}</span>
        <span className="text-emerald-400/80">Split</span>
        <span className="font-bold text-right text-slate-100">{isWeekend ? '÷ 4 members' : '÷ 3 day members'}</span>
        <span className="text-emerald-400/80">Per person</span>
        <span className="font-bold text-right text-slate-100">{valid ? formatUnits(perPerson) : '—'}</span>
        <span className="text-emerald-400 font-bold">Cost / person</span>
        <span className="font-bold text-right text-emerald-400">{valid ? formatCost(cost) : '—'}</span>
      </div>
    </div>
  );
}
