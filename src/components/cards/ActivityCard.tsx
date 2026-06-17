import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity as ActivityIcon,
  Bike,
  Clock,
  Flame,
  Bookmark,
  Calendar,
} from 'lucide-react';
import type { Activity } from '@/types';
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatDate,
} from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { MiniTrackMap } from '../maps/MiniTrackMap';

interface ActivityCardProps {
  activity: Activity;
  onToggleFavorite?: (id: string) => void;
  className?: string;
}

export function ActivityCard({
  activity,
  onToggleFavorite,
  className = '',
}: ActivityCardProps) {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  const isRunning = activity.type === 'running';
  const TypeIcon = isRunning ? ActivityIcon : Bike;

  const handleClick = () => {
    navigate(`/activity/${activity.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = !isFavorite;
    setIsFavorite(newValue);
    onToggleFavorite?.(activity.id);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
      onClick={handleClick}
      className={cn(
        'group relative overflow-hidden rounded-3xl cursor-pointer',
        'bg-white border border-ink-100',
        'shadow-soft hover:shadow-card-hover',
        'transition-all duration-300 ease-out',
        className
      )}
    >
      <div className="relative">
        <MiniTrackMap
          trackPoints={activity.trackPoints}
          width={400}
          height={160}
          padding={20}
          className="w-full"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        <div className="absolute top-4 left-4">
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
              'text-white text-xs font-semibold backdrop-blur-md',
              isRunning
                ? 'bg-brand-500/90'
                : 'bg-blue-500/90'
            )}
          >
            <TypeIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>{isRunning ? '跑步' : '骑行'}</span>
          </div>
        </div>

        <button
          onClick={handleFavoriteClick}
          className={cn(
            'absolute top-4 right-4 w-9 h-9 rounded-full',
            'flex items-center justify-center backdrop-blur-md',
            'transition-all duration-200 ease-out',
            isFavorite
              ? 'bg-brand-500 text-white shadow-glow'
              : 'bg-white/80 text-ink-500 hover:bg-white hover:text-brand-500'
          )}
        >
          <motion.div
            animate={isFavorite ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Bookmark
              className={cn('w-4 h-4', isFavorite && 'fill-current')}
              strokeWidth={2.2}
            />
          </motion.div>
        </button>

        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white font-bold text-lg truncate drop-shadow-md">
            {activity.name}
          </h3>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 text-ink-500 text-xs mb-4">
          <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
          <span>{formatDate(activity.startTime, 'MM月dd日 HH:mm')}</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 rounded-2xl bg-ink-50 group-hover:bg-brand-50 transition-colors">
            <div className="flex items-center gap-1 text-brand-500 mb-1">
              <ActivityIcon className="w-4 h-4" strokeWidth={2.2} />
              <span className="text-[11px] font-medium">距离</span>
            </div>
            <p className="font-bold text-ink-800 font-display text-lg leading-none">
              {formatDistance(activity.distance, 2).replace(' km', '')}
            </p>
            <p className="text-[10px] text-ink-400 mt-0.5">km</p>
          </div>

          <div className="flex flex-col items-center p-3 rounded-2xl bg-ink-50 group-hover:bg-teal-50 transition-colors">
            <div className="flex items-center gap-1 text-teal-500 mb-1">
              <Clock className="w-4 h-4" strokeWidth={2.2} />
              <span className="text-[11px] font-medium">时长</span>
            </div>
            <p className="font-bold text-ink-800 font-display text-lg leading-none">
              {formatDuration(activity.duration, false).split(':').slice(0, 2).join(':')}
            </p>
            <p className="text-[10px] text-ink-400 mt-0.5">分:秒</p>
          </div>

          <div className="flex flex-col items-center p-3 rounded-2xl bg-ink-50 group-hover:bg-purple-50 transition-colors">
            <div className="flex items-center gap-1 text-purple-500 mb-1">
              <Flame className="w-4 h-4" strokeWidth={2.2} />
              <span className="text-[11px] font-medium">配速</span>
            </div>
            <p className="font-bold text-ink-800 font-display text-lg leading-none">
              {formatPace(activity.avgPace).split(' ')[0]}
            </p>
            <p className="text-[10px] text-ink-400 mt-0.5">分/km</p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r',
          isRunning
            ? 'from-brand-500 via-brand-400 to-brand-600'
            : 'from-blue-500 via-blue-400 to-blue-600',
          'origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out'
        )}
      />
    </motion.article>
  );
}
