import type { Activity, TrackPoint, HeartRateSample, SplitRecord } from '../types';

const BASE_LAT = 39.9042;
const BASE_LNG = 116.4074;

function generateTrackPoints(
  startLat: number,
  startLng: number,
  pointCount: number,
  totalDistance: number,
  isCycling: boolean,
  startTime: number
): TrackPoint[] {
  const points: TrackPoint[] = [];
  let currentLat = startLat;
  let currentLng = startLng;
  let currentAlt = 45 + Math.random() * 10;

  const avgSpeed = isCycling ? 22 : 10;
  const interval = (totalDistance / 1000) / (pointCount - 1) / avgSpeed * 3600 * 1000;

  const pathPatterns = [
    { latDelta: 0.0008, lngDelta: 0.0012 },
    { latDelta: 0.0006, lngDelta: -0.0009 },
    { latDelta: -0.0004, lngDelta: -0.0015 },
    { latDelta: -0.0009, lngDelta: 0.0005 },
    { latDelta: 0.0002, lngDelta: 0.0011 },
  ];

  for (let i = 0; i < pointCount; i++) {
    const progress = i / (pointCount - 1);
    const patternIndex = Math.floor(progress * pathPatterns.length) % pathPatterns.length;
    const pattern = pathPatterns[patternIndex];
    const nextPattern = pathPatterns[(patternIndex + 1) % pathPatterns.length];
    const t = (progress * pathPatterns.length) - patternIndex;

    const latDelta = pattern.latDelta + (nextPattern.latDelta - pattern.latDelta) * t;
    const lngDelta = pattern.lngDelta + (nextPattern.lngDelta - pattern.lngDelta) * t;

    const jitterLat = (Math.random() - 0.5) * 0.00015;
    const jitterLng = (Math.random() - 0.5) * 0.00015;

    currentLat += (latDelta / (pointCount / pathPatterns.length)) + jitterLat;
    currentLng += (lngDelta / (pointCount / pathPatterns.length)) + jitterLng;

    const hillWave = Math.sin(progress * Math.PI * 3) * 8;
    const baseElevChange = Math.sin(progress * Math.PI) * 12;
    currentAlt = 48 + baseElevChange + hillWave + (Math.random() - 0.5) * 1.5;
    currentAlt = Math.max(30, Math.min(85, currentAlt));

    const speedVariation = 0.75 + Math.sin(progress * Math.PI * 5) * 0.15 + Math.random() * 0.2;
    const speed = avgSpeed * speedVariation;

    points.push({
      timestamp: startTime + Math.floor(i * interval),
      latitude: Math.round(currentLat * 1000000) / 1000000,
      longitude: Math.round(currentLng * 1000000) / 1000000,
      elevation: Math.round(currentAlt * 10) / 10,
      speed: Math.round(speed * 100) / 100,
    });
  }

  return points;
}

function generateHeartRateSamples(
  startTime: number,
  duration: number,
  pointCount: number,
  isCycling: boolean
): HeartRateSample[] {
  const samples: HeartRateSample[] = [];
  const interval = duration / (pointCount - 1);
  const baseHR = isCycling ? 138 : 148;
  const maxHR = isCycling ? 172 : 182;
  const minHR = isCycling ? 112 : 118;

  for (let i = 0; i < pointCount; i++) {
    const progress = i / (pointCount - 1);
    const warmUp = Math.min(1, progress * 6);
    const coolDown = Math.min(1, (1 - progress) * 6);
    const intensity = warmUp * coolDown;

    const wave = Math.sin(progress * Math.PI * 8) * 12;
    const midWave = Math.sin(progress * Math.PI * 3) * 8;

    let bpm = baseHR + (intensity * (maxHR - baseHR - 10)) + wave + midWave + (Math.random() - 0.5) * 5;
    bpm = Math.max(minHR, Math.min(maxHR, bpm));

    samples.push({
      timestamp: startTime + Math.floor(i * interval),
      bpm: Math.round(bpm),
    });
  }

  return samples;
}

function generateSplits(
  splitCount: number,
  totalDistance: number,
  totalDuration: number,
  isCycling: boolean
): SplitRecord[] {
  const splits: SplitRecord[] = [];
  const splitDistance = totalDistance / splitCount;
  const avgPace = totalDuration / (totalDistance / 1000);

  for (let i = 0; i < splitCount; i++) {
    const progress = (i + 0.5) / splitCount;
    const warmUp = Math.min(1, (i + 1) * 1.5);
    const coolDown = Math.min(1, (splitCount - i) * 1.5);
    const paceFactor = (1 / (warmUp * coolDown)) * (0.9 + Math.sin(progress * Math.PI * 4) * 0.12 + Math.random() * 0.08);

    const splitDuration = avgPace * (splitDistance / 1000) * paceFactor;
    const splitPace = splitDuration / (splitDistance / 1000);

    splits.push({
      index: i + 1,
      distance: Math.round(splitDistance * 10) / 10,
      duration: Math.round(splitDuration),
      pace: Math.round(splitPace),
      elevationGain: Math.round(5 + Math.abs(Math.sin(progress * Math.PI * 3)) * 18 + Math.random() * 6),
      avgHeartRate: Math.round((isCycling ? 138 : 148) + Math.sin(progress * Math.PI) * 22 + (Math.random() - 0.5) * 8),
    });
  }

  return splits;
}

