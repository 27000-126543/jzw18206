import type { Challenge, ChallengeParticipant } from '../types';
import { mockUsers, currentUser } from './mockUser';

function generateParticipantsForChallenge(
  challengeType: 'distance' | 'streak' | 'elevation',
  target: number
): ChallengeParticipant[] {
  const participants: ChallengeParticipant[] = [];
  const selectedUsers = [
    mockUsers[2],
    mockUsers[6],
    mockUsers[1],
    mockUsers[5],
    currentUser,
    mockUsers[4],
    mockUsers[10],
    mockUsers[7],
    mockUsers[11],
    mockUsers[8],
  ];

  for (let i = 0; i < selectedUsers.length; i++) {
    const user = selectedUsers[i];
    let currentValue: number;
    let progress: number;

    if (challengeType === 'distance') {
      currentValue = Math.round((target * (0.45 + (selectedUsers.length - i) * 0.06 + Math.random() * 0.08)) * 10) / 10;
      progress = Math.min(100, Math.round((currentValue / target) * 1000) / 10);
    } else if (challengeType === 'streak') {
      currentValue = Math.min(target, Math.max(1, Math.round(target * (0.3 + (selectedUsers.length - i) * 0.07 + Math.random() * 0.1))));
      progress = Math.min(100, Math.round((currentValue / target) * 1000) / 10);
    } else {
      currentValue = Math.round(target * (0.25 + (selectedUsers.length - i) * 0.08 + Math.random() * 0.06));
      progress = Math.min(100, Math.round((currentValue / target) * 1000) / 10);
    }

    const baseDate = new Date('2026-06-01T00:00:00+08:00');
    baseDate.setDate(baseDate.getDate() + Math.floor(Math.random() * 5));

    participants.push({
      userId: user.id,
      user: user,
      progress,
      currentValue,
      joinedAt: baseDate.toISOString(),
      rank: i + 1,
    });
  }

  return participants.sort((a, b) => b.currentValue - a.currentValue).map((p, i) => ({ ...p, rank: i + 1 }));
}

const distanceParticipants = generateParticipantsForChallenge('distance', 100);
const streakParticipants = generateParticipantsForChallenge('streak', 7);
const elevationParticipants = generateParticipantsForChallenge('elevation', 1000);

export const mockChallenges: Challenge[] = [
  {
    id: 'challenge-001',
    title: '六月百公里挑战赛',
    description: '火热六月，燃情开跑！在本月内完成累计100公里的跑步或骑行距离，用汗水点亮整个夏天，赢取限定勋章！',
    type: 'distance',
    target: 100,
    unit: 'km',
    startDate: '2026-06-01T00:00:00+08:00',
    endDate: '2026-06-30T23:59:59+08:00',
    participantCount: 5842,
    participants: distanceParticipants,
    banner: 'https://mmageg.ensplash.com/unspl-1552674605-ob6ffd4fhcb5?w=-526&h=460&fit=crop5-db6ffd4facb5?w=1200&h=400&fit=crop',
    reward: '🏆 百公里限定勋章 + 专属数字徽章',
    rules: [
      '挑战期间累计跑步或骑行距离达到100公里即可完成',
      '仅记录APP内记录的运动数据，手动添加无效',
      '跑步和骑行距离可累加计算',
      '完成挑战后自动解锁限定勋章',
      '最终数据以挑战结束时系统统计为准',
    ],
    isJoined: true,
    myProgress: distanceParticipants.find(p => p.userId === currentUser.id)?.progress || 0,
    myCurrentValue: distanceParticipants.find(p => p.userId === currentUser.id)?.currentValue || 0,
  },
  {
    id: 'challenge-002',
    title: '连续7天打卡挑战',
    description: '养成运动习惯，从连续7天开始！每天完成至少30分钟运动（跑步/骑行均可），连续打卡7天，见证更好的自己！',
    type: 'streak',
    target: 7,
    unit: '天',
    startDate: '2026-06-12T00:00:00+08:00',
    endDate: '2026-06-25T23:59:59+08:00',
    participantCount: 8236,
    participants: streakParticipants,
    banner: 'https://picsum.photos/seed/chal002/1200/400',
    reward: '🔥 连续打卡达人徽章 + 7天运动报告',
    rules: [
      '连续7天每天完成至少30分钟运动',
      '运动类型不限（跑步、骑行均可）',
      '每天23:59前完成运动并同步数据视为当天打卡成功',
      '中断1天则连续天数清零，可重新开始',
      '挑战期内完成连续7天即可获得奖励',
    ],
    isJoined: true,
    myProgress: streakParticipants.find(p => p.userId === currentUser.id)?.progress || 0,
    myCurrentValue: streakParticipants.find(p => p.userId === currentUser.id)?.currentValue || 0,
  },
  {
    id: 'challenge-003',
    title: '千峰万仞·累计爬升1000米',
    description: '征服高度，挑战自我！在挑战期间累计完成1000米爬升，无论是山路跑步还是爬坡骑行，每一步向上都是胜利！',
    type: 'elevation',
    target: 1000,
    unit: 'm',
    startDate: '2026-06-05T00:00:00+08:00',
    endDate: '2026-07-05T23:59:59+08:00',
    participantCount: 2156,
    participants: elevationParticipants,
    banner: 'https://picsum.photos/seed/chal003/1200/400',
    reward: '⛰️ 登山勇士勋章 + 爬坡训练计划',
    rules: [
      '挑战期间累计运动爬升高度达到1000米',
      '仅计算运动中真实海拔上升数据，下坡和平路不计入',
      '跑步和骑行的爬升均可累加',
      '建议选择山区路线或坡道进行训练',
      '完成挑战即可解锁专属勋章',
    ],
    isJoined: false,
  },
];

export default mockChallenges;
