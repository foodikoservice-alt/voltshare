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
        .select('units, cost, meter_entries(entry_type, opening_at)');

      if (error) throw error;

      const map = new Map<string, { day_u: number; night_u: number; day_c: number; night_c: number }>();

      (data ?? []).forEach((row: {
        units: number;
        cost: number;
        meter_entries: { entry_type: string; opening_at: string } | { entry_type: string; opening_at: string }[] | null;
      }) => {
        const entry = Array.isArray(row.meter_entries)
          ? row.meter_entries[0]
          : row.meter_entries;

        if (!entry?.opening_at) return;

        const key = toMonthKey(entry.opening_at);
        const cur = map.get(key) ?? { day_u: 0, night_u: 0, day_c: 0, night_c: 0 };
        const isDay = entry.entry_type === 'day_shift';

        map.set(key, {
          day_u:   cur.day_u   + (isDay ? Number(row.units) : 0),
          night_u: cur.night_u + (isDay ? 0 : Number(row.units)),
          day_c:   cur.day_c   + (isDay ? Number(row.cost)  : 0),
          night_c: cur.night_c + (isDay ? 0 : Number(row.cost)),
        });
      });

      // Sort months newest first to match history table
      const sorted = Array.from(map.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([key, s]) => ({
          month:       key,
          label:       formatMonthLabel(key),
          day_units:   parseFloat(s.day_u.toFixed(1)),
          night_units: parseFloat(s.night_u.toFixed(1)),
          total_units: parseFloat((s.day_u + s.night_u).toFixed(1)),
          day_cost:    parseFloat(s.day_c.toFixed(2)),
          night_cost:  parseFloat(s.night_c.toFixed(2)),
          total_cost:  parseFloat((s.day_c + s.night_c).toFixed(2)),
        }));

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
    const ch = supabase
      .channel('monthly_stats_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'member_usage' },
        () => setTimeout(() => fetch(), 300)
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetch]);

  return { months, loading };
}
