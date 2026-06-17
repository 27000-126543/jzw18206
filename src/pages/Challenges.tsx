import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Clock,
  Users,
  Target,
  Zap,
  Search,
  Plus,
  X,
  ChevronRight,
  Crown,
  Award,
  TrendingUp,
  Calendar,
  Flame,
  Mountain,
  Footprints,
  CheckCircle,
  Circle,
  ChevronDown,
  Filter,
  Sparkles,
  Star,
  Medal,
  Timer,
  Gift,
  Info,
  ArrowRight,
} from 'lucide-react';
import useStore from '@/store/useStore';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatters';
import type { Challenge, ChallengeType, ChallengeParticipant, User } from '@/types';

type TabFilter = 'all' | 'ongoing' | 'upcoming' | 'completed' | 'joined';
type TypeFilter = 'all' | ChallengeType;

const typeGradientMap: Record<ChallengeType, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  distance: {
    bg: 'from-orange-500 via-amber-500 to-orange-600',
    text: 'text-orange-600',
    label: '距离挑战',
    icon: <Footprints className="w-3.5 h-3.5" />,
  },
  streak: {
    bg: 'from-teal-500 via-cyan-500 to-teal-600',
    text: 'text-teal-600',
    label: '连续打卡',
    icon: <Flame className="w-3.5 h-3.5" />,
  },
  elevation: {
    bg: 'from-purple-500 via-violet-500 to-purple-600',
    text: 'text-purple-600',
    label: '爬升挑战',
    icon: <Mountain className="w-3.5 h-3.5" />,
  },
};

function getChallengeStatus(challenge: Challenge): 'ongoing' | 'upcoming' | 'completed' {
  const now = new Date();
  const start = new Date(challenge.startDate);
  const end = new Date(challenge.endDate);
  if (now < start) return 'upcoming';
  if (now > end) return 'completed';
  return 'ongoing';
}

