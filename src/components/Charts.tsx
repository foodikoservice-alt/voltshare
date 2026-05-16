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

// ─── Shared Style Tokens ──────────────────────────────────────────────────────

const FONT = "'Inter', system-ui, sans-serif";

// One colour per member (cycles if more than 8)
const MEMBER_PALETTE = [
  { bg: 'rgba(139, 92,  246, 0.75)', border: '#8b5cf6' },
  { bg: 'rgba(251, 191,  36, 0.75)', border: '#fbbf24' },
  { bg: 'rgba(6,   182, 212, 0.75)', border: '#06b6d4' },
  { bg: 'rgba(16,  185, 129, 0.75)', border: '#10b981' },
  { bg: 'rgba(239,  68,  68, 0.75)', border: '#ef4444' },
  { bg: 'rgba(249, 115,  22, 0.75)', border: '#f97316' },
  { bg: 'rgba(99,  102, 241, 0.75)', border: '#6366f1' },
  { bg: 'rgba(236,  72, 153, 0.75)', border: '#ec4899' },
];

const tooltipStyle = {
  backgroundColor: 'rgba(10, 6, 28, 0.95)',
  borderColor:     'rgba(139, 92, 246, 0.25)',
  borderWidth:     1,
  padding:         12,
  titleColor:      '#e2e8f0',
  bodyColor:       '#94a3b8',
  titleFont:       { family: FONT, size: 12, weight: 'bold'  as const },
  bodyFont:        { family: FONT, size: 11 },
  cornerRadius:    10,
};

const axisStyle = {
  x: {
    grid: { display: false },
    border: { display: false },
    ticks: { color: '#475569', font: { family: FONT, size: 11 } },
  },
  y: {
    grid:   { color: 'rgba(255,255,255,0.05)' },
    border: { display: false },
    ticks:  { color: '#475569', font: { family: FONT, size: 10 } },
  },
};

const legendStyle = {
  display:  true,
  position: 'top' as const,
  align:    'end'  as const,
  labels: {
    color:          '#64748b',
    font:           { family: FONT, size: 11 },
    boxWidth:       10,
    boxHeight:      10,
    padding:        14,
    usePointStyle:  true,
    pointStyle:     'rectRounded' as const,
  },
};

// ─── Generic Bar Chart (x = Total/Day/Night, dataset per member) ─────────────

interface MemberDataset {
  name:  string;
  total: number;
  day:   number;
  night: number;
}

interface GroupedBarProps {
  title:         string;
  members:       MemberDataset[];
  formatTick:    (v: number | string) => string;
  formatTooltip: (v: number) => string;
}

function GroupedBar({ title, members, formatTick, formatTooltip }: GroupedBarProps) {
  const data = {
    // x-axis: always three categories
    labels: ['Total', 'Day', 'Night'],
    datasets: members.map((m, i) => {
      const c = MEMBER_PALETTE[i % MEMBER_PALETTE.length];
      return {
        label:           m.name,
        data:            [m.total, m.day, m.night],
        backgroundColor: c.bg,
        borderColor:     c.border,
        borderWidth:     1.5,
        borderRadius:    6,
        borderSkipped:   false,
      };
    }),
  };

  const options = {
    responsive:          true,
    maintainAspectRatio: false,
    plugins: {
      legend: legendStyle,
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (ctx: { dataset: { label: string }; parsed: { y: number } }) =>
            ` ${ctx.dataset.label}: ${formatTooltip(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: axisStyle.x,
      y: {
        ...axisStyle.y,
        ticks: {
          ...axisStyle.y.ticks,
          callback: (v: number | string) => formatTick(v),
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-surface-container p-4 sm:p-5 space-y-3 shadow-xl">
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

  // Shape data so each member is a dataset, x-axis = Total/Day/Night
  const unitsDatasets: MemberDataset[] = breakdown.map(b => ({
    name:  b.member.name,
    total: b.total_units,
    day:   b.day_units,
    night: b.night_units,
  }));

  const costDatasets: MemberDataset[] = breakdown.map(b => ({
    name:  b.member.name,
    total: b.total_cost,
    day:   b.day_cost,
    night: b.night_cost,
  }));

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <GroupedBar
          title="Units (kWh) — Total / Day / Night"
          members={unitsDatasets}
          formatTick={v => `${v}u`}
          formatTooltip={v => `${v.toFixed(1)} kWh`}
        />
        <GroupedBar
          title="Cost (₹) — Total / Day / Night"
          members={costDatasets}
          formatTick={v => `₹${v}`}
          formatTooltip={v => `₹${v.toFixed(2)}`}
        />
      </div>
    </section>
  );
}
