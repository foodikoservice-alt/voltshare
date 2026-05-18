import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import type { Member } from '../types/app.types';
import { useMonthlyStats } from '../hooks/useMonthlyStats';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const FONT = "'Inter', system-ui, sans-serif";

function useCSSVar(name: string, fallback: string) {
  const [val, setVal] = useState(fallback);
  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (v) setVal(v);
  }, [name]);
  return val;
}

// ─── Shared bar chart renderer ────────────────────────────────────────────────

interface BarChartProps {
  title: string;
  labels: string[];
  dayValues: number[];
  nightValues: number[];
  formatTick: (v: number | string) => string;
  formatTooltip: (v: number) => string;
}

function BarChart({ title, labels, dayValues, nightValues, formatTick, formatTooltip }: BarChartProps) {
  const ink = useCSSVar('--color-ink', '#141413');
  const body = useCSSVar('--color-body', '#3d3d3a');
  const muted = useCSSVar('--color-muted', '#6c6a64');
  const mutedSft = useCSSVar('--color-muted-soft', '#8e8b82');
  const surface = useCSSVar('--color-surface-card', '#efe9de');
  const primary = useCSSVar('--color-primary', '#cc785c');

  const tooltipStyle = {
    backgroundColor: surface + 'f0',
    borderColor: primary + '40',
    borderWidth: 1,
    padding: 12,
    titleColor: ink,
    bodyColor: body,
    titleFont: { family: FONT, size: 12, weight: 'bold' as const },
    bodyFont: { family: FONT, size: 11 },
    cornerRadius: 10,
  };

  const radius = labels.length > 2 ? 4 : 10;

  const data = {
    labels,
    datasets: [
      {
        label: 'Day',
        data: dayValues,
        backgroundColor: 'rgba(251,191,36,0.85)',
        borderColor: '#fbbf24',
        borderWidth: 2,
        borderRadius: radius,
        borderSkipped: false,
      },
      {
        label: 'Night',
        data: nightValues,
        backgroundColor: 'rgba(6,182,212,0.85)',
        borderColor: '#06b6d4',
        borderWidth: 2,
        borderRadius: radius,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          title: (items: TooltipItem<'bar'>[]) => items[0]?.label ?? '',
          label: (ctx: TooltipItem<'bar'>) =>
            ` ${ctx.dataset.label ?? ''}: ${formatTooltip(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: muted, font: { family: FONT, size: 12, weight: 'bold' as const } },
      },
      y: {
        grid: { color: ink + '10' },
        border: { display: false },
        ticks: {
          color: mutedSft,
          font: { family: FONT, size: 10 },
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

// ─── Donut chart for cost (Day vs Night) ───────────────────────────────────
const CostDonut = ({ dayCost, nightCost, displayTotal }: { dayCost: number; nightCost: number; displayTotal?: number }) => {
  const surface = useCSSVar('--color-surface-card', '#efe9de');
  const primary = useCSSVar('--color-primary', '#cc785c');
  const ink = useCSSVar('--color-ink', '#141413');
  const body = useCSSVar('--color-body', '#3d3d3a');
  const muted = useCSSVar('--color-muted', '#6c6a64');
  const total = displayTotal ?? (dayCost + nightCost);

  const donutData = {
    labels: ['Day', 'Night'],
    datasets: [{
      data: [dayCost, nightCost],
      backgroundColor: ['rgba(251,191,36,0.85)', 'rgba(6,182,212,0.85)'],
      borderColor: ['#fbbf24', '#06b6d4'],
      borderWidth: 2,
      hoverOffset: 6,
    }],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: muted,
          font: { family: FONT, size: 11, weight: 'bold' as const },
          boxWidth: 12,
          boxHeight: 12,
          borderRadius: 4,
          padding: 16,
          useBorderRadius: true,
          generateLabels: (chart: ChartJS) => {
            const ds = chart.data.datasets[0];
            return (chart.data.labels as string[]).map((label, i) => ({
              text: `${label}  ₹${(ds.data[i] as number).toFixed(2)}`,
              fillStyle: (ds.backgroundColor as string[])[i],
              strokeStyle: (ds.borderColor as string[])[i],
              lineWidth: 2,
              hidden: false,
              index: i,
              datasetIndex: 0,
              fontColor: muted,
            }));
          },
        },
      },
      tooltip: {
        backgroundColor: surface + 'f0',
        borderColor: primary + '40',
        borderWidth: 1,
        padding: 12,
        titleColor: ink,
        bodyColor: body,
        titleFont: { family: FONT, size: 12, weight: 'bold' as const },
        bodyFont: { family: FONT, size: 11 },
        cornerRadius: 10,
        callbacks: {
          label: (ctx: TooltipItem<'doughnut'>) => {
            const sliceSum = dayCost + nightCost;
            return `  ₹${(ctx.parsed as number).toFixed(2)} (${sliceSum > 0 ? ((ctx.parsed as number / sliceSum) * 100).toFixed(1) : 0}%)`;
          }
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-hairline bg-surface-card p-4 sm:p-6 space-y-3">
      <h3 className="text-xs font-black text-muted uppercase tracking-widest">Cost (₹)</h3>
      <div className="relative" style={{ height: 240 }}>
        <Doughnut data={donutData} options={donutOptions} />
        {/* Centred total label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: '2.5rem' }}>
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Total</span>
          <span className="text-lg font-black text-ink">₹{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

interface ChartsProps {
  members: Member[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Charts({ members: _members, selectedMonth, onMonthChange }: ChartsProps) {
  const { months, loading } = useMonthlyStats();

  if (loading || months.length === 0) return null;

  // Active month: use selectedMonth if valid, otherwise default to the latest month
  const latestMonth = months[0]?.month ?? '';
  const activeMonth = months.find(m => m.month === selectedMonth)?.month ?? latestMonth;

  // If viewing a specific month → 2 bars: Day | Night
  // If viewing all months  → stacked monthly trend
  const isSingleMonth = !!activeMonth;

  const single = months.find(m => m.month === activeMonth);

  const labels = isSingleMonth
    ? [`Day ${single?.day_units.toFixed(1)}u`, `Night ${single?.night_units.toFixed(1)}u`]
    : months.map(m => `${m.label} (${(m.day_units + m.night_units).toFixed(1)}u)`);

  const dayUnits = isSingleMonth ? [single?.day_units ?? 0] : months.map(m => m.day_units);
  const nightUnits = isSingleMonth ? [single?.night_units ?? 0] : months.map(m => m.night_units);

  // For single-month view: two separate bars (Day, Night) — not stacked
  // For all-months view: stacked monthly bars
  
  // For single month, render as three separate simple bars (one dataset)
  const singleMonthUnitsData = {
    labels: [
      `Day ${single?.day_units.toFixed(1)}u`,
      `Night ${single?.night_units.toFixed(1)}u`
    ],
    datasets: [
      {
        label: 'Units (kWh)',
        data: [single?.day_units ?? 0, single?.night_units ?? 0],
        backgroundColor: ['rgba(251,191,36,0.85)', 'rgba(6,182,212,0.85)'],
        borderColor: ['#fbbf24', '#06b6d4'],
        borderWidth: 2,
        borderRadius: 10,
        borderSkipped: false as const,
      },
    ],
  };



  const makeOptions = (formatTick: (v: number | string) => string, formatTooltip: (v: number) => string) => {
    const ink = getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim() || '#141413';
    const muted = getComputedStyle(document.documentElement).getPropertyValue('--color-muted').trim() || '#6c6a64';
    const mutedSft = getComputedStyle(document.documentElement).getPropertyValue('--color-muted-soft').trim() || '#8e8b82';
    const surface = getComputedStyle(document.documentElement).getPropertyValue('--color-surface-card').trim() || '#efe9de';
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#cc785c';
    const body = getComputedStyle(document.documentElement).getPropertyValue('--color-body').trim() || '#3d3d3a';
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: surface + 'f0',
          borderColor: primary + '40',
          borderWidth: 1,
          padding: 12,
          titleColor: ink,
          bodyColor: body,
          titleFont: { family: FONT, size: 12, weight: 'bold' as const },
          bodyFont: { family: FONT, size: 11 },
          cornerRadius: 10,
          callbacks: {
            title: (items: TooltipItem<'bar'>[]) => items[0]?.label ?? '',
            label: (ctx: TooltipItem<'bar'>) => ` ${formatTooltip(ctx.parsed.y ?? 0)}`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { color: muted, font: { family: FONT, size: 13, weight: 'bold' as const } } },
        y: { grid: { color: ink + '10' }, border: { display: false }, ticks: { color: mutedSft, font: { family: FONT, size: 10 }, callback: (v: number | string) => formatTick(v) } },
      },
    };
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-muted uppercase tracking-widest">Analytics</h2>
        {isSingleMonth && single && (
          <span className="text-xs text-muted font-medium">{single.label} · {single.total_units.toFixed(1)} kWh</span>
        )}
      </div>

      {/* Month filter pills — shared with history table */}
      <div className="flex flex-wrap gap-2 px-1">
        {months.map(m => (
          <button
            key={m.month}
            onClick={() => onMonthChange(m.month === activeMonth && selectedMonth ? '' : m.month)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${m.month === activeMonth
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-surface-card text-muted border-hairline hover:border-primary/40'
              }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {isSingleMonth ? (
          <>
            <div className="rounded-2xl border border-hairline bg-surface-card p-4 sm:p-6 space-y-3">
              <h3 className="text-xs font-black text-muted uppercase tracking-widest">Units (kWh)</h3>
              <div style={{ height: 240 }}>
                <Bar data={singleMonthUnitsData} options={makeOptions(v => `${v}u`, v => `${v.toFixed(1)} kWh`)} />
              </div>
            </div>
            <CostDonut
              dayCost={single?.day_cost ?? 0}
              nightCost={single?.night_cost ?? 0}
              displayTotal={(single?.building_day_cost ?? 0) + (single?.building_night_cost ?? 0)}
            />
          </>
        ) : (
          <>
            <BarChart
              title="Units (kWh) — Monthly"
              labels={labels}
              dayValues={dayUnits}
              nightValues={nightUnits}
              formatTick={v => `${v}u`}
              formatTooltip={v => `${v.toFixed(1)} kWh`}
            />
            <CostDonut
              dayCost={months.reduce((s, m) => s + m.day_cost, 0)}
              nightCost={months.reduce((s, m) => s + m.night_cost, 0)}
              displayTotal={months.reduce((s, m) => s + m.building_day_cost + m.building_night_cost, 0)}
            />
          </>
        )}
      </div>
    </section>
  );
}
