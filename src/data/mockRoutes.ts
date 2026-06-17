import type { Route, TrackPoint } from '../types';
import { mockUsers } from './mockUser';

const BASE_LAT = 39.9042;
const BASE_LNG = 116.4074;

function generateRouteTrack(
  startLat: number,
  startLng: number,
  pointCount: number,
  totalDistance: number,
  elevationGain: number
): TrackPoint[] {
  const points: TrackPoint[] = [];
  let currentLat = startLat;
  let currentLng = startLng;

  const pathPatterns = [
    { latDelta: 0.0008, lngDelta: 0.0012 },
    { latDelta: 0.0006, lngDelta: -0.0009 },
    { latDelta: -0.0004, lngDelta: -0.0015 },
    { latDelta: -0.0009, lngDelta: 0.0005 },
    { latDelta: 0.0002, lngDelta: 0.0011 },
    { latDelta: 0.0010, lngDelta: 0.0003 },
  ];

  for (let i = 0; i < pointCount; i++) {
    const progress = i / (pointCount - 1);
    const patternIndex = Math.floor(progress * pathPatterns.length) % pathPatterns.length;
    const pattern = pathPatterns[patternIndex];
    const nextPattern = pathPatterns[(patternIndex + 1) % pathPatterns.length];
    const t = (progress * pathPatterns.length) - patternIndex;

    const latDelta = pattern.latDelta + (nextPattern.latDelta - pattern.latDelta) * t;
    const lngDelta = pattern.lngDelta + (nextPattern.lngDelta - pattern.lngDelta) * t;

    const jitterLat = (Math.random() - 0.5) * 0.00012;
    const jitterLng = (Math.random() - 0.5) * 0.00012;

    currentLat += (latDelta / (pointCount / pathPatterns.length)) + jitterLat;
    currentLng += (lngDelta / (pointCount / pathPatterns.length)) + jitterLng;

    const hillWave = Math.sin(progress * Math.PI * 4) * (elevationGain / 10);
    const baseElevChange = Math.sin(progress * Math.PI) * (elevationGain / 4);
    const altitude = 48 + baseElevChange + hillWave + (Math.random() - 0.5) * 2;

    const speed = 3 + Math.random() * 18;

    points.push({
      timestamp: i * 60000,
      latitude: Math.round(currentLat * 1000000) / 1000000,
      longitude: Math.round(currentLng * 1000000) / 1000000,
      elevation: Math.round(Math.max(25, Math.min(180, altitude)) * 10) / 10,
      speed: Math.round(speed * 100) / 100,
    });
  }

  return points;
}

const route1Track = generateRouteTrack(BASE_LAT - 0.008, BASE_LNG + 0.012, 72, 10200, 48);
const route2Track = generateRouteTrack(BASE_LAT + 0.018, BASE_LNG - 0.020, 58, 5100, 18);
const route3Track = generateRouteTrack(BASE_LAT + 0.005, BASE_LNG + 0.028, 92, 21500, 95);
const route4Track = generateRouteTrack(BASE_LAT + 0.015, BASE_LNG - 0.012, 78, 32800, 125);
const route5Track = generateRouteTrack(BASE_LAT - 0.025, BASE_LNG - 0.010, 110, 56200, 320);
const route6Track = generateRouteTrack(BASE_LAT - 0.002, BASE_LNG + 0.006, 48, 3200, 8);

