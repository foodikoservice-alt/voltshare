import { createContext, useContext, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types/app.types';

interface AuthState {
  role: Role | null;
  username: string | null;
  isEditor: boolean;
  loading: boolean;
  login: (username: string, passcode: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>(null!);

export const useAuthContext = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
