import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity as ActivityIcon,
  Bike,
  Star,
  Users,
  TrendingUp,
  Mountain,
  Heart,
  Navigation,
} from 'lucide-react';
import type { Route } from '@/types';
import { formatDistance } from '@/utils/formatters';
import { getDifficultyColor } from '@/utils/colors';
import { cn } from '@/lib/utils';
import { MiniTrackMap } from '../maps/MiniTrackMap';

interface RouteCardProps {
  route: Route;
  onRun?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  className?: string;
}

export function RouteCard({
  route,
  onRun,
  onToggleFavorite,
  className = '',
}: RouteCardProps) {
  const [isFavorite, setIsFavorite] = useState(route.isFavorite);

  const isRunning = route.type === 'running';
  const TypeIcon = isRunning ? ActivityIcon : Bike;
  const { color: difficultyColor, label: difficultyLabel } = getDifficultyColor(
    route.difficulty
  );

  const handleRunClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRun?.(route.id);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = !isFavorite;
    setIsFavorite(newValue);
    onToggleFavorite?.(route.id);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      const fill = i < fullStars ? '#F59E0B' : i === fullStars && hasHalf ? 'url(#halfStar)' : 'transparent';
      const stroke = i < fullStars || (i === fullStars && hasHalf) ? '#F59E0B' : '#D4D4D4';
      stars.push(
        <Star
          key={i}
          className="w-3.5 h-3.5"
          fill={fill}
          stroke={stroke}
          strokeWidth={1.8}
        />
      );
    }
    return stars;
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group relative overflow-hidden rounded-3xl',
        'bg-white border border-ink-100',
        'shadow-soft hover:shadow-card-hover',
        'transition-all duration-300 ease-out',
        className
      )}
    >
      <div className="relative">
        <div className="relative h-44 overflow-hidden">
          <MiniTrackMap
            trackPoints={route.trackData}
            width={480}
            height={200}
            padding={24}
            colorByPace={false}
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>

        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
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
            <span>{isRunning ? '跑步路线' : '骑行路线'}</span>
          </div>

          <div
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md"
            style={{
              backgroundColor: `${difficultyColor}CC`,
              color: 'white',
            }}
          >
            <span>{difficultyLabel}</span>
          </div>
        </div>

        <button
          onClick={handleFavoriteClick}
          className={cn(
            'absolute top-4 right-4 w-10 h-10 rounded-full',
            'flex items-center justify-center backdrop-blur-md',
            'transition-all duration-200 ease-out',
            isFavorite
              ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
              : 'bg-white/80 text-ink-500 hover:bg-white hover:text-red-500'
          )}
        >
          <motion.div
            animate={isFavorite ? { scale: [1, 1.35, 1] } : {}}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <Heart
              className={cn('w-4.5 h-4.5', isFavorite && 'fill-current')}
              strokeWidth={2.2}
            />
          </motion.div>
        </button>

        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white font-bold text-xl leading-tight drop-shadow-lg line-clamp-2">
            {route.name}
          </h3>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="0" height="0">
              <defs>
                <linearGradient id="halfStar" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex items-center gap-0.5">{renderStars(route.rating)}</div>
            <span className="text-sm font-bold text-ink-700">{route.rating.toFixed(1)}</span>
            <span className="text-xs text-ink-400">({route.reviewCount})</span>
          </div>

          <div className="flex items-center gap-1 text-ink-500">
            <Users className="w-4 h-4" strokeWidth={2} />
            <span className="text-xs font-medium">{route.completionCount.toLocaleString()} 人完成</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-ink-50">
            <div className="flex items-center gap-1 text-brand-500 mb-1">
              <Navigation className="w-3.5 h-3.5" strokeWidth={2.2} />
            </div>
            <p className="font-bold text-ink-800 font-display text-base leading-none">
              {formatDistance(route.distance, 1).replace(' km', '').replace(' m', '')}
            </p>
            <p className="text-[10px] text-ink-400 mt-0.5">
              {formatDistance(route.distance, 1).includes('m') ? '米' : '公里'}
            </p>
          </div>

          <div className="flex flex-col items-center p-2.5 rounded-xl bg-ink-50">
            <div className="flex items-center gap-1 text-teal-500 mb-1">
              <Mountain className="w-3.5 h-3.5" strokeWidth={2.2} />
            </div>
            <p className="font-bold text-ink-800 font-display text-base leading-none">
              {route.elevationGain >= 1000
                ? (route.elevationGain / 1000).toFixed(1)
                : route.elevationGain}
            </p>
            <p className="text-[10px] text-ink-400 mt-0.5">
              {route.elevationGain >= 1000 ? 'km 爬升' : 'm 爬升'}
            </p>
          </div>

          <div className="flex flex-col items-center p-2.5 rounded-xl bg-ink-50">
            <div className="flex items-center gap-1 text-purple-500 mb-1">
              <TrendingUp className="w-3.5 h-3.5" strokeWidth={2.2} />
            </div>
            <p
              className="font-bold font-display text-base leading-none"
              style={{ color: difficultyColor }}
            >
              {difficultyLabel}
            </p>
            <p className="text-[10px] text-ink-400 mt-0.5">难度</p>
          </div>
        </div>

        <button
          onClick={handleRunClick}
          className={cn(
            'relative w-full py-3 rounded-2xl font-bold text-sm text-white overflow-hidden',
            'bg-gradient-to-r from-brand-500 to-brand-600',
            'hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]',
            'transition-all duration-200 ease-out',
            'group/btn'
          )}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <TypeIcon className="w-4 h-4" strokeWidth={2.5} />
            跑这条路线
          </span>
          <motion.div
            className="absolute inset-0 bg-white/20 origin-left"
            initial={{ scaleX: 0 }}
            whileHover={{ scaleX: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </button>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-teal-500 to-brand-600 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"
      />
    </motion.article>
  );
}
