import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { MeterEntry, OpeningMeterFormData, Member } from '../types/app.types';
import { supabase } from '../lib/supabase';
import { calculateUsage, buildMemberUsageRows } from '../utils/calculations';

export function useMeterEntries(members: Member[]) {
  const [entries, setEntries] = useState<MeterEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Keep a stable ref so async callbacks always read the latest members list
  // without needing to be re-created every time members changes.
  const membersRef = useRef<Member[]>(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  const fetchEntries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('meter_entries')
        .select('*')
        .order('opening_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching entries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();

    const channel = supabase
      .channel('meter_entries_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meter_entries' }, () => {
        fetchEntries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEntries]);

  const openDayEntries = useMemo(
    () => entries.filter(e => e.entry_type === 'day_shift' && e.status === 'open'),
    [entries]
  );

  const closedEntries = useMemo(
    () => entries.filter(e => e.status === 'closed'),
    [entries]
  );

  const lastClosedDay = useMemo(
    () => entries.find(
      e => e.entry_type === 'day_shift' && e.status === 'closed'
    ),
    [entries]
  );

  const addOpeningMeter = async (formData: OpeningMeterFormData, rate: number = 14) => {
    const opening = parseFloat(formData.opening_meter);

    const { data: allEntries, error: fetchErr } = await supabase
      .from('meter_entries')
      .select('*')
      .order('opening_at', { ascending: false });

    if (fetchErr) throw fetchErr;

    const lastClosed = allEntries?.find(
      e => e.entry_type === 'day_shift' && e.status === 'closed'
    );
    const alreadyHasNight = allEntries?.some(
      e => e.entry_type === 'night_shift' && Math.abs(e.start_meter - (lastClosed?.end_meter || 0)) < 0.01
    );

    let nightEntryCreated = false;
    let nightUnits = 0;
    let createdNightEntryId: string | null = null;

    if (lastClosed && !alreadyHasNight) {
      const prevClosing = Number(lastClosed.end_meter);
      const units = calculateUsage(prevClosing, opening);

      if (units > 0) {
        const prevDate = new Date(lastClosed.closing_at || new Date().toISOString());
        const isNightWeekend = prevDate.getDay() === 0 || prevDate.getDay() === 6;

        const { data: nightEntry, error: nightErr } = await supabase
          .from('meter_entries')
          .insert({
            entry_type: 'night_shift',
            is_auto: true,
            is_weekend: isNightWeekend,
            status: 'closed',
            start_meter: prevClosing,
            end_meter: opening,
            usage_units: units,
            opening_at: lastClosed.closing_at || new Date().toISOString(),
            closing_at: new Date().toISOString(),
            rate_per_unit: rate,
          })
          .select()
          .single();

        if (nightErr) throw nightErr;
        createdNightEntryId = nightEntry.id;

        const nightRows = buildMemberUsageRows(
          { id: nightEntry.id, usage_units: units, entry_type: 'night_shift', is_weekend: isNightWeekend, opening_at: nightEntry.opening_at, rate_per_unit: rate },
          membersRef.current
        );
        const { error: usageErr } = await supabase.from('member_usage').insert(nightRows);
        
        if (usageErr) {
          await supabase.from('meter_entries').delete().eq('id', nightEntry.id);
          throw usageErr;
        }

        nightEntryCreated = true;
        nightUnits = units;
      }
    }

    const { error } = await supabase
      .from('meter_entries')
      .insert({
        entry_type: 'day_shift',
        is_auto: false,
        is_weekend: formData.is_weekend,
        status: 'open',
        start_meter: opening,
        opening_at: new Date().toISOString(),
        notes: formData.notes || null,
        rate_per_unit: rate,
      });

    if (error) {
      if (createdNightEntryId) {
        await supabase.from('meter_entries').delete().eq('id', createdNightEntryId);
      }
      throw error;
    }
    await fetchEntries();
    return { nightEntryCreated, nightUnits };
  };

  const addClosingMeter = async (openEntry: MeterEntry, closingMeter: number, rate: number = 14) => {
    const usage_units = calculateUsage(openEntry.start_meter, closingMeter);

    const { data: closed, error } = await supabase
      .from('meter_entries')
      .update({
        end_meter: closingMeter,
        usage_units,
        status: 'closed',
        closing_at: new Date().toISOString(),
        rate_per_unit: rate,
      })
      .eq('id', openEntry.id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('member_usage').delete().eq('meter_entry_id', openEntry.id);

    const rows = buildMemberUsageRows(
      { id: closed.id, usage_units, entry_type: 'day_shift', is_weekend: closed.is_weekend, opening_at: closed.opening_at, rate_per_unit: closed.rate_per_unit },
      membersRef.current
    );
    const { error: usageErr } = await supabase.from('member_usage').insert(rows);
    if (usageErr) throw usageErr;

    await fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('meter_entries').delete().eq('id', id);
    if (error) throw error;
    await fetchEntries();
  };

  return {
    entries,
    loading,
    openDayEntries,
    closedEntries,
    lastClosedDay,
    addOpeningMeter,
    addClosingMeter,
    deleteEntry,
    refresh: fetchEntries,
  };
}
