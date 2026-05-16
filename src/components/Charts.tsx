import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { Member } from '../types/app.types';
import { useMemberShiftBreakdown } from '../hooks/useMemberShiftBreakdown';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FONT = "'Inter', system-ui, sans-serif";

// One colour per bar: Total=purple, Day=amber, Night=cyan
const BAR_COLORS = {
  bg:     ['rgba(139,92,246,0.8)', 'rgba(251,191,36,0.8)', 'rgba(6,182,212,0.8)'],
  border: ['#8b5cf6',              '#fbbf24',               '#06b6d4'],
};

const tooltipStyle = {
  backgroundColor: 'rgba(10, 6, 28, 0.95)',
  borderColor:     'rgba(139, 92, 246, 0.25)',
  borderWidth:     1,
  padding:         12,
  titleColor:      '#e2e8f0',
  bodyColor:       '#94a3b8',
  titleFont:       { family: FONT, size: 12, weight: 'bold' as const },
  bodyFont:        { family: FONT, size: 11 },
  cornerRadius:    10,
};

// ─── Single Chart Component ───────────────────────────────────────────────────

interface SimpleBarProps {
  title:         string;
  values:        [number, number, number]; // [total, day, night]
  formatTick:    (v: number | string) => string;
  formatTooltip: (v: number) => string;
}

function SimpleBar({ title, values, formatTick, formatTooltip }: SimpleBarProps) {
  const data = {
    labels: ['Total', 'Day', 'Night'],
    datasets: [
      {
        data:            values,
        backgroundColor: BAR_COLORS.bg,
        borderColor:     BAR_COLORS.border,
        borderWidth:     2,
        borderRadius:    10,
        borderSkipped:   false,
      },
    ],
  };

  const options = {
    responsive:          true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          title: (items: { label: string }[]) => items[0]?.label ?? '',
          label: (ctx: { parsed: { y: number } }) => ` ${formatTooltip(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid:   { display: false },
        border: { display: false },
        ticks:  {
          color: '#94a3b8',
          font:  { family: FONT, size: 13, weight: 'bold' as const },
        },
      },
      y: {
        grid:   { color: 'rgba(255,255,255,0.05)' },
        border: { display: false },
        ticks:  {
          color: '#475569',
          font:  { family: FONT, size: 10 },
          callback: (v: number | string) => formatTick(v),
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-surface-container p-4 sm:p-6 space-y-3 shadow-xl">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h3>
      <div style={{ height: 240 }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface ChartsProps {
  members: Member[];
}

export function Charts({ members }: ChartsProps) {
  const { breakdown, loading } = useMemberShiftBreakdown(members);

  if (loading || breakdown.length === 0) return null;

  // Grand totals across ALL members
  const totalUnits = parseFloat(breakdown.reduce((s, b) => s + b.total_units, 0).toFixed(1));
  const dayUnits   = parseFloat(breakdown.reduce((s, b) => s + b.day_units,   0).toFixed(1));
  const nightUnits = parseFloat(breakdown.reduce((s, b) => s + b.night_units, 0).toFixed(1));
  const totalCost  = parseFloat(breakdown.reduce((s, b) => s + b.total_cost,  0).toFixed(2));
  const dayCost    = parseFloat(breakdown.reduce((s, b) => s + b.day_cost,    0).toFixed(2));
  const nightCost  = parseFloat(breakdown.reduce((s, b) => s + b.night_cost,  0).toFixed(2));

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <SimpleBar
          title="Units (kWh)"
          values={[totalUnits, dayUnits, nightUnits]}
          formatTick={v => `${v}u`}
          formatTooltip={v => `${v.toFixed(1)} kWh`}
        />
        <SimpleBar
          title="Cost (₹)"
          values={[totalCost, dayCost, nightCost]}
          formatTick={v => `₹${v}`}
          formatTooltip={v => `₹${v.toFixed(2)}`}
        />
      </div>
    </section>
  );
}