export const mockRoutes: Route[] = [
  {
    id: 'route-001',
    name: '朝阳公园外环经典10K',
    type: 'running',
    distance: 10200,
    elevationGain: 48,
    difficulty: 'easy',
    completionCount: 12584,
    rating: 4.8,
    reviewCount: 2356,
    startPoint: [BASE_LAT - 0.008, BASE_LNG + 0.012],
    endPoint: [route1Track[route1Track.length - 1].latitude, route1Track[route1Track.length - 1].longitude],
    trackData: route1Track,
    isFavorite: true,
    description: '北京最受欢迎的跑步路线之一，环绕朝阳公园外环，路面平整，沿途绿化优美，适合日常训练和长距离LSD。',
    tags: ['公园', '路面平整', '风景优美', '适合新手'],
    estimatedDuration: 3600,
    creator: {
      id: mockUsers[1].id,
      name: mockUsers[1].name,
      avatar: mockUsers[1].avatar,
    },
    createdAt: '2024-05-12T10:20:00Z',
    coverImage: 'https://picsum.photos/seed/route001/600/400',
  },
  {
    id: 'route-002',
    name: '什刹海环湖夜跑5K',
    type: 'running',
    distance: 5100,
    elevationGain: 18,
    difficulty: 'easy',
    completionCount: 8892,
    rating: 4.7,
    reviewCount: 1567,
    startPoint: [BASE_LAT + 0.018, BASE_LNG - 0.020],
    endPoint: [route2Track[route2Track.length - 1].latitude, route2Track[route2Track.length - 1].longitude],
    trackData: route2Track,
    isFavorite: false,
    description: '环绕什刹海的经典夜跑路线，沿途古色古香，灯火阑珊，可欣赏到北京胡同风貌和后海酒吧街的独特氛围。',
    tags: ['夜景', '历史文化', '短距离', '夜跑'],
    estimatedDuration: 1800,
    creator: {
      id: mockUsers[7].id,
      name: mockUsers[7].name,
      avatar: mockUsers[7].avatar,
    },
    createdAt: '2024-08-28T19:45:00Z',
    coverImage: 'https://picsum.photos/seed/route002/600/400',
  },
  {
    id: 'route-003',
    name: '长安街半马挑战路线',
    type: 'running',
    distance: 21500,
    elevationGain: 95,
    difficulty: 'moderate',
    completionCount: 3421,
    rating: 4.9,
    reviewCount: 892,
    startPoint: [BASE_LAT + 0.005, BASE_LNG + 0.028],
    endPoint: [route3Track[route3Track.length - 1].latitude, route3Track[route3Track.length - 1].longitude],
    trackData: route3Track,
    isFavorite: true,
    description: '沿着长安街东西贯穿北京城，从国贸到复兴门折返，途经天安门、王府井等标志性地标，是北京最具仪式感的半马路线。',
    tags: ['地标', '半马', '城市景观', '仪式感'],
    estimatedDuration: 7800,
    creator: {
      id: mockUsers[4].id,
      name: mockUsers[4].name,
      avatar: mockUsers[4].avatar,
    },
    createdAt: '2024-03-05T07:30:00Z',
    coverImage: 'https://picsum.photos/seed/route003/600/400',
  },
  {
    id: 'route-004',
    name: '奥林匹克森林公园环形骑行',
    type: 'cycling',
    distance: 32800,
    elevationGain: 125,
    difficulty: 'moderate',
    completionCount: 5678,
    rating: 4.6,
    reviewCount: 1234,
    startPoint: [BASE_LAT + 0.015, BASE_LNG - 0.012],
    endPoint: [route4Track[route4Track.length - 1].latitude, route4Track[route4Track.length - 1].longitude],
    trackData: route4Track,
    isFavorite: false,
    description: '奥森公园是北京骑行爱好者的天堂，南园北园连骑路线，全程有专用自行车道，起伏适中，适合拉练和周末休闲骑行。',
    tags: ['公园', '专用车道', '适合拉练', '风景优美'],
    estimatedDuration: 5400,
    creator: {
      id: mockUsers[2].id,
      name: mockUsers[2].name,
      avatar: mockUsers[2].avatar,
    },
    createdAt: '2023-11-12T14:10:00Z',
    coverImage: 'https://picsum.photos/seed/route004/600/400',
  },
  {
    id: 'route-005',
    name: '十三陵水库穿越骑行',
    type: 'cycling',
    distance: 56200,
    elevationGain: 320,
    difficulty: 'hard',
    completionCount: 1856,
    rating: 4.8,
    reviewCount: 567,
    startPoint: [BASE_LAT - 0.025, BASE_LNG - 0.010],
    endPoint: [route5Track[route5Track.length - 1].latitude, route5Track[route5Track.length - 1].longitude],
    trackData: route5Track,
    isFavorite: true,
    description: '从昌平城区出发，绕行十三陵水库，途经神路、定陵等历史景点，沿途山路蜿蜒，水库风光壮丽，是北京最经典的长距离骑行路线。',
    tags: ['山区', '历史景点', '水库风光', '长距离'],
    estimatedDuration: 10800,
    creator: {
      id: mockUsers[10].id,
      name: mockUsers[10].name,
      avatar: mockUsers[10].avatar,
    },
    createdAt: '2023-06-18T06:00:00Z',
    coverImage: 'https://picsum.photos/seed/route005/600/400',
  },
  {
    id: 'route-006',
    name: '玉渊潭公园樱花3K恢复跑',
    type: 'running',
    distance: 3200,
    elevationGain: 8,
    difficulty: 'easy',
    completionCount: 15432,
    rating: 4.5,
    reviewCount: 2891,
    startPoint: [BASE_LAT - 0.002, BASE_LNG + 0.006],
    endPoint: [route6Track[route6Track.length - 1].latitude, route6Track[route6Track.length - 1].longitude],
    trackData: route6Track,
    isFavorite: false,
    description: '环绕玉渊潭公园的短距离路线，春天樱花盛开时美不胜收，适合恢复跑、饭后散步和带家人一起运动。',
    tags: ['樱花', '短距离', '恢复跑', '家庭友好'],
    estimatedDuration: 1080,
    creator: {
      id: mockUsers[3].id,
      name: mockUsers[3].name,
      avatar: mockUsers[3].avatar,
    },
    createdAt: '2025-04-02T09:15:00Z',
    coverImage: 'https://picsum.photos/seed/route006/600/400',
  },
];

export default mockRoutes;
