import { motion } from 'framer-motion';
import {
  Activity as ActivityIcon,
  MapPin,
  Timer,
  Flame,
  TrendingUp,
  Mountain,
} from 'lucide-react';
import type { Activity } from '../types';
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatCalories,
  formatDate,
} from '../utils/formatters';
import { cn } from '../lib/utils';

export interface ActivityCardProps {
  activity: Activity;
  delay?: number;
}

export default function ActivityCard({
  activity,
  delay = 0,
}: ActivityCardProps) {
  const isRunning = activity.type === 'running';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ x: 4, transition: { duration: 0.2 } }}
      className="group flex gap-4 p-4 rounded-2xl bg-white border border-ink-100 shadow-soft hover:shadow-card-hover transition-all cursor-pointer"
    >
      <div
        className={cn(
          'relative flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 overflow-hidden',
          isRunning
            ? 'bg-gradient-to-br from-brand-500 to-brand-600'
            : 'bg-gradient-to-br from-teal-500 to-teal-600'
        )}
      >
        <div className="absolute inset-0 bg-white/10 rounded-2xl" />
        <ActivityIcon className="h-6 w-6 text-white relative z-10" />
        <span className="text-[10px] font-semibold text-white/90 relative z-10">
          {isRunning ? '跑步' : '骑行'}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h4 className="font-semibold text-ink-800 line-clamp-1 group-hover:text-brand-600 transition-colors">
              {activity.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin className="h-3 w-3 text-ink-400 shrink-0" />
              <span className="text-xs text-ink-500">
                {formatDate(activity.startTime, 'MM月dd日 HH:mm')}
              </span>
              {activity.weather && (
                <span className="text-xs text-ink-400">
                  · {activity.weather.condition} {activity.weather.temperature}°C
                </span>
              )}
            </div>
          </div>

          <div
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
              isRunning
                ? 'bg-brand-50 text-brand-600'
                : 'bg-teal-50 text-teal-600'
            )}
          >
            <TrendingUp className="h-3 w-3" />
            {isRunning ? formatPace(activity.avgPace) : `${activity.avgSpeed.toFixed(1)} km/h`}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-ink-50/50">
            <MapPin className="h-3.5 w-3.5 text-brand-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-ink-400 leading-none">距离</p>
              <p className="text-sm font-bold text-ink-800 leading-tight mt-0.5">
                {formatDistance(activity.distance, 1)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-ink-50/50">
            <Timer className="h-3.5 w-3.5 text-teal-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-ink-400 leading-none">时长</p>
              <p className="text-sm font-bold text-ink-800 leading-tight mt-0.5">
                {formatDuration(activity.duration, true)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-ink-50/50">
            <Mountain className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-ink-400 leading-none">爬升</p>
              <p className="text-sm font-bold text-ink-800 leading-tight mt-0.5">
                {activity.elevationGain}m
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-ink-50/50">
            <Flame className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-ink-400 leading-none">卡路里</p>
              <p className="text-sm font-bold text-ink-800 leading-tight mt-0.5">
                {formatCalories(activity.calories)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
