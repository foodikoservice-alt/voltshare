import { useState, useEffect, useCallback, useRef } from 'react';
import type { Member, MemberTotal } from '../types/app.types';
import { supabase } from '../lib/supabase';

export function useMemberTotals(members: Member[], selectedMonth?: string) {
  const [totals, setTotals] = useState<MemberTotal[]>([]);
  const [loading, setLoading] = useState(true);

  // Keep a stable ref to members so the subscription callback always has
  // the latest value without needing to re-subscribe every time members changes.
  const membersRef = useRef<Member[]>(members);
  const monthRef = useRef<string | undefined>(selectedMonth);
  
  useEffect(() => {
    membersRef.current = members;
    monthRef.current = selectedMonth;
  }, [members, selectedMonth]);

  const calculateTotals = useCallback(async () => {
    const currentMembers = membersRef.current;
    if (currentMembers.length === 0) return;

    try {
      /** Convert UTC ISO string → IST (UTC+5:30) YYYY-MM key */
      function toMonthKey(isoDate: string): string {
        const d = new Date(isoDate);
        d.setMinutes(d.getMinutes() + 330);
        return d.toISOString().slice(0, 7);
      }

      const { data, error } = await supabase
        .from('member_usage')
        .select('member_id, units, cost, meter_entries(opening_at)');

      if (error) throw error;

      const memberMap = new Map<string, { units: number; cost: number }>();

      (data ?? []).forEach((usage: any) => {
        // Filter by month if selected
        const currentMonth = monthRef.current;
        if (currentMonth) {
          const entry = Array.isArray(usage.meter_entries) ? usage.meter_entries[0] : usage.meter_entries;
          if (!entry?.opening_at) return;
          if (toMonthKey(entry.opening_at) !== currentMonth) return;
        }

        const current = memberMap.get(usage.member_id) || { units: 0, cost: 0 };
        memberMap.set(usage.member_id, {
          units: current.units + Number(usage.units),
          cost: current.cost + Number(usage.cost),
        });
      });

      const memberTotals: MemberTotal[] = currentMembers.map(member => {
        const stats = memberMap.get(member.id) || { units: 0, cost: 0 };
        return {
          member,
          total_units: parseFloat(stats.units.toFixed(1)),
          total_cost: parseFloat(stats.cost.toFixed(2)),
        };
      });

      // Sort: day-shift first, then night-shift; within same shift sort by name
      memberTotals.sort((a, b) => {
        if (a.member.shift_type !== b.member.shift_type) {
          return a.member.shift_type === 'day' ? -1 : 1;
        }
        return a.member.name.localeCompare(b.member.name);
      });

      setTotals(memberTotals);
    } catch (err) {
      console.error('Error calculating member totals:', err);
    } finally {
      setLoading(false);
    }
  }, []); // stable — reads members via ref

  // Initial load + re-fetch whenever members list or month filter changes
  useEffect(() => {
    if (members.length === 0) return;
    setLoading(true);
    calculateTotals();
  }, [members, calculateTotals, selectedMonth]);

  // Realtime subscription: any change to member_usage triggers a re-fetch
  useEffect(() => {
    const channel = supabase
      .channel('member_usage_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'member_usage' },
        () => {
          // Small delay to let the DB transaction fully commit before reading
          setTimeout(() => calculateTotals(), 300);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [calculateTotals]); // calculateTotals is stable (no deps), so this runs once

  return { totals, loading, refresh: calculateTotals };
}
