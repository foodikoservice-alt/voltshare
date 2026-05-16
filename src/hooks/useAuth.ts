import { useState, useCallback } from 'react';
import type { Role } from '../types/app.types';
import { supabase } from '../lib/supabase';

interface AuthState {
  role: Role | null;
  username: string | null;
  isEditor: boolean;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    role: localStorage.getItem('volt_role') as Role | null,
    username: localStorage.getItem('volt_username'),
    isEditor: localStorage.getItem('volt_role') === 'editor',
    loading: false,
  });

  const login = useCallback(async (username: string, passcode: string) => {
    setState(s => ({ ...s, loading: true }));
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('role')
        .eq('username', username)
        .eq('passcode', passcode)
        .single();

      if (error || !data) {
        return false;
      }

      const role = data.role as Role;
      localStorage.setItem('volt_role', role);
      localStorage.setItem('volt_username', username);
      
      setState({
        role,
        username,
        isEditor: role === 'editor',
        loading: false,
      });
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setState(s => ({ ...s, loading: false }));
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('volt_role');
    localStorage.removeItem('volt_username');
    setState({
      role: null,
      username: null,
      isEditor: false,
      loading: false,
    });
  }, []);

  return {
    ...state,
    login,
    logout,
  };
}