function calculateStats(trackPoints: TrackPoint[], heartRates: HeartRateSample[], type: 'running' | 'cycling') {
  if (trackPoints.length < 2) {
    return { distance: 0, duration: 0, avgSpeed: 0, elevationGain: 0, maxElevation: 0, avgHR: 0, maxHR: 0 };
  }

  let distance = 0;
  let elevationGain = 0;
  let maxElevation = -Infinity;
  const startTs = trackPoints[0].timestamp;
  const endTs = trackPoints[trackPoints.length - 1].timestamp;
  const duration = (endTs - startTs) / 1000;

  for (let i = 1; i < trackPoints.length; i++) {
    const prev = trackPoints[i - 1];
    const curr = trackPoints[i];

    const R = 6371000;
    const dLat = (curr.latitude - prev.latitude) * Math.PI / 180;
    const dLng = (curr.longitude - prev.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(prev.latitude * Math.PI / 180) * Math.cos(curr.latitude * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    distance += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    if (curr.elevation > prev.elevation && curr.elevation - prev.elevation < 50) {
      elevationGain += curr.elevation - prev.elevation;
    }

    maxElevation = Math.max(maxElevation, curr.elevation);
  }

  const avgSpeed = distance > 0 ? (distance / 1000) / (duration / 3600) : 0;

  let avgHR = 0;
  let maxHR = 0;
  if (heartRates && heartRates.length > 0) {
    const sum = heartRates.reduce((acc, h) => acc + h.bpm, 0);
    avgHR = Math.round(sum / heartRates.length);
    maxHR = Math.max(...heartRates.map(h => h.bpm));
  }

  const calories = type === 'running'
    ? Math.round(distance / 1000 * 70)
    : Math.round(distance / 1000 * 45);

  return {
    distance: Math.round(distance * 10) / 10,
    duration: Math.round(duration),
    avgSpeed: Math.round(avgSpeed * 100) / 100,
    elevationGain: Math.round(elevationGain * 10) / 10,
    maxElevation: Math.round(maxElevation * 10) / 10,
    avgHR,
    maxHR,
    calories,
  };
}

const activity1Start = new Date('2026-06-17T06:30:00+08:00').getTime();
const activity1Points = generateTrackPoints(BASE_LAT - 0.005, BASE_LNG + 0.008, 86, 10250, false, activity1Start);
const activity1HR = generateHeartRateSamples(activity1Start, activity1Points[activity1Points.length - 1].timestamp - activity1Start, 92, false);
const activity1Stats = calculateStats(activity1Points, activity1HR, 'running');
const activity1Splits = generateSplits(10, activity1Stats.distance, activity1Stats.duration, false);

const activity2Start = new Date('2026-06-15T17:45:00+08:00').getTime();
const activity2Points = generateTrackPoints(BASE_LAT + 0.012, BASE_LNG - 0.015, 78, 32500, true, activity2Start);
const activity2HR = generateHeartRateSamples(activity2Start, activity2Points[activity2Points.length - 1].timestamp - activity2Start, 85, true);
const activity2Stats = calculateStats(activity2Points, activity2HR, 'cycling');
const activity2Splits = generateSplits(10, activity2Stats.distance, activity2Stats.duration, true);

const activity3Start = new Date('2026-06-14T07:00:00+08:00').getTime();
const activity3Points = generateTrackPoints(BASE_LAT + 0.003, BASE_LNG + 0.022, 94, 21300, false, activity3Start);
const activity3HR = generateHeartRateSamples(activity3Start, activity3Points[activity3Points.length - 1].timestamp - activity3Start, 100, false);
const activity3Stats = calculateStats(activity3Points, activity3HR, 'running');
const activity3Splits = generateSplits(Math.floor(activity3Stats.distance / 1000), activity3Stats.distance, activity3Stats.duration, false);

const activity4Start = new Date('2026-06-12T06:15:00+08:00').getTime();
const activity4Points = generateTrackPoints(BASE_LAT - 0.02, BASE_LNG - 0.008, 72, 55800, true, activity4Start);
const activity4HR = generateHeartRateSamples(activity4Start, activity4Points[activity4Points.length - 1].timestamp - activity4Start, 78, true);
const activity4Stats = calculateStats(activity4Points, activity4HR, 'cycling');
const activity4Splits = generateSplits(11, activity4Stats.distance, activity4Stats.duration, true);

const activity5Start = new Date('2026-06-10T20:00:00+08:00').getTime();
const activity5Points = generateTrackPoints(BASE_LAT + 0.006, BASE_LNG + 0.004, 65, 5200, false, activity5Start);
const activity5HR = generateHeartRateSamples(activity5Start, activity5Points[activity5Points.length - 1].timestamp - activity5Start, 70, false);
const activity5Stats = calculateStats(activity5Points, activity5HR, 'running');
const activity5Splits = generateSplits(5, activity5Stats.distance, activity5Stats.duration, false);

export const mockActivities: Activity[] = [
  {
    id: 'act-001',
    userId: 'user-001',
    routeId: 'route-001',
    type: 'running',
    name: '朝阳公园晨跑训练',
    distance: activity1Stats.distance,
    duration: activity1Stats.duration,
    avgPace: Math.round(activity1Stats.duration / (activity1Stats.distance / 1000)),
    avgSpeed: activity1Stats.avgSpeed,
    elevationGain: activity1Stats.elevationGain,
    maxElevation: activity1Stats.maxElevation,
    avgHeartRate: activity1Stats.avgHR,
    maxHeartRate: activity1Stats.maxHR,
    calories: activity1Stats.calories,
    startTime: new Date(activity1Start).toISOString(),
    endTime: new Date(activity1Points[activity1Points.length - 1].timestamp).toISOString(),
    trackPoints: activity1Points,
    heartRateSamples: activity1HR,
    splits: activity1Splits,
    weather: {
      temperature: 22,
      condition: '多云',
      humidity: 55,
    },
  },
  {
    id: 'act-002',
    userId: 'user-001',
    routeId: 'route-004',
    type: 'cycling',
    name: '奥森公园环形骑行',
    distance: activity2Stats.distance,
    duration: activity2Stats.duration,
    avgPace: Math.round(activity2Stats.duration / (activity2Stats.distance / 1000)),
    avgSpeed: activity2Stats.avgSpeed,
    elevationGain: activity2Stats.elevationGain,
    maxElevation: activity2Stats.maxElevation,
    avgHeartRate: activity2Stats.avgHR,
    maxHeartRate: activity2Stats.maxHR,
    calories: activity2Stats.calories,
    startTime: new Date(activity2Start).toISOString(),
    endTime: new Date(activity2Points[activity2Points.length - 1].timestamp).toISOString(),
    trackPoints: activity2Points,
    heartRateSamples: activity2HR,
    splits: activity2Splits,
    weather: {
      temperature: 28,
      condition: '晴',
      humidity: 42,
    },
  },
  {
    id: 'act-003',
    userId: 'user-001',
    routeId: 'route-003',
    type: 'running',
    name: '半程马拉松LSD训练',
    distance: activity3Stats.distance,
    duration: activity3Stats.duration,
    avgPace: Math.round(activity3Stats.duration / (activity3Stats.distance / 1000)),
    avgSpeed: activity3Stats.avgSpeed,
    elevationGain: activity3Stats.elevationGain,
    maxElevation: activity3Stats.maxElevation,
    avgHeartRate: activity3Stats.avgHR,
    maxHeartRate: activity3Stats.maxHR,
    calories: activity3Stats.calories,
    startTime: new Date(activity3Start).toISOString(),
    endTime: new Date(activity3Points[activity3Points.length - 1].timestamp).toISOString(),
    trackPoints: activity3Points,
    heartRateSamples: activity3HR,
    splits: activity3Splits,
    weather: {
      temperature: 24,
      condition: '晴间多云',
      humidity: 48,
    },
  },
  {
    id: 'act-004',
    userId: 'user-001',
    routeId: 'route-005',
    type: 'cycling',
    name: '十三陵水库长距离骑行',
    distance: activity4Stats.distance,
    duration: activity4Stats.duration,
    avgPace: Math.round(activity4Stats.duration / (activity4Stats.distance / 1000)),
    avgSpeed: activity4Stats.avgSpeed,
    elevationGain: activity4Stats.elevationGain,
    maxElevation: activity4Stats.maxElevation,
    avgHeartRate: activity4Stats.avgHR,
    maxHeartRate: activity4Stats.maxHR,
    calories: activity4Stats.calories,
    startTime: new Date(activity4Start).toISOString(),
    endTime: new Date(activity4Points[activity4Points.length - 1].timestamp).toISOString(),
    trackPoints: activity4Points,
    heartRateSamples: activity4HR,
    splits: activity4Splits,
    weather: {
      temperature: 20,
      condition: '晴',
      humidity: 38,
    },
  },
  {
    id: 'act-005',
    userId: 'user-001',
    type: 'running',
    name: '轻松恢复跑',
    distance: activity5Stats.distance,
    duration: activity5Stats.duration,
    avgPace: Math.round(activity5Stats.duration / (activity5Stats.distance / 1000)),
    avgSpeed: activity5Stats.avgSpeed,
    elevationGain: activity5Stats.elevationGain,
    maxElevation: activity5Stats.maxElevation,
    avgHeartRate: activity5Stats.avgHR,
    maxHeartRate: activity5Stats.maxHR,
    calories: activity5Stats.calories,
    startTime: new Date(activity5Start).toISOString(),
    endTime: new Date(activity5Points[activity5Points.length - 1].timestamp).toISOString(),
    trackPoints: activity5Points,
    heartRateSamples: activity5HR,
    splits: activity5Splits,
    weather: {
      temperature: 26,
      condition: '阴',
      humidity: 62,
    },
  },
];

export default mockActivities;
