import React from 'react';
import { LogOut, Zap, Sun, Moon, ShieldCheck } from 'lucide-react';
import type { Role } from '../types/app.types';
import { formatUnits, formatCost } from '../utils/formatters';

interface HeaderProps {
  role: Role | null;
  totalUnits: number;
  totalCost: number;
  dark: boolean;
  onToggleDark: () => void;
  onLogout: () => void;
  onEditorLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  role,
  totalUnits,
  totalCost,
  dark,
  onToggleDark,
  onLogout,
  onEditorLogin,
}) => {
  const isEditor = role === 'editor';

  return (
    <header className="sticky top-0 z-30 glass-sm border-b border-white/5 px-3 sm:px-4 py-2.5 sm:py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-3">

        {/* Logo + mobile totals */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-primary p-1.5 sm:p-2 rounded-xl shadow-lg shadow-primary/20 animate-bounce-subtle shrink-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight">VoltShare</h1>
            {/* Show mini totals on mobile only */}
            <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider leading-tight sm:hidden truncate">
              {formatUnits(totalUnits)} • {formatCost(totalCost)}
            </p>
          </div>
        </div>

        {/* Desktop totals */}
        <div className="hidden sm:flex items-center gap-4 lg:gap-6 text-sm">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Total Usage</span>
            <span className="font-bold text-primary-light">{formatUnits(totalUnits)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Grand Total</span>
            <span className="font-bold text-primary-light">{formatCost(totalCost)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={onToggleDark}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-muted hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {isEditor ? (
            <>
              <span className="badge hidden xs:inline-flex badge-amber">editor</span>
              <button
                onClick={onLogout}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-muted hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={onEditorLogin}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary-light text-[11px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 min-h-[44px]"
              title="Editor sign in"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">Editor Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
