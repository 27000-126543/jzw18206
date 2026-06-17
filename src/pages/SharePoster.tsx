import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Share2,
  MessageCircle,
  Users,
  Link2,
  Copy,
  Check,
  Palette,
  Type,
  SlidersHorizontal,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Trophy,
  Award,
  Zap,
  Map as MapIcon,
  Heart,
  Mountain,
  TrendingUp,
  Zap as ZapIcon,
  Calendar,
  Sun,
  Flame,
  Gauge,
  Timer,
  Activity as ActivityIcon,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import html2canvas from 'html2canvas';

import useStore from '@/store/useStore';
import { MiniTrackMap } from '@/components/maps/MiniTrackMap';
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatCalories,
  formatDate,
} from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type { Activity, TrackPoint, HeartRateSample } from '@/types';

type TemplateId = 'minimal' | 'dynamic' | 'scenic' | 'social';
type ThemeId = 'orange' | 'cyan' | 'blue' | 'dark' | 'pink';
type BackgroundType = 'gradient' | 'scenic' | 'upload';

interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
}

interface ThemeConfig {
  id: ThemeId;
  name: string;
  primary: string;
  secondary: string;
  gradient: string;
  textPrimary: string;
  textSecondary: string;
  background: string;
  accent: string;
}

interface DataSwitches {
  distance: boolean;
  duration: boolean;
  pace: boolean;
  elevation: boolean;
  heartRate: boolean;
  calories: boolean;
  date: boolean;
  weather: boolean;
}

interface DecorationSwitches {
  trackMap: boolean;
  heartCurve: boolean;
  elevationProfile: boolean;
  badges: boolean;
  pb: boolean;
}

const TEMPLATES: TemplateConfig[] = [
  { id: 'minimal', name: '简约数据型', description: '白底+品牌色点缀，大数据卡片' },
  { id: 'dynamic', name: '动感运动型', description: '渐变背景+大图轨迹，速度感' },
  { id: 'scenic', name: '风景诗意型', description: '风景背景+玻璃拟态，文艺风格' },
  { id: 'social', name: '社交炫耀型', description: '品牌渐变+大数字，排名徽章' },
];

const THEMES: ThemeConfig[] = [
  {
    id: 'orange',
    name: '活力橙',
    primary: '#FF6B35',
    secondary: '#F7931E',
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    textPrimary: '#1A1A2E',
    textSecondary: '#737373',
    background: '#FFFBF7',
    accent: '#FFD1B0',
  },
  {
    id: 'cyan',
    name: '清新青',
    primary: '#0D9488',
    secondary: '#2DD4BF',
    gradient: 'linear-gradient(135deg, #0D9488 0%, #2DD4BF 100%)',
    textPrimary: '#042F2E',
    textSecondary: '#115E59',
    background: '#F0FDFA',
    accent: '#99F6E4',
  },
  {
    id: 'blue',
    name: '电光蓝',
    primary: '#3B82F6',
    secondary: '#6366F1',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
    textPrimary: '#1E3A5F',
    textSecondary: '#64748B',
    background: '#EFF6FF',
    accent: '#BFDBFE',
  },
  {
    id: 'dark',
    name: '暗夜黑',
    primary: '#8B5CF6',
    secondary: '#EC4899',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    textPrimary: '#F5F5F5',
    textSecondary: '#A3A3A3',
    background: '#0F0F1A',
    accent: '#4A5568',
  },
  {
    id: 'pink',
    name: '樱花粉',
    primary: '#EC4899',
    secondary: '#F472B6',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
    textPrimary: '#831843',
    textSecondary: '#9D174D',
    background: '#FDF2F8',
    accent: '#FBCFE8',
  },
];

const SCENIC_BACKGROUNDS = [
  { id: 1, gradient: 'linear-gradient(180deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' },
  { id: 2, gradient: 'linear-gradient(180deg, #2193b0 0%, #6dd5ed 100%)' },
  { id: 3, gradient: 'linear-gradient(180deg, #ff9966 0%, #ff5e62 100%)' },
  { id: 4, gradient: 'linear-gradient(180deg, #134E5E 0%, #71B280 100%)' },
  { id: 5, gradient: 'linear-gradient(180deg, #434343 0%, #000000 100%)' },
  { id: 6, gradient: 'linear-gradient(180deg, #f7971e 0%, #ffd200 100%)' },
];

function MockQRCode({ size = 64, color = '#1A1A2E' }: { size?: number; color?: string }) {
  const cells = 21;
  const modules = useMemo(() => {
    const grid: boolean[][] = [];
    for (let i = 0; i < cells; i++) {
      grid[i] = [];
      for (let j = 0; j < cells; j++) {
        if ((i < 7 && j < 7) || (i < 7 && j >= cells - 7) || (i >= cells - 7 && j < 7)) {
          const isOuter = i === 0 || i === 6 || j === 0 || j === 6 ||
            (i >= cells - 7 && (i === cells - 7 || i === cells - 1)) ||
            (j >= cells - 7 && (j === cells - 7 || j === cells - 1));
          grid[i][j] = isOuter || (i >= 2 && i <= 4 && j >= 2 && j <= 4 &&
            (i === 2 || i === 4 || j === 2 || j === 4));
        } else {
          grid[i][j] = Math.random() > 0.5;
        }
      }
    }
    return grid;
  }, []);

  const cellSize = size / cells;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" rx={4} />
      {modules.map((row, i) =>
        row.map((cell, j) =>
          cell ? (
            <rect
              key={`${i}-${j}`}
              x={j * cellSize}
              y={i * cellSize}
              width={cellSize}
              height={cellSize}
              fill={color}
            />
          ) : null
        )
      )}
    </svg>
  );
}

