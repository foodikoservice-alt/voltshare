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
    if (currentMembers.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const query = supabase
        .from('member_usage')
        .select('member_id, units, cost');
      
      const currentMonth = monthRef.current;
      
      // Try server-side filtering first
      // eslint-disable-next-line prefer-const
      let { data, error } = await (currentMonth 
        ? query.eq('usage_month', currentMonth) 
        : query);

      // FALLBACK: If usage_month column doesn't exist yet (Postgres error 42703 or specific message)
      const isMissingColumn = error && (
        error.code === '42703' || 
        error.message?.includes('usage_month') || 
        error.message?.includes('column "usage_month" does not exist')
      );

      if (isMissingColumn) {
        console.warn('Database column "usage_month" missing. Falling back to client-side filtering. Please run the migration SQL.');
        const { data: allData, error: allErr } = await supabase
          .from('member_usage')
          .select('member_id, units, cost, meter_entries(opening_at)');
        
        if (allErr) throw allErr;

        /** Convert UTC ISO string → IST (UTC+5:30) YYYY-MM key */
        const toMonthKey = (isoDate: string): string => {
          const d = new Date(isoDate);
          d.setMinutes(d.getMinutes() + 330);
          return d.toISOString().slice(0, 7);
        };

        data = (allData ?? []).filter((usage: Record<string, unknown>) => {
          if (!currentMonth) return true;
          const usageEntries = usage.meter_entries as Record<string, unknown> | Record<string, unknown>[];
          const entry = Array.isArray(usageEntries) ? usageEntries[0] : usageEntries;
          return entry?.opening_at && toMonthKey(entry.opening_at as string) === currentMonth;
        });
      } else if (error) {
        throw error;
      }

      const memberMap = new Map<string, { units: number; cost: number }>();

      (data ?? []).forEach((usage: Record<string, unknown>) => {
        const memberId = usage.member_id as string;
        const current = memberMap.get(memberId) || { units: 0, cost: 0 };
        memberMap.set(memberId, {
          units: current.units + Number(usage.units),
          cost: current.cost + Number(usage.cost),
        });
      });

      const memberTotals: MemberTotal[] = currentMembers.map(member => {
        const stats = memberMap.get(member.id) || { units: 0, cost: 0 };
        return {
          member,
          total_units: parseFloat(stats.units.toFixed(2)),
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
    let pending: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel('member_usage_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'member_usage' },
        () => {
          clearTimeout(pending);
          pending = setTimeout(() => calculateTotals(), 300);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(pending);
      supabase.removeChannel(channel);
    };
  }, [calculateTotals]); // calculateTotals is stable (no deps), so this runs once

  return { totals, loading, refresh: calculateTotals };
}
