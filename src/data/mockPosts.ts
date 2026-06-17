import type { Post, Comment } from '../types';
import { mockUsers, currentUser } from './mockUser';

function createComments(commentCount: number): Comment[] {
  const comments: Comment[] = [];
  const commentContents = [
    '太棒了！配速真稳 👏',
    '这条路线风景超美，下次一起！',
    '大神带带我，我也想跑这么快',
    '心率控制得真好，学习了',
    '周末骑行太棒了，风景绝了',
    '连续打卡太厉害了，向你学习！',
    '这个爬升量真恐怖，厉害厉害',
    '照片拍得好好看，是什么相机？',
    '朝阳公园果然是跑步圣地啊',
    '一起加油，冲过百公里！💪',
    '这个配速太猛了，完全追不上',
    '恢复跑也这么快，太强了',
    '什刹海夜景真的很适合跑步',
    '骑行长距离真的需要毅力，佩服',
    '十三陵水库那条线我也骑过，真的美！',
  ];

  for (let i = 0; i < commentCount; i++) {
    const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    const date = new Date('2026-06-17T12:00:00+08:00');
    date.setHours(date.getHours() - Math.floor(Math.random() * 12));
    date.setMinutes(date.getMinutes() - Math.floor(Math.random() * 60));

    comments.push({
      id: `comment-${Date.now()}-${i}`,
      userId: user.id,
      user: user,
      content: commentContents[Math.floor(Math.random() * commentContents.length)],
      createdAt: date.toISOString(),
      likes: Math.floor(Math.random() * 25),
    });
  }

  return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const mockPosts: Post[] = [
  {
    id: 'post-001',
    userId: mockUsers[1].id,
    user: mockUsers[1],
    activityId: 'act-001',
    content: '今天朝阳公园晨跑10公里！配速终于进了5分以内，虽然只是刚刚达标，但对我来说已经是很大的进步了 ☀️ 清晨的公园空气真好，看到很多跑友都在努力训练，大家一起加油！#晨跑打卡 #朝阳公园 #PB突破',
    images: [
      'https://picsum.photos/seed/post001-1/800/600',
      'https://picsum.photos/seed/post001-2/800/600',
      'https://picsum.photos/seed/post001-3/800/600',
    ],
    likes: 186,
    comments: createComments(4),
    createdAt: '2026-06-17T07:48:00+08:00',
    isLiked: true,
    isBookmarked: false,
    shareCount: 12,
    tags: ['晨跑打卡', '朝阳公园', 'PB突破'],
    location: {
      name: '朝阳公园',
      latitude: 39.9356,
      longitude: 116.4824,
    },
  },
  {
    id: 'post-002',
    userId: mockUsers[2].id,
    user: mockUsers[2],
    activityId: 'act-002',
    content: '周末奥森骑行32公里！南园北园连刷三圈，天气超级给力，蓝天白云的 ☁️ 路上遇到好多骑友，互相打招呼的感觉真好。下周准备挑战更长的路线，有一起的吗？🚴‍♂️ #周末骑行 #奥森公园 #公路车',
    images: [
      'https://picsum.photos/seed/post002-1/800/600',
      'https://picsum.photos/seed/post002-2/800/600',
    ],
    likes: 245,
    comments: createComments(6),
    createdAt: '2026-06-15T19:32:00+08:00',
    isLiked: false,
    isBookmarked: true,
    shareCount: 28,
    tags: ['周末骑行', '奥森公园', '公路车'],
    location: {
      name: '奥林匹克森林公园',
      latitude: 40.0030,
      longitude: 116.3894,
    },
  },
  {
    id: 'post-003',
    userId: mockUsers[4].id,
    user: mockUsers[4],
    content: '周末越野跑打卡！香山到八大处穿越，21公里半马距离，爬升800多米 🏔️ 山路虽然累，但站在山顶俯瞰北京城的那一刻，所有汗水都值了！提醒大家越野跑一定要带好补给和导航，安全第一！#越野跑 #香山 #半程马拉松',
    images: [
      'https://picsum.photos/seed/post003-1/800/600',
      'https://picsum.photos/seed/post003-2/800/600',
      'https://picsum.photos/seed/post003-3/800/600',
      'https://picsum.photos/seed/post003-4/800/600',
    ],
    likes: 412,
    comments: createComments(8),
    createdAt: '2026-06-14T16:25:00+08:00',
    isLiked: true,
    isBookmarked: true,
    shareCount: 45,
    tags: ['越野跑', '香山', '半程马拉松'],
    location: {
      name: '香山公园',
      latitude: 39.9948,
      longitude: 116.1880,
    },
  },
  {
    id: 'post-004',
    userId: mockUsers[7].id,
    user: mockUsers[7],
    content: '晨跑打卡第89天！！！连续快三个月了，给自己一个大大的赞 🎉 今天5公里轻松跑，身体状态很好，感觉已经完全融入了生活。最初只是想减肥，现在收获的不只是好身材，还有更好的精神状态和一群志同道合的朋友！感恩运动 #晨跑达人 #自律人生 #连续打卡',
    images: [
      'https://picsum.photos/seed/post004-1/800/600',
      'https://picsum.photos/seed/post004-2/800/600',
    ],
    likes: 589,
    comments: createComments(12),
    createdAt: '2026-06-17T06:15:00+08:00',
    isLiked: true,
    isBookmarked: false,
    shareCount: 76,
    tags: ['晨跑达人', '自律人生', '连续打卡'],
  },
  {
    id: 'post-005',
    userId: mockUsers[10].id,
    user: mockUsers[10],
    content: '今天解锁了北京周边最难的山道骑行路线！香山-模式口-八大处环线，全程65公里，爬升1200米 🚵 有几段坡真的陡到想下车推，但还是咬牙坚持下来了。山顶的风景和下坡的爽快感，让一切都值得！山地车爱好者一定要来挑战！#山地车 #越野骑行 #爬坡挑战',
    images: [
      'https://picsum.photos/seed/post005-1/800/600',
      'https://picsum.photos/seed/post005-2/800/600',
      'https://picsum.photos/seed/post005-3/800/600',
    ],
    likes: 356,
    comments: createComments(7),
    createdAt: '2026-06-13T18:42:00+08:00',
    isLiked: false,
    isBookmarked: false,
    shareCount: 34,
    tags: ['山地车', '越野骑行', '爬坡挑战'],
    location: {
      name: '模式口古道',
      latitude: 39.9356,
      longitude: 116.1548,
    },
  },
  {
    id: 'post-006',
    userId: mockUsers[11].id,
    user: mockUsers[11],
    content: '周末什刹海夜跑，用镜头记录下北京的夜晚 🌃 跑步+摄影是我的两大爱好，能把两者结合起来真的太幸福了。湖边的风、胡同的灯、路边的烤串摊...每一张照片都是满满的生活气息。运动不只是数据，更是感受生活的方式 📸🏃‍♀️ #跑步摄影 #什刹海 #夜跑 #北京夜景',
    images: [
      'https://picsum.photos/seed/post006-1/800/600',
      'https://picsum.photos/seed/post006-2/800/600',
      'https://picsum.photos/seed/post006-3/800/600',
      'https://picsum.photos/seed/post006-4/800/600',
      'https://picsum.photos/seed/post006-5/800/600',
    ],
    likes: 823,
    comments: createComments(15),
    createdAt: '2026-06-16T21:58:00+08:00',
    isLiked: true,
    isBookmarked: true,
    shareCount: 128,
    tags: ['跑步摄影', '什刹海', '夜跑', '北京夜景'],
    location: {
      name: '什刹海',
      latitude: 39.9375,
      longitude: 116.3847,
    },
  },
  {
    id: 'post-007',
    userId: currentUser.id,
    user: currentUser,
    content: '六月百公里挑战进度更新！已经跑了128公里，超额完成月度目标 ✅ 跑了3次长距离，加上几次骑行通勤，不知不觉就完成了。接下来准备好好休息调整，为下个目标做准备！感谢TrackPath的挑战功能，让运动更有动力 💪 #百公里挑战 #月度目标 #运动打卡',
    images: [
      'https://picsum.photos/seed/post007-1/800/600',
    ],
    likes: 167,
    comments: createComments(5),
    createdAt: '2026-06-17T20:15:00+08:00',
    isLiked: false,
    isBookmarked: false,
    shareCount: 18,
    tags: ['百公里挑战', '月度目标', '运动打卡'],
  },
  {
    id: 'post-008',
    userId: mockUsers[3].id,
    user: mockUsers[3],
    content: '今天带学员们在玉渊潭公园跑了3公里恢复跑 🌸 春天虽然过去了，但公园里的景色还是很美！看到大家从最初跑500米都喘，到现在能轻松完成3公里，真的特别有成就感。运动从来都不是一蹴而就的，慢慢来，你会看到自己的改变！#健身教练 #跑步入门 #玉渊潭 #恢复跑',
    images: [
      'https://picsum.photos/seed/post008-1/800/600',
      'https://picsum.photos/seed/post008-2/800/600',
      'https://picsum.photos/seed/post008-3/800/600',
    ],
    likes: 298,
    comments: createComments(9),
    createdAt: '2026-06-16T18:30:00+08:00',
    isLiked: false,
    isBookmarked: false,
    shareCount: 42,
    tags: ['健身教练', '跑步入门', '玉渊潭', '恢复跑'],
    location: {
      name: '玉渊潭公园',
      latitude: 39.9112,
      longitude: 116.3032,
    },
  },
];

export default mockPosts;
