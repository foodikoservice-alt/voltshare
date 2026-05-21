import type { EntryType, MeterEntry, Member, GrandTotals } from '../types/app.types';

export const DEFAULT_COST_PER_UNIT = 14;

export function getSplitCount(entryType: EntryType, isWeekend: boolean): number {
  if (isWeekend) return 4;
  return entryType === 'day_shift' ? 3 : 1;
}

export function calculateUsage(start: number, end: number): number {
  return end - start;
}

export function calculatePerPerson(usage: number, entryType: EntryType, isWeekend: boolean): number {
  return parseFloat((usage / getSplitCount(entryType, isWeekend)).toFixed(2));
}

export function calculateCost(units: number, rate: number = DEFAULT_COST_PER_UNIT): number {
  return parseFloat((units * rate).toFixed(2));
}

export function buildMemberUsageRows(
  entry: { id: string; usage_units: number; entry_type: EntryType; is_weekend: boolean, opening_at: string, rate_per_unit?: number | null },
  members: Member[]
) {
  let eligible: Member[];

  if (entry.is_weekend) {
    eligible = members;
  } else if (entry.entry_type === 'day_shift') {
    eligible = members.filter(m => m.shift_type === 'day');
  } else {
    eligible = members.filter(m => m.shift_type === 'night');
  }

  const perPerson = calculatePerPerson(entry.usage_units, entry.entry_type, entry.is_weekend);

  return eligible.map(m => ({
    member_id: m.id,
    meter_entry_id: entry.id,
    units: perPerson,
    usage_month: getISTMonthKey(entry.opening_at)
  }));
}

/** Get IST-aware YYYY-MM month key */
export function getISTMonthKey(isoDate: string): string {
  const d = new Date(isoDate);
  d.setMinutes(d.getMinutes() + 330);
  return d.toISOString().slice(0, 7);
}

export function calculateGrandTotals(entries: MeterEntry[], defaultRate: number = DEFAULT_COST_PER_UNIT): GrandTotals {
  const closed    = entries.filter(e => e.status === 'closed');
  const open      = entries.filter(e => e.status === 'open');
  const nightAuto = entries.filter(e => e.is_auto);
  
  let total_units = 0;
  let total_cost = 0;
  
  closed.forEach(e => {
    const units = e.usage_units ?? 0;
    const rate = e.rate_per_unit ?? defaultRate;
    total_units += units;
    total_cost += units * rate;
  });

  return {
    total_units: parseFloat(total_units.toFixed(2)),
    total_cost: parseFloat(total_cost.toFixed(2)),
    entry_count: closed.length,
    open_count: open.length,
    night_auto_count: nightAuto.length,
  };
}

export function calculateNightPreview(
  prevClosingMeter: number | null,
  nextOpeningMeter: number,
  rate: number = DEFAULT_COST_PER_UNIT
): { night_units: number | null; night_cost: number | null } {
  if (prevClosingMeter === null || isNaN(nextOpeningMeter)) {
    return { night_units: null, night_cost: null };
  }
  const night_units = calculateUsage(prevClosingMeter, nextOpeningMeter);
  if (night_units <= 0) return { night_units: null, night_cost: null };
  return {
    night_units: parseFloat(night_units.toFixed(2)),
    night_cost: calculateCost(night_units, rate),
  };
}
