import React, { useState, useEffect } from 'react';
import { Zap, Lock, User as UserIcon, Loader2, X } from 'lucide-react';

interface LoginModalProps {
  onLogin: (username: string, passcode: string) => Promise<boolean>;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

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
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Modal card */}
      <div className="relative w-full max-w-[400px] z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 p-2 bg-surface-container rounded-full border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all z-20"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="glass-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/5">
          {/* Header */}
          <div className="flex flex-col items-center mb-7">
            <div className="bg-primary p-3 rounded-2xl shadow-xl shadow-primary/20 mb-4 animate-bounce-subtle">
              <Zap className="w-7 h-7 text-white fill-white" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">Editor Sign In</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Enter your editor credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Username
              </label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  id="editor-username"
                  placeholder="Enter username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-primary/50 focus:bg-surface-container-low transition-all placeholder:text-slate-600"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Passcode */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Passcode
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  id="editor-passcode"
                  inputMode="numeric"
                  placeholder="••••"
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-primary/50 focus:bg-surface-container-low tracking-[0.5em] transition-all placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold text-center">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.98] transition-all mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In as Editor</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
