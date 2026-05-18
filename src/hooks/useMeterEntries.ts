import { useState, useEffect, useCallback, useMemo } from 'react';
import type { MeterEntry, OpeningMeterFormData, Member } from '../types/app.types';
import { supabase } from '../lib/supabase';
import { calculateUsage, buildMemberUsageRows } from '../utils/calculations';

export function useMeterEntries(members: Member[]) {
  const [entries, setEntries] = useState<MeterEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

    const { data: allEntries } = await supabase
      .from('meter_entries')
      .select('*')
      .order('opening_at', { ascending: false });

    const lastClosed = allEntries?.find(
      e => e.entry_type === 'day_shift' && e.status === 'closed'
    );
    const alreadyHasNight = allEntries?.some(
      e => e.entry_type === 'night_shift' && e.start_meter === lastClosed?.end_meter
    );

    let nightEntryCreated = false;
    let nightUnits = 0;

    if (lastClosed && !alreadyHasNight) {
      const prevClosing = Number(lastClosed.end_meter);
      const units = calculateUsage(prevClosing, opening);

      if (units > 0) {
        const { data: nightEntry, error: nightErr } = await supabase
          .from('meter_entries')
          .insert({
            entry_type: 'night_shift',
            is_auto: true,
            is_weekend: formData.is_weekend,
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

        const nightRows = buildMemberUsageRows(
          { id: nightEntry.id, usage_units: units, entry_type: 'night_shift', is_weekend: formData.is_weekend, rate_per_unit: rate },
          members
        );
        const { error: usageErr } = await supabase.from('member_usage').insert(nightRows);
        if (usageErr) throw usageErr;

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
        notes: 'notes' in formData ? (formData as {notes?: string}).notes || null : null,
        rate_per_unit: rate,
      });

    if (error) throw error;
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

    const rows = buildMemberUsageRows(
      { id: closed.id, usage_units, entry_type: 'day_shift', is_weekend: closed.is_weekend, rate_per_unit: closed.rate_per_unit },
      members
    );
    await supabase.from('member_usage').insert(rows);

    await fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    await supabase.from('meter_entries').delete().eq('id', id);
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
