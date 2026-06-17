import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { Mountain, ArrowUp, ArrowDown } from 'lucide-react';
import type { TrackPoint } from '@/types';
import { formatDistance } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface ElevationChartProps {
  trackPoints: TrackPoint[];
  elevationGain?: number;
  className?: string;
}

interface ChartPoint {
  index: number;
  distance: number;
  distanceLabel: string;
  elevation: number;
  elevationLabel: string;
  isMax?: boolean;
  isMin?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      className="glass rounded-2xl p-4 shadow-card-hover min-w-[160px] border border-white/50"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-teal-600">
            <Mountain className="w-3.5 h-3.5" strokeWidth={2.2} />
            <span className="text-xs font-medium">海拔</span>
          </div>
          <span className="font-bold font-display text-base text-ink-800">
            {data.elevationLabel}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-ink-500">距离</span>
          <span className="font-bold text-sm text-ink-700">
            {data.distanceLabel}
          </span>
        </div>
      </div>
      {data.isMax && (
        <div className="mt-2 pt-2 border-t border-ink-200/50 text-xs font-semibold text-amber-500">
          ⛰️ 最高点
        </div>
      )}
      {data.isMin && (
        <div className="mt-2 pt-2 border-t border-ink-200/50 text-xs font-semibold text-blue-500">
          🌊 最低点
        </div>
      )}
    </motion.div>
  );
}

export function ElevationChart({
  trackPoints,
  elevationGain,
  className = '',
}: ElevationChartProps) {
  const { chartData, stats, maxPoint, minPoint } = useMemo(() => {
    if (!trackPoints || trackPoints.length < 2) {
      return {
        chartData: [] as ChartPoint[],
        stats: { gain: 0, loss: 0, max: 0, min: 0 },
        maxPoint: null as ChartPoint | null,
        minPoint: null as ChartPoint | null,
      };
    }

    const points: ChartPoint[] = [];
    let cumDistance = 0;
    let maxElevation = -Infinity;
    let minElevation = Infinity;
    let totalGain = 0;
    let totalLoss = 0;
    let maxIdx = 0;
    let minIdx = 0;

    for (let i = 1; i < trackPoints.length; i++) {
      const p1 = trackPoints[i - 1];
      const p2 = trackPoints[i];

      const dLat = (p2.latitude - p1.latitude) * 111000;
      const dLng =
        (p2.longitude - p1.longitude) *
        111000 *
        Math.cos((p1.latitude * Math.PI) / 180);
      const segDistance = Math.sqrt(dLat * dLat + dLng * dLng);
      cumDistance += segDistance;

      const elevDiff = p2.elevation - p1.elevation;
      if (elevDiff > 0) {
        totalGain += elevDiff;
      } else {
        totalLoss += Math.abs(elevDiff);
      }

      const sampleInterval = Math.max(1, Math.floor(trackPoints.length / 80));

      if (i % sampleInterval === 0 || i === trackPoints.length - 1) {
        const elev = p2.elevation;
        if (elev > maxElevation) {
          maxElevation = elev;
          maxIdx = points.length;
        }
        if (elev < minElevation) {
          minElevation = elev;
          minIdx = points.length;
        }

        points.push({
          index: i,
          distance: cumDistance,
          distanceLabel: formatDistance(cumDistance, 2),
          elevation: Math.round(elev),
          elevationLabel: `${Math.round(elev)} m`,
        });
      }
    }

    if (points.length > 0) {
      points[maxIdx] = { ...points[maxIdx], isMax: true };
      points[minIdx] = { ...points[minIdx], isMin: true };
    }

    return {
      chartData: points,
      stats: {
        gain: elevationGain ?? totalGain,
        loss: totalLoss,
        max: maxElevation === -Infinity ? 0 : maxElevation,
        min: minElevation === Infinity ? 0 : minElevation,
      },
      maxPoint: points[maxIdx] ?? null,
      minPoint: points[minIdx] ?? null,
    };
  }, [trackPoints, elevationGain]);

  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl bg-ink-50 border border-ink-100',
          'min-h-[280px]',
          className
        )}
      >
        <p className="text-ink-400">暂无海拔数据</p>
      </div>
    );
  }

  const yMin = Math.max(0, Math.floor(stats.min / 50) * 50 - 25);
  const yMax = Math.ceil(stats.max / 50) * 50 + 25;

  const xTicks = useMemo(() => {
    const numTicks = Math.min(5, chartData.length);
    const ticks: number[] = [];
    for (let i = 0; i <= numTicks; i++) {
      const idx = Math.round((i / numTicks) * (chartData.length - 1));
      if (chartData[idx]) ticks.push(chartData[idx].distance);
    }
    return ticks;
  }, [chartData]);

  const maxDist = chartData[chartData.length - 1]?.distance ?? 0;

  return (
    <div
      className={cn('glass rounded-3xl p-5 border border-white/40', className)}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-bold text-ink-800 text-lg">海拔变化</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            累计爬升{' '}
            <span className="font-semibold text-teal-600 font-display">
              +{Math.round(stats.gain)} m
            </span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <ArrowUp
                className="w-3.5 h-3.5 text-emerald-600"
                strokeWidth={2.5}
              />
            </div>
            <div>
              <p className="text-[10px] text-emerald-700 font-medium">爬升</p>
              <p className="text-sm font-bold font-display text-emerald-700">
                +{Math.round(stats.gain)} m
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <ArrowDown
                className="w-3.5 h-3.5 text-blue-600"
                strokeWidth={2.5}
              />
            </div>
            <div>
              <p className="text-[10px] text-blue-700 font-medium">下降</p>
              <p className="text-sm font-bold font-display text-blue-700">
                -{Math.round(stats.loss)} m
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D9488" stopOpacity={0.55} />
                <stop offset="50%" stopColor="#14B8A6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#5EEAD4" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="tealLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0F766E" />
                <stop offset="50%" stopColor="#0D9488" />
                <stop offset="100%" stopColor="#14B8A6" />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#E5E5E5"
              vertical={false}
            />

            <XAxis
              dataKey="distance"
              type="number"
              domain={[0, maxDist]}
              ticks={xTicks}
              tickFormatter={(v) => formatDistance(v, 1).replace(' ', '')}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#737373', fontSize: 10, fontWeight: 600 }}
              dy={6}
            />

            <YAxis
              domain={[yMin, yMax]}
              tickFormatter={(v) => `${v} m`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#A3A3A3', fontSize: 10 }}
              width={45}
            />

            <Tooltip
              cursor={{
                stroke: '#0D9488',
                strokeDasharray: '4 4',
                strokeOpacity: 0.4,
              }}
              content={<CustomTooltip />}
            />

            <Area
              type="monotone"
              dataKey="elevation"
              stroke="url(#tealLine)"
              strokeWidth={2.5}
              fill="url(#tealGradient)"
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />

            {maxPoint && (
              <ReferenceDot
                x={maxPoint.distance}
                y={maxPoint.elevation}
                r={6}
                fill="#F59E0B"
                stroke="#fff"
                strokeWidth={2}
                label={{
                  value: `最高 ${maxPoint.elevationLabel}`,
                  position: 'top',
                  fill: '#B45309',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
            )}

            {minPoint && (
              <ReferenceDot
                x={minPoint.distance}
                y={minPoint.elevation}
                r={6}
                fill="#3B82F6"
                stroke="#fff"
                strokeWidth={2}
                label={{
                  value: `最低 ${minPoint.elevationLabel}`,
                  position: 'bottom',
                  fill: '#1D4ED8',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
