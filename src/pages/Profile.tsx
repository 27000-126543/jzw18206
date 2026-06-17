import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Edit3,
  MapPin,
  Activity as ActivityIcon,
  Clock,
  Mountain,
  Trophy,
  Medal,
  Target,
  Flame,
  Footprints,
  Bike,
  Filter,
  ChevronDown,
  Users,
  UserPlus,
  Award,
  Star,
  Sparkles,
  Zap,
  Compass,
  CalendarCheck,
  Crown,
  Gem,
} from 'lucide-react';
import useStore from '@/store/useStore';
import StatCard from '@/components/StatCard';
import ActivityCard from '@/components/ActivityCard';
import {
  formatDistance,
  formatDuration,
  formatDate,
} from '@/utils/formatters';
import type {
  ActivityType,
  PersonalBest,
  Badge,
  MonthlyStat,
} from '@/types';
import { cn } from '@/lib/utils';

type TimeRange = 'week' | 'month' | 'year' | 'all';
type ActivityFilter = 'all' | 'running' | 'cycling';
type DistanceRange = 'all' | 'short' | 'medium' | 'long';

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'year', label: '本年' },
  { key: 'all', label: '全部' },
];

const ACTIVITY_FILTERS: { key: ActivityFilter; label: string; icon: typeof Footprints }[] = [
  { key: 'all', label: '全部', icon: ActivityIcon },
  { key: 'running', label: '跑步', icon: Footprints },
  { key: 'cycling', label: '骑行', icon: Bike },
];

const DISTANCE_RANGES: { key: DistanceRange; label: string; min?: number; max?: number }[] = [
  { key: 'all', label: '全部距离' },
  { key: 'short', label: '5km以内', max: 5000 },
  { key: 'medium', label: '5-15km', min: 5000, max: 15000 },
  { key: 'long', label: '15km以上', min: 15000 },
];

const PERSONAL_BESTS: PersonalBest[] = [
  { distance: '5K', value: '24:30', date: '2026-05-28', activityId: 'pb-5k', isNew: true },
  { distance: '10K', value: '52:15', date: '2026-04-10', activityId: 'pb-10k', isNew: false },
  { distance: '半马', value: '01:58:42', date: '2026-03-20', activityId: 'pb-half', isNew: true },
  { distance: '全马', value: '—', date: '待突破', activityId: 'pb-full', isNew: false },
];

const ACHIEVEMENT_BADGES: Badge[] = [
  { id: 'milestone-100', name: '百里挑一', description: '累计里程达到100km', icon: 'milestone', unlocked: true, unlockedAt: '2024-05-10', category: 'milestone' },
  { id: 'milestone-500', name: '千里之行', description: '累计里程达到500km', icon: 'milestone', unlocked: true, unlockedAt: '2024-09-18', category: 'milestone' },
  { id: 'milestone-1000', name: '万里长征', description: '累计里程达到1000km', icon: 'milestone', unlocked: true, unlockedAt: '2025-06-01', category: 'milestone' },
  { id: 'milestone-5000', name: '远征达人', description: '累计里程达到5000km', icon: 'milestone', unlocked: false, category: 'milestone' },
  { id: 'streak-7', name: '一周坚持', description: '连续打卡7天', icon: 'streak', unlocked: true, unlockedAt: '2024-04-01', category: 'streak' },
  { id: 'streak-30', name: '月度达人', description: '连续打卡30天', icon: 'streak', unlocked: true, unlockedAt: '2024-08-15', category: 'streak' },
  { id: 'streak-100', name: '百日坚持', description: '连续打卡100天', icon: 'streak', unlocked: false, category: 'streak' },
  { id: 'challenge-5', name: '挑战新星', description: '完成5个挑战', icon: 'challenge', unlocked: true, unlockedAt: '2024-10-20', category: 'challenge' },
  { id: 'challenge-20', name: '挑战猎手', description: '完成20个挑战', icon: 'challenge', unlocked: false, category: 'challenge' },
  { id: 'explorer-10', name: '探索者', description: '探索10条不同路线', icon: 'explorer', unlocked: true, unlockedAt: '2024-11-05', category: 'explorer' },
  { id: 'explorer-50', name: '旅行家', description: '探索50条不同路线', icon: 'explorer', unlocked: false, category: 'explorer' },
  { id: 'explorer-city', name: '城市漫游', description: '在5个城市运动', icon: 'explorer', unlocked: false, category: 'explorer' },
];

