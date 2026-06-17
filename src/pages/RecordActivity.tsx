import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  useMap,
} from 'react-leaflet';
import {
  ArrowLeft,
  Play,
  Pause,
  Check,
  Flag,
  Lock,
  Unlock,
  Timer,
  Activity as ActivityIcon,
  Mountain,
  Heart,
  Gauge,
  Bike,
  Footprints,
} from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import L from 'leaflet';
import useStore from '@/store/useStore';
import { formatDistance, formatDuration, formatPace, calculateActivityCalories } from '@/utils/formatters';
import { calculateDistance, calculateTotalDistance, calculateElevationGain, calculateSpeed } from '@/utils/geoCalculations';
import type {
  ActivityType,
  TrackPoint,
  HeartRateSample,
  SplitRecord,
  Activity,
} from '@/types';
import { DEFAULT_HEART_RATE_ZONES } from '@/types';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

type RecordingStatus = 'idle' | 'recording' | 'paused';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

function AnimatedNumber({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  className = '',
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const roundedValue = useTransform(motionValue, (v) =>
    Number(v).toFixed(decimals)
  );
  const [displayValue, setDisplayValue] = useState(
    Number(0).toFixed(decimals)
  );

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    });
    return controls.stop;
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = roundedValue.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return () => unsubscribe();
  }, [roundedValue]);

  return (
    <span className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

interface AnimatedDurationProps {
  value: number;
  className?: string;
}

function AnimatedDuration({ value, className = '' }: AnimatedDurationProps) {
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = Math.floor(value % 60);
  const [colonBlink, setColonBlink] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setColonBlink((v) => !v), 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className={className}>
      <AnimatedNumber
        value={hours}
        decimals={0}
        prefix=""
        suffix=""
      />
      <span className={colonBlink ? 'opacity-100' : 'opacity-30'}>:</span>
      <AnimatedNumber
        value={minutes}
        decimals={0}
        prefix=""
        suffix=""
      />
      <span className={colonBlink ? 'opacity-100' : 'opacity-30'}>:</span>
      <AnimatedNumber
        value={seconds}
        decimals={0}
        prefix=""
        suffix=""
      />
    </span>
  );
}

interface AnimatedPaceProps {
  value: number;
  className?: string;
}

function AnimatedPace({ value, className = '' }: AnimatedPaceProps) {
  if (!isFinite(value) || value <= 0 || value === Infinity) {
    return <span className={className}>--:--</span>;
  }
  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <span className={className}>
      <AnimatedNumber value={minutes} decimals={0} />
      <span>:</span>
      <AnimatedNumber value={seconds} decimals={0} />
      <span className="text-xs opacity-60 ml-1">/km</span>
    </span>
  );
}

interface HeartRateSparklineProps {
  data: HeartRateSample[];
  width?: number;
  height?: number;
}

