import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Gauge, Timer } from 'lucide-react';
import type { SplitRecord } from '@/types';
import { formatPace, formatDistance } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface PaceChartProps {
  splits: SplitRecord[];
  avgPace?: number;
  className?: string;
}

interface ChartDataPoint {
  index: number;
  label: string;
  pace: number;
  paceFormatted: string;
  distance: string;
  elevationGain: number;
  belowAvg: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="glass rounded-2xl p-4 shadow-card-hover min-w-[180px] border border-white/50"
    >
      <p className="text-xs font-semibold text-ink-500 mb-2">
        第 {data.index + 1} 公里
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-brand-500">
            <Timer className="w-3.5 h-3.5" strokeWidth={2.2} />
            <span className="text-xs font-medium">配速</span>
          </div>
          <span className="font-bold font-display text-base text-ink-800">
            {data.paceFormatted}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-teal-500">
            <Gauge className="w-3.5 h-3.5" strokeWidth={2.2} />
            <span className="text-xs font-medium">距离</span>
          </div>
          <span className="font-bold text-sm text-ink-700">{data.distance}</span>
        </div>
        {data.elevationGain > 0 && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-purple-500">
              <Gauge className="w-3.5 h-3.5" strokeWidth={2.2} />
              <span className="text-xs font-medium">爬升</span>
            </div>
            <span className="font-bold text-sm text-ink-700">
              +{data.elevationGain.toFixed(0)} m
            </span>
          </div>
        )}
      </div>
      <div
        className={cn(
          'mt-2 pt-2 border-t border-ink-200/50 text-xs font-medium',
          data.belowAvg ? 'text-emerald-600' : 'text-red-500'
        )}
      >
        {data.belowAvg ? '✓ 快于平均配速' : '↓ 慢于平均配速'}
      </div>
    </motion.div>
  );
}

export function PaceChart({ splits, avgPace, className = '' }: PaceChartProps) {
  const { chartData, averagePace, minPace, maxPace } = useMemo(() => {
    if (!splits || splits.length === 0) {
      return {
        chartData: [] as ChartDataPoint[],
        averagePace: 0,
        minPace: 0,
        maxPace: 0,
      };
    }

    const validSplits = splits.filter((s) => s.pace > 0 && s.pace < 1200);
    const avg =
      avgPace ??
      validSplits.reduce((sum, s) => sum + s.pace, 0) / validSplits.length;

    const paces = validSplits.map((s) => s.pace);
    const minP = Math.min(...paces);
    const maxP = Math.max(...paces);

    const data: ChartDataPoint[] = validSplits.map((split) => ({
      index: split.index,
      label: `K${split.index + 1}`,
      pace: split.pace,
      paceFormatted: formatPace(split.pace).split(' ')[0],
      distance: formatDistance(split.distance, 2),
      elevationGain: split.elevationGain || 0,
      belowAvg: split.pace < avg,
    }));

    return {
      chartData: data,
      averagePace: avg,
      minPace: minP,
      maxPace: maxP,
    };
  }, [splits, avgPace]);

  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl bg-ink-50 border border-ink-100',
          'min-h-[280px]',
          className
        )}
      >
        <p className="text-ink-400 text-sm">暂无配速数据</p>
      </div>
    );
  }

  const yDomainMin = Math.floor(minPace / 30) * 30 - 15;
  const yDomainMax = Math.ceil(maxPace / 30) * 30 + 15;

  const tickFormatter = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}'${s.toString().padStart(2, '0')}"`;
  };

  return (
    <div
      className={cn(
        'glass rounded-3xl p-5 border border-white/40',
        className
      )}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-ink-800 text-lg">每公里配速</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            平均配速{' '}
            <span className="font-semibold text-brand-500 font-display">
              {formatPace(averagePace)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-ink-500 font-medium">快于平均</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-400" />
            <span className="text-ink-500 font-medium">慢于平均</span>
          </div>
        </div>
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="barFast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="barSlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F87171" stopOpacity={1} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.8} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#E5E5E5"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#737373', fontSize: 11, fontWeight: 600 }}
              dy={8}
            />

            <YAxis
              domain={[yDomainMin, yDomainMax]}
              tickFormatter={tickFormatter}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#A3A3A3', fontSize: 10 }}
              width={45}
            />

            <Tooltip
              cursor={{ fill: 'rgba(255,107,53,0.06)' }}
              content={<CustomTooltip />}
            />

            <ReferenceLine
              y={averagePace}
              stroke="#FF6B35"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: '平均',
                position: 'right',
                fill: '#FF6B35',
                fontSize: 10,
                fontWeight: 700,
              }}
            />

            <Bar dataKey="pace" radius={[8, 8, 0, 0]} maxBarSize={28}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.belowAvg ? 'url(#barFast)' : 'url(#barSlow)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
