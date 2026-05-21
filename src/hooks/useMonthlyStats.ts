import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface MonthlyStats {
  month: string;       // "YYYY-MM"
  label: string;       // "Jan '26"
  day_units: number;
  night_units: number;
  total_units: number;
  day_cost: number;
  night_cost: number;
  total_cost: number;
  building_day_cost: number;
  building_night_cost: number;
}

/** Convert a UTC ISO string → IST (UTC+5:30) YYYY-MM key */
function toMonthKey(isoDate: string): string {
  const d = new Date(isoDate);
  d.setMinutes(d.getMinutes() + 330); // +5h 30m for IST
  return d.toISOString().slice(0, 7);
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-');
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
}

export function useMonthlyStats() {
  const [months, setMonths] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('member_usage')
        .select('units, cost, member_id, meter_entries(entry_type, opening_at), members(shift_type)');

      if (error) throw error;

      // Map to store per-member totals per month
      const monthMemberTotals = new Map<string, {
        dayUnits: Map<string, number>,
        nightUnits: Map<string, number>,
        dayCost: Map<string, number>,
        nightCost: Map<string, number>,
        b_day_c: number,
        b_night_c: number,
      }>();

      (data ?? []).forEach((row: { cost: string | number; units: string | number; member_id: string; meter_entries: unknown; members: unknown; }) => {
        const entry = Array.isArray(row.meter_entries) ? (row.meter_entries as Record<string, unknown>[])[0] : (row.meter_entries as Record<string, unknown>);
        const member = Array.isArray(row.members) ? (row.members as Record<string, unknown>[])[0] : (row.members as Record<string, unknown>);
        if (!entry?.opening_at || !member) return;

        const key = toMonthKey(entry.opening_at as string);
        if (!monthMemberTotals.has(key)) {
          monthMemberTotals.set(key, {
            dayUnits: new Map(),
            nightUnits: new Map(),
            dayCost: new Map(),
            nightCost: new Map(),
            b_day_c: 0,
            b_night_c: 0,
          });
        }
        const monthStats = monthMemberTotals.get(key)!;

        // Building totals based on entry type
        const isDayShift = entry.entry_type === 'day_shift';
        if (isDayShift) {
          monthStats.b_day_c += Number(row.cost);
        } else {
          monthStats.b_night_c += Number(row.cost);
        }

        // Per-person totals based on member's shift type
        const isDayMember = member.shift_type === 'day';
        const unitsMap = isDayMember ? monthStats.dayUnits : monthStats.nightUnits;
        const costMap = isDayMember ? monthStats.dayCost : monthStats.nightCost;

        unitsMap.set(row.member_id, (unitsMap.get(row.member_id) ?? 0) + Number(row.units));
        costMap.set(row.member_id, (costMap.get(row.member_id) ?? 0) + Number(row.cost));
      });

      const getMax = (map: Map<string, number>) => {
        let max = 0;
        for (const val of map.values()) {
          if (val > max) max = val;
        }
        return max;
      };

      // Sort months newest first to match history table
      const sorted = Array.from(monthMemberTotals.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([key, stats]) => {
          const maxDayUnits = getMax(stats.dayUnits);
          const maxNightUnits = getMax(stats.nightUnits);
          const maxDayCost = getMax(stats.dayCost);
          const maxNightCost = getMax(stats.nightCost);

          return {
            month:       key,
            label:       formatMonthLabel(key),
            day_units:   parseFloat(maxDayUnits.toFixed(2)),
            night_units: parseFloat(maxNightUnits.toFixed(2)),
            total_units: parseFloat((maxDayUnits + maxNightUnits).toFixed(2)),
            day_cost:    parseFloat(maxDayCost.toFixed(2)),
            night_cost:  parseFloat(maxNightCost.toFixed(2)),
            total_cost:  parseFloat((maxDayCost + maxNightCost).toFixed(2)),
            building_day_cost: parseFloat(stats.b_day_c.toFixed(2)),
            building_night_cost: parseFloat(stats.b_night_c.toFixed(2)),
          };
        });

      setMonths(sorted);
    } catch (err) {
      console.error('Error fetching monthly stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Realtime refresh
  useEffect(() => {
    let pending: ReturnType<typeof setTimeout>;
    const ch = supabase
      .channel('monthly_stats_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'member_usage' },
        () => {
          clearTimeout(pending);
          pending = setTimeout(() => fetch(), 300);
        }
      )
      .subscribe();
    return () => { 
      clearTimeout(pending);
      supabase.removeChannel(ch); 
    };
  }, [fetch]);

  return { months, loading };
}
