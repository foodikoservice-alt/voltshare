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
    const updateVal = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      if (v && v !== val) setVal(v);
    };

    // Initial check
    updateVal();

    // Listen for dark mode class toggles on the HTML element
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          updateVal();
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, [name, val]);

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

  const dayBg = useCSSVar('--chart-day-bg', 'rgba(251,191,36,0.85)');
  const dayBorder = useCSSVar('--chart-day-border', '#fbbf24');
  const nightBg = useCSSVar('--chart-night-bg', 'rgba(6,182,212,0.85)');
  const nightBorder = useCSSVar('--chart-night-border', '#06b6d4');

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
        backgroundColor: dayBg,
        borderColor: dayBorder,
        borderWidth: 2,
        borderRadius: radius,
        borderSkipped: false,
      },
      {
        label: 'Night',
        data: nightValues,
        backgroundColor: nightBg,
        borderColor: nightBorder,
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
const CostDonut = ({ dayCost, nightCost }: { dayCost: number; nightCost: number }) => {
  const surface = useCSSVar('--color-surface-card', '#efe9de');
  const primary = useCSSVar('--color-primary', '#cc785c');
  const ink = useCSSVar('--color-ink', '#141413');
  const body = useCSSVar('--color-body', '#3d3d3a');
  const muted = useCSSVar('--color-muted', '#6c6a64');

  const dayBg = useCSSVar('--chart-day-bg', 'rgba(251,191,36,0.85)');
  const dayBorder = useCSSVar('--chart-day-border', '#fbbf24');
  const nightBg = useCSSVar('--chart-night-bg', 'rgba(6,182,212,0.85)');
  const nightBorder = useCSSVar('--chart-night-border', '#06b6d4');

  const donutData = {
    labels: ['Day', 'Night'],
    datasets: [{
      data: [dayCost, nightCost],
      backgroundColor: [dayBg, nightBg],
      borderColor: [dayBorder, nightBorder],
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
              text: `${label}  ${(ds.data[i] as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
        bodyFont: { family: FONT, size: 11, weight: 'bold' as const },
        cornerRadius: 10,
        callbacks: {
          title: (ctx: TooltipItem<'doughnut'>[]) => ctx[0].label || '',
          label: (ctx: TooltipItem<'doughnut'>) => {
            const sliceSum = dayCost + nightCost;
            const percent = sliceSum > 0 ? ((ctx.parsed as number / sliceSum) * 100).toFixed(1) : '0';
            return ` Cost: ${(ctx.parsed as number).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percent}%)`;
          }
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-hairline bg-surface-card p-4 sm:p-6 space-y-3">
      <h3 className="text-xs font-black text-muted uppercase tracking-widest">Cost (₹)</h3>
      <div className="relative" style={{ height: 240 }}>
        <div className="relative z-10 h-full w-full">
          <Doughnut data={donutData} options={donutOptions} />
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

// Remove unused members prop
export function Charts({ selectedMonth, onMonthChange }: Omit<ChartsProps, 'members'>) {
  const { months, loading } = useMonthlyStats();
  
  const dayBg = useCSSVar('--chart-day-bg', 'rgba(251,191,36,0.85)');
  const dayBorder = useCSSVar('--chart-day-border', '#fbbf24');
  const nightBg = useCSSVar('--chart-night-bg', 'rgba(6,182,212,0.85)');
  const nightBorder = useCSSVar('--chart-night-border', '#06b6d4');

  if (loading || months.length === 0) return null;

  const isSingleMonth = selectedMonth !== '';
  const activeMonth = isSingleMonth ? (months.find(m => m.month === selectedMonth)?.month ?? months[0]?.month) : '';

  const single = isSingleMonth ? months.find(m => m.month === activeMonth) : undefined;

  const labels = isSingleMonth
    ? [`Day ${single?.day_units.toFixed(2)}u`, `Night ${single?.night_units.toFixed(2)}u`]
    : months.map(m => `${m.label} (${(m.day_units + m.night_units).toFixed(2)}u)`);

  const dayUnits = isSingleMonth ? [single?.day_units ?? 0] : months.map(m => m.day_units);
  const nightUnits = isSingleMonth ? [single?.night_units ?? 0] : months.map(m => m.night_units);

  // For single-month view: two separate bars (Day, Night) — not stacked
  // For all-months view: stacked monthly bars
  
  // For single month, render as three separate simple bars (one dataset)
  const singleMonthUnitsData = {
    labels: [
      `Day ${single?.day_units.toFixed(2)}u`,
      `Night ${single?.night_units.toFixed(2)}u`
    ],
    datasets: [
      {
        label: 'Units (kWh)',
        data: [single?.day_units ?? 0, single?.night_units ?? 0],
        backgroundColor: [dayBg, nightBg],
        borderColor: [dayBorder, nightBorder],
        borderWidth: 2,
        borderRadius: 10,
        borderSkipped: false as const,
      },
    ],
  };



  const makeOptions = (formatTick: (v: number | string) => string, formatTooltip: (v: number) => string) => {
    // Read from body classes or just use explicit values to avoid getComputedStyle during render
    const ink = '#141413';
    const muted = '#6c6a64';
    const mutedSft = '#8e8b82';
    const surface = '#efe9de';
    const primary = '#cc785c';
    const bodyColor = '#3d3d3a';
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
          bodyColor: bodyColor,
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
          <span className="text-xs text-muted font-medium">{single.label} · {single.total_units.toFixed(2)} kWh</span>
        )}
      </div>

      {/* Month filter pills — shared with history table */}
      <div className="flex flex-wrap gap-2 px-1">
        {months.map(m => (
          <button
            key={m.month}
            onClick={() => onMonthChange(m.month === selectedMonth ? '' : m.month)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${m.month === selectedMonth
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
                <Bar data={singleMonthUnitsData} options={makeOptions(v => `${v}u`, v => `${v.toFixed(2)} kWh`)} />
              </div>
            </div>
            <CostDonut
              dayCost={single?.day_cost ?? 0}
              nightCost={single?.night_cost ?? 0}
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
              formatTooltip={v => `${v.toFixed(2)} kWh`}
            />
            <CostDonut
              dayCost={months.reduce((s, m) => s + m.day_cost, 0)}
              nightCost={months.reduce((s, m) => s + m.night_cost, 0)}
            />
          </>
        )}
      </div>
    </section>
  );
}
