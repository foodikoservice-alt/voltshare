import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import type { MeterEntry, MemberTotal } from '../types/app.types';
import { BarChart2, TrendingUp, PieChart } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ─── Shared Chart Defaults ───────────────────────────────────────────────────

const FONT_FAMILY = "'Inter', 'system-ui', sans-serif";

const tooltipDefaults = {
  backgroundColor: 'rgba(15, 10, 30, 0.92)',
  borderColor: 'rgba(139, 92, 246, 0.3)',
  borderWidth: 1,
  padding: 12,
  titleColor: '#e2e8f0',
  bodyColor: '#94a3b8',
  titleFont: { family: FONT_FAMILY, size: 12, weight: 'bold' as const },
  bodyFont: { family: FONT_FAMILY, size: 11 },
  cornerRadius: 10,
};

const gridColor = 'rgba(255,255,255,0.05)';
const tickColor = '#475569';

const MEMBER_COLORS = [
  '#8b5cf6', '#a855f7', '#6366f1', '#3b82f6',
  '#06b6d4', '#14b8a6', '#f59e0b', '#ef4444',
];

// ─── Card Wrapper ─────────────────────────────────────────────────────────────

function ChartCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-surface-container p-4 sm:p-6 space-y-4 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/15 text-primary-light shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── 1. Member Units Bar Chart ────────────────────────────────────────────────

function MemberUnitsChart({ memberTotals }: { memberTotals: MemberTotal[] }) {
  const data = useMemo(() => ({
    labels: memberTotals.map(m => m.member.name),
    datasets: [
      {
        label: 'Units (kWh)',
        data: memberTotals.map(m => m.total_units),
        backgroundColor: memberTotals.map((_, i) => MEMBER_COLORS[i % MEMBER_COLORS.length] + 'cc'),
        borderColor: memberTotals.map((_, i) => MEMBER_COLORS[i % MEMBER_COLORS.length]),
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  }), [memberTotals]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipDefaults,
        callbacks: {
          label: (ctx: { parsed: { y: number } }) => ` ${ctx.parsed.y.toFixed(1)} kWh`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: tickColor, font: { family: FONT_FAMILY, size: 11 } },
      },
      y: {
        grid: { color: gridColor, lineWidth: 1 },
        border: { display: false, dash: [4, 4] },
        ticks: {
          color: tickColor,
          font: { family: FONT_FAMILY, size: 10 },
          callback: (v: number | string) => `${v} u`,
        },
      },
    },
  }), []);

  return (
    <ChartCard icon={BarChart2} title="Usage per Member" subtitle="Total units consumed">
      <div className="w-full" style={{ height: 220 }}>
        <Bar data={data} options={{ ...options, maintainAspectRatio: false }} />
      </div>
    </ChartCard>
  );
}

// ─── 2. Daily Usage Trend Line Chart ─────────────────────────────────────────

function DailyTrendChart({ entries }: { entries: MeterEntry[] }) {
  const { labels, dayData, nightData } = useMemo(() => {
    const closed = entries
      .filter(e => e.status === 'closed' && e.usage_units !== null && e.closing_at)
      .sort((a, b) => new Date(a.closing_at!).getTime() - new Date(b.closing_at!).getTime())
      .slice(-14); // last 14 entries

    const dayEntries = closed.filter(e => e.entry_type === 'day_shift');
    const nightEntries = closed.filter(e => e.entry_type === 'night_shift');

    // Build a unified date label set
    const allDates = [...new Set(closed.map(e => {
      const d = new Date(e.closing_at!);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    }))];

    const getByDate = (arr: MeterEntry[], date: string) => {
      const match = arr.find(e => {
        const d = new Date(e.closing_at!);
        return `${d.getDate()}/${d.getMonth() + 1}` === date;
      });
      return match?.usage_units ?? null;
    };

    return {
      labels: allDates,
      dayData: allDates.map(d => getByDate(dayEntries, d)),
      nightData: allDates.map(d => getByDate(nightEntries, d)),
    };
  }, [entries]);

  const data = {
    labels,
    datasets: [
      {
        label: 'Day Shift',
        data: dayData,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.12)',
        borderWidth: 2,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#1e1b3a',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
        spanGaps: true,
      },
      {
        label: 'Night Shift',
        data: nightData,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        borderWidth: 2,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#1e1b3a',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
        spanGaps: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: '#64748b',
          font: { family: FONT_FAMILY, size: 10 },
          boxWidth: 12,
          boxHeight: 3,
          padding: 12,
          usePointStyle: true,
          pointStyle: 'line',
        },
      },
      tooltip: {
        ...tooltipDefaults,
        callbacks: {
          label: (ctx: { dataset: { label: string }; parsed: { y: number | null } }) =>
            ctx.parsed.y !== null ? ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)} kWh` : '',
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: tickColor, font: { family: FONT_FAMILY, size: 10 }, maxRotation: 0 },
      },
      y: {
        grid: { color: gridColor },
        border: { display: false },
        ticks: {
          color: tickColor,
          font: { family: FONT_FAMILY, size: 10 },
          callback: (v: number | string) => `${v}u`,
        },
      },
    },
  };

  return (
    <ChartCard icon={TrendingUp} title="Usage Trend" subtitle="Day & night shift — last 14 entries">
      <div className="w-full" style={{ height: 220 }}>
        <Line data={data} options={options} />
      </div>
    </ChartCard>
  );
}

// ─── 3. Cost Share Doughnut ───────────────────────────────────────────────────

function CostShareChart({ memberTotals }: { memberTotals: MemberTotal[] }) {
  const data = useMemo(() => ({
    labels: memberTotals.map(m => m.member.name),
    datasets: [
      {
        data: memberTotals.map(m => m.total_cost),
        backgroundColor: memberTotals.map((_, i) => MEMBER_COLORS[i % MEMBER_COLORS.length] + 'cc'),
        borderColor: memberTotals.map((_, i) => MEMBER_COLORS[i % MEMBER_COLORS.length]),
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }), [memberTotals]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#64748b',
          font: { family: FONT_FAMILY, size: 11 },
          boxWidth: 10,
          boxHeight: 10,
          padding: 10,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        ...tooltipDefaults,
        callbacks: {
          label: (ctx: { label: string; parsed: number; dataset: { data: number[] } }) => {
            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : '0';
            return ` ₹${ctx.parsed.toFixed(2)} (${pct}%)`;
          },
        },
      },
    },
  }), []);

  return (
    <ChartCard icon={PieChart} title="Cost Share" subtitle="Total bill distribution">
      <div className="w-full" style={{ height: 200 }}>
        <Doughnut data={data} options={options} />
      </div>
    </ChartCard>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface ChartsProps {
  entries: MeterEntry[];
  memberTotals: MemberTotal[];
}

export function Charts({ entries, memberTotals }: ChartsProps) {
  if (memberTotals.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Analytics</h2>
      </div>

      {/* Responsive grid: 1 col mobile, 2 col md, 3 col lg */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <MemberUnitsChart memberTotals={memberTotals} />
        <CostShareChart memberTotals={memberTotals} />
        <div className="md:col-span-2 lg:col-span-1">
          <DailyTrendChart entries={entries} />
        </div>
      </div>
    </section>
  );
}
