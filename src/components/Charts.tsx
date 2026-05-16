import { useEffect, useState } from 'react';
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

const BAR_COLORS = {
  bg:     ['rgba(139,92,246,0.8)', 'rgba(251,191,36,0.8)', 'rgba(6,182,212,0.8)'],
  border: ['#8b5cf6',              '#fbbf24',               '#06b6d4'],
};

function useCSSVar(name: string, fallback: string) {
  const [val, setVal] = useState(fallback);
  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (v) setVal(v);
  }, [name]);
  return val;
}

// ─── Single Chart Component ───────────────────────────────────────────────────

interface SimpleBarProps {
  title:         string;
  values:        [number, number, number]; // [total, day, night]
  formatTick:    (v: number | string) => string;
  formatTooltip: (v: number) => string;
}

function SimpleBar({ title, values, formatTick, formatTooltip }: SimpleBarProps) {
  const ink      = useCSSVar('--color-ink', '#141413');
  const body     = useCSSVar('--color-body', '#3d3d3a');
  const muted    = useCSSVar('--color-muted', '#6c6a64');
  const mutedSft = useCSSVar('--color-muted-soft', '#8e8b82');
  const surface  = useCSSVar('--color-surface-card', '#efe9de');
  const primary  = useCSSVar('--color-primary', '#cc785c');

  const tooltipStyle = {
    backgroundColor: surface + 'f0',
    borderColor:     primary + '40',
    borderWidth:     1,
    padding:         12,
    titleColor:      ink,
    bodyColor:       body,
    titleFont:       { family: FONT, size: 12, weight: 'bold' as const },
    bodyFont:        { family: FONT, size: 11 },
    cornerRadius:    10,
  };

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
          label: (ctx: { parsed: { y: number | null } }) => ` ${formatTooltip(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        grid:   { display: false },
        border: { display: false },
        ticks:  {
          color: muted,
          font:  { family: FONT, size: 13, weight: 'bold' as const },
        },
      },
      y: {
        grid:   { color: ink + '10' },
        border: { display: false },
        ticks:  {
          color: mutedSft,
          font:  { family: FONT, size: 10 },
          callback: (v: number | string) => formatTick(v),
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-hairline bg-surface-card p-4 sm:p-6 space-y-3">
      <h3 className="text-xs font-black text-muted uppercase tracking-widest">{title}</h3>
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
      <h2 className="text-sm font-bold text-muted uppercase tracking-widest px-1">Analytics</h2>

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
