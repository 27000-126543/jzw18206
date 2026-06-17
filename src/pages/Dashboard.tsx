import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  MapPin,
  Timer,
  Flame,
  Activity as ActivityIcon,
  Bike,
  Footprints,
  Play,
  ChevronRight,
  Trophy,
  Clock,
  TrendingUp,
  Calendar,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Sun,
  Moon,
  Sunset,
  Award,
  Users,
  Target,
} from 'lucide-react';
import useStore from '@/store/useStore';
import StatCard from '@/components/StatCard';
import RouteCard from '@/components/RouteCard';
import ActivityCard from '@/components/ActivityCard';
import {
  formatDistance,
  formatDuration,
  formatCalories,
  formatDate,
} from '@/utils/formatters';
import type { ActivityType, Challenge, Post } from '@/types';
import { cn } from '@/lib/utils';

function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { text: '早上好', icon: <Sun className="h-6 w-6 text-amber-500" /> };
  } else if (hour >= 12 && hour < 18) {
    return { text: '下午好', icon: <Sunset className="h-6 w-6 text-orange-500" /> };
  } else {
    return { text: '晚上好', icon: <Moon className="h-6 w-6 text-indigo-500" /> };
  }
}

function getSportSuggestion(type: ActivityType): string {
  const hour = new Date().getHours();
  if (type === 'running') {
    if (hour >= 5 && hour < 10) {
      return '清晨空气清新，适合5-8公里有氧慢跑，提升心肺耐力';
    } else if (hour >= 17 && hour < 20) {
      return '傍晚黄金时段，来一场高强度间歇训练突破PB吧';
    }
    return '今日建议30-45分钟轻松跑，保持状态，注意补水';
  } else {
    if (hour >= 6 && hour < 10) {
      return '晨间骑行20-30公里，享受城市苏醒的美好';
    } else if (hour >= 15 && hour < 19) {
      return '下午光线充足，挑战长距离骑行路线，挑战自我';
    }
    return '今日建议骑行45-60分钟，中低强度保持节奏';
  }
}

interface WeeklyDataPoint {
  day: string;
  date: string;
  distance: number;
}

function generateWeeklyData(activities: ReturnType<typeof useStore.getState>['activities']): WeeklyDataPoint[] {
  const today = new Date();
  const data: WeeklyDataPoint[] = [];
  const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayIndex = (date.getDay() + 6) % 7;

    const dayDistance = activities.reduce((acc, act) => {
      const actDate = new Date(act.startTime).toISOString().split('T')[0];
      return actDate === dateStr ? acc + act.distance : acc;
    }, 0);

    data.push({
      day: weekdays[dayIndex],
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      distance: Math.round(dayDistance / 100) / 10,
    });
  }

  return data;
}

