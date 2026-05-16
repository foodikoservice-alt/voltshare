import React, { useState } from 'react';
import { Zap, Lock, User as UserIcon, Loader2 } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string, passcode: string) => Promise<boolean>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !passcode) return;
    
    setError('');
    setLoading(true);
    const success = await onLogin(username, passcode);
    if (!success) {
      setError('Invalid username or passcode');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[400px] z-10 px-0">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary p-3 rounded-2xl shadow-xl shadow-primary/20 mb-4 animate-bounce-subtle">
            <Zap className="w-8 h-8 text-on-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-ink">VoltShare</h1>
          <p className="text-muted font-medium mt-1">Electricity Usage Management</p>
        </div>

        <div className="glass-lg rounded-2xl sm:rounded-3xl p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Username</label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                <input 
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-hairline rounded-2xl pl-11 pr-4 py-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-surface-container-low transition-all placeholder:text-muted-soft text-ink"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Passcode</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                <input 
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-hairline rounded-2xl pl-11 pr-4 py-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-surface-container-low tracking-[0.5em] transition-all placeholder:text-muted-soft text-ink"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-[11px] font-bold text-center animate-in shake duration-300">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-4 text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Secure Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-muted-soft text-xs mt-8 font-medium">
          Secure Access • Property Management Tool
        </p>
      </div>
    </div>
  );
};

