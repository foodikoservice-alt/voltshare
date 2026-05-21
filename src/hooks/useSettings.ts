import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSettings() {
  const [unitRate, setUnitRate] = useState<number>(14);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'unit_rate')
          .single();

        if (!error && data && data.value != null) {
          const parsed = parseFloat(data.value);
          if (!isNaN(parsed)) setUnitRate(parsed);
        }
      } catch (err) {
        console.error('Error fetching unit rate:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  return { unitRate, loading };
}
