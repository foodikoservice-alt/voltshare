import { useState, useEffect } from 'react';
import type { Member } from '../types/app.types';
import { supabase } from '../lib/supabase';

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('name');

        if (error) throw error;
        setMembers(data || []);
      } catch (err) {
        console.error('Error fetching members:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, []);

  return { members, loading };
}