export default function Dashboard() {
  const {
    user,
    activities,
    routes,
    challenges,
    posts,
    toggleFavoriteRoute,
  } = useStore();

  const [sportType, setSportType] = useState<ActivityType>('running');
  const greeting = getGreeting();
  const sportSuggestion = getSportSuggestion(sportType);

  const weeklyData = useMemo(() => generateWeeklyData(activities), [activities]);

  const weekStats = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = weekAgo - 7 * 24 * 60 * 60 * 1000;

    let thisWeekDistance = 0;
    let thisWeekDuration = 0;
    let thisWeekCalories = 0;
    let thisWeekCount = 0;
    let lastWeekDistance = 0;

    activities.forEach((act) => {
      const actTime = new Date(act.startTime).getTime();
      if (actTime >= weekAgo && actTime <= now) {
        thisWeekDistance += act.distance;
        thisWeekDuration += act.duration;
        thisWeekCalories += act.calories;
        thisWeekCount += 1;
      } else if (actTime >= twoWeeksAgo && actTime < weekAgo) {
        lastWeekDistance += act.distance;
      }
    });

    const distanceTrend =
      lastWeekDistance > 0
        ? ((thisWeekDistance - lastWeekDistance) / lastWeekDistance) * 100
        : thisWeekDistance > 0
        ? 100
        : 0;

    return {
      distance: thisWeekDistance,
      duration: thisWeekDuration,
      calories: thisWeekCalories,
      count: thisWeekCount,
      distanceTrend,
    };
  }, [activities]);

  const recommendedRoutes = useMemo(() => routes.slice(0, 4), [routes]);
  const recentActivities = useMemo(() => activities.slice(0, 3), [activities]);
  const communityPosts = useMemo(() => posts.slice(0, 2), [posts]);
  const activeChallenges = useMemo(
    () => challenges.filter((c) => c.isJoined).slice(0, 2),
    [challenges]
  );

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

  return (
    <div className="min-h-screen bg-ink-50 pb-16">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
        className="container pt-6 space-y-8"
      >
        {/* Hero 欢迎区 */}
        <motion.section variants={itemVariants} className="relative">
          <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 shadow-brand-glow">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-300 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
            </div>

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm">
                    {greeting.icon}
                  </div>
                  <div>
                    <h2 className="text-white/80 text-sm font-medium">
                      {greeting.text}
                    </h2>
                    <h1 className="text-white text-2xl md:text-3xl font-bold flex items-center gap-2">
                      {user.name}
                      <Sparkles className="h-5 w-5 text-amber-300" />
                    </h1>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white/70 text-xs font-medium mb-1">
                        今日运动建议
                      </p>
                      <p className="text-white text-sm leading-relaxed">
                        {sportSuggestion}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                      <Calendar className="h-4 w-4 text-white/80" />
                      <span className="text-white text-sm font-medium">
                        连续打卡 {user.streakDays} 天
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                      <Award className="h-4 w-4 text-amber-300" />
                      <span className="text-white text-sm font-medium">
                        Lv.{user.level}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 rounded-full bg-white/30 blur-2xl animate-pulse-slow" />
                  <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full bg-brand-gradient animate-breathe flex items-center justify-center shadow-2xl">
                    <div className="absolute inset-2 rounded-full border-2 border-white/30" />
                    <div className="absolute inset-4 rounded-full border border-white/20" />
                    <div className="flex flex-col items-center gap-2 text-white">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="h-8 w-8 fill-current ml-1" />
                      </div>
                      <span className="text-xl font-bold tracking-wide">
                        开始运动
                      </span>
                    </div>
                  </div>
                </motion.button>

                <div className="flex p-1.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <button
                    onClick={() => setSportType('running')}
                    className={cn(
                      'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
                      sportType === 'running'
                        ? 'bg-white text-brand-600 shadow-lg'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <Footprints className="h-4 w-4" />
                    跑步
                  </button>
                  <button
                    onClick={() => setSportType('cycling')}
                    className={cn(
                      'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
                      sportType === 'cycling'
                        ? 'bg-white text-brand-600 shadow-lg'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <Bike className="h-4 w-4" />
                    骑行
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 统计概览区 */}
        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="本周里程"
              value={formatDistance(weekStats.distance, 1)}
              icon={<MapPin className="h-5 w-5" />}
              trend={weekStats.distanceTrend}
              gradientFrom="from-brand-500"
              gradientTo="to-brand-600"
              delay={0}
            />
            <StatCard
              title="运动次数"
              value={`${weekStats.count} 次`}
              icon={<ActivityIcon className="h-5 w-5" />}
              gradientFrom="from-teal-500"
              gradientTo="to-teal-600"
              delay={0.05}
            />
            <StatCard
              title="累计时长"
              value={formatDuration(weekStats.duration, true)}
              icon={<Timer className="h-5 w-5" />}
              gradientFrom="from-blue-500"
              gradientTo="to-blue-600"
              delay={0.1}
            />
            <StatCard
              title="消耗卡路里"
              value={formatCalories(weekStats.calories)}
              icon={<Flame className="h-5 w-5" />}
              gradientFrom="from-orange-500"
              gradientTo="to-orange-600"
              delay={0.15}
            />
          </div>
        </motion.section>

        {/* 本周里程趋势图 */}
        <motion.section variants={itemVariants}>
          <div className="rounded-3xl bg-white p-6 shadow-soft border border-ink-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-ink-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                  本周里程趋势
                </h3>
                <p className="text-sm text-ink-500 mt-1">
                  近7天每日运动里程统计
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-gradient" />
                <span className="text-sm font-semibold text-teal-700">
                  总计 {formatDistance(weekStats.distance, 1)}
                </span>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklyData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0D9488" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="tealLine" x1="0" y1="0" x2="1" y2="0">
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
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#737373', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#A3A3A3', fontSize: 11 }}
                    tickFormatter={(v) => `${v}km`}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      padding: '10px 14px',
                    }}
                    labelStyle={{
                      fontWeight: 600,
                      color: '#2D3748',
                      marginBottom: '4px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)} km`, '里程']}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        const item = payload[0] as { payload: WeeklyDataPoint };
                        return `${label} (${item.payload.date})`;
                      }
                      return label as string;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="distance"
                    stroke="url(#tealLine)"
                    strokeWidth={3}
                    fill="url(#tealGradient)"
                    activeDot={{
                      r: 6,
                      fill: '#0D9488',
                      stroke: '#fff',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.section>

        {/* 推荐路线区 */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-ink-800 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                为你推荐
              </h3>
              <p className="text-sm text-ink-500 mt-1">
                根据你的运动偏好精选路线
              </p>
            </div>
            <button className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
              查看更多
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-1 px-1">
            {recommendedRoutes.map((route, index) => (
              <RouteCard
                key={route.id}
                route={route}
                onToggleFavorite={toggleFavoriteRoute}
                delay={index * 0.08}
              />
            ))}
          </div>
        </motion.section>

        {/* 最近运动记录 + 社区动态 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 最近运动记录 */}
          <motion.section
            variants={itemVariants}
            className="lg:col-span-3 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink-800 flex items-center gap-2">
                  <ActivityIcon className="h-5 w-5 text-brand-600" />
                  最近活动
                </h3>
                <p className="text-sm text-ink-500 mt-1">
                  你最近的运动记录
                </p>
              </div>
              <button className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                查看全部
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </motion.section>

          {/* 社区动态 */}
          <motion.section
            variants={itemVariants}
            className="lg:col-span-2 space-y-4"
          >
            <div>
              <h3 className="text-lg font-bold text-ink-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                社区动态
              </h3>
              <p className="text-sm text-ink-500 mt-1">
                来自运动社区的精彩分享
              </p>
            </div>

            <div className="space-y-4">
              {communityPosts.map((post, index) => (
                <PostCard key={post.id} post={post} delay={index * 0.1} />
              ))}
            </div>
          </motion.section>
        </div>

        {/* 进行中挑战 */}
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-ink-800 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                我的挑战
              </h3>
              <p className="text-sm text-ink-500 mt-1">
                正在进行的挑战，加油完成！
              </p>
            </div>
            <button className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
              查看全部
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeChallenges.map((challenge, index) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                delay={index * 0.1}
              />
            ))}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}

function PostCard({ post, delay = 0 }: { post: Post; delay?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="rounded-2xl bg-white border border-ink-100 shadow-soft overflow-hidden hover:shadow-card-hover transition-all cursor-pointer"
    >
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <img
            src={post.user.avatar}
            alt={post.user.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-ink-100"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="font-semibold text-ink-800 text-sm">
                  {post.user.name}
                </h4>
                <p className="text-xs text-ink-400">
                  {formatDate(post.createdAt, 'MM月dd日 HH:mm')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-ink-600 leading-relaxed line-clamp-2 mb-3">
          {post.content}
        </p>

        {post.images.length > 0 && (
          <div
            className={cn(
              'grid gap-1.5 mb-3 rounded-xl overflow-hidden',
              post.images.length === 1
                ? 'grid-cols-1'
                : post.images.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-3'
            )}
          >
            {post.images.slice(0, post.images.length === 1 ? 1 : 3).map((img, i) => (
              <div
                key={i}
                className={cn(
                  'relative overflow-hidden',
                  post.images.length === 1
                    ? 'aspect-video'
                    : 'aspect-square'
                )}
              >
                <img
                  src={img}
                  alt={`图片${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                {i === 2 && post.images.length > 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      +{post.images.length - 3}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-lg text-xs font-medium bg-brand-50 text-brand-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 pt-3 border-t border-ink-100">
          <button className="flex items-center gap-1.5 text-ink-500 hover:text-red-500 transition-colors">
            <Heart
              className={cn(
                'h-4 w-4',
                post.isLiked ? 'fill-red-500 text-red-500' : ''
              )}
            />
            <span className="text-xs font-medium">{post.likes}</span>
          </button>
          <button className="flex items-center gap-1.5 text-ink-500 hover:text-brand-600 transition-colors">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-medium">{post.comments.length}</span>
          </button>
          <button className="flex items-center gap-1.5 text-ink-500 hover:text-teal-600 transition-colors">
            <Share2 className="h-4 w-4" />
            <span className="text-xs font-medium">{post.shareCount}</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function ChallengeCard({
  challenge,
  delay = 0,
}: {
  challenge: Challenge;
  delay?: number;
}) {
  const myRank = challenge.participants.find(
    (p) => p.userId === useStore.getState().user.id
  )?.rank;

  const now = new Date();
  const endDate = new Date(challenge.endDate);
  const daysLeft = Math.max(
    0,
    Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const progress = challenge.myProgress || 0;
  const currentValue = challenge.myCurrentValue || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative rounded-2xl overflow-hidden bg-white border border-ink-100 shadow-soft hover:shadow-card-hover transition-all group"
    >
      <div className="relative h-28 overflow-hidden">
        <img
          src={challenge.banner}
          alt={challenge.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-amber-500/90 backdrop-blur-sm flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            {challenge.type === 'distance'
              ? '里程挑战'
              : challenge.type === 'streak'
              ? '连续打卡'
              : '爬升挑战'}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h4 className="font-bold text-white text-base line-clamp-1">
            {challenge.title}
          </h4>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-xl bg-ink-50">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <TrendingUp className="h-3 w-3 text-brand-600" />
            </div>
            <p className="text-sm font-bold text-ink-800">
              {progress.toFixed(0)}%
            </p>
            <p className="text-[10px] text-ink-400">完成进度</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-ink-50">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Clock className="h-3 w-3 text-teal-600" />
            </div>
            <p className="text-sm font-bold text-ink-800">{daysLeft}天</p>
            <p className="text-[10px] text-ink-400">剩余时间</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-ink-50">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Award className="h-3 w-3 text-amber-500" />
            </div>
            <p className="text-sm font-bold text-ink-800">
              {myRank ? `#${myRank}` : '-'}
            </p>
            <p className="text-[10px] text-ink-400">当前排名</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-500">
              已完成{' '}
              <span className="font-semibold text-ink-800">
                {currentValue} {challenge.unit}
              </span>
            </span>
            <span className="text-ink-500">
              目标{' '}
              <span className="font-semibold text-ink-800">
                {challenge.target} {challenge.unit}
              </span>
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-ink-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.min(100, progress)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-brand-500 via-brand-500 to-amber-500 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 animate-shimmer" />
            </motion.div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-ink-100">
          <div className="flex -space-x-2">
            {challenge.participants.slice(0, 4).map((p) => (
              <img
                key={p.userId}
                src={p.user.avatar}
                alt={p.user.name}
                className="w-6 h-6 rounded-full border-2 border-white object-cover"
              />
            ))}
            <div className="w-6 h-6 rounded-full border-2 border-white bg-ink-100 flex items-center justify-center">
              <span className="text-[9px] font-bold text-ink-500">
                +{Math.max(0, challenge.participantCount - 4)}
              </span>
            </div>
          </div>
          <span className="text-xs text-ink-500">
            {challenge.participantCount.toLocaleString()} 人参与
          </span>
        </div>
      </div>
    </motion.div>
  );
}