function MiniHeartRateCurve({
  samples,
  width = 200,
  height = 60,
  color = '#EF4444',
}: {
  samples?: HeartRateSample[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const points = useMemo(() => {
    if (!samples || samples.length < 2) return '';
    const maxBpm = Math.max(...samples.map((s) => s.bpm));
    const minBpm = Math.min(...samples.map((s) => s.bpm));
    const range = maxBpm - minBpm || 1;
    return samples
      .map((s, i) => {
        const x = (i / (samples.length - 1)) * width;
        const y = height - ((s.bpm - minBpm) / range) * (height - 10) - 5;
        return `${x},${y}`;
      })
      .join(' ');
  }, [samples, width, height]);

  if (!points) {
    return (
      <svg width={width} height={height}>
        <rect width={width} height={height} fill="none" />
      </svg>
    );
  }

  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${height} ${points} ${width},${height}`}
        fill="url(#hrGradient)"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MiniElevationProfile({
  trackPoints,
  width = 200,
  height = 60,
  color = '#0D9488',
}: {
  trackPoints: TrackPoint[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const areaPath = useMemo(() => {
    if (!trackPoints || trackPoints.length < 2) return '';
    const maxElev = Math.max(...trackPoints.map((p) => p.elevation));
    const minElev = Math.min(...trackPoints.map((p) => p.elevation));
    const range = maxElev - minElev || 1;
    const step = Math.max(1, Math.floor(trackPoints.length / 50));
    const sampled: string[] = [];
    for (let i = 0; i < trackPoints.length; i += step) {
      const idx = Math.min(i, trackPoints.length - 1);
      const p = trackPoints[idx];
      const x = (idx / (trackPoints.length - 1)) * width;
      const y = height - ((p.elevation - minElev) / range) * (height - 10) - 5;
      sampled.push(`${x},${y}`);
    }
    return sampled.join(' ');
  }, [trackPoints, width, height]);

  if (!areaPath) {
    return (
      <svg width={width} height={height}>
        <rect width={width} height={height} fill="none" />
      </svg>
    );
  }

  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${areaPath} ${width},${height}`}
        fill="url(#elevGradient)"
      />
      <polyline
        points={areaPath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Template1Minimal({
  activity,
  theme,
  customTexts,
  dataSwitches,
  decorationSwitches,
  user,
}: {
  activity: Activity;
  theme: ThemeConfig;
  customTexts: { title: string; slogan: string; signature: string };
  dataSwitches: DataSwitches;
  decorationSwitches: DecorationSwitches;
  user: { name: string; avatar: string; level: number };
}) {
  const isDark = theme.id === 'dark';
  return (
    <div
      className={cn(
        'w-full h-full flex flex-col p-6 relative overflow-hidden',
        isDark ? 'bg-ink-900' : 'bg-white'
      )}
    >
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
        style={{ background: theme.gradient, transform: 'translate(30%, -30%)' }}
      />
      <div className="flex items-center gap-3 mb-5 relative z-10">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: theme.gradient }}
        >
          <ActivityIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3
            className={cn(
              'font-bold font-display text-base',
              isDark ? 'text-white' : 'text-ink-800'
            )}
          >
            TrackPath
          </h3>
          <p className={cn('text-xs', isDark ? 'text-ink-400' : 'text-ink-400')}>
            {formatDate(activity.startTime, 'yyyy.MM.dd')}
          </p>
        </div>
      </div>

      <div className="text-center mb-4 relative z-10">
        <h2
          className={cn(
            'font-bold font-display text-xl mb-1',
            isDark ? 'text-white' : 'text-ink-800'
          )}
        >
          {customTexts.title}
        </h2>
        <p className="text-sm" style={{ color: theme.primary }}>
          {customTexts.slogan}
        </p>
      </div>

      {decorationSwitches.trackMap && (
        <div className="rounded-2xl overflow-hidden mb-5 relative z-10 shadow-lg">
          <MiniTrackMap
            trackPoints={activity.trackPoints}
            width={280}
            height={140}
            className="w-full"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
        {dataSwitches.distance && (
          <div
            className={cn(
              'rounded-xl p-3',
              isDark ? 'bg-ink-800/60' : 'bg-ink-50'
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Gauge className="w-3.5 h-3.5" style={{ color: theme.primary }} />
              <span className={cn('text-[10px] font-medium', isDark ? 'text-ink-400' : 'text-ink-500')}>
                距离
              </span>
            </div>
            <p className={cn('font-display font-bold text-lg', isDark ? 'text-white' : 'text-ink-800')}>
              {(activity.distance / 1000).toFixed(2)}
              <span className={cn('text-xs font-normal ml-0.5', isDark ? 'text-ink-400' : 'text-ink-400')}>
                km
              </span>
            </p>
          </div>
        )}
        {dataSwitches.duration && (
          <div
            className={cn(
              'rounded-xl p-3',
              isDark ? 'bg-ink-800/60' : 'bg-ink-50'
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Timer className="w-3.5 h-3.5" style={{ color: theme.primary }} />
              <span className={cn('text-[10px] font-medium', isDark ? 'text-ink-400' : 'text-ink-500')}>
                时长
              </span>
            </div>
            <p className={cn('font-display font-bold text-lg', isDark ? 'text-white' : 'text-ink-800')}>
              {formatDuration(activity.duration, false)}
            </p>
          </div>
        )}
        {dataSwitches.pace && (
          <div
            className={cn(
              'rounded-xl p-3',
              isDark ? 'bg-ink-800/60' : 'bg-ink-50'
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <ZapIcon className="w-3.5 h-3.5" style={{ color: theme.primary }} />
              <span className={cn('text-[10px] font-medium', isDark ? 'text-ink-400' : 'text-ink-500')}>
                配速
              </span>
            </div>
            <p className={cn('font-display font-bold text-lg', isDark ? 'text-white' : 'text-ink-800')}>
              {formatPace(activity.avgPace).split(' ')[0]}
            </p>
          </div>
        )}
        {dataSwitches.elevation && (
          <div
            className={cn(
              'rounded-xl p-3',
              isDark ? 'bg-ink-800/60' : 'bg-ink-50'
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Mountain className="w-3.5 h-3.5" style={{ color: theme.primary }} />
              <span className={cn('text-[10px] font-medium', isDark ? 'text-ink-400' : 'text-ink-500')}>
                爬升
              </span>
            </div>
            <p className={cn('font-display font-bold text-lg', isDark ? 'text-white' : 'text-ink-800')}>
              +{activity.elevationGain.toFixed(0)}
              <span className={cn('text-xs font-normal ml-0.5', isDark ? 'text-ink-400' : 'text-ink-400')}>
                m
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-4 relative z-10">
        {decorationSwitches.heartCurve && dataSwitches.heartRate && activity.heartRateSamples && (
          <div
            className={cn(
              'flex-1 rounded-xl p-3',
              isDark ? 'bg-ink-800/60' : 'bg-ink-50'
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Heart className="w-3.5 h-3.5 text-red-500" />
              <span className={cn('text-[10px] font-medium', isDark ? 'text-ink-400' : 'text-ink-500')}>
                心率 {activity.avgHeartRate} bpm
              </span>
            </div>
            <MiniHeartRateCurve
              samples={activity.heartRateSamples.slice(0, 40)}
              width={120}
              height={32}
            />
          </div>
        )}
        {decorationSwitches.elevationProfile && (
          <div
            className={cn(
              'flex-1 rounded-xl p-3',
              isDark ? 'bg-ink-800/60' : 'bg-ink-50'
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: theme.primary }} />
              <span className={cn('text-[10px] font-medium', isDark ? 'text-ink-400' : 'text-ink-500')}>
                海拔剖面
              </span>
            </div>
            <MiniElevationProfile
              trackPoints={activity.trackPoints}
              width={120}
              height={32}
              color={theme.primary}
            />
          </div>
        )}
      </div>

      {(dataSwitches.calories || dataSwitches.weather || dataSwitches.date) && (
        <div
          className={cn(
            'flex items-center justify-around py-2.5 px-3 rounded-xl mb-4',
            isDark ? 'bg-ink-800/40' : 'bg-ink-50'
          )}
        >
          {dataSwitches.calories && (
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className={cn('text-xs font-semibold', isDark ? 'text-white' : 'text-ink-700')}>
                {activity.calories} kcal
              </span>
            </div>
          )}
          {dataSwitches.date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" style={{ color: theme.primary }} />
              <span className={cn('text-xs font-semibold', isDark ? 'text-white' : 'text-ink-700')}>
                {formatDate(activity.startTime, 'MM-dd')}
              </span>
            </div>
          )}
          {dataSwitches.weather && activity.weather && (
            <div className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className={cn('text-xs font-semibold', isDark ? 'text-white' : 'text-ink-700')}>
                {activity.weather.temperature}°C
              </span>
            </div>
          )}
        </div>
      )}

      {decorationSwitches.badges && (
        <div className="flex gap-2 mb-4 justify-center">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: theme.gradient }}
          >
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)' }}
          >
            <Award className="w-4 h-4 text-white" />
          </div>
          {decorationSwitches.pb && (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center bg-gold-gradient"
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center gap-3 pt-4 border-t relative z-10" style={{ borderColor: isDark ? '#2D3748' : '#E5E5E5' }}>
        <div className="relative">
          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
          <div
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
            style={{ background: theme.gradient }}
          >
            {user.level}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('font-semibold text-sm truncate', isDark ? 'text-white' : 'text-ink-800')}>
            {user.name}
          </p>
          <p className={cn('text-xs truncate', isDark ? 'text-ink-400' : 'text-ink-500')}>
            {customTexts.signature}
          </p>
        </div>
        <MockQRCode size={48} color={isDark ? '#F5F5F5' : '#1A1A2E'} />
      </div>
    </div>
  );
}

function Template2Dynamic({
  activity,
  theme,
  customTexts,
  dataSwitches,
  decorationSwitches,
  user,
}: {
  activity: Activity;
  theme: ThemeConfig;
  customTexts: { title: string; slogan: string; signature: string };
  dataSwitches: DataSwitches;
  decorationSwitches: DecorationSwitches;
  user: { name: string; avatar: string; level: number };
}) {
  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden" style={{ background: theme.gradient }}>
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
        }}
      />
      <svg className="absolute top-10 right-0 w-64 h-64 opacity-20" viewBox="0 0 200 200">
        {[...Array(8)].map((_, i) => (
          <line
            key={i}
            x1="0"
            y1={i * 25}
            x2="200"
            y2={i * 25 + 60}
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}
      </svg>

      <div className="relative z-10 p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ActivityIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold font-display text-white">TrackPath</span>
          </div>
          <div className="text-white/80 text-xs font-medium">
            {formatDate(activity.startTime, 'MM.dd')}
          </div>
        </div>

        <div
          className="mb-4"
          style={{ transform: 'rotate(-3deg)' }}
        >
          <h1 className="font-display font-black text-4xl text-white drop-shadow-lg">
            {(activity.distance / 1000).toFixed(1)}
            <span className="text-2xl font-bold ml-1 opacity-80">KM</span>
          </h1>
          <p className="text-white/90 text-lg font-display font-bold mt-1">
            {customTexts.title}
          </p>
        </div>

        {decorationSwitches.trackMap && (
          <div
            className="rounded-3xl overflow-hidden mb-5 shadow-2xl" style={{ transform: 'rotate(-1deg)' }}>
            <MiniTrackMap
              trackPoints={activity.trackPoints}
              width={280}
              height={130}
              className="w-full"
            />
          </div>
        )}

        <div
          className="grid grid-cols-3 gap-2 mb-4"
          style={{ transform: 'rotate(1deg)' }}
        >
          {dataSwitches.duration && (
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 text-center">
              <Timer className="w-4 h-4 text-white/80 mx-auto mb-1" />
              <p className="text-white font-display font-bold text-base">
                {formatDuration(activity.duration, false)}
              </p>
              <p className="text-white/60 text-[10px]">时长</p>
            </div>
          )}
          {dataSwitches.pace && (
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 text-center">
              <ZapIcon className="w-4 h-4 text-white/80 mx-auto mb-1" />
              <p className="text-white font-display font-bold text-base">
                {formatPace(activity.avgPace).split(' ')[0]}
              </p>
              <p className="text-white/60 text-[10px]">配速</p>
            </div>
          )}
          {dataSwitches.elevation && (
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 text-center">
              <Mountain className="w-4 h-4 text-white/80 mx-auto mb-1" />
              <p className="text-white font-display font-bold text-base">
                +{activity.elevationGain.toFixed(0)}m
              </p>
              <p className="text-white/60 text-[10px]">爬升</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          {decorationSwitches.heartCurve && dataSwitches.heartRate && activity.heartRateSamples && (
            <div className="flex-1 bg-white/15 backdrop-blur-md rounded-2xl p-2.5">
              <div className="flex items-center justify-between mb-1">
                <Heart className="w-3.5 h-3.5 text-white/80" />
                <span className="text-white text-xs font-bold">
                  {activity.avgHeartRate}
                </span>
              </div>
              <MiniHeartRateCurve
                samples={activity.heartRateSamples.slice(0, 40)}
                width={100}
                height={28}
                color="#FECACA"
              />
            </div>
          )}
          {decorationSwitches.elevationProfile && (
            <div className="flex-1 bg-white/15 backdrop-blur-md rounded-2xl p-2.5">
              <div className="flex items-center justify-between mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-white/80" />
                <span className="text-white text-xs font-bold">
                  {activity.maxElevation.toFixed(0)}m
                </span>
              </div>
              <MiniElevationProfile
                trackPoints={activity.trackPoints}
                width={100}
                height={28}
                color="#A7F3D0"
              />
            </div>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 mb-4 flex items-center justify-around">
          {dataSwitches.calories && (
            <div className="text-center">
              <Flame className="w-4 h-4 text-white/80 mx-auto mb-0.5" />
              <p className="text-white text-xs font-bold">{activity.calories}</p>
              <p className="text-white/50 text-[9px]">kcal</p>
            </div>
          )}
          {dataSwitches.weather && activity.weather && (
            <div className="text-center">
              <Sun className="w-4 h-4 text-white/80 mx-auto mb-0.5" />
              <p className="text-white text-xs font-bold">{activity.weather.temperature}°</p>
              <p className="text-white/50 text-[9px]">{activity.weather.condition}</p>
            </div>
          )}
          {decorationSwitches.pb && (
            <div className="text-center">
              <Sparkles className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
              <p className="text-white text-xs font-bold">PB</p>
              <p className="text-white/50 text-[9px]">新纪录</p>
            </div>
          )}
          {decorationSwitches.badges && (
            <div className="text-center">
              <Award className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
              <p className="text-white text-xs font-bold">TOP</p>
              <p className="text-white/50 text-[9px]">5%</p>
            </div>
          )}
        </div>

        <p className="text-white/90 text-center text-sm font-medium italic mb-4">
          「{customTexts.slogan}」
        </p>

        <div className="mt-auto flex items-center gap-3 pt-3 border-t border-white/20">
          <div className="relative">
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-white/50" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {user.name} <span className="text-white/60">Lv.{user.level}</span>
            </p>
            <p className="text-white/60 text-[11px] truncate">{customTexts.signature}</p>
          </div>
          <MockQRCode size={44} color={theme.primary} />
        </div>
      </div>
    </div>
  );
}

function Template3Scenic({
  activity,
  theme,
  customTexts,
  dataSwitches,
  decorationSwitches,
  user,
  scenicBg,
}: {
  activity: Activity;
  theme: ThemeConfig;
  customTexts: { title: string; slogan: string; signature: string };
  dataSwitches: DataSwitches;
  decorationSwitches: DecorationSwitches;
  user: { name: string; avatar: string; level: number };
  scenicBg: string;
}) {
  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: scenicBg }} />
      <div className="absolute inset-0 bg-black/20" />

      <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%'
      }} />

      <svg className="absolute bottom-0 left-0 right-0 w-full h-32 opacity-30" viewBox="0 0 400 100" preserveAspectRatio="none">
        <path d="M0,100 L0,60 Q50,40 100,55 T200,45 T300,50 T400,40 L400,100 Z" fill="white" />
        <path d="M0,100 L0,75 Q80,55 160,70 T320,65 T400,60 L400,100 Z" fill="white" opacity="0.7" />
      </svg>

      <div className="relative z-10 p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <MapIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white text-sm">TrackPath</span>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[10px] font-medium">
            {formatDate(activity.startTime, 'yyyy.MM.dd')}
          </div>
        </div>

        <div className="text-center mb-5">
          <p className="text-white/70 text-xs tracking-widest uppercase mb-1.5">
            {activity.type === 'running' ? 'RUNNING' : 'CYCLING'}
          </p>
          <h1 className="font-display font-black text-5xl text-white drop-shadow-xl tracking-tight">
            {(activity.distance / 1000).toFixed(2)}
            <span className="text-2xl font-bold ml-1 opacity-70">km</span>
          </h1>
          <p className="text-white/80 mt-1 font-display text-sm">{customTexts.title}</p>
        </div>

        {decorationSwitches.trackMap && (
          <div className="rounded-3xl overflow-hidden mb-5 shadow-2xl border border-white/20 backdrop-blur-sm">
            <MiniTrackMap
              trackPoints={activity.trackPoints}
              width={280}
              height={120}
              className="w-full"
            />
          </div>
        )}

        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-4 mb-4 border border-white/20 shadow-glass">
          <div className="grid grid-cols-4 gap-2 text-center">
            {dataSwitches.duration && (
              <div>
                <p className="text-white font-display font-bold text-lg leading-none">
                  {formatDuration(activity.duration, false)}
                </p>
                <p className="text-white/60 text-[9px] mt-1">时长</p>
              </div>
            )}
            {dataSwitches.pace && (
              <div>
                <p className="text-white font-display font-bold text-lg leading-none">
                  {formatPace(activity.avgPace).split(' ')[0]}
                </p>
                <p className="text-white/60 text-[9px] mt-1">配速</p>
              </div>
            )}
            {dataSwitches.elevation && (
              <div>
                <p className="text-white font-display font-bold text-lg leading-none">
                  +{activity.elevationGain.toFixed(0)}
                </p>
                <p className="text-white/60 text-[9px] mt-1">m</p>
              </div>
            )}
            {dataSwitches.heartRate && activity.avgHeartRate && (
              <div>
                <p className="text-white font-display font-bold text-lg leading-none">
                  {activity.avgHeartRate}
                </p>
                <p className="text-white/60 text-[9px] mt-1">bpm</p>
              </div>
            )}
          </div>
          <div className="h-px bg-white/15 my-3" />
          <div className="flex items-center justify-around">
            {dataSwitches.calories && (
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-300" />
                <span className="text-white text-xs font-semibold">{activity.calories} kcal</span>
              </div>
            )}
            {dataSwitches.weather && activity.weather && (
              <div className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-white text-xs font-semibold">
                  {activity.weather.temperature}° {activity.weather.condition}
                </span>
              </div>
            )}
            {decorationSwitches.pb && (
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-white text-xs font-semibold">PB</span>
              </div>
            )}
          </div>
        </div>

        {(decorationSwitches.heartCurve || decorationSwitches.elevationProfile) && (
          <div className="flex gap-2 mb-4">
            {decorationSwitches.heartCurve && activity.heartRateSamples && (
              <div className="flex-1 backdrop-blur-xl bg-white/10 rounded-2xl p-2.5 border border-white/15">
                <div className="flex items-center gap-1 mb-1">
                  <Heart className="w-3 h-3 text-red-300" />
                  <span className="text-white/70 text-[10px] font-medium">心率曲线</span>
                </div>
                <MiniHeartRateCurve
                  samples={activity.heartRateSamples.slice(0, 40)}
                  width={100}
                  height={28}
                  color="#FCA5A5"
                />
              </div>
            )}
            {decorationSwitches.elevationProfile && (
              <div className="flex-1 backdrop-blur-xl bg-white/10 rounded-2xl p-2.5 border border-white/15">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3 text-emerald-300" />
                  <span className="text-white/70 text-[10px] font-medium">海拔</span>
                </div>
                <MiniElevationProfile
                  trackPoints={activity.trackPoints}
                  width={100}
                  height={28}
                  color="#6EE7B7"
                />
              </div>
            )}
          </div>
        )}

        <p className="text-white/85 text-center italic font-display text-base mb-4 leading-relaxed">
          「{customTexts.slogan}」
        </p>

        {decorationSwitches.badges && (
          <div className="flex gap-2 justify-center mb-4">
            <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center shadow-lg">
              <Trophy className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="w-8 h-8 rounded-full bg-silver-gradient flex items-center justify-center shadow-lg">
              <Award className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center gap-3 pt-3 border-t border-white/15">
          <div className="relative">
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-white/40" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {user.name} <span className="text-white/60 text-[11px]">Lv.{user.level}</span>
            </p>
            <p className="text-white/50 text-[11px] truncate">{customTexts.signature}</p>
          </div>
          <MockQRCode size={42} color="#ffffff" />
        </div>
      </div>
    </div>
  );
}

function Template4Social({
  activity,
  theme,
  customTexts,
  dataSwitches,
  decorationSwitches,
  user,
}: {
  activity: Activity;
  theme: ThemeConfig;
  customTexts: { title: string; slogan: string; signature: string };
  dataSwitches: DataSwitches;
  decorationSwitches: DecorationSwitches;
  user: { name: string; avatar: string; level: number };
}) {
  const rank = useMemo(() => {
    const km = activity.distance / 1000;
    if (km >= 42) return { label: '精英', rank: 1, gradient: 'bg-gold-gradient' };
    if (km >= 21) return { label: '优秀', rank: 2, gradient: 'bg-silver-gradient' };
    if (km >= 10) return { label: '出色', rank: 3, gradient: 'bg-bronze-gradient' };
    return { label: '坚持', rank: null, gradient: 'bg-brand-gradient' };
  }, [activity.distance]);

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden" style={{ background: theme.gradient }}>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-20 right-5 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-white/5 blur-2xl" />
      </div>

      <div className="relative z-10 p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
              <ActivityIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display font-black text-white text-base leading-none">
                TrackPath
              </p>
              <p className="text-white/60 text-[10px] mt-0.5">运动成就</p>
            </div>
          </div>
          {rank.rank && (
            <div className={cn('w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-xl', rank.gradient)}>
              <span className="text-white text-[9px] font-bold opacity-90">RANK</span>
              <span className="text-white font-black font-display text-xl leading-none">
                {rank.rank}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-start justify-between mb-5 px-1">
          <div className="relative">
            <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-2xl object-cover ring-4 ring-white/30 shadow-xl" />
            <div
              className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-black text-white shadow-lg"
              style={{ background: theme.gradient }}
            >
              Lv.{user.level}
            </div>
          </div>
          <div className="text-right flex-1 ml-4">
            <p className="text-white font-bold text-base">{user.name}</p>
            <p className="text-white/70 text-xs">{customTexts.signature}</p>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-5 mb-4 border border-white/20 shadow-2xl">
          <div className="text-center mb-3">
            <p className="text-white/60 text-xs tracking-widest uppercase font-semibold">
              {customTexts.title}
            </p>
          </div>
          <div className="text-center">
            <span className="text-white font-black font-display text-6xl leading-none drop-shadow-lg">
              {(activity.distance / 1000).toFixed(2)}
            </span>
            <span className="text-white/80 font-bold font-display text-xl ml-1">KM</span>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            {rank.rank && (
              <div className={cn('px-3 py-1 rounded-full text-[10px] font-black text-white', rank.gradient)}>
                {rank.label}跑者
              </div>
            )}
            {decorationSwitches.pb && (
              <div className="px-3 py-1 bg-yellow-400/90 rounded-full text-[10px] font-black text-yellow-900 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                PB达成
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {dataSwitches.duration && (
            <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-3 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <Timer className="w-3.5 h-3.5 text-white/70" />
                <span className="text-white/60 text-[10px] font-medium">总时长</span>
              </div>
              <p className="text-white font-display font-black text-2xl leading-tight">
                {formatDuration(activity.duration, false)}
              </p>
            </div>
          )}
          {dataSwitches.pace && (
            <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-3 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <ZapIcon className="w-3.5 h-3.5 text-white/70" />
                <span className="text-white/60 text-[10px] font-medium">平均配速</span>
              </div>
              <p className="text-white font-display font-black text-2xl leading-tight">
                {formatPace(activity.avgPace).split(' ')[0]}
              </p>
            </div>
          )}
        </div>

        {decorationSwitches.trackMap && (
          <div className="rounded-2xl overflow-hidden mb-4 border border-white/15 shadow-lg">
            <MiniTrackMap
              trackPoints={activity.trackPoints}
              width={280}
              height={100}
              className="w-full"
            />
          </div>
        )}

        <div className="flex gap-2 mb-4">
          {dataSwitches.calories && (
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl py-2 px-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-300" />
              <div>
                <p className="text-white font-bold text-sm">{activity.calories}</p>
                <p className="text-white/50 text-[9px]">kcal</p>
              </div>
            </div>
          )}
          {dataSwitches.elevation && (
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl py-2 px-3 flex items-center gap-2">
              <Mountain className="w-4 h-4 text-emerald-300" />
              <div>
                <p className="text-white font-bold text-sm">+{activity.elevationGain.toFixed(0)}</p>
                <p className="text-white/50 text-[9px]">m 爬升</p>
              </div>
            </div>
          )}
          {dataSwitches.heartRate && activity.avgHeartRate && (
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl py-2 px-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-300" />
              <div>
                <p className="text-white font-bold text-sm">{activity.avgHeartRate}</p>
                <p className="text-white/50 text-[9px]">bpm</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            {decorationSwitches.heartCurve && activity.heartRateSamples && (
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-white/60 text-[9px]">心率</span>
                  <span className="text-white font-bold text-[10px]">{activity.avgHeartRate} bpm</span>
                </div>
                <MiniHeartRateCurve
                  samples={activity.heartRateSamples.slice(0, 40)}
                  width={110}
                  height={26}
                  color="#FCA5A5"
                />
              </div>
            )}
            {decorationSwitches.elevationProfile && (
              <div className="w-px h-10 bg-white/15" />
            )}
            {decorationSwitches.elevationProfile && (
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-white/60 text-[9px]">海拔</span>
                  <span className="text-white font-bold text-[10px]">{activity.maxElevation.toFixed(0)} m</span>
                </div>
                <MiniElevationProfile
                  trackPoints={activity.trackPoints}
                  width={110}
                  height={26}
                  color="#6EE7B7"
                />
              </div>
            )}
          </div>
        </div>

        <p className="text-white text-center font-bold italic mb-4 text-sm">
          「{customTexts.slogan}」
        </p>

        {decorationSwitches.badges && (
          <div className="flex gap-2 justify-center mb-4">
            <div className="w-9 h-9 rounded-full bg-gold-gradient flex items-center justify-center shadow-lg">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div className="w-9 h-9 rounded-full bg-silver-gradient flex items-center justify-center shadow-lg">
              <Award className="w-4 h-4 text-white" />
            </div>
            <div className="w-9 h-9 rounded-full bg-bronze-gradient flex items-center justify-center shadow-lg">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center gap-3 pt-3 border-t border-white/15">
          <div className="flex-1">
            <p className="text-white/60 text-[10px] text-right mb-1">
              {formatDate(activity.startTime, 'yyyy.MM.dd HH:mm')}
            </p>
            <p className="text-white/50 text-[9px] text-right">扫码查看详情</p>
          </div>
          <MockQRCode size={48} color="#ffffff" />
        </div>
      </div>
    </div>
  );
}

export default function SharePoster() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const posterRef = useRef<HTMLDivElement>(null);

  const activity = useStore((state) => state.getActivityById(id ?? ''));
  const user = useStore((state) => state.user);

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('minimal');
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('orange');
  const [activePanel, setActivePanel] = useState<'template' | 'theme' | 'text' | 'data' | 'decoration' | 'background'>('template');
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('gradient');
  const [selectedScenicBg, setSelectedScenicBg] = useState(0);
  const [downloadScale, setDownloadScale] = useState<2 | 3>(2);
  const [copied, setCopied] = useState(false);

  const [customTexts, setCustomTexts] = useState({
    title: activity?.name ?? '我的运动',
    slogan: '每一步都算数',
    signature: '坚持就是胜利 💪',
  });

  const [dataSwitches, setDataSwitches] = useState<DataSwitches>({
    distance: true,
    duration: true,
    pace: true,
    elevation: true,
    heartRate: true,
    calories: true,
    date: true,
    weather: true,
  });

  const [decorationSwitches, setDecorationSwitches] = useState<DecorationSwitches>({
    trackMap: true,
    heartCurve: true,
    elevationProfile: true,
    badges: true,
    pb: true,
  });

  const theme = THEMES.find((t) => t.id === selectedTheme) ?? THEMES[0];
  const scenicBg = SCENIC_BACKGROUNDS[selectedScenicBg]?.gradient ?? SCENIC_BACKGROUNDS[0].gradient;

  const toggleDataSwitch = (key: keyof DataSwitches) => {
    setDataSwitches((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDecorationSwitch = (key: keyof DecorationSwitches) => {
    setDecorationSwitches((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownload = async () => {
    if (!posterRef.current) return;
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: downloadScale,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
      });
      const link = document.createElement('a');
      link.download = `trackpath-poster-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      console.log('海报下载成功');
      alert('海报已开始下载！');
    } catch (error) {
      console.error('生成海报失败:', error);
      alert('生成海报失败，请重试');
    }
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('链接已复制到剪贴板（mock）');
    }
  };

  if (!activity) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-ink-100 flex items-center justify-center mx-auto mb-4">
          <MapIcon className="w-10 h-10 text-ink-400" />
        </div>
          <p className="text-ink-600 font-medium">未找到运动数据</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-5 py-2.5 rounded-xl bg-brand-gradient text-white font-medium"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  const userInfo = { name: user.name, avatar: user.avatar, level: user.level };
  const templateProps = {
    activity,
    theme,
    customTexts,
    dataSwitches,
    decorationSwitches,
    user: userInfo,
  };

  const renderTemplate = () => {
    switch (selectedTemplate) {
      case 'minimal':
        return <Template1Minimal {...templateProps} />;
      case 'dynamic':
        return <Template2Dynamic {...templateProps} />;
      case 'scenic':
        return <Template3Scenic {...templateProps} scenicBg={scenicBg} />;
      case 'social':
        return <Template4Social {...templateProps} />;
    }
  };

  const panels = [
    { id: 'template' as const, icon: LayoutIcon, label: '模板' },
    { id: 'theme' as const, icon: Palette, label: '配色' },
    { id: 'text' as const, icon: Type, label: '文案' },
    { id: 'data' as const, icon: SlidersHorizontal, label: '数据' },
    { id: 'decoration' as const, icon: Sparkles, label: '装饰' },
    { id: 'background' as const, icon: ImageIcon, label: '背景' },
  ];

  return (
    <div className="min-h-screen bg-ink-50 flex">
      <div className="w-1/2 min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-ink-100/50 to-white relative overflow-hidden">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-ink-600 hover:bg-ink-50 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="absolute top-6 right-6">
          <div className="px-4 py-2 rounded-full bg-white shadow-sm flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: theme.gradient }}
            />
            <span className="text-sm font-semibold text-ink-700">
              {TEMPLATES.find((t) => t.id === selectedTemplate)?.name}
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 300, damping: 25 }}
          className="relative"
        >
          <div className="absolute -inset-6 rounded-[3rem]" style={{ background: theme.gradient, opacity: 0.15, filter: 'blur(30px)' }} />

          <div className="relative w-[340px] h-[606px] rounded-[3rem] bg-ink-900 p-3 shadow-2xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-ink-900 rounded-b-2xl z-20" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-1.5 rounded-full bg-ink-700 z-20" />
            <div className="absolute top-3 right-16 w-2 h-2 rounded-full bg-ink-700 z-20" />

            <div
              ref={posterRef}
              className="w-full h-full rounded-[2.25rem] overflow-hidden bg-white"
              style={{ aspectRatio: '9/16' }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedTemplate + selectedTheme + selectedScenicBg}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="w-full h-full"
                >
                  {renderTemplate()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex items-center gap-3"
        >
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white shadow-sm">
            <span className="text-xs text-ink-500">比例</span>
            <span className="text-xs font-bold text-ink-700">9 : 16</span>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white shadow-sm">
            <span className="text-xs text-ink-500">分辨率</span>
            <span className="text-xs font-bold text-ink-700">
              {downloadScale === 2 ? '1080×1920 (2x)' : '1620×2880 (3x)'}
            </span>
          </div>
        </motion.div>
      </div>

      <div className="w-1/2 min-h-screen bg-white border-l border-ink-100 flex flex-col">
        <div className="p-6 border-b border-ink-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black font-display text-ink-800">生成分享海报</h1>
            <p className="text-sm text-ink-500 mt-1">自定义你的运动成就海报</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-ink-50 flex items-center justify-center text-ink-500 hover:bg-ink-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 border-b border-ink-100">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {panels.map((panel) => {
                const Icon = panel.icon;
                const isActive = activePanel === panel.id;
                return (
                  <motion.button
                    key={panel.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActivePanel(panel.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all',
                      isActive
                        ? 'text-white shadow-lg'
                        : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                    )}
                    style={isActive ? { background: theme.gradient } : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-semibold">{panel.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                {activePanel === 'template' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-ink-800 text-lg">选择模板风格</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {TEMPLATES.map((template, idx) => {
                        const isSelected = selectedTemplate === template.id;
                        return (
                          <motion.button
                            key={template.id}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setSelectedTemplate(template.id)}
                            className={cn(
                              'relative rounded-2xl overflow-hidden border-2 transition-all',
                              isSelected
                                ? 'shadow-xl'
                                : 'border-ink-100 hover:border-ink-200'
                            )}
                            style={isSelected ? { borderColor: 'transparent' } : undefined}
                          >
                            {isSelected && (
                              <div className="absolute inset-0 rounded-2xl p-0.5 pointer-events-none" style={{ background: theme.gradient }}>
                                <div className="w-full h-full rounded-[calc(1rem-1px)] bg-white/60" />
                              </div>
                            )}
                            <div className="relative">
                              <div
                                className={cn(
                                  'aspect-[9/16] w-full flex items-center justify-center relative overflow-hidden',
                                  idx === 0 && 'bg-white',
                                  idx === 1 && '',
                                  idx === 2 && '',
                                  idx === 3 && ''
                                )}
                                style={
                                  idx === 1
                                    ? { background: theme.gradient }
                                    : idx === 2
                                    ? { background: SCENIC_BACKGROUNDS[selectedScenicBg].gradient }
                                    : idx === 3
                                    ? { background: theme.gradient }
                                    : undefined
                                }
                              >
                                <div className="absolute inset-0 p-3">
                                  <div className="flex flex-col gap-1.5 h-full">
                                    <div className={cn(
                                      'h-3 w-16 rounded',
                                      idx === 0 ? 'bg-ink-200' : 'bg-white/30'
                                    )} />
                                    <div className={cn(
                                      'h-6 w-full rounded-lg mt-2',
                                      idx === 0 ? 'bg-ink-100' : 'bg-white/20'
                                    )} />
                                    <div className={cn(
                                      'flex-1 rounded-lg mt-2',
                                      idx === 0 ? 'bg-teal-50' : 'bg-white/15 backdrop-blur-sm'
                                    )} />
                                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                                      <div className={cn(
                                        'h-8 rounded',
                                        idx === 0 ? 'bg-ink-50' : 'bg-white/15'
                                      )} />
                                      <div className={cn(
                                        'h-8 rounded',
                                        idx === 0 ? 'bg-ink-50' : 'bg-white/15'
                                      )} />
                                    </div>
                                    <div className={cn(
                                      'h-8 w-full rounded mt-2',
                                      idx === 0 ? 'bg-ink-50' : 'bg-white/10'
                                    )} />
                                  </div>
                                </div>
                                <span className="relative z-10 font-black font-display text-3xl drop-shadow-lg" style={
                                  idx === 0 ? { color: theme.primary } : { color: 'white' }
                                }>
                                  {idx + 1}
                                </span>
                              </div>
                              <div className="p-3 bg-white border-t border-ink-50">
                                <div className="flex items-center justify-between">
                                  <div className="text-left">
                                    <p className="font-bold text-sm text-ink-800">{template.name}</p>
                                    <p className="text-[11px] text-ink-500 mt-0.5">{template.description}</p>
                                  </div>
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-2"
                                      style={{ background: theme.gradient }}
                                    >
                                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activePanel === 'theme' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-ink-800 text-lg">选择配色主题</h3>
                    <div className="grid grid-cols-5 gap-3">
                      {THEMES.map((t) => {
                        const isSelected = selectedTheme === t.id;
                        return (
                          <motion.button
                            key={t.id}
                            whileHover={{ y: -2, scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedTheme(t.id)}
                            className="relative group"
                          >
                            <div
                              className={cn(
                                'w-full aspect-square rounded-2xl shadow-md transition-all overflow-hidden',
                                isSelected && 'ring-4 ring-offset-2'
                              )}
                              style={
                                isSelected
                                  ? { background: t.gradient, boxShadow: `0 0 0 4px white, 0 0 0 6px ${t.primary}` }
                                  : { background: t.gradient }
                              }
                            >
                              {t.id === 'dark' && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-6 h-6 rounded-full bg-white/20 blur-sm" />
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                                style={{ background: t.gradient }}
                              >
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                              </motion.div>
                            )}
                            <p className={cn(
                              'text-xs mt-2 text-center font-medium transition-colors',
                              isSelected ? 'text-ink-800' : 'text-ink-500'
                            )}>
                              {t.name}
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>
                    <div className="mt-6 p-4 rounded-2xl bg-ink-50">
                      <p className="text-xs font-semibold text-ink-600 mb-3">主题预览</p>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl shadow-md" style={{ background: theme.gradient }} />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ background: theme.primary }} />
                            <span className="text-xs text-ink-500">主色</span>
                            <span className="text-xs font-mono font-semibold text-ink-700 ml-auto">{theme.primary}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ background: theme.accent }} />
                            <span className="text-xs text-ink-500">强调色</span>
                            <span className="text-xs font-mono font-semibold text-ink-700 ml-auto">{theme.accent}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activePanel === 'text' && (
                  <div className="space-y-5">
                    <h3 className="font-bold text-ink-800 text-lg">自定义文案</h3>

                    <div>
                      <label className="block text-sm font-semibold text-ink-700 mb-2">
                        海报标题
                      </label>
                      <input
                        type="text"
                        value={customTexts.title}
                        onChange={(e) => setCustomTexts((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="输入海报标题"
                        className="w-full px-4 py-3 rounded-xl bg-ink-50 border border-ink-100 focus:border-transparent focus:ring-2 focus:ring-brand-500/40 outline-none text-sm font-medium text-ink-800 transition-all"
                      />
                      <p className="text-[11px] text-ink-400 mt-1.5">默认显示运动名称</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-ink-700 mb-2">
                        激励语
                      </label>
                      <input
                        type="text"
                        value={customTexts.slogan}
                        onChange={(e) => setCustomTexts((prev) => ({ ...prev, slogan: e.target.value }))}
                        placeholder="输入激励语"
                        className="w-full px-4 py-3 rounded-xl bg-ink-50 border border-ink-100 focus:border-transparent focus:ring-2 focus:ring-brand-500/40 outline-none text-sm font-medium text-ink-800 transition-all"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {['每一步都算数', '跑过的路不会骗人', '坚持就是胜利', '超越昨天的自己'].map((s) => (
                          <button
                            key={s}
                            onClick={() => setCustomTexts((prev) => ({ ...prev, slogan: s }))}
                            className="px-3 py-1.5 rounded-lg bg-ink-50 hover:bg-ink-100 text-[11px] text-ink-600 font-medium transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-ink-700 mb-2">
                        签名 / 昵称
                      </label>
                      <input
                        type="text"
                        value={customTexts.signature}
                        onChange={(e) => setCustomTexts((prev) => ({ ...prev, signature: e.target.value }))}
                        placeholder="输入个性签名"
                        className="w-full px-4 py-3 rounded-xl bg-ink-50 border border-ink-100 focus:border-transparent focus:ring-2 focus:ring-brand-500/40 outline-none text-sm font-medium text-ink-800 transition-all"
                      />
                    </div>
                  </div>
                )}

                {activePanel === 'data' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-ink-800 text-lg">数据显示开关</h3>
                    <p className="text-sm text-ink-500 -mt-2">选择要在海报上显示的数据项</p>

                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          { key: 'distance' as const, label: '距离', icon: Gauge, desc: `${(activity.distance / 1000).toFixed(2)} km` },
                          { key: 'duration' as const, label: '时长', icon: Timer, desc: formatDuration(activity.duration, false) },
                          { key: 'pace' as const, label: '配速', icon: ZapIcon, desc: formatPace(activity.avgPace).split(' ')[0] },
                          { key: 'elevation' as const, label: '爬升', icon: Mountain, desc: `+${activity.elevationGain.toFixed(0)} m` },
                          { key: 'heartRate' as const, label: '心率', icon: Heart, desc: activity.avgHeartRate ? `${activity.avgHeartRate} bpm` : '—' },
                          { key: 'calories' as const, label: '卡路里', icon: Flame, desc: `${activity.calories} kcal` },
                          { key: 'date' as const, label: '日期', icon: Calendar, desc: formatDate(activity.startTime, 'yyyy-MM-dd') },
                          { key: 'weather' as const, label: '天气', icon: Sun, desc: activity.weather ? `${activity.weather.temperature}°C` : '—' },
                        ]
                      ).map((item) => {
                        const Icon = item.icon;
                        const isOn = dataSwitches[item.key];
                        return (
                          <motion.button
                            key={item.key}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => toggleDataSwitch(item.key)}
                            className={cn(
                              'p-3.5 rounded-2xl border-2 text-left transition-all',
                              isOn
                                ? 'border-transparent shadow-md'
                                : 'border-ink-100 bg-ink-50/50 hover:border-ink-200'
                            )}
                            style={isOn ? { background: `${theme.primary}10`, borderColor: `${theme.primary}30` } : undefined}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div
                                className={cn(
                                  'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
                                  isOn ? '' : 'bg-ink-100'
                                )}
                                style={isOn ? { background: theme.gradient } : undefined}
                              >
                                <Icon className={cn('w-4 h-4', isOn ? 'text-white' : 'text-ink-400')} />
                              </div>
                              <div className="relative">
                                <motion.div
                                  animate={{
                                    background: isOn ? theme.gradient : '#E5E5E5',
                                  }}
                                  className={cn(
                                    'w-11 h-6 rounded-full flex items-center px-0.5 transition-all'
                                  )}
                                >
                                  <motion.div
                                    animate={{ x: isOn ? 20 : 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    className="w-5 h-5 rounded-full bg-white shadow-md"
                                  />
                                </motion.div>
                              </div>
                            </div>
                            <p className={cn(
                              'text-sm font-bold mb-0.5 transition-colors',
                              isOn ? 'text-ink-800' : 'text-ink-500'
                            )}>
                              {item.label}
                            </p>
                            <p className={cn(
                              'text-[11px] font-medium transition-colors',
                              isOn ? '' : 'text-ink-400'
                            )}
                            style={isOn ? { color: theme.primary } : undefined}>
                              {item.desc}
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activePanel === 'decoration' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-ink-800 text-lg">装饰元素</h3>
                    <p className="text-sm text-ink-500 -mt-2">添加丰富的视觉元素让海报更生动</p>

                    <div className="space-y-3">
                      {(
                        [
                          { key: 'trackMap' as const, label: '轨迹地图', icon: MapIcon, desc: '显示运动轨迹路线图' },
                          { key: 'heartCurve' as const, label: '心率曲线', icon: Heart, desc: '心率变化趋势图表' },
                          { key: 'elevationProfile' as const, label: '海拔剖面', icon: TrendingUp, desc: '海拔变化曲线图' },
                          { key: 'badges' as const, label: '成就徽章', icon: Trophy, desc: '展示金银铜成就徽章' },
                          { key: 'pb' as const, label: 'PB 标识', icon: Sparkles, desc: '高亮个人最佳标记' },
                        ]
                      ).map((item) => {
                        const Icon = item.icon;
                        const isOn = decorationSwitches[item.key];
                        return (
                          <motion.button
                            key={item.key}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleDecorationSwitch(item.key)}
                            className={cn(
                              'w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all text-left',
                              isOn
                                ? 'border-transparent shadow-md'
                                : 'border-ink-100 bg-ink-50/30 hover:border-ink-200'
                            )}
                            style={isOn ? { background: `${theme.primary}08`, borderColor: `${theme.primary}25` } : undefined}
                          >
                            <div
                              className={cn(
                                'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                                !isOn && 'bg-ink-100'
                              )}
                              style={isOn ? { background: theme.gradient } : undefined}
                            >
                              <Icon className={cn('w-5 h-5', isOn ? 'text-white' : 'text-ink-400')} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                'font-bold transition-colors',
                                isOn ? 'text-ink-800' : 'text-ink-500'
                              )}>
                                {item.label}
                              </p>
                              <p className={cn(
                                'text-xs mt-0.5 transition-colors',
                                isOn ? 'text-ink-500' : 'text-ink-400'
                              )}>
                                {item.desc}
                              </p>
                            </div>
                            <div className="relative flex-shrink-0">
                              <motion.div
                                animate={{
                                  background: isOn ? theme.gradient : '#E5E5E5',
                                }}
                                className="w-12 h-7 rounded-full flex items-center px-0.5 transition-all"
                              >
                                <motion.div
                                  animate={{ x: isOn ? 22 : 0 }}
                                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                  className="w-6 h-6 rounded-full bg-white shadow-md"
                                />
                              </motion.div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activePanel === 'background' && (
                  <div className="space-y-5">
                    <h3 className="font-bold text-ink-800 text-lg">背景设置</h3>

                    <div className="flex gap-2 p-1 bg-ink-100 rounded-xl">
                      {(
                        [
                          { key: 'gradient' as const, label: '主题渐变', icon: Palette },
                          { key: 'scenic' as const, label: '模拟风景', icon: ImageIcon },
                          { key: 'upload' as const, label: '上传图片', icon: Upload },
                        ]
                      ).map((opt) => {
                        const Icon = opt.icon;
                        const isActive = backgroundType === opt.key;
                        return (
                          <motion.button
                            key={opt.key}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setBackgroundType(opt.key)}
                            className={cn(
                              'flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all',
                              isActive
                                ? 'bg-white shadow-sm text-ink-800'
                                : 'text-ink-500 hover:text-ink-700'
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {opt.label}
                          </motion.button>
                        );
                      })}
                    </div>

                    {backgroundType === 'gradient' && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <p className="text-sm font-semibold text-ink-600">使用配色主题中选择的渐变背景</p>
                        <div
                          className="w-full aspect-[16/10] rounded-2xl shadow-inner"
                          style={{ background: theme.gradient }}
                        />
                        <p className="text-xs text-ink-500 text-center">当前主题：{theme.name}</p>
                      </motion.div>
                    )}

                    {backgroundType === 'scenic' && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <p className="text-sm font-semibold text-ink-600">选择模拟风景背景</p>
                        <div className="grid grid-cols-3 gap-3">
                          {SCENIC_BACKGROUNDS.map((bg, idx) => {
                            const isSelected = selectedScenicBg === idx;
                            return (
                              <motion.button
                                key={bg.id}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedScenicBg(idx)}
                                className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md"
                              >
                                <div
                                  className="absolute inset-0"
                                  style={{ background: bg.gradient }}
                                />
                                {idx % 3 === 0 && (
                                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                    <div className="w-full h-1/2 bg-gradient-to-t from-white/40 to-transparent self-end" />
                                  </div>
                                )}
                                {isSelected && (
                                  <>
                                    <div className="absolute inset-0 ring-2 ring-offset-2 rounded-2xl" style={{ boxShadow: `0 0 0 2px ${theme.primary}` }} />
                                    <div
                                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-lg z-10"
                                      style={{ background: theme.gradient }}
                                    >
                                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                    </div>
                                  </>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {backgroundType === 'upload' && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <div className="w-full aspect-[16/10] rounded-2xl border-2 border-dashed border-ink-200 flex flex-col items-center justify-center bg-ink-50 hover:bg-ink-100/50 cursor-pointer transition-all hover:border-brand-400/50 group">
                          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform" style={{ background: theme.gradient }}>
                            <Upload className="w-6 h-6 text-white" />
                          </div>
                          <p className="font-bold text-ink-700 text-sm">点击上传背景图片</p>
                          <p className="text-xs text-ink-400 mt-1">支持 JPG / PNG, 建议 1080×1920 以上</p>
                        </div>
                        <p className="text-[11px] text-ink-400 text-center">* 演示模式，实际上传功能已 mock</p>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="p-6 border-t border-ink-100 bg-gradient-to-b from-white to-ink-50/50">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-ink-700">下载清晰度</p>
            </div>
            <div className="flex gap-2">
              {([2, 3] as const).map((scale) => (
                <motion.button
                  key={scale}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDownloadScale(scale)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                    downloadScale === scale
                      ? 'text-white shadow-lg'
                      : 'bg-white border border-ink-200 text-ink-600 hover:border-ink-300'
                  )}
                  style={downloadScale === scale ? { background: theme.gradient } : undefined}
                >
                  <ZapIcon className="w-4 h-4" />
                  {scale}x {scale === 2 ? '高清 (1080p)' : '超清 (2K)'}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg flex items-center justify-center gap-2.5"
              style={{ background: theme.gradient }}
            >
              <Download className="w-5 h-5" />
              下载海报图片
            </motion.button>

            <div>
              <p className="text-xs font-semibold text-ink-500 mb-2.5 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                分享到
              </p>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { label: '微信', icon: MessageCircle, mock: true },
                    { label: '朋友圈', icon: Users, mock: true },
                    { label: '微博', icon: Zap, mock: true },
                    { label: '复制链接', icon: copied ? Check : Link2, mock: false, action: handleCopyLink },
                  ]
                ).map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <motion.button
                      key={s.label}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (s.action) {
                          s.action();
                        } else {
                          alert(`分享到${s.label}（演示 mock）`);
                        }
                      }}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white border border-ink-100 hover:border-ink-200 hover:shadow-sm transition-all"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={
                          idx === 0
                            ? { background: 'linear-gradient(135deg, #07C160 0%, #06AD56 100%)' }
                            : idx === 1
                            ? { background: 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)' }
                            : idx === 2
                            ? { background: 'linear-gradient(135deg, #E6162D 0%, #C40010 100%)' }
                            : idx === 3 && copied
                            ? { background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }
                            : { background: theme.gradient }
                        }
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] font-semibold text-ink-600">{s.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LayoutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}