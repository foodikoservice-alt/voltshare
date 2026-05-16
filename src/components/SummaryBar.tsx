import React from 'react';
import type { GrandTotals } from '../types/app.types';
import { formatUnits, formatCost } from '../utils/formatters';
import { Zap, IndianRupee, Moon, Clock } from 'lucide-react';

interface SummaryBarProps {
  totals: GrandTotals;
}

const StatCard = ({ label, value, icon: Icon, color, shadowColor, glowColor }: { label: string; value: string | number; icon: any; color: string; shadowColor: string; glowColor: string }) => (
  <div className="relative overflow-hidden glass rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4 transition-all hover:scale-[1.02] hover:bg-surface-card group">
    <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40 ${glowColor}`} />
    <div className={`relative z-10 p-2 sm:p-2.5 rounded-xl ${color} shadow-lg ${shadowColor} transition-transform group-hover:scale-110 shrink-0`}>
      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-on-primary" />
    </div>
    <div className="relative z-10 min-w-0">
      <p className="text-[9px] sm:text-[10px] text-muted uppercase font-black tracking-widest leading-none mb-1 truncate">{label}</p>
      <p className="text-lg sm:text-xl font-black tracking-tight text-ink truncate">{value}</p>
    </div>
  </div>
);

export const SummaryBar: React.FC<SummaryBarProps> = ({ totals }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      <StatCard
        label="Total Units"
        value={formatUnits(totals.total_units)}
        icon={Zap}
        color="bg-primary"
        shadowColor="neon-glow-primary"
        glowColor="bg-primary"
      />
      <StatCard
        label="Total Cost"
        value={formatCost(totals.total_cost)}
        icon={IndianRupee}
        color="bg-secondary"
        shadowColor="neon-glow-secondary"
        glowColor="bg-secondary"
      />
      <StatCard
        label="Night (Auto)"
        value={totals.night_auto_count}
        icon={Moon}
        color="bg-indigo"
        shadowColor="neon-glow-indigo"
        glowColor="bg-indigo"
      />
      <StatCard
        label="Pending"
        value={totals.open_count}
        icon={Clock}
        color="bg-tertiary"
        shadowColor="shadow-tertiary/20"
        glowColor="bg-tertiary"
      />
    </div>
  );
};