function getBadgeIcon(badge: Badge) {
  const IconMap: Record<Badge['category'], typeof Star> = {
    milestone: Target,
    streak: CalendarCheck,
    challenge: Trophy,
    explorer: Compass,
  };
  const Icon = IconMap[badge.category];
  return <Icon className="h-6 w-6" />;
}

function getBadgeGradient(category: Badge['category'], unlocked: boolean): string {
  if (!unlocked) return 'from-ink-300 to-ink-400';
  const map: Record<Badge['category'], string> = {
    milestone: 'from-brand-500 to-brand-600',
    streak: 'from-teal-500 to-teal-600',
    challenge: 'from-amber-500 to-amber-600',
    explorer: 'from-blue-500 to-blue-600',
  };
  return map[category];
}

function generateMonthlyStats(
  activities: ReturnType<typeof useStore.getState>['activities']
): MonthlyStat[] {
  const today = new Date();
  const stats: MonthlyStat[] = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(today.getMonth() - i);
    const year = date.getFullYear();
    const month = date.getMonth();

    const monthStart = new Date(year, month, 1).getTime();
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59).getTime();

    let distance = 0;
    let count = 0;
    let duration = 0;
    let elevation = 0;

    activities.forEach((act) => {
      const actTime = new Date(act.startTime).getTime();
      if (actTime >= monthStart && actTime <= monthEnd) {
        distance += act.distance;
        count += 1;
        duration += act.duration;
        elevation += act.elevationGain;
      }
    });

    stats.push({
      month: `${date.getMonth() + 1}月`,
      distance: Math.round((distance / 1000) * 10) / 10,
      activities: count,
      duration: Math.round(duration / 3600),
      elevation: Math.round(elevation),
    });
  }

  return stats;
}