function getDaysRemaining(endDateStr: string): number {
  const now = new Date();
  const end = new Date(endDateStr);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function getEstimatedCompletionTime(
  currentValue: number,
  target: number,
  daysPassed: number
): string {
  if (currentValue >= target || daysPassed <= 0) return '即将达成';
  const progressPerDay = currentValue / daysPassed;
  if (progressPerDay <= 0) return '暂无数据';
  const remainingValue = target - currentValue;
  const estimatedDays = Math.ceil(remainingValue / progressPerDay);
  if (estimatedDays <= 0) return '即将达成';
  if (estimatedDays > 365) return '需加速';
  return `预计约 ${estimatedDays} 天`;
}

export default function Challenges() {
  const { challenges, user, joinChallenge, addChallenge } = useStore();

  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const ongoing = challenges.filter((c) => getChallengeStatus(c) === 'ongoing');
    const completed = challenges.filter((c) => getChallengeStatus(c) === 'completed');
    const totalParticipants = challenges.reduce((sum, c) => sum + c.participantCount, 0);
    return {
      ongoing: ongoing.length,
      totalParticipants,
      completed: completed.length,
      myJoined: challenges.filter((c) => c.isJoined).length,
      _now: now,
    };
  }, [challenges]);

  const filteredChallenges = useMemo(() => {
    let result = [...challenges];

    if (activeTab === 'ongoing') {
      result = result.filter((c) => getChallengeStatus(c) === 'ongoing');
    } else if (activeTab === 'upcoming') {
      result = result.filter((c) => getChallengeStatus(c) === 'upcoming');
    } else if (activeTab === 'completed') {
      result = result.filter((c) => getChallengeStatus(c) === 'completed');
    } else if (activeTab === 'joined') {
      result = result.filter((c) => c.isJoined);
    }

    if (typeFilter !== 'all') {
      result = result.filter((c) => c.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    return result;
  }, [challenges, activeTab, typeFilter, searchQuery]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
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

  const handleJoin = (challengeId: string) => {
    joinChallenge(challengeId);
  };

  const tabs: { key: TabFilter; label: string; count?: number }[] = [
    { key: 'all', label: '全部' },
    { key: 'ongoing', label: '进行中', count: stats.ongoing },
    { key: 'upcoming', label: '即将开始' },
    { key: 'completed', label: '已完成', count: stats.completed },
    { key: 'joined', label: '我参与的', count: stats.myJoined },
  ];

  const typeOptions: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: '全部类型' },
    { key: 'distance', label: '距离挑战' },
    { key: 'streak', label: '连续打卡' },
    { key: 'elevation', label: '爬升挑战' },
  ];

  return (
    <div className="min-h-screen bg-ink-50 pb-16">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
        variants={containerVariants}
        className="container pt-6 space-y-8"
      >
        {/* Hero 横幅区 */}
        <motion.section variants={itemVariants} className="relative">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-amber-500 shadow-brand-glow">
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"
              />
              <motion.div
                animate={{
                  rotate: [360, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                className="absolute -bottom-48 -right-20 w-[500px] h-[500px] bg-teal-300/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-10 right-20 w-24 h-24 border-4 border-white/20 rotate-45 rounded-2xl"
              />
              <motion.div
                animate={{ y: [0, 15, 0], rotate: [0, 15, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute bottom-16 left-16 w-16 h-16 border-4 border-white/25 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/2 left-1/3 w-8 h-8 bg-white/30 rounded-lg rotate-12"
              />
            </div>

            <div className="relative p-6 md:p-10 lg:p-12">
              <div className="max-w-3xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-6"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span className="text-white/90 text-sm font-medium">限时挑战 · 赢取限定奖励</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-white leading-tight mb-4"
                >
                  挑战自我 · 突破极限
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-white/85 text-base md:text-lg leading-relaxed mb-8"
                >
                  与社区伙伴一起，用每一步创造非凡
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
                >
                  <StatPill
                    icon={<Trophy className="w-5 h-5" />}
                    value={stats.ongoing}
                    label="进行中挑战"
                    color="from-amber-400 to-yellow-300"
                    delay={0.5}
                  />
                  <StatPill
                    icon={<Users className="w-5 h-5" />}
                    value={stats.totalParticipants}
                    label="总参与人次"
                    color="from-teal-400 to-cyan-300"
                    delay={0.55}
                  />
                  <StatPill
                    icon={<CheckCircle className="w-5 h-5" />}
                    value={stats.completed}
                    label="累计完成挑战"
                    color="from-purple-400 to-pink-300"
                    delay={0.6}
                  />
                  <StatPill
                    icon={<Star className="w-5 h-5" />}
                    value={stats.myJoined}
                    label="我参与的"
                    color="from-blue-400 to-indigo-300"
                    delay={0.65}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 筛选栏 */}
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-soft border border-ink-100">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex flex-wrap items-center gap-2 p-1 rounded-xl bg-ink-50">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300',
                      activeTab === tab.key
                        ? 'bg-white text-brand-600 shadow-sm'
                        : 'text-ink-500 hover:text-ink-700 hover:bg-white/60'
                    )}
                  >
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                          activeTab === tab.key
                            ? 'bg-brand-50 text-brand-600'
                            : 'bg-ink-100 text-ink-500'
                        )}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="text"
                    placeholder="搜索挑战..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ink-50 border border-ink-100 text-sm text-ink-700 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                  />
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ink-50 border border-ink-100 text-sm font-medium text-ink-700 hover:bg-ink-100 transition-all w-full sm:w-auto justify-center"
                  >
                    <Filter className="w-4 h-4 text-ink-500" />
                    {typeOptions.find((o) => o.key === typeFilter)?.label}
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-ink-400 transition-transform',
                        showTypeDropdown && 'rotate-180'
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {showTypeDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full mt-2 right-0 w-44 rounded-xl bg-white border border-ink-100 shadow-glass overflow-hidden z-20"
                      >
                        {typeOptions.map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => {
                              setTypeFilter(opt.key);
                              setShowTypeDropdown(false);
                            }}
                            className={cn(
                              'w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors',
                              typeFilter === opt.key
                                ? 'bg-brand-50 text-brand-600 font-semibold'
                                : 'text-ink-600 hover:bg-ink-50'
                            )}
                          >
                            {typeFilter === opt.key && <CheckCircle className="w-4 h-4" />}
                            {typeFilter !== opt.key && <Circle className="w-4 h-4 text-ink-300" />}
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-[0.98] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  创建挑战
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              距离挑战
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              连续打卡
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              爬升挑战
            </span>
          </div>
        </motion.section>

        {/* 挑战卡片网格 */}
        <motion.section variants={itemVariants}>
          {filteredChallenges.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-soft border border-ink-100 text-center">
              <Target className="w-16 h-16 text-ink-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ink-600 mb-2">暂无匹配的挑战</h3>
              <p className="text-sm text-ink-400">换个筛选条件试试吧</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredChallenges.map((challenge, index) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    index={index}
                    userId={user.id}
                    onOpenDetail={() => setSelectedChallenge(challenge)}
                    onJoin={() => handleJoin(challenge.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.section>
      </motion.div>

      <AnimatePresence>
        {selectedChallenge && (
          <DetailModal
            challenge={selectedChallenge}
            currentUserId={user.id}
            onClose={() => setSelectedChallenge(null)}
            onJoin={() => handleJoin(selectedChallenge.id)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <CreateChallengeModal
            onClose={() => setShowCreateModal(false)}
            onCreate={addChallenge}
            user={user}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatPill({
  icon,
  value,
  label,
  color,
  delay,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, type: 'spring', stiffness: 200 }}
      className="group relative bg-white/12 backdrop-blur-md border border-white/25 rounded-2xl p-4 hover:bg-white/20 transition-all cursor-default"
    >
      <div
        className={cn(
          'absolute -top-1 -right-1 w-10 h-10 rounded-full bg-gradient-to-br',
          color,
          'opacity-40 blur-xl group-hover:opacity-60 transition-opacity'
        )}
      />
      <div className="relative flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl bg-gradient-to-br',
            color,
            'flex items-center justify-center text-white shadow-lg'
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xl md:text-2xl font-bold text-white leading-none">
            {value.toLocaleString()}
          </div>
          <div className="text-[11px] md:text-xs text-white/80 mt-1 truncate">{label}</div>
        </div>
      </div>
    </motion.div>
  );
}

function ChallengeCard({
  challenge,
  index,
  userId,
  onOpenDetail,
  onJoin,
}: {
  challenge: Challenge;
  index: number;
  userId: string;
  onOpenDetail: () => void;
  onJoin: () => void;
}) {
  const gradient = typeGradientMap[challenge.type];
  const status = getChallengeStatus(challenge);
  const daysLeft = getDaysRemaining(challenge.endDate);
  const myParticipant = challenge.participants.find((p) => p.userId === userId);
  const progress = myParticipant?.progress ?? challenge.myProgress ?? 0;
  const currentValue = myParticipant?.currentValue ?? challenge.myCurrentValue ?? 0;
  const myRank = myParticipant?.rank;
  const isCompleted = status === 'completed';
  const isOngoing = status === 'ongoing';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: 'easeOut',
      }}
      whileHover={{ y: -6 }}
      onClick={onOpenDetail}
      className="group relative rounded-3xl overflow-hidden bg-white border border-ink-100 shadow-soft hover:shadow-card-hover transition-all cursor-pointer"
    >
      <div className={cn('relative h-36 overflow-hidden bg-gradient-to-br', gradient.bg)}>
        {challenge.banner ? (
          <img
            src={challenge.banner}
            alt={challenge.title}
            className="w-full h-full object-cover opacity-40 mix-blend-overlay transition-transform duration-700 group-hover:scale-110"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        <motion.div
          animate={{ rotate: [0, 8, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-6 -right-6 w-28 h-28 border-4 border-white/20 rounded-3xl rotate-12"
        />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-6 -left-4 w-16 h-16 border-2 border-white/25 rounded-full"
        />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-white/25 backdrop-blur-sm flex items-center gap-1">
              {gradient.icon}
              {gradient.label}
            </span>
            {challenge.isJoined && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-brand-700 bg-white/90 backdrop-blur-sm flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                已参与
              </span>
            )}
            {isCompleted && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-ink-700 bg-white/90 backdrop-blur-sm flex items-center gap-1">
                <Award className="w-3 h-3" />
                已结束
              </span>
            )}
            {status === 'upcoming' && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 backdrop-blur-sm flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                即将开始
              </span>
            )}
          </div>
        </div>

        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-bold text-white text-lg line-clamp-1 drop-shadow-sm">
            {challenge.title}
          </h3>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-sm text-ink-500 leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {challenge.description}
        </p>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500 flex items-center gap-1">
              <TrendingUp className={cn('w-4 h-4', gradient.text)} />
              <span>
                <span className="font-bold text-ink-800">
                  {currentValue.toLocaleString()}
                </span>{' '}
                / {challenge.target.toLocaleString()} {challenge.unit}
              </span>
            </span>
            <span className={cn('text-sm font-bold', gradient.text)}>
              {progress.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-ink-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.min(100, progress)}%` }}
              viewport={{ once: true }}
              transition={{
                duration: 1.2,
                delay: 0.2 + index * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={cn('h-full rounded-full bg-gradient-to-r relative overflow-hidden', gradient.bg)}
            >
              <div className="absolute inset-0 bg-white/25 animate-shimmer" />
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2.5 rounded-xl bg-ink-50">
            <Timer className="w-3.5 h-3.5 text-ink-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-ink-800">
              {isCompleted ? '已结束' : status === 'upcoming' ? '待开始' : `${daysLeft}天`}
            </p>
            <p className="text-[10px] text-ink-400">剩余时间</p>
          </div>
          <div className="text-center p-2.5 rounded-xl bg-ink-50">
            <Users className="w-3.5 h-3.5 text-ink-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-ink-800">
              {challenge.participants.length}
            </p>
            <p className="text-[10px] text-ink-400">参与人数</p>
          </div>
          <div className="text-center p-2.5 rounded-xl bg-ink-50">
            <Medal className="w-3.5 h-3.5 text-ink-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-ink-800">{myRank ? `#${myRank}` : '-'}</p>
            <p className="text-[10px] text-ink-400">我的排名</p>
          </div>
        </div>

        {challenge.isJoined && myRank && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-brand-50 to-amber-50 border border-brand-100">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-brand-700 font-medium">
                <Sparkles className="w-4 h-4" />
                我的进度
              </span>
              <span className="text-brand-600 font-bold">{progress.toFixed(1)}%</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-ink-100">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {challenge.participants.slice(0, 5).map((p) => (
                <img
                  key={p.userId}
                  src={p.user.avatar}
                  alt={p.user.name}
                  className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm"
                  title={p.user.name}
                />
              ))}
              {challenge.participants.length > 5 && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br from-ink-200 to-ink-300 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-ink-600">
                    +{(challenge.participants.length - 5) > 99 ? '99+' : challenge.participants.length - 5}
                  </span>
                </div>
              )}
            </div>
          </div>

          {isCompleted ? (
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-ink-100 to-ink-200 text-ink-600 text-sm font-semibold">
              <Award className="w-4 h-4" />
              已完成
            </div>
          ) : challenge.isJoined ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail();
              }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all',
                gradient.bg
              )}
            >
              查看详情
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJoin();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-gradient text-white text-sm font-semibold shadow-md shadow-brand-500/25 hover:shadow-brand-500/40 transition-all"
            >
              <Zap className="w-4 h-4" />
              参与挑战
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function DetailModal({
  challenge,
  currentUserId,
  onClose,
  onJoin,
}: {
  challenge: Challenge;
  currentUserId: string;
  onClose: () => void;
  onJoin: () => void;
}) {
  const gradient = typeGradientMap[challenge.type];
  const status = getChallengeStatus(challenge);
  const daysLeft = getDaysRemaining(challenge.endDate);
  const myParticipant = challenge.participants.find((p) => p.userId === currentUserId);
  const myProgress = myParticipant?.progress ?? challenge.myProgress ?? 0;
  const myCurrentValue = myParticipant?.currentValue ?? challenge.myCurrentValue ?? 0;
  const myRank = myParticipant?.rank;
  const startDate = new Date(challenge.startDate);
  const now = new Date();
  const daysPassed = Math.max(
    1,
    Math.ceil((Math.min(now.getTime(), new Date(challenge.endDate).getTime()) - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const sortedParticipants = useMemo(
    () => [...challenge.participants].sort((a, b) => b.currentValue - a.currentValue),
    [challenge.participants]
  );

  const top3 = sortedParticipants.slice(0, 3);
  const rest = sortedParticipants.slice(3);

  const participantCount = challenge.participants.length;

  const activities = useMemo(() => {
    const result: {
      id: string;
      user: User;
      action: string;
      time: string;
      milestone: string | null;
    }[] = [];

    const count = Math.min(sortedParticipants.length, 4);
    if (count === 0) return result;

    const activityTemplates = [
      { action: '刚刚加入挑战', time: '刚刚', milestone: null },
      { action: '加入挑战', time: '1小时前', milestone: null },
      { action: '完成了今日打卡', time: '今天早上', milestone: null },
      { action: '达成了 30% 里程碑', time: '昨天', milestone: '30%' },
    ];

    for (let i = 0; i < count; i++) {
      const participant = sortedParticipants[i];
      const template = activityTemplates[i];

      let action = template.action;
      let milestone = template.milestone;
      let time = template.time;

      if (i === 0) {
        action = '刚刚加入挑战';
        milestone = null;
        time = '刚刚';
      } else if (i === 1) {
        action = '加入挑战';
        milestone = null;
        time = '1小时前';
      } else if (i === 2) {
        action = '完成了今日打卡';
        milestone = null;
        time = '今天早上';
      } else if (i === 3) {
        const progress = participant.progress;
        if (progress >= 80) {
          action = '达成了 80% 里程碑';
          milestone = '80%';
        } else if (progress >= 50) {
          action = '达成了 50% 里程碑';
          milestone = '50%';
        } else if (progress >= 30) {
          action = '达成了 30% 里程碑';
          milestone = '30%';
        } else {
          action = '完成了今日打卡';
          milestone = null;
        }
        time = '昨天';
      }

      result.push({
        id: `act-${i}`,
        user: participant.user,
        action,
        time,
        milestone,
      });
    }

    return result;
  }, [sortedParticipants]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ duration: 0.35, type: 'spring', stiffness: 280, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl my-4 bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-ink-600 hover:text-ink-900 hover:bg-white transition-all hover:scale-110"
        >
          <X className="w-5 h-5" />
        </button>

        <div className={cn('relative h-48 sm:h-56 overflow-hidden bg-gradient-to-br', gradient.bg)}>
          {challenge.banner && (
            <img
              src={challenge.banner}
              alt={challenge.title}
              className="w-full h-full object-cover opacity-45 mix-blend-overlay"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          <motion.div
            animate={{ rotate: [0, 20, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-20 -right-10 w-64 h-64 border-4 border-white/15 rounded-[3rem] rotate-45"
          />

          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/25 backdrop-blur-sm flex items-center gap-1.5">
                {gradient.icon}
                {gradient.label}
              </span>
              {status === 'ongoing' && (
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-green-500/80 backdrop-blur-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  进行中
                </span>
              )}
              {status === 'upcoming' && (
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-500/80 backdrop-blur-sm">
                  即将开始
                </span>
              )}
              {status === 'completed' && (
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-ink-700/80 backdrop-blur-sm flex items-center gap-1.5">
                  <Award className="w-3 h-3" />
                  已结束
                </span>
              )}
              {challenge.isJoined && (
                <span className="px-3 py-1 rounded-lg text-xs font-bold text-brand-700 bg-white/95 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  我已参与
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display drop-shadow-sm mb-1">
              {challenge.title}
            </h2>
            <p className="text-white/85 text-sm sm:text-base max-w-2xl">{challenge.description}</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <InfoSection challenge={challenge} gradient={gradient} daysLeft={daysLeft} participantCount={participantCount} />
              <LeaderboardSection
                top3={top3}
                rest={rest}
                currentUserId={currentUserId}
                gradient={gradient}
                target={challenge.target}
                unit={challenge.unit}
              />
              <ActivityWall activities={activities} />
            </div>

            <div className="space-y-6">
              <MyProgressCard
                isJoined={!!challenge.isJoined}
                myProgress={myProgress}
                myCurrentValue={myCurrentValue}
                target={challenge.target}
                unit={challenge.unit}
                myRank={myRank}
                gradient={gradient}
                daysPassed={daysPassed}
                status={status}
                onJoin={onJoin}
              />
              <TimelineCard challenge={challenge} />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InfoSection({
  challenge,
  gradient,
  daysLeft,
  participantCount,
}: {
  challenge: Challenge;
  gradient: { bg: string; text: string; label: string };
  daysLeft: number;
  participantCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-5"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-ink-50 text-center">
          <Calendar className={cn('w-5 h-5 mx-auto mb-1.5', gradient.text)} />
          <p className="text-xs text-ink-400 mb-1">开始</p>
          <p className="text-sm font-bold text-ink-800">
            {formatDate(challenge.startDate, 'MM月dd日')}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-ink-50 text-center">
          <Clock className={cn('w-5 h-5 mx-auto mb-1.5', gradient.text)} />
          <p className="text-xs text-ink-400 mb-1">结束</p>
          <p className="text-sm font-bold text-ink-800">
            {formatDate(challenge.endDate, 'MM月dd日')}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-ink-50 text-center">
          <Users className={cn('w-5 h-5 mx-auto mb-1.5', gradient.text)} />
          <p className="text-xs text-ink-400 mb-1">参与人数</p>
          <p className="text-sm font-bold text-ink-800">
            {participantCount}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-amber-50 text-center border border-brand-100">
          <Timer className="w-5 h-5 text-brand-600 mx-auto mb-1.5" />
          <p className="text-xs text-brand-500/70 mb-1">剩余</p>
          <p className="text-sm font-bold text-brand-700">{daysLeft} 天</p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-ink-50 space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-bold text-ink-800">
          <Info className="w-4 h-4 text-ink-400" />
          挑战规则
        </h4>
        <ul className="space-y-2">
          {challenge.rules.map((rule, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-ink-600">
              <span className={cn('flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br flex items-center justify-center text-[10px] font-bold text-white', gradient.bg)}>
                {i + 1}
              </span>
              <span className="leading-relaxed">{rule}</span>
            </li>
          ))}
        </ul>
      </div>

      {challenge.reward && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-100 space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-bold text-amber-800">
            <Gift className="w-4 h-4 text-amber-600" />
            挑战奖励
          </h4>
          <p className="text-sm text-amber-700 leading-relaxed">{challenge.reward}</p>
        </div>
      )}
    </motion.div>
  );
}

function LeaderboardSection({
  top3,
  rest,
  currentUserId,
  gradient,
  target,
  unit,
}: {
  top3: ChallengeParticipant[];
  rest: ChallengeParticipant[];
  currentUserId: string;
  gradient: { bg: string; text: string; label: string };
  target: number;
  unit: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="space-y-4"
    >
      <h4 className="flex items-center gap-2 text-lg font-bold text-ink-800">
        <Trophy className="w-5 h-5 text-amber-500" />
        实时排行榜
      </h4>

      <div className="grid grid-cols-3 gap-3 items-end">
        {[1, 0, 2].map((order) => {
          const participant = top3[order];
          const rank = order + 1;
          if (!participant) {
            return <div key={`empty-${rank}`} className="h-48" />;
          }
          return (
            <Top3Card
              key={participant.userId}
              participant={participant}
              rank={rank}
              isCurrentUser={participant.userId === currentUserId}
              gradient={gradient}
              target={target}
              unit={unit}
            />
          );
        })}
      </div>

      <div className="rounded-2xl border border-ink-100 overflow-hidden">
        {rest.map((p, index) => {
          const rank = 4 + index;
          const isCurrentUser = p.userId === currentUserId;
          const gapToTop = top3[0]
            ? (top3[0].currentValue - p.currentValue).toFixed(1)
            : '0';
          return (
            <motion.div
              key={p.userId}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.4 + index * 0.04 }}
              className={cn(
                'flex items-center gap-3 p-3 border-b border-ink-50 last:border-b-0 transition-colors',
                isCurrentUser
                  ? 'bg-gradient-to-r from-brand-50/60 to-transparent border-l-4 border-l-brand-500'
                  : 'hover:bg-ink-50/60'
              )}
            >
              <div
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold',
                  isCurrentUser
                    ? 'bg-brand-gradient text-white shadow-md shadow-brand-500/30'
                    : 'bg-ink-100 text-ink-600'
                )}
              >
                {rank}
              </div>

              <img
                src={p.user.avatar}
                alt={p.user.name}
                className={cn(
                  'w-9 h-9 rounded-full object-cover ring-2',
                  isCurrentUser ? 'ring-brand-500/50' : 'ring-white'
                )}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink-800 truncate">
                    {p.user.name}
                  </p>
                  {isCurrentUser && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md bg-brand-500 text-white text-[10px] font-bold">
                      我
                    </span>
                  )}
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, p.progress)}%` }}
                    transition={{
                      duration: 1,
                      delay: 0.5 + index * 0.05,
                      ease: 'easeOut',
                    }}
                    className={cn('h-full rounded-full bg-gradient-to-r', gradient.bg)}
                  />
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-ink-800">
                  {p.currentValue.toFixed(1)} {unit}
                </p>
                <p className="text-[10px] text-ink-400 flex items-center justify-end gap-1">
                  <ArrowRight className="w-3 h-3" />
                  差 {gapToTop}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function Top3Card({
  participant,
  rank,
  isCurrentUser,
  gradient,
  target,
  unit,
}: {
  participant: ChallengeParticipant;
  rank: number;
  isCurrentUser: boolean;
  gradient: { bg: string; text: string };
  target: number;
  unit: string;
}) {
  const rankConfig = {
    1: {
      gradient: 'from-yellow-400 via-amber-300 to-yellow-500',
      borderGradient: 'from-yellow-400 via-amber-300 to-yellow-500',
      bg: 'from-yellow-50 via-amber-50 to-yellow-100',
      shadow: 'shadow-yellow-400/30',
      size: rank === 1 ? 'h-52' : rank === 2 ? 'h-44' : 'h-40',
      order: rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3',
    },
    2: {
      gradient: 'from-gray-300 via-slate-200 to-gray-400',
      borderGradient: 'from-gray-300 via-slate-200 to-gray-400',
      bg: 'from-slate-50 via-gray-50 to-slate-100',
      shadow: 'shadow-slate-400/30',
      size: 'h-44',
      order: 'order-1',
    },
    3: {
      gradient: 'from-orange-400 via-amber-600 to-orange-700',
      borderGradient: 'from-orange-400 via-amber-600 to-orange-700',
      bg: 'from-orange-50 via-amber-50 to-orange-100',
      shadow: 'shadow-orange-400/30',
      size: 'h-40',
      order: 'order-3',
    },
  }[rank as 1 | 2 | 3];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.25 + rank * 0.08, type: 'spring', stiffness: 220 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={cn(
        'relative rounded-3xl overflow-hidden p-4 bg-gradient-to-br',
        rankConfig.bg,
        rankConfig.size,
        rank === 1 ? '' : ''
      )}
    >
      {rank === 1 && (
        <>
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(251, 191, 36, 0.4)',
                '0 0 0 20px rgba(251, 191, 36, 0)',
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-3xl"
          />
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute -top-2 left-1/2 -translate-x-1/2 z-10"
          >
            <Crown className="w-10 h-10 text-yellow-500 drop-shadow-lg fill-yellow-300" />
          </motion.div>
        </>
      )}

      {isCurrentUser && (
        <div className="absolute top-2 right-2 z-10">
          <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-bold shadow-md">
            我
          </span>
        </div>
      )}

      <div className="h-full flex flex-col items-center justify-end">
        <div className="relative mb-3 mt-2">
          {rank === 1 && (
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-yellow-300 to-amber-300 opacity-40 blur-md animate-pulse" />
          )}
          <div
            className={cn(
              'relative p-0.5 rounded-full bg-gradient-to-br',
              rankConfig.borderGradient
            )}
          >
            <img
              src={participant.user.avatar}
              alt={participant.user.name}
              className={cn(
                'rounded-full object-cover ring-4 ring-white shadow-xl',
                rank === 1 ? 'w-16 h-16' : 'w-14 h-14'
              )}
            />
          </div>
          <div
            className={cn(
              'absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white',
              rankConfig.gradient
            )}
          >
            {rank}
          </div>
        </div>

        <p className="text-sm font-bold text-ink-800 text-center line-clamp-1 w-full">
          {participant.user.name}
        </p>

        <div className="mt-1.5 w-full">
          <div className="flex items-center justify-between text-[10px] text-ink-500 mb-1">
            <span>{participant.currentValue.toFixed(1)} {unit}</span>
            <span className="font-bold text-ink-700">
              {participant.progress.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/70 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, participant.progress)}%` }}
              transition={{
                duration: 1.2,
                delay: 0.6 + rank * 0.1,
                ease: 'easeOut',
              }}
              className={cn('h-full rounded-full bg-gradient-to-r', gradient.bg)}
            />
          </div>
        </div>

        <div
          className={cn(
            'mt-2 px-2.5 py-0.5 rounded-lg bg-gradient-to-r text-white text-[10px] font-bold shadow-sm',
            rankConfig.gradient
          )}
        >
          {rank === 1 ? '冠军' : rank === 2 ? '亚军' : '季军'}
        </div>
      </div>
    </motion.div>
  );
}

function MyProgressCard({
  isJoined,
  myProgress,
  myCurrentValue,
  target,
  unit,
  myRank,
  gradient,
  daysPassed,
  status,
  onJoin,
}: {
  isJoined: boolean;
  myProgress: number;
  myCurrentValue: number;
  target: number;
  unit: string;
  myRank?: number;
  gradient: { bg: string; text: string };
  daysPassed: number;
  status: 'ongoing' | 'upcoming' | 'completed';
  onJoin: () => void;
}) {
  const estimated = getEstimatedCompletionTime(myCurrentValue, target, daysPassed);

  if (!isJoined) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="p-6 rounded-3xl bg-gradient-to-br from-brand-50 via-white to-amber-50 border border-brand-100 text-center space-y-4"
      >
        <div
          className={cn(
            'w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg',
            gradient.bg
          )}
        >
          <Zap className="w-8 h-8 text-white" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-ink-800 mb-1">加入挑战</h4>
          <p className="text-sm text-ink-500 leading-relaxed">
            参与挑战，和 {target} 目标同行，解锁专属奖励！
          </p>
        </div>
        {status !== 'completed' && (
          <button
            onClick={onJoin}
            className="w-full py-3 rounded-xl bg-brand-gradient text-white font-bold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all active:scale-[0.98]"
          >
            立即参与
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className={cn(
        'p-5 rounded-3xl bg-gradient-to-br overflow-hidden relative',
        gradient.bg
      )}
    >
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="absolute -top-16 -right-16 w-40 h-40 border-4 border-white/15 rounded-full"
      />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

      <div className="relative text-white space-y-4">
        <h4 className="font-bold flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          我的进度
        </h4>

        <div className="text-center py-2">
          <div className="text-4xl font-bold font-display">
            {myProgress.toFixed(1)}%
          </div>
          <div className="text-sm text-white/80 mt-1">完成度</div>
        </div>

        <div className="h-3 rounded-full bg-white/20 overflow-hidden backdrop-blur-sm">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, myProgress)}%` }}
            transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-white relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
            <p className="text-[10px] text-white/70">当前</p>
            <p className="text-sm font-bold mt-0.5">
              {myCurrentValue.toFixed(1)} <span className="text-[10px] font-normal">{unit}</span>
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
            <p className="text-[10px] text-white/70">目标</p>
            <p className="text-sm font-bold mt-0.5">
              {target} <span className="text-[10px] font-normal">{unit}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
            <p className="text-[10px] text-white/70">当前排名</p>
            <p className="text-sm font-bold mt-0.5 flex items-center gap-1">
              <Medal className="w-3.5 h-3.5" />
              {myRank ? `#${myRank}` : '-'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
            <p className="text-[10px] text-white/70">预计完成</p>
            <p className="text-sm font-bold mt-0.5 flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" />
              {status === 'completed' ? '已完成' : estimated}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TimelineCard({ challenge }: { challenge: Challenge }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="p-5 rounded-3xl bg-ink-50 space-y-3"
    >
      <h4 className="flex items-center gap-2 text-sm font-bold text-ink-800">
        <Calendar className="w-4 h-4 text-ink-500" />
        时间安排
      </h4>
      <div className="relative pl-6 space-y-4">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-teal-400 via-brand-400 to-purple-400" />
        <TimelineItem
          title="挑战开始"
          subtitle={formatDate(challenge.startDate, 'yyyy年MM月dd日')}
          status="done"
          dotColor="bg-teal-500"
        />
        <TimelineItem
          title="进行中"
          subtitle="努力达成目标中..."
          status="active"
          dotColor="bg-brand-500"
        />
        <TimelineItem
          title="挑战结束"
          subtitle={formatDate(challenge.endDate, 'yyyy年MM月dd日')}
          status="pending"
          dotColor="bg-purple-500"
        />
      </div>
    </motion.div>
  );
}

function TimelineItem({
  title,
  subtitle,
  status,
  dotColor,
}: {
  title: string;
  subtitle: string;
  status: 'done' | 'active' | 'pending';
  dotColor: string;
}) {
  return (
    <div className="relative">
      <div
        className={cn(
          'absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full ring-4 ring-ink-50 z-10',
          dotColor,
          status === 'active' && 'animate-pulse'
        )}
      />
      <p
        className={cn(
          'text-sm font-semibold',
          status === 'pending' ? 'text-ink-400' : 'text-ink-800'
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          'text-xs mt-0.5',
          status === 'pending' ? 'text-ink-300' : 'text-ink-500'
        )}
      >
        {subtitle}
      </p>
    </div>
  );
}

function ActivityWall({
  activities,
}: {
  activities: {
    id: string;
    user: User;
    action: string;
    time: string;
    milestone: string | null;
  }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="space-y-3"
    >
      <h4 className="flex items-center gap-2 text-sm font-bold text-ink-800">
        <Sparkles className="w-4 h-4 text-amber-500" />
        参与者动态
      </h4>
      {activities.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-2xl bg-ink-50">
          <Sparkles className="w-10 h-10 text-ink-200 mx-auto mb-3" />
          <p className="text-sm text-ink-500 font-medium">暂无动态</p>
          <p className="text-xs text-ink-400 mt-1">成为第一个参与者吧！</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((act, i) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.35 + i * 0.06 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-ink-50 hover:bg-ink-100/70 transition-colors"
            >
              <img
                src={act.user.avatar}
                alt={act.user.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink-700 leading-tight">
                  <span className="font-semibold text-ink-800">{act.user.name}</span>{' '}
                  <span className="text-ink-500">{act.action}</span>
                </p>
                <p className="text-[11px] text-ink-400 mt-0.5">{act.time}</p>
              </div>
              {act.milestone && (
                <span className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold shadow-sm">
                  {act.milestone}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function CreateChallengeModal({
  onClose,
  onCreate,
  user,
}: {
  onClose: () => void;
  onCreate: (challenge: Challenge) => void;
  user: User;
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'distance' as ChallengeType,
    target: '',
    unit: 'km',
    startDate: '',
    endDate: '',
    rewardBadge: '🏆',
  });

  const badgeOptions = ['🏆', '🥇', '🎖️', '⭐', '🔥', '💎', '🎯', '🏅', '⚡', '🌟'];
  const unitOptions: Record<ChallengeType, { value: string; label: string }[]> = {
    distance: [
      { value: 'km', label: '公里 (km)' },
      { value: 'm', label: '米 (m)' },
      { value: 'mi', label: '英里 (mi)' },
    ],
    streak: [{ value: '天', label: '天' }],
    elevation: [
      { value: 'm', label: '米 (m)' },
      { value: 'km', label: '千米 (km)' },
    ],
  };

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'type') {
        next.unit = unitOptions[value as ChallengeType][0].value;
      }
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ duration: 0.35, type: 'spring', stiffness: 280, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg my-8 bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="relative h-32 bg-gradient-to-br from-brand-500 via-brand-600 to-amber-500 overflow-hidden">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-16 -right-16 w-56 h-56 border-4 border-white/15 rounded-[2.5rem] rotate-45"
          />
          <div className="absolute inset-0 p-6 flex items-end">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white font-display">创建挑战</h3>
                <p className="text-white/80 text-sm">和社区一起挑战自我</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-brand-500" />
              挑战标题
            </label>
            <input
              type="text"
              placeholder="例如：月度百公里挑战"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-ink-50 border border-ink-100 text-sm text-ink-700 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-brand-500" />
              挑战描述
            </label>
            <textarea
              rows={3}
              placeholder="描述一下这个挑战的目标和意义..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-ink-50 border border-ink-100 text-sm text-ink-700 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink-800">挑战类型</label>
              <div className="p-1 rounded-xl bg-ink-50 flex">
                {(['distance', 'streak', 'elevation'] as ChallengeType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => update('type', t)}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-semibold transition-all',
                      form.type === t
                        ? 'bg-white text-brand-600 shadow-sm'
                        : 'text-ink-500 hover:text-ink-700'
                    )}
                  >
                    {t === 'distance' && <Footprints className="w-4 h-4" />}
                    {t === 'streak' && <Flame className="w-4 h-4" />}
                    {t === 'elevation' && <Mountain className="w-4 h-4" />}
                    {t === 'distance' ? '距离' : t === 'streak' ? '打卡' : '爬升'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink-800">目标单位</label>
              <select
                value={form.unit}
                onChange={(e) => update('unit', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-ink-50 border border-ink-100 text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all appearance-none"
              >
                {unitOptions[form.type].map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              目标值
            </label>
            <input
              type="number"
              placeholder={`例如：100${form.unit}`}
              value={form.target}
              onChange={(e) => update('target', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-ink-50 border border-ink-100 text-sm text-ink-700 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-500" />
                开始日期
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => update('startDate', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-ink-50 border border-ink-100 text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-500" />
                结束日期
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => update('endDate', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-ink-50 border border-ink-100 text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-amber-500" />
              奖励徽章
            </label>
            <div className="flex flex-wrap gap-2">
              {badgeOptions.map((badge) => (
                <button
                  key={badge}
                  onClick={() => update('rewardBadge', badge)}
                  className={cn(
                    'w-12 h-12 rounded-2xl text-2xl flex items-center justify-center transition-all',
                    form.rewardBadge === badge
                      ? 'bg-gradient-to-br from-amber-100 to-orange-100 ring-2 ring-brand-500 scale-110 shadow-md'
                      : 'bg-ink-50 hover:bg-ink-100'
                  )}
                >
                  {badge}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 sm:px-8 sm:pb-8 border-t border-ink-100 bg-ink-50/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white border border-ink-200 text-ink-700 font-semibold text-sm hover:bg-ink-100 transition-all"
          >
            取消
          </button>
          <button
            onClick={() => {
              if (!form.title.trim()) {
                alert('请输入挑战标题');
                return;
              }
              if (!form.target.trim()) {
                alert('请输入目标值');
                return;
              }
              if (!form.startDate) {
                alert('请选择开始日期');
                return;
              }
              if (!form.endDate) {
                alert('请选择结束日期');
                return;
              }

              const newChallenge: Challenge = {
                id: `chal-${Date.now()}`,
                title: form.title,
                description: form.description,
                type: form.type,
                unit: form.unit,
                target: Number(form.target),
                startDate: `${form.startDate}T00:00:00.000Z`,
                endDate: `${form.endDate}T23:59:59.000Z`,
                participantCount: 1,
                isJoined: true,
                banner: `https://picsum.photos/seed/${Date.now()}/1200/400`,
                reward: `${form.rewardBadge} 完成挑战奖励`,
                rules: [
                  '按照挑战类型要求完成每日目标',
                  '坚持打卡，记录真实运动数据',
                  '尊重其他参与者，公平竞争'
                ],
                participants: [
                  {
                    userId: user.id,
                    user: user,
                    progress: 0,
                    currentValue: 0,
                    joinedAt: new Date().toISOString(),
                    rank: 1
                  }
                ]
              };

              onCreate(newChallenge);
              onClose();
            }}
            className="flex-[2] py-3 rounded-xl bg-brand-gradient text-white font-bold text-sm shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            创建挑战
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}