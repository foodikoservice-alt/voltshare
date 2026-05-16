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
    role: null,
    username: null,
    isEditor: false,
    loading: false,
  });

  const login = useCallback(async (username: string, passcode: string) => {
    // Basic input validation to reject clearly malformed credentials
    const usernameValid = /^[a-zA-Z0-9_]{3,30}$/.test(username);
    const passcodeValid = /^[0-9]{4,6}$/.test(passcode);
    if (!usernameValid || !passcodeValid) {
      console.warn('Login attempt with invalid input format');
      return false;
    }
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