function HeartRateSparkline({
  data,
  width = 160,
  height = 40,
}: HeartRateSparklineProps) {
  const pathData = useMemo(() => {
    if (data.length < 2) return '';

    const maxBPM = 200;
    const minBPM = 60;
    const range = maxBPM - minBPM;

    const points = data.slice(-60).map((sample, i, arr) => {
      const x = (i / (arr.length - 1)) * width;
      const y = height - ((sample.bpm - minBPM) / range) * height;
      return [x, Math.max(0, Math.min(height, y))] as const;
    });

    return points
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(' ');
  }, [data, width, height]);

  const areaPath = useMemo(() => {
    if (!pathData) return '';
    return `${pathData} L ${width} ${height} L 0 ${height} Z`;
  }, [pathData, width, height]);

  const lastBPM = data[data.length - 1]?.bpm ?? 72;
  const zoneColor = useMemo(() => {
    const zone = DEFAULT_HEART_RATE_ZONES.find(
      (z) => lastBPM >= z.minRate && lastBPM < z.maxRate
    );
    return zone?.color ?? '#60A5FA';
  }, [lastBPM]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="hrAreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={zoneColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={zoneColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath && <path d={areaPath} fill="url(#hrAreaGradient)" />}
      {pathData && (
        <path
          d={pathData}
          fill="none"
          stroke={zoneColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

interface HeartRateZonesBarProps {
  currentBPM: number;
}

function HeartRateZonesBar({ currentBPM }: HeartRateZonesBarProps) {
  const totalRange = DEFAULT_HEART_RATE_ZONES[DEFAULT_HEART_RATE_ZONES.length - 1].maxRate -
    DEFAULT_HEART_RATE_ZONES[0].minRate;

  return (
    <div className="w-full">
      <div className="relative h-2 rounded-full overflow-hidden flex">
        {DEFAULT_HEART_RATE_ZONES.map((zone) => {
          const widthPercent =
            ((zone.maxRate - zone.minRate) / totalRange) * 100;
          return (
            <div
              key={zone.name}
              className="h-full"
              style={{
                width: `${widthPercent}%`,
                backgroundColor: zone.color,
                opacity: currentBPM >= zone.minRate && currentBPM < zone.maxRate ? 1 : 0.4,
              }}
            />
          );
        })}
      </div>
      <div
        className="absolute top-0 h-2 w-1 bg-white rounded-full shadow-lg"
        style={{
          left: `${Math.max(0, Math.min(100, ((currentBPM - DEFAULT_HEART_RATE_ZONES[0].minRate) / totalRange) * 100))}%`,
          transform: 'translateX(-50%)',
        }}
      />
    </div>
  );
}

interface MapAutoCenterProps {
  position: [number, number];
}

function MapAutoCenter({ position }: MapAutoCenterProps) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);

  return null;
}

interface CurrentPositionMarkerProps {
  position: [number, number];
}

function CurrentPositionMarker({ position }: CurrentPositionMarkerProps) {
  return (
    <>
      <CircleMarker
        center={position}
        radius={18}
        pathOptions={{
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.15,
          weight: 0,
        }}
      />
      <CircleMarker
        center={position}
        radius={10}
        pathOptions={{
          color: '#60A5FA',
          fillColor: '#60A5FA',
          fillOpacity: 0.3,
          weight: 0,
        }}
      />
      <CircleMarker
        center={position}
        radius={6}
        pathOptions={{
          color: '#FFFFFF',
          fillColor: '#3B82F6',
          fillOpacity: 1,
          weight: 2,
        }}
      />
    </>
  );
}

const BASE_POSITION: [number, number] = [39.9042, 116.4074];

function generateNextTrackPoint(
  prevPoint: TrackPoint | null,
  activityType: ActivityType,
  timestamp: number
): TrackPoint {
  if (!prevPoint) {
    return {
      timestamp,
      latitude: BASE_POSITION[0],
      longitude: BASE_POSITION[1],
      elevation: 43.5,
      speed: 0,
    };
  }

  const baseSpeed = activityType === 'running' ? 2.8 : 6.5;
  const speedVariation = (Math.random() - 0.5) * (activityType === 'running' ? 0.6 : 1.5);
  const speed = Math.max(0.5, baseSpeed + speedVariation);

  const timeDelta = (timestamp - prevPoint.timestamp) / 1000;
  const distanceMoved = speed * timeDelta;

  const bearing = Math.random() * Math.PI * 2;
  const latDelta = (distanceMoved * Math.cos(bearing)) / 111000;
  const lngDelta =
    (distanceMoved * Math.sin(bearing)) /
    (111000 * Math.cos((prevPoint.latitude * Math.PI) / 180));

  const elevationVariation = (Math.random() - 0.5) * 1.2;

  return {
    timestamp,
    latitude: prevPoint.latitude + latDelta,
    longitude: prevPoint.longitude + lngDelta,
    elevation: Math.max(0, prevPoint.elevation + elevationVariation),
    speed,
  };
}

function generateHeartRateSample(
  prevBPM: number,
  status: RecordingStatus,
  timestamp: number
): HeartRateSample {
  let targetBPM: number;
  if (status === 'idle') {
    targetBPM = 72;
  } else if (status === 'recording') {
    targetBPM = 155;
  } else {
    targetBPM = 100;
  }

  const trend = targetBPM - prevBPM;
  const variation = (Math.random() - 0.5) * 4;
  const newBPM = Math.max(60, Math.min(200, prevBPM + trend * 0.05 + variation));

  return {
    timestamp,
    bpm: Math.round(newBPM),
  };
}

export default function RecordActivity() {
  const navigate = useNavigate();
  const addActivity = useStore((state) => state.addActivity);
  const user = useStore((state) => state.user);

  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [activityType, setActivityType] = useState<ActivityType>('running');
  const [isLocked, setIsLocked] = useState(false);

  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [heartRateSamples, setHeartRateSamples] = useState<HeartRateSample[]>([
    { timestamp: Date.now(), bpm: 72 },
  ]);
  const [splits, setSplits] = useState<SplitRecord[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastSplitDistance, setLastSplitDistance] = useState(0);
  const [lastSplitDuration, setLastSplitDuration] = useState(0);

  const accumulatedDistanceRef = useRef(0);
  const lastTrackPointRef = useRef<TrackPoint | null>(null);
  const lastBPMRef = useRef(72);

  const currentDistance = useMemo(() => {
    if (trackPoints.length < 2) return 0;
    return calculateTotalDistance(trackPoints);
  }, [trackPoints]);

  const currentPace = useMemo(() => {
    if (currentDistance <= 0 || elapsedSeconds <= 0) return 0;
    const distanceKm = currentDistance / 1000;
    return elapsedSeconds / distanceKm;
  }, [currentDistance, elapsedSeconds]);

  const currentSpeed = useMemo(() => {
    if (trackPoints.length < 2) return 0;
    const recentPoints = trackPoints.slice(-10);
    if (recentPoints.length < 2) return 0;
    return calculateSpeed(recentPoints[0], recentPoints[recentPoints.length - 1]);
  }, [trackPoints]);

  const elevationData = useMemo(
    () => calculateElevationGain(trackPoints),
    [trackPoints]
  );

  const currentBPM =
    heartRateSamples[heartRateSamples.length - 1]?.bpm ?? 72;

  const mapCenter = useMemo<[number, number]>(() => {
    if (trackPoints.length > 0) {
      const last = trackPoints[trackPoints.length - 1];
      return [last.latitude, last.longitude];
    }
    return BASE_POSITION;
  }, [trackPoints]);

  const polylinePositions = useMemo<[number, number][]>(
    () => trackPoints.map((p) => [p.latitude, p.longitude]),
    [trackPoints]
  );

  useEffect(() => {
    if (status !== 'recording') return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== 'recording') return;

    const trackInterval = setInterval(() => {
      const now = Date.now();
      const newPoint = generateNextTrackPoint(
        lastTrackPointRef.current,
        activityType,
        now
      );

      if (lastTrackPointRef.current) {
        const segmentDist = calculateDistance(
          lastTrackPointRef.current,
          newPoint
        );
        accumulatedDistanceRef.current += segmentDist;
      }

      lastTrackPointRef.current = newPoint;

      setTrackPoints((prev) => {
        const updated = [...prev, newPoint];

        if (accumulatedDistanceRef.current - lastSplitDistance >= 1000) {
          const splitDistance = accumulatedDistanceRef.current - lastSplitDistance;
          const splitDuration = elapsedSeconds - lastSplitDuration;
          const splitPace =
            splitDistance > 0 ? splitDuration / (splitDistance / 1000) : 0;

          const splitStartIdx = splits.length === 0 ? 0 :
            splits.reduce((acc, s) => acc + s.distance, 0);

          const splitPoints = updated.filter(p => {
            const distFromStart = calculateTotalDistance(
              updated.slice(0, updated.indexOf(p) + 1)
            );
            return distFromStart >= splitStartIdx;
          });

          const splitElevation = calculateElevationGain(splitPoints);

          const avgHR = heartRateSamples.length > 0
            ? Math.round(
                heartRateSamples
                  .slice(-30)
                  .reduce((acc, h) => acc + h.bpm, 0) /
                  Math.min(heartRateSamples.length, 30)
              )
            : undefined;

          setSplits((prevSplits) => [
            ...prevSplits,
            {
              index: prevSplits.length + 1,
              distance: splitDistance,
              duration: splitDuration,
              pace: splitPace,
              elevationGain: splitElevation.gain,
              avgHeartRate: avgHR,
            },
          ]);

          setLastSplitDistance(accumulatedDistanceRef.current);
          setLastSplitDuration(elapsedSeconds);
        }

        return updated;
      });
    }, 2000);

    return () => clearInterval(trackInterval);
  }, [status, activityType, lastSplitDistance, lastSplitDuration, elapsedSeconds, heartRateSamples, splits.length]);

  useEffect(() => {
    if (status !== 'recording') return;

    const hrInterval = setInterval(() => {
      const now = Date.now();
      const newSample = generateHeartRateSample(lastBPMRef.current, status, now);
      lastBPMRef.current = newSample.bpm;
      setHeartRateSamples((prev) => [...prev, newSample]);
    }, 1000);

    return () => clearInterval(hrInterval);
  }, [status]);

  const handleStart = useCallback(() => {
    setStatus('recording');
    setStartTime(Date.now());
    accumulatedDistanceRef.current = 0;
    lastTrackPointRef.current = null;
    setTrackPoints([]);
    setElapsedSeconds(0);
    setSplits([]);
    setLastSplitDistance(0);
    setLastSplitDuration(0);

    const now = Date.now();
    const firstPoint = generateNextTrackPoint(null, activityType, now);
    lastTrackPointRef.current = firstPoint;
    setTrackPoints([firstPoint]);
  }, [activityType]);

  const handlePause = useCallback(() => {
    setStatus('paused');
  }, []);

  const handleResume = useCallback(() => {
    setStatus('recording');
  }, []);

  const handleLap = useCallback(() => {
    if (status !== 'recording' || accumulatedDistanceRef.current <= 0) return;

    const splitDistance = accumulatedDistanceRef.current - lastSplitDistance;
    const splitDuration = elapsedSeconds - lastSplitDuration;
    const splitPace = splitDistance > 0 ? splitDuration / (splitDistance / 1000) : 0;

    const avgHR = heartRateSamples.length > 0
      ? Math.round(
          heartRateSamples
            .slice(-30)
            .reduce((acc, h) => acc + h.bpm, 0) /
            Math.min(heartRateSamples.length, 30)
        )
      : undefined;

    setSplits((prev) => [
      ...prev,
      {
        index: prev.length + 1,
        distance: splitDistance,
        duration: splitDuration,
        pace: splitPace,
        elevationGain: 0,
        avgHeartRate: avgHR,
      },
    ]);

    setLastSplitDistance(accumulatedDistanceRef.current);
    setLastSplitDuration(elapsedSeconds);
  }, [status, lastSplitDistance, lastSplitDuration, elapsedSeconds, heartRateSamples]);

  const handleFinish = useCallback(() => {
    if (status === 'idle' || currentDistance < 10) {
      navigate('/');
      return;
    }

    const now = Date.now();
    const totalDistance = currentDistance;
    const totalDuration = elapsedSeconds;
    const avgPace = totalDistance > 0 ? totalDuration / (totalDistance / 1000) : 0;
    const avgSpeed = totalDuration > 0 ? (totalDistance / 1000) / (totalDuration / 3600) : 0;
    const avgHR = heartRateSamples.length > 0
      ? Math.round(
          heartRateSamples.reduce((acc, h) => acc + h.bpm, 0) /
            heartRateSamples.length
        )
      : undefined;
    const maxHR = heartRateSamples.length > 0
      ? Math.max(...heartRateSamples.map((h) => h.bpm))
      : undefined;

    const tempActivity: Activity = {
      id: '',
      userId: user.id,
      type: activityType,
      name: `${activityType === 'running' ? '跑步' : '骑行'}活动`,
      distance: totalDistance,
      duration: totalDuration,
      avgPace,
      avgSpeed,
      elevationGain: elevationData.gain,
      maxElevation: elevationData.max,
      avgHeartRate: avgHR,
      maxHeartRate: maxHR,
      calories: 0,
      startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
      endTime: new Date(now).toISOString(),
      trackPoints,
      heartRateSamples,
      splits,
    };

    tempActivity.calories = calculateActivityCalories(tempActivity, 70);
    tempActivity.id = `act-${Date.now()}`;

    addActivity(tempActivity);
    navigate(`/activity/${tempActivity.id}`);
  }, [status, currentDistance, elapsedSeconds, heartRateSamples, user.id, activityType, elevationData.gain, elevationData.max, startTime, trackPoints, splits, addActivity, navigate]);

  const displayDistanceKm = currentDistance / 1000;
  const currentElevation =
    trackPoints.length > 0 ? trackPoints[trackPoints.length - 1].elevation : 43.5;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(255, 107, 53, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(13, 148, 136, 0.1) 0%, transparent 50%)
          `,
        }}
      />

      <div className="absolute inset-0 p-4 sm:p-6 flex flex-col z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-4"
        >
          <Link
            to="/"
            className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            {[
              { type: 'running' as const, icon: Footprints, label: '跑步' },
              { type: 'cycling' as const, icon: Bike, label: '骑行' },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => status === 'idle' && setActivityType(item.type)}
                disabled={status !== 'idle'}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  activityType === item.type
                    ? 'bg-brand-gradient text-white shadow-brand-glow'
                    : 'text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`w-11 h-11 rounded-2xl backdrop-blur-md border flex items-center justify-center transition-all active:scale-95 ${
              isLocked
                ? 'bg-brand-gradient text-white border-transparent shadow-brand-glow'
                : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
            }`}
          >
            {isLocked ? (
              <Lock className="w-5 h-5" />
            ) : (
              <Unlock className="w-5 h-5" />
            )}
          </button>
        </motion.div>

        <div className="relative flex-1 min-h-0 rounded-3xl overflow-hidden mb-4 border border-white/10 shadow-2xl">
          {status === 'idle' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-ink-900/90 via-ink-800/90 to-ink-900/90 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6"
              >
                <div className="relative w-16 h-16 rounded-full bg-brand-gradient/20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-brand-gradient/40 animate-ping opacity-40" />
                  <div className="relative w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center animate-breathe">
                    <Gauge className="w-5 h-5 text-white" />
                  </div>
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold font-display text-white mb-2">
                准备开始
              </h2>
              <p className="text-white/50 text-sm mb-8">
                GPS 已就绪 · 点击下方按钮开始记录
              </p>

              <div className="grid grid-cols-3 gap-4 w-full max-w-md px-6">
                {[
                  { label: '距离', value: '0.00', unit: 'km', icon: ActivityIcon },
                  { label: '时长', value: '00:00', unit: '', icon: Timer },
                  { label: '心率', value: currentBPM.toString(), unit: 'bpm', icon: Heart },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center"
                  >
                    <stat.icon className="w-5 h-5 mx-auto mb-2 text-brand-400" />
                    <div className="text-xl font-bold text-white font-display">
                      {stat.value}
                      <span className="text-xs text-white/50 ml-0.5">{stat.unit}</span>
                    </div>
                    <div className="text-xs text-white/40 mt-1">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={16}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
              attributionControl={false}
              className="map-container"
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={19}
              />
              <MapAutoCenter position={mapCenter} />
              {polylinePositions.length >= 2 && (
                <>
                  <Polyline
                    positions={polylinePositions}
                    pathOptions={{
                      color: '#F7931E',
                      weight: 6,
                      opacity: 0.3,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                  <Polyline
                    positions={polylinePositions}
                    pathOptions={{
                      color: '#FF6B35',
                      weight: 4,
                      opacity: 0.95,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                  <Polyline
                    positions={polylinePositions}
                    pathOptions={{
                      color: '#FFB080',
                      weight: 1.5,
                      opacity: 0.8,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                </>
              )}
              <CurrentPositionMarker position={mapCenter} />
            </MapContainer>
          )}

          {status === 'recording' && (
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <span className="text-xs font-medium text-red-300">
                  正在记录
                </span>
              </div>
              {splits.length > 0 && (
                <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                  <span className="text-xs font-medium text-white/80">
                    第 {splits.length + 1} 圈
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="rounded-3xl p-5 sm:p-6 bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex-1">
                <div className="text-xs font-medium text-white/40 mb-1 uppercase tracking-wider">
                  距离
                </div>
                <div className="flex items-baseline gap-1">
                  <AnimatedNumber
                    value={displayDistanceKm}
                    decimals={2}
                    className="text-4xl sm:text-5xl font-bold font-display text-white tracking-tight"
                  />
                  <span className="text-lg font-medium text-white/50">km</span>
                </div>
              </div>

              <div className="flex-1 text-right">
                <div className="text-xs font-medium text-white/40 mb-1 uppercase tracking-wider">
                  时长
                </div>
                <AnimatedDuration
                  value={elapsedSeconds}
                  className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Timer className="w-3.5 h-3.5 text-brand-400" />
                  <span className="text-[11px] font-medium text-white/50">配速</span>
                </div>
                <AnimatedPace
                  value={currentPace}
                  className="text-base sm:text-lg font-semibold text-white font-display tabular-nums"
                />
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Gauge className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-[11px] font-medium text-white/50">速度</span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <AnimatedNumber
                    value={currentSpeed}
                    decimals={1}
                    className="text-base sm:text-lg font-semibold text-white font-display tabular-nums"
                  />
                  <span className="text-[10px] font-medium text-white/50">km/h</span>
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Mountain className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[11px] font-medium text-white/50">海拔</span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <AnimatedNumber
                    value={currentElevation}
                    decimals={0}
                    className="text-base sm:text-lg font-semibold text-white font-display tabular-nums"
                  />
                  <span className="text-[10px] font-medium text-white/50">m</span>
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Heart className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  <span className="text-[11px] font-medium text-white/50">心率</span>
                </div>
                <div className="flex items-baseline gap-0.5 mb-2">
                  <AnimatedNumber
                    value={currentBPM}
                    decimals={0}
                    className="text-base sm:text-lg font-semibold text-white font-display tabular-nums"
                  />
                  <span className="text-[10px] font-medium text-white/50">bpm</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden relative">
                  <HeartRateZonesBar currentBPM={currentBPM} />
                </div>
              </div>
            </div>

            {status !== 'idle' && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-red-400/70" />
                    <span className="text-[11px] font-medium text-white/40">
                      心率曲线
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-white/30">
                    近1分钟
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <HeartRateSparkline
                    data={heartRateSamples}
                    width={200}
                    height={48}
                  />
                  <div className="flex-1 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-[10px] text-white/40 mb-0.5">平均心率</div>
                      <div className="text-sm font-bold text-white/80 font-display tabular-nums">
                        {heartRateSamples.length > 1
                          ? Math.round(
                              heartRateSamples.reduce((a, b) => a + b.bpm, 0) /
                                heartRateSamples.length
                            )
                          : '--'}
                        <span className="text-[10px] text-white/50 ml-0.5">bpm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-6 pb-4">
            {status === 'idle' ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-brand-gradient shadow-brand-glow flex items-center justify-center animate-breathe"
              >
                <Play className="w-10 h-10 sm:w-12 sm:h-12 text-white ml-1" fill="currentColor" />
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={!isLocked ? { scale: 1.05 } : {}}
                  whileTap={!isLocked ? { scale: 0.95 } : {}}
                  onClick={status === 'recording' ? handlePause : handleResume}
                  disabled={isLocked}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all ${
                    isLocked
                      ? 'bg-teal-500/50 cursor-not-allowed'
                      : 'bg-gradient-to-br from-teal-500 to-teal-400 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50'
                  }`}
                >
                  {status === 'recording' ? (
                    <Pause className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="currentColor" />
                  ) : (
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" fill="currentColor" />
                  )}
                </motion.button>

                <motion.button
                  whileHover={!isLocked ? { scale: 1.05 } : {}}
                  whileTap={!isLocked ? { scale: 0.95 } : {}}
                  onClick={handleFinish}
                  disabled={isLocked}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all ${
                    isLocked
                      ? 'bg-brand-gradient/50 cursor-not-allowed'
                      : 'bg-brand-gradient shadow-brand-glow'
                  }`}
                >
                  <Check className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={3} />
                </motion.button>

                <motion.button
                  whileHover={!isLocked && status === 'recording' ? { scale: 1.05 } : {}}
                  whileTap={!isLocked && status === 'recording' ? { scale: 0.95 } : {}}
                  onClick={handleLap}
                  disabled={isLocked || status !== 'recording'}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all border-2 ${
                    isLocked || status !== 'recording'
                      ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/15 hover:border-white/30'
                  }`}
                >
                  <Flag className="w-7 h-7 sm:w-9 sm:h-9" />
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {isLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-x-0 bottom-24 z-20 pointer-events-none"
        >
          <div className="flex justify-center">
            <div className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Lock className="w-3.5 h-3.5" />
                <span>屏幕已锁定 - 点击锁定按钮解锁</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
