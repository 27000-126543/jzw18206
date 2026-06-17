import { motion } from 'framer-motion';
import {
  MapPin,
  Mountain,
  Star,
  Users,
  Heart,
  Clock,
  Activity,
} from 'lucide-react';
import type { Route } from '../types';
import {
  formatDistance,
  formatDuration,
} from '../utils/formatters';
import { DIFFICULTY_CONFIG } from '../types';
import { cn } from '../lib/utils';

export interface RouteCardProps {
  route: Route;
  onToggleFavorite?: (id: string) => void;
  delay?: number;
}

export default function RouteCard({
  route,
  onToggleFavorite,
  delay = 0,
}: RouteCardProps) {
  const difficultyConfig = DIFFICULTY_CONFIG[route.difficulty];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className="flex-shrink-0 w-72 rounded-2xl bg-white overflow-hidden shadow-soft border border-ink-100 group cursor-pointer"
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={route.coverImage}
          alt={route.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(route.id);
          }}
          className={cn(
            'absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm',
            route.isFavorite
              ? 'bg-red-500 text-white'
              : 'bg-white/80 text-ink-600 hover:bg-white hover:text-red-500'
          )}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-transform',
              route.isFavorite ? 'fill-current' : ''
            )}
          />
        </button>

        <div className="absolute top-3 left-3 flex gap-2">
          <div
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white backdrop-blur-sm"
            style={{ backgroundColor: `${difficultyConfig.color}dd` }}
          >
            {difficultyConfig.label}
          </div>
          <div className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-black/40 backdrop-blur-sm flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {route.type === 'running' ? '跑步' : '骑行'}
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-white shrink-0" />
          <p className="text-sm font-semibold text-white line-clamp-1">
            {route.name}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-xl bg-ink-50">
            <p className="text-[10px] text-ink-400 mb-0.5">距离</p>
            <p className="text-sm font-bold text-ink-800">
              {formatDistance(route.distance, 1)}
            </p>
          </div>
          <div className="text-center p-2 rounded-xl bg-ink-50">
            <p className="text-[10px] text-ink-400 mb-0.5">爬升</p>
            <div className="flex items-center justify-center gap-0.5">
              <Mountain className="h-3 w-3 text-teal-600" />
              <p className="text-sm font-bold text-ink-800">
                {route.elevationGain}m
              </p>
            </div>
          </div>
          <div className="text-center p-2 rounded-xl bg-ink-50">
            <p className="text-[10px] text-ink-400 mb-0.5">时长</p>
            <div className="flex items-center justify-center gap-0.5">
              <Clock className="h-3 w-3 text-brand-600" />
              <p className="text-sm font-bold text-ink-800">
                {formatDuration(route.estimatedDuration, true).split(':').slice(0, 2).join(':')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-ink-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-ink-700">
                {route.rating}
              </span>
              <span className="text-xs text-ink-400">
                ({route.reviewCount})
              </span>
            </div>
            <div className="flex items-center gap-1 text-ink-500">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs">{route.completionCount.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center -space-x-2">
            <img
              src={route.creator.avatar}
              alt={route.creator.name}
              className="w-7 h-7 rounded-full border-2 border-white object-cover"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
