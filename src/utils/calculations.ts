import type { EntryType, MeterEntry, Member, GrandTotals } from '../types/app.types';

export const DEFAULT_COST_PER_UNIT = 14;

export function getSplitCount(entryType: EntryType, isWeekend: boolean): number {
  if (isWeekend) return 4;
  return entryType === 'day_shift' ? 3 : 1;
}

export function calculateUsage(start: number, end: number): number {
  return parseFloat((end - start).toFixed(1));
}

export function calculatePerPerson(usage: number, entryType: EntryType, isWeekend: boolean): number {
  return parseFloat((usage / getSplitCount(entryType, isWeekend)).toFixed(1));
}

export function calculateCost(units: number, rate: number = DEFAULT_COST_PER_UNIT): number {
  return parseFloat((units * rate).toFixed(2));
}

export function buildMemberUsageRows(
  entry: { id: string; usage_units: number; entry_type: EntryType; is_weekend: boolean },
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
    usage_month: getISTMonthKey(new Date().toISOString())
  }));
}

/** Get IST-aware YYYY-MM month key */
export function getISTMonthKey(isoDate: string): string {
  const d = new Date(isoDate);
  d.setMinutes(d.getMinutes() + 330);
  return d.toISOString().slice(0, 7);
}

export function calculateGrandTotals(entries: MeterEntry[], rate: number = DEFAULT_COST_PER_UNIT): GrandTotals {
  const closed    = entries.filter(e => e.status === 'closed');
  const open      = entries.filter(e => e.status === 'open');
  const nightAuto = entries.filter(e => e.is_auto);
  const total_units = parseFloat(
    closed.reduce((s, e) => s + (e.usage_units ?? 0), 0).toFixed(1)
  );
  return {
    total_units,
    total_cost: parseFloat((total_units * rate).toFixed(2)),
    entry_count: closed.length,
    open_count: open.length,
    night_auto_count: nightAuto.length,
  };
}

export function calculateNightPreview(
  prevClosingMeter: number | null,
  nextOpeningMeter: number
): { night_units: number | null; night_cost: number | null } {
  if (prevClosingMeter === null || isNaN(nextOpeningMeter)) {
    return { night_units: null, night_cost: null };
  }
  const night_units = calculateUsage(prevClosingMeter, nextOpeningMeter);
  if (night_units <= 0) return { night_units: null, night_cost: null };
  return {
    night_units,
    night_cost: calculateCost(night_units, DEFAULT_COST_PER_UNIT),
  };
}