function getRangeStats(
  activities: ReturnType<typeof useStore.getState>['activities'],
  range: TimeRange
) {
  const now = Date.now();
  const nowDate = new Date();
  let startTime = 0;

  switch (range) {
    case 'week': {
      startTime = now - 7 * 24 * 60 * 60 * 1000;
      break;
    }
    case 'month': {
      const d = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
      startTime = d.getTime();
      break;
    }
    case 'year': {
      const d = new Date(nowDate.getFullYear(), 0, 1);
      startTime = d.getTime();
      break;
    }
    case 'all':
    default:
      startTime = 0;
  }

  let distance = 0;
  let count = 0;
  let duration = 0;
  let elevation = 0;

  activities.forEach((act) => {
    const actTime = new Date(act.startTime).getTime();
    if (actTime >= startTime) {
      distance += act.distance;
      count += 1;
      duration += act.duration;
      elevation += act.elevationGain;
    }
  });

  return { distance, count, duration, elevation };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function Profile() {
  const { user, activities } = useStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [distanceFilter, setDistanceFilter] = useState<DistanceRange>('all');
  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);
  const [displayCount, setDisplayCount] = useState(6);

  const monthlyStats = useMemo(
    () => generateMonthlyStats(activities),
    [activities]
  );

  const rangeStats = useMemo(
    () => getRangeStats(activities, timeRange),
    [activities, timeRange]
  );

  const filteredActivities = useMemo(() => {
    return activities
      .filter((act) => {
        if (activityFilter !== 'all' && act.type !== activityFilter) return false;
        const range = DISTANCE_RANGES.find((r) => r.key === distanceFilter);
        if (range) {
          if (range.min !== undefined && act.distance < range.min) return false;
          if (range.max !== undefined && act.distance > range.max) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
  }, [activities, activityFilter, distanceFilter]);

  const activityTypeData = useMemo(() => {
    const running = activities.filter((a) => a.type === 'running').length;
    const cycling = activities.filter((a) => a.type === 'cycling').length;
    return [
      { name: '跑步', value: running, color: '#FF6B35' },
      { name: '骑行', value: cycling, color: '#0D9488' },
    ];
  }, [activities]);

  const totalElevation = useMemo(() => {
    return activities.reduce((sum, a) => sum + a.elevationGain, 0);
  }, [activities]);

  const handleLoadMore = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + 4, filteredActivities.length));
  }, [filteredActivities.length]);

  const displayedActivities = filteredActivities.slice(0, displayCount);

  return (
    <div className="min-h-screen bg-ink-50 pb-16">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
        variants={containerVariants}
        className="container pt-6 space-y-8"
      >
        {/* 页面标题 */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink-800">
            个人中心
          </h1>
          <p className="text-ink-500 mt-1 text-sm">
            查看你的运动数据、成就和历史记录
          </p>
        </motion.div>

        {/* 1. 顶部个人信息区 */}
        <motion.section variants={itemVariants} className="relative">
          <div className="relative overflow-hidden rounded-3xl bg-hero-gradient shadow-brand-glow">
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/20 rounded-full blur-3xl animate-float" />
              <div className="absolute top-20 -left-20 w-64 h-64 bg-teal-300/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
              <div className="absolute -bottom-16 right-1/3 w-56 h-56 bg-amber-300/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
              <svg className="absolute bottom-0 left-0 w-full h-24 opacity-20" viewBox="0 0 400 100" preserveAspectRatio="none">
                <polygon points="0,100 40,60 80,80 120,40 160,70 200,30 240,65 280,45 320,75 360,35 400,55 400,100" fill="white" />
              </svg>
            </div>

            <div className="relative z-10 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-amber-300 via-white/60 to-teal-300 animate-spin-slow" />
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-2xl"
                  />
                  <button className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-brand-500 hover:bg-brand-50 hover:scale-110 transition-all duration-300 group">
                    <Edit3 className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                  </button>
                </div>

                <div className="flex-1 text-center lg:text-left min-w-0">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-center lg:justify-start gap-3 sm:gap-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">
                      {user.name}
                    </h2>
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gold-gradient text-white text-sm font-bold shadow-lg animate-breathe">
                      <Crown className="h-4 w-4" />
                      Lv.{user.level}
                    </div>
                  </div>
                  <p className="text-white/85 text-sm mt-3 max-w-xl leading-relaxed mx-auto lg:mx-0">
                    {user.bio}
                  </p>
                  <div className="flex items-center justify-center lg:justify-start gap-3 mt-4 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm text-white text-sm">
                      <Flame className="h-4 w-4 text-amber-300" fill="currentColor" />
                      <span className="font-semibold">{user.streakDays}天连续</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm text-white text-sm">
                      <Gem className="h-4 w-4 text-teal-300" />
                      <span className="font-semibold">
                        {ACHIEVEMENT_BADGES.filter((b) => b.unlocked).length} 个成就
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-8 pt-6 border-t border-white/20">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className="text-center cursor-pointer group"
                >
                  <div className="flex items-center justify-center gap-1.5 text-white/70 text-xs sm:text-sm mb-1 group-hover:text-white transition-colors">
                    <Users className="h-3.5 w-3.5" />
                    粉丝
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white font-display">
                    {user.followers}
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className="text-center cursor-pointer group border-l border-r border-white/20"
                >
                  <div className="flex items-center justify-center gap-1.5 text-white/70 text-xs sm:text-sm mb-1 group-hover:text-white transition-colors">
                    <UserPlus className="h-3.5 w-3.5" />
                    关注
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white font-display">
                    {user.following}
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className="text-center cursor-pointer group"
                >
                  <div className="flex items-center justify-center gap-1.5 text-white/70 text-xs sm:text-sm mb-1 group-hover:text-white transition-colors">
                    <ActivityIcon className="h-3.5 w-3.5" />
                    动态
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white font-display">
                    {user.totalActivities}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 2. 运动总览卡片行 */}
        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="累计里程"
              value={formatDistance(user.totalDistance * 1000, 1)}
              icon={<MapPin className="h-5 w-5" />}
              trend={((user.monthlyDistance * 1000) / (user.totalDistance * 1000)) * 100}
              trendLabel="本月占比"
              gradientFrom="from-brand-500"
              gradientTo="to-brand-600"
              delay={0}
            />
            <StatCard
              title="运动次数"
              value={`${user.totalActivities} 次`}
              icon={<ActivityIcon className="h-5 w-5" />}
              trend={Math.round((rangeStats.count / Math.max(1, user.totalActivities)) * 100)}
              trendLabel={`${TIME_RANGES.find((r) => r.key === timeRange)?.label}占比`}
              gradientFrom="from-teal-500"
              gradientTo="to-teal-600"
              delay={0.05}
            />
            <StatCard
              title="总时长"
              value={`${user.totalHours.toFixed(0)} 小时`}
              icon={<Clock className="h-5 w-5" />}
              trend={user.totalHours > 0 ? Math.round((rangeStats.duration / 3600 / user.totalHours) * 100) : 0}
              trendLabel={`${TIME_RANGES.find((r) => r.key === timeRange)?.label}占比`}
              gradientFrom="from-blue-500"
              gradientTo="to-blue-600"
              delay={0.1}
            />
            <StatCard
              title="累计爬升"
              value={`${Math.round(totalElevation)} m`}
              icon={<Mountain className="h-5 w-5" />}
              trend={rangeStats.elevation > 0 ? Math.round((rangeStats.elevation / totalElevation) * 100) : 0}
              trendLabel={`${TIME_RANGES.find((r) => r.key === timeRange)?.label}占比`}
              gradientFrom="from-purple-500"
              gradientTo="to-purple-600"
              delay={0.15}
            />
          </div>
        </motion.section>

        {/* 3. 时间范围筛选器 + 4. 月度里程趋势 */}
        <motion.section variants={itemVariants}>
          <div className="rounded-3xl bg-white p-6 shadow-soft border border-ink-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-ink-800 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-brand-500" />
                  月度里程趋势
                </h3>
                <p className="text-sm text-ink-500 mt-1">
                  最近12个月运动数据概览
                </p>
              </div>

              <div className="flex p-1 rounded-2xl bg-ink-100">
                {TIME_RANGES.map((range) => (
                  <button
                    key={range.key}
                    onClick={() => setTimeRange(range.key)}
                    className={cn(
                      'relative px-4 sm:px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300',
                      timeRange === range.key
                        ? 'text-white shadow-lg'
                        : 'text-ink-500 hover:text-ink-800'
                    )}
                  >
                    {timeRange === range.key && (
                      <motion.div
                        layoutId="timeRangePill"
                        className="absolute inset-0 rounded-xl bg-hero-gradient animate-gradient-x"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{range.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-2xl bg-ink-50/50">
              <div className="text-center">
                <p className="text-xs text-ink-500 mb-1">
                  {TIME_RANGES.find((r) => r.key === timeRange)?.label}里程
                </p>
                <p className="text-xl font-bold gradient-text font-display">
                  {formatDistance(rangeStats.distance, 1)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-ink-500 mb-1">
                  {TIME_RANGES.find((r) => r.key === timeRange)?.label}次数
                </p>
                <p className="text-xl font-bold gradient-text-teal font-display">
                  {rangeStats.count} 次
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-ink-500 mb-1">
                  {TIME_RANGES.find((r) => r.key === timeRange)?.label}时长
                </p>
                <p className="text-xl font-bold gradient-text-blue font-display">
                  {formatDuration(rangeStats.duration, true)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-ink-500 mb-1">
                  {TIME_RANGES.find((r) => r.key === timeRange)?.label}爬升
                </p>
                <p className="text-xl font-bold font-display bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
                  {rangeStats.elevation} m
                </p>
              </div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyStats}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#F7931E" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF8A50" />
                      <stop offset="100%" stopColor="#FFB080" />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0D9488" />
                      <stop offset="100%" stopColor="#2DD4BF" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E5E5E5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#737373', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#A3A3A3', fontSize: 11 }}
                    tickFormatter={(v) => `${v}`}
                    width={45}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#A3A3A3', fontSize: 11 }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '14px',
                      border: 'none',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                      padding: '12px 16px',
                    }}
                    labelStyle={{
                      fontWeight: 700,
                      color: '#1A1A2E',
                      marginBottom: '8px',
                      fontSize: '14px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'distance') return [`${value} km`, '里程'];
                      return [`${value} 次`, '运动次数'];
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      paddingTop: '16px',
                      fontSize: '13px',
                    }}
                    formatter={(value: string) => (
                      <span className="text-ink-600 font-medium">
                        {value === 'distance' ? '月度里程 (km)' : '运动次数'}
                      </span>
                    )}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="distance"
                    name="distance"
                    fill="url(#barGradient)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={40}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="activities"
                    name="activities"
                    stroke="url(#lineGradient)"
                    strokeWidth={3}
                    dot={{
                      fill: '#0D9488',
                      stroke: '#fff',
                      strokeWidth: 2,
                      r: 5,
                    }}
                    activeDot={{
                      r: 8,
                      fill: '#0D9488',
                      stroke: '#fff',
                      strokeWidth: 3,
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.section>

        {/* 5. PB成绩墙 + 7. 运动类型占比 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* PB成绩墙 */}
          <motion.section
            variants={itemVariants}
            className="lg:col-span-3"
          >
            <div className="rounded-3xl bg-white p-6 shadow-soft border border-ink-100 h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-ink-800 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    个人最佳
                  </h3>
                  <p className="text-sm text-ink-500 mt-1">
                    挑战自我，不断突破极限
                  </p>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50">
                  <Medal className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-700">
                    {PERSONAL_BESTS.filter((p) => p.value !== '—').length} 项纪录
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {PERSONAL_BESTS.map((pb, index) => (
                  <motion.div
                    key={pb.distance}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    whileHover={{
                      scale: 1.03,
                      y: -4,
                      transition: { type: 'spring', stiffness: 400, damping: 15 },
                    }}
                    className={cn(
                      'relative overflow-hidden rounded-2xl p-5 cursor-pointer',
                      'transition-all duration-300 group'
                    )}
                    style={{
                      background: pb.value !== '—'
                        ? 'linear-gradient(135deg, #D4A017 0%, #F5D061 40%, #FFE082 60%, #D4A017 100%)'
                        : 'linear-gradient(135deg, #E5E5E5 0%, #F5F5F5 100%)',
                      backgroundSize: '200% 200%',
                      animation: pb.value !== '—' ? 'gradient-x 4s ease infinite' : undefined,
                    }}
                  >
                    {pb.isNew && pb.value !== '—' && (
                      <div className="absolute -top-1 -right-1">
                        <motion.div
                          animate={{
                            scale: [1, 1.15, 1],
                            opacity: [1, 0.8, 1],
                          }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-[10px] font-black shadow-lg flex items-center gap-1"
                        >
                          <Zap className="h-3 w-3" fill="currentColor" />
                          NEW
                        </motion.div>
                      </div>
                    )}

                    <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute inset-0 bg-white animate-shimmer" />
                    </div>

                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={cn(
                            'text-sm font-bold px-3 py-1 rounded-lg',
                            pb.value !== '—'
                              ? 'bg-white/30 text-amber-900'
                              : 'bg-white/50 text-ink-500'
                          )}
                        >
                          {pb.distance}
                        </span>
                        {pb.value !== '—' ? (
                          <Trophy className="h-5 w-5 text-amber-700" />
                        ) : (
                          <Target className="h-5 w-5 text-ink-400" />
                        )}
                      </div>

                      <p
                        className={cn(
                          'text-3xl sm:text-4xl font-black font-display tracking-tight mb-2',
                          pb.value !== '—' ? 'text-amber-900' : 'text-ink-400'
                        )}
                      >
                        {pb.value}
                      </p>

                      <div className="flex items-center gap-1.5">
                        <Award
                          className={cn(
                            'h-3.5 w-3.5',
                            pb.value !== '—' ? 'text-amber-700' : 'text-ink-400'
                          )}
                        />
                        <span
                          className={cn(
                            'text-xs font-medium',
                            pb.value !== '—' ? 'text-amber-800/80' : 'text-ink-400'
                          )}
                        >
                          {pb.date}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* 运动类型占比 */}
          <motion.section
            variants={itemVariants}
            className="lg:col-span-2"
          >
            <div className="rounded-3xl bg-white p-6 shadow-soft border border-ink-100 h-full flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-ink-800 flex items-center gap-2">
                  <ActivityIcon className="h-5 w-5 text-brand-500" />
                  运动类型占比
                </h3>
                <p className="text-sm text-ink-500 mt-1">
                  跑步与骑行运动分布
                </p>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="relative w-full max-w-[240px] aspect-square">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <linearGradient id="pieGradient1" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#FF6B35" />
                          <stop offset="100%" stopColor="#F7931E" />
                        </linearGradient>
                        <linearGradient id="pieGradient2" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#0D9488" />
                          <stop offset="100%" stopColor="#2DD4BF" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={activityTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        strokeWidth={0}
                        dataKey="value"
                      >
                        {activityTypeData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 0 ? 'url(#pieGradient1)' : 'url(#pieGradient2)'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        }}
                        formatter={(value: number, name: string) => [
                          `${value} 次 (${Math.round((value / Math.max(1, activities.length)) * 100)}%)`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-4xl font-black font-display gradient-text">
                      {activities.length}
                    </p>
                    <p className="text-xs text-ink-500 mt-1 font-medium">总运动次数</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-brand-50/50">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 shadow-sm" />
                  <div>
                    <p className="text-xs text-ink-500">跑步</p>
                    <p className="text-lg font-bold text-ink-800">
                      {activityTypeData[0]?.value || 0} 次
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-teal-50/50">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 shadow-sm" />
                  <div>
                    <p className="text-xs text-ink-500">骑行</p>
                    <p className="text-lg font-bold text-ink-800">
                      {activityTypeData[1]?.value || 0} 次
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* 6. 成就徽章区 */}
        <motion.section variants={itemVariants}>
          <div className="rounded-3xl bg-white p-6 shadow-soft border border-ink-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-ink-800 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" fill="currentColor" />
                  我的成就
                </h3>
                <p className="text-sm text-ink-500 mt-1">
                  记录你运动路上的每一个里程碑
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-purple-50">
                <Award className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-ink-700">
                  {ACHIEVEMENT_BADGES.filter((b) => b.unlocked).length}
                  <span className="text-ink-400 mx-1">/</span>
                  {ACHIEVEMENT_BADGES.length} 已解锁
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {ACHIEVEMENT_BADGES.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  whileHover={badge.unlocked ? {
                    scale: 1.08,
                    y: -6,
                    transition: { type: 'spring', stiffness: 400, damping: 12 },
                  } : {}}
                  className={cn(
                    'group relative flex flex-col items-center p-4 rounded-2xl cursor-pointer',
                    badge.unlocked
                      ? 'bg-gradient-to-b from-ink-50 to-white border border-ink-100 hover:shadow-card-hover'
                      : 'bg-ink-50/50 border border-ink-100/50'
                  )}
                >
                  <div
                    className={cn(
                      'relative w-14 h-14 rounded-2xl flex items-center justify-center mb-3',
                      'bg-gradient-to-br shadow-lg',
                      getBadgeGradient(badge.category, badge.unlocked),
                      badge.unlocked && 'animate-breathe'
                    )}
                  >
                    {badge.unlocked ? (
                      <div className="text-white drop-shadow-sm">
                        {getBadgeIcon(badge)}
                      </div>
                    ) : (
                      <div className="text-white/60 grayscale">
                        {getBadgeIcon(badge)}
                      </div>
                    )}
                    {badge.unlocked && (
                      <div className="absolute -inset-0.5 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                  </div>

                  <p
                    className={cn(
                      'text-xs font-bold text-center mb-1 leading-tight',
                      badge.unlocked ? 'text-ink-800' : 'text-ink-400'
                    )}
                  >
                    {badge.name}
                  </p>
                  <p
                    className={cn(
                      'text-[10px] text-center leading-tight px-1',
                      badge.unlocked ? 'text-ink-500' : 'text-ink-400/70'
                    )}
                  >
                    {badge.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* 8. 历史记录列表 */}
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-ink-800 flex items-center gap-2">
                <ActivityIcon className="h-5 w-5 text-brand-600" />
                历史记录
              </h3>
              <p className="text-sm text-ink-500 mt-1">
                共 {filteredActivities.length} 条运动记录
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex p-1 rounded-2xl bg-ink-100">
                {ACTIVITY_FILTERS.map((f) => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.key}
                      onClick={() => {
                        setActivityFilter(f.key);
                        setDisplayCount(6);
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300',
                        activityFilter === f.key
                          ? 'bg-white text-brand-600 shadow-md'
                          : 'text-ink-500 hover:text-ink-800'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{f.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowDistanceDropdown((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-ink-200 text-sm font-medium text-ink-700 hover:border-brand-300 hover:text-brand-600 transition-all shadow-soft"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {DISTANCE_RANGES.find((r) => r.key === distanceFilter)?.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-300',
                      showDistanceDropdown && 'rotate-180'
                    )}
                  />
                </button>
                {showDistanceDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 z-20 w-40 py-2 rounded-2xl bg-white border border-ink-100 shadow-card-hover overflow-hidden"
                  >
                    {DISTANCE_RANGES.map((range) => (
                      <button
                        key={range.key}
                        onClick={() => {
                          setDistanceFilter(range.key);
                          setDisplayCount(6);
                          setShowDistanceDropdown(false);
                        }}
                        className={cn(
                          'w-full px-4 py-2.5 text-left text-sm transition-all',
                          distanceFilter === range.key
                            ? 'bg-brand-50 text-brand-600 font-semibold'
                            : 'text-ink-600 hover:bg-ink-50'
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {displayedActivities.length > 0 ? (
            <>
              <div className="space-y-3">
                {displayedActivities.map((activity, index) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    delay={index * 0.06}
                  />
                ))}
              </div>

              {displayCount < filteredActivities.length && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="flex justify-center pt-2"
                >
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLoadMore}
                    className="px-8 py-3 rounded-2xl bg-white border-2 border-brand-200 text-brand-600 font-semibold hover:bg-brand-50 hover:border-brand-300 transition-all shadow-soft flex items-center gap-2"
                  >
                    <ChevronDown className="h-5 w-5" />
                    加载更多 ({filteredActivities.length - displayCount} 条)
                  </motion.button>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-white border border-ink-100 shadow-soft p-12 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-ink-50 flex items-center justify-center">
                <ActivityIcon className="h-10 w-10 text-ink-300" />
              </div>
              <h4 className="text-lg font-semibold text-ink-700 mb-2">
                暂无运动记录
              </h4>
              <p className="text-sm text-ink-500">
                当前筛选条件下没有找到运动记录
              </p>
            </motion.div>
          )}
        </motion.section>
      </motion.div>
    </div>
  );
}
