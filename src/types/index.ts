export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  totalDistance: number;
  totalActivities: number;
  totalHours: number;
  monthlyDistance: number;
  weeklyDistance: number;
  streakDays: number;
  followers: number;
  following: number;
  createdAt: string;
  level: number;
}

export type ActivityType = 'running' | 'cycling';

export interface TrackPoint {
  timestamp: number;
  latitude: number;
  longitude: number;
  elevation: number;
  speed: number;
}

export interface HeartRateSample {
  timestamp: number;
  bpm: number;
}

export interface SplitRecord {
  index: number;
  distance: number;
  duration: number;
  pace: number;
  elevationGain: number;
  avgHeartRate?: number;
}

export interface Activity {
  id: string;
  userId: string;
  routeId?: string;
  type: ActivityType;
  name: string;
  distance: number;
  duration: number;
  avgPace: number;
  avgSpeed: number;
  elevationGain: number;
  maxElevation: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  calories: number;
  startTime: string;
  endTime: string;
  trackPoints: TrackPoint[];
  heartRateSamples?: HeartRateSample[];
  splits?: SplitRecord[];
  weather?: {
    temperature: number;
    condition: string;
    humidity: number;
  };
}

export type Difficulty = 'easy' | 'moderate' | 'hard';
export type DifficultyLevel = 'easy' | 'moderate' | 'hard' | 'expert';

export interface Route {
  id: string;
  name: string;
  type: ActivityType;
  distance: number;
  elevationGain: number;
  difficulty: Difficulty;
  completionCount: number;
  rating: number;
  reviewCount: number;
  startPoint: [number, number];
  endPoint: [number, number];
  trackData: TrackPoint[];
  isFavorite: boolean;
  description: string;
  tags: string[];
  estimatedDuration: number;
  creator: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  coverImage?: string;
}

export type ChallengeType = 'distance' | 'streak' | 'elevation';

export interface ChallengeParticipant {
  userId: string;
  user: User;
  progress: number;
  currentValue: number;
  joinedAt: string;
  rank?: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  target: number;
  unit: string;
  startDate: string;
  endDate: string;
  participantCount: number;
  participants: ChallengeParticipant[];
  banner?: string;
  reward?: string;
  rules: string[];
  isJoined?: boolean;
  myProgress?: number;
  myCurrentValue?: number;
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  content: string;
  createdAt: string;
  likes: number;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  activityId?: string;
  content: string;
  images: string[];
  likes: number;
  comments: Comment[];
  createdAt: string;
  isLiked: boolean;
  isBookmarked: boolean;
  shareCount: number;
  tags: string[];
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'milestone' | 'streak' | 'challenge' | 'explorer';
}

export interface PersonalBest {
  distance: string;
  value: string;
  date: string;
  activityId: string;
  isNew?: boolean;
}

export interface MonthlyStat {
  month: string;
  distance: number;
  activities: number;
  duration: number;
  elevation: number;
}

export interface PaceZone {
  name: string;
  minPace: number;
  maxPace: number;
  color: string;
  description: string;
}

export interface HeartRateZoneConfig {
  name: string;
  minRate: number;
  maxRate: number;
  color: string;
  description: string;
}

export interface DifficultyConfig {
  [key: string]: {
    label: string;
    color: string;
    minDistance: number;
  };
}

export const DEFAULT_PACE_ZONES: PaceZone[] = [
  {
    name: '冲刺',
    minPace: 0,
    maxPace: 240,
    color: '#DC2626',
    description: '最大速度，无氧运动区间',
  },
  {
    name: '节奏跑',
    minPace: 240,
    maxPace: 300,
    color: '#EA580C',
    description: '高强度有氧，提升速度耐力',
  },
  {
    name: '马拉松配速',
    minPace: 300,
    maxPace: 360,
    color: '#F59E0B',
    description: '比赛配速，提升耐力表现',
  },
  {
    name: '有氧跑',
    minPace: 360,
    maxPace: 420,
    color: '#10B981',
    description: '舒适有氧区间，增强心肺功能',
  },
  {
    name: '轻松跑',
    minPace: 420,
    maxPace: 480,
    color: '#3B82F6',
    description: '恢复性慢跑，适合热身和放松',
  },
  {
    name: '超慢跑',
    minPace: 480,
    maxPace: Infinity,
    color: '#6366F1',
    description: '极低强度，适合恢复和初学者',
  },
];

export const DEFAULT_HEART_RATE_ZONES: HeartRateZoneConfig[] = [
  {
    name: '热身',
    minRate: 0,
    maxRate: 120,
    color: '#60A5FA',
    description: '热身运动，身体准备阶段',
  },
  {
    name: '燃脂',
    minRate: 120,
    maxRate: 140,
    color: '#34D399',
    description: '脂肪燃烧区间，适合减脂',
  },
  {
    name: '有氧',
    minRate: 140,
    maxRate: 160,
    color: '#FBBF24',
    description: '有氧耐力区间，增强心肺功能',
  },
  {
    name: '无氧',
    minRate: 160,
    maxRate: 180,
    color: '#F97316',
    description: '高强度训练，提升速度能力',
  },
  {
    name: '极限',
    minRate: 180,
    maxRate: 220,
    color: '#EF4444',
    description: '最大强度，仅适合短时间冲刺',
  },
];

export const DIFFICULTY_CONFIG: DifficultyConfig = {
  easy: {
    label: '简单',
    color: '#10B981',
    minDistance: 0,
  },
  moderate: {
    label: '中等',
    color: '#F59E0B',
    minDistance: 10000,
  },
  hard: {
    label: '困难',
    color: '#F97316',
    minDistance: 25000,
  },
  expert: {
    label: '挑战',
    color: '#DC2626',
    minDistance: 50000,
  },
};
