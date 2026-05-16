import React from 'react';
import type { MemberTotal } from '../types/app.types';
import { formatCost } from '../utils/formatters';
import { User, Sun, Moon } from 'lucide-react';

interface MemberCardsProps {
  memberTotals: MemberTotal[];
}

export const MemberCards: React.FC<MemberCardsProps> = ({ memberTotals }) => {
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {memberTotals.map((mt) => (
        <div 
          key={mt.member.id} 
          className="relative overflow-hidden glass rounded-2xl p-3.5 sm:p-4 transition-all hover:border-primary/30 hover:bg-surface-container-low active:scale-[0.98] cursor-default group animate-fade-in"
        >
          {/* Background Glow on Hover */}
          <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none ${
            mt.member.shift_type === 'day' ? 'bg-secondary' : 'bg-primary'
          }`} />
          
          {/* Accent bar */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5 ${
            mt.member.shift_type === 'day' ? 'bg-secondary' : 'bg-primary'
          }`} />
          
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="bg-surface-container-highest/50 p-1.5 sm:p-2 rounded-xl border border-hairline transition-transform group-hover:rotate-6">
              <User className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${mt.member.shift_type === 'day' ? 'text-secondary' : 'text-primary'}`} />
            </div>
            <div className={`badge ${
              mt.member.shift_type === 'day' ? 'badge-green' : 'badge-blue'
            } flex items-center gap-1 backdrop-blur-md`}>
              {mt.member.shift_type === 'day' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
              <span className="text-[9px] font-black">{mt.member.shift_type}</span>
            </div>
          </div>
          
          <div className="relative z-10">
            <p className="text-[9px] sm:text-xs font-black text-muted uppercase tracking-widest mb-0.5">Member</p>
            <p className="text-sm sm:text-base font-bold text-ink truncate group-hover:text-ink transition-colors" title={mt.member.name}>
              {mt.member.name}
            </p>
            
            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-hairline flex items-end justify-between">
              <div>
                <p className="text-[9px] sm:text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Usage</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg sm:text-xl font-black tracking-tight text-ink">
                    {mt.total_units.toFixed(1)}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-muted font-black uppercase tracking-widest">Units</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] sm:text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Cost</p>
                <p className={`text-xs sm:text-sm font-black ${mt.member.shift_type === 'day' ? 'text-secondary' : 'text-primary'}`}>
                  {formatCost(mt.total_cost)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
