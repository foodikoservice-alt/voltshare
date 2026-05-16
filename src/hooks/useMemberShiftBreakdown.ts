import { useState, useEffect, useCallback, useRef } from 'react';
import type { Member } from '../types/app.types';
import { supabase } from '../lib/supabase';

export interface MemberShiftBreakdown {
  member: Member;
  total_units: number;
  day_units: number;
  night_units: number;
  total_cost: number;
  day_cost: number;
  night_cost: number;
}

export function useMemberShiftBreakdown(members: Member[]) {
  const [breakdown, setBreakdown] = useState<MemberShiftBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const membersRef = useRef(members);
  useEffect(() => { membersRef.current = members; }, [members]);

  const fetch = useCallback(async () => {
    const currentMembers = membersRef.current;
    if (currentMembers.length === 0) return;
    try {
      const { data, error } = await supabase
        .from('member_usage')
        .select('member_id, units, cost, meter_entries(entry_type)');

      if (error) throw error;

      // Aggregate by member + shift type
      const map = new Map<string, { day_u: number; night_u: number; day_c: number; night_c: number }>();

      data?.forEach((row: {
        member_id: string;
        units: number;
        cost: number;
        meter_entries: { entry_type: string } | { entry_type: string }[] | null;
      }) => {
        const cur = map.get(row.member_id) ?? { day_u: 0, night_u: 0, day_c: 0, night_c: 0 };
        // Supabase may return meter_entries as a single object (many-to-one) or array
        const entryTypeRaw = Array.isArray(row.meter_entries)
          ? row.meter_entries[0]?.entry_type
          : (row.meter_entries as { entry_type: string } | null)?.entry_type;
        const isDay = entryTypeRaw === 'day_shift';
        map.set(row.member_id, {
          day_u:   cur.day_u   + (isDay ? Number(row.units) : 0),
          night_u: cur.night_u + (isDay ? 0 : Number(row.units)),
          day_c:   cur.day_c   + (isDay ? Number(row.cost)  : 0),
          night_c: cur.night_c + (isDay ? 0 : Number(row.cost)),
        });
      });

      const result: MemberShiftBreakdown[] = currentMembers.map(member => {
        const s = map.get(member.id) ?? { day_u: 0, night_u: 0, day_c: 0, night_c: 0 };
        return {
          member,
          day_units:   parseFloat(s.day_u.toFixed(1)),
          night_units: parseFloat(s.night_u.toFixed(1)),
          total_units: parseFloat((s.day_u + s.night_u).toFixed(1)),
          day_cost:    parseFloat(s.day_c.toFixed(2)),
          night_cost:  parseFloat(s.night_c.toFixed(2)),
          total_cost:  parseFloat((s.day_c + s.night_c).toFixed(2)),
        };
      });

      result.sort((a, b) => {
        if (a.member.shift_type !== b.member.shift_type)
          return a.member.shift_type === 'day' ? -1 : 1;
        return a.member.name.localeCompare(b.member.name);
      });

      setBreakdown(result);
    } catch (err) {
      console.error('Error fetching shift breakdown:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (members.length === 0) return;
    setLoading(true);
    fetch();
  }, [members, fetch]);

  // Realtime refresh
  useEffect(() => {
    const ch = supabase
      .channel('shift_breakdown_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'member_usage' },
        () => setTimeout(() => fetch(), 300)
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetch]);

  return { breakdown, loading };
}
