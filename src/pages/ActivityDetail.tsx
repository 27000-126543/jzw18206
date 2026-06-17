import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowLeft,
  Heart,
  Share2,
  Image as ImageIcon,
  RefreshCw,
  Activity as ActivityIcon,
  Timer,
  Gauge,
  Mountain,
  Flame,
  Zap,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  Flag,
  Map as MapIcon,
  Satellite,
  Moon,
  TrendingUp,
  TrendingDown,
  BookmarkPlus,
  Users,
  Award,
  ChevronRight,
  ArrowUpRight,
  HeartPulse,
  Calendar,
  X,
  Plus,
  Tag,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';

import useStore from '../store/useStore';
import { PaceChart } from '../components/charts/PaceChart';
import { ElevationChart } from '../components/charts/ElevationChart';
import { MiniTrackMap } from '../components/maps/MiniTrackMap';
import type {
  Activity,
  TrackPoint,
  SplitRecord,
  HeartRateSample,
  HeartRateZoneConfig,
  Post,
  User,
} from '../types';
import { DEFAULT_HEART_RATE_ZONES } from '../types';
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatCalories,
  formatDate,
} from '../utils/formatters';
import { getPaceColor, getHeartRateZone } from '../utils/colors';
import { cn } from '../lib/utils';

type TabType = 'pace' | 'elevation' | 'heartrate';
type MapStyleType = 'standard' | 'satellite' | 'dark';

interface MapSegment {
  positions: [number, number][];
  color: string;
}

interface PaceSegmentStats {
  minPace: SplitRecord | null;
  maxPace: SplitRecord | null;
}

interface HRChartPoint {
  time: string;
  timeSeconds: number;
  bpm: number;
}

interface HRZoneData {
  name: string;
  value: number;
  percent: number;
  color: string;
}

function createFlagIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      font-weight: bold;
    ">🚩</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function ChangeMapView({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function WeatherIcon({ condition }: { condition: string }) {
  const cond = condition.toLowerCase();
  const className = 'w-5 h-5';
  if (cond.includes('雨'))
    return <CloudRain className={cn(className, 'text-blue-500')} />;
  if (cond.includes('雪'))
    return <CloudSnow className={cn(className, 'text-sky-400')} />;
  if (cond.includes('阴') || cond.includes('多云'))
    return <Cloud className={cn(className, 'text-slate-500')} />;
  if (cond.includes('风'))
    return <Wind className={cn(className, 'text-teal-500')} />;
  return <Sun className={cn(className, 'text-amber-500')} />;
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', staggerChildren: 0.08 },
  },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

const tabContentVariants = {
  initial: { opacity: 0, y: 10, scale: 0.995 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.995,
    transition: { duration: 0.2 },
  },
};

const HOT_TAGS = ['晨跑打卡', '周末骑行', 'PB突破', '越野跑', '夜跑', '自律人生'];

interface ShareToCommunityModalProps {
  open: boolean;
  onClose: () => void;
  activity: Activity;
  user: User;
  onPublish: (post: Post) => void;
}

function ShareToCommunityModal({ open, onClose, activity, user, onPublish }: ShareToCommunityModalProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | File[]) => {
    const remainingSlots = 9 - images.length;
    if (remainingSlots <= 0) return;

    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const limitedFiles = fileArray.slice(0, remainingSlots);

    const promises = limitedFiles.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );

    try {
      const dataUrls = await Promise.all(promises);
      setImages((prev) => [...prev, ...dataUrls]);
    } catch (err) {
      console.error('Failed to read files:', err);
    }
  };

  const handleAddImages = (e?: React.ChangeEvent<HTMLInputElement> | React.MouseEvent) => {
    if (e && 'target' in e && e.target instanceof HTMLInputElement && e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
      return;
    }
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (t: string) => {
    setTags((prev) => prev.filter((x) => x !== t));
  };

  const handleSubmit = () => {
    const defaultContent = `刚刚完成了一次${activity.type === 'running' ? '跑步' : '骑行'}！${formatDistance(activity.distance)}达成🎉`;
    const finalContent = content.trim() || defaultContent;

    const post: Post = {
      id: `post-${Date.now()}`,
      userId: user.id,
      user: user,
      activityId: activity.id,
      content: tags.length > 0
        ? `${finalContent} ${tags.map((t) => `#${t}`).join(' ')}`
        : finalContent,
      images: images,
      comments: [],
      likes: 0,
      createdAt: new Date().toISOString(),
      isLiked: false,
      isBookmarked: false,
      shareCount: 0,
      tags: tags,
    };

    onPublish(post);
    setContent('');
    setImages([]);
    setTags([]);
    setTagInput('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed left-1/2 top-[6%] -translate-x-1/2 z-50 w-[95%] max-w-4xl max-h-[88vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 shrink-0">
              <h2 className="font-bold text-xl font-display text-ink-800">分享到社区</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-ink-100 text-ink-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid lg:grid-cols-5 gap-6 h-full">
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-1 rounded-2xl gradient-border">
                    <div className="rounded-xl overflow-hidden bg-ink-50">
                      <MiniTrackMap
                        trackPoints={activity.trackPoints}
                        width={280}
                        height={160}
                        className="w-full !h-40 rounded-t-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-ink-50 border border-ink-100">
                      <ActivityIcon className={cn('w-5 h-5 shrink-0', activity.type === 'running' ? 'text-brand-500' : 'text-teal-500')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-ink-400">运动类型</p>
                        <p className="text-sm font-semibold text-ink-700 truncate">
                          {activity.type === 'running' ? '跑步' : '骑行'} · {activity.name}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 rounded-xl bg-brand-50/60 border border-brand-100 text-center">
                        <MapIcon className="w-4 h-4 text-brand-500 mx-auto mb-1" />
                        <p className="text-[10px] text-ink-400 mb-0.5">距离</p>
                        <p className="text-sm font-black font-display text-brand-600">
                          {formatDistance(activity.distance, 1).split(' ')[0]}
                        </p>
                        <p className="text-[10px] text-ink-400">km</p>
                      </div>
                      <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-100 text-center">
                        <Timer className="w-4 h-4 text-teal-500 mx-auto mb-1" />
                        <p className="text-[10px] text-ink-400 mb-0.5">时长</p>
                        <p className="text-sm font-black font-display text-teal-600">
                          {formatDuration(activity.duration, false)}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 text-center">
                        <Gauge className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                        <p className="text-[10px] text-ink-400 mb-0.5">配速</p>
                        <p className="text-sm font-black font-display text-purple-600">
                          {formatPace(activity.avgPace).split(' ')[0]}
                        </p>
                        <p className="text-[10px] text-ink-400">/km</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <Flame className="w-4.5 h-4.5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-amber-700 mb-0.5">
                        消耗 {activity.calories} kcal
                      </p>
                      <p className="text-[11px] text-amber-600/80 leading-relaxed">
                        相当于 {(activity.calories / 77).toFixed(1)} 碗米饭的热量
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-brand-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink-800 flex items-center gap-2">
                        {user.name}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-100 text-brand-600 font-medium">
                          Lv.{user.level}
                        </span>
                      </div>
                      <div className="text-xs text-ink-400">
                        所有人可见 · {formatDate(new Date(), 'yyyy-MM-dd HH:mm')}
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="说点什么吧..."
                    rows={5}
                    className="w-full resize-none outline-none text-base text-ink-800 placeholder:text-ink-400 leading-relaxed bg-ink-50/50 rounded-2xl p-4 border border-ink-100 focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all"
                    maxLength={500}
                  />
                  <div className="text-right text-xs text-ink-400 -mt-2">
                    {content.length}/500
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((img, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative aspect-square rounded-xl overflow-hidden bg-ink-100 border border-ink-100"
                        >
                          <img
                            src={img}
                            alt={`upload-${i}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handleRemoveImage(i)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                      {images.length < 9 && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02 }}
                          onClick={handleAddImages}
                          className="aspect-square rounded-xl border-2 border-dashed border-ink-200 hover:border-brand-400 hover:bg-brand-50/50 transition-colors flex flex-col items-center justify-center gap-1.5 text-ink-400 hover:text-brand-500"
                        >
                          <Plus className="w-6 h-6" />
                          <span className="text-xs">添加</span>
                        </motion.button>
                      )}
                    </div>
                  )}

                  {images.length === 0 && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all text-center border-ink-200 hover:border-brand-300 hover:bg-ink-50"
                    >
                      <ImageIcon className="w-10 h-10 mx-auto mb-2 text-ink-300" />
                      <p className="text-sm font-medium text-ink-600">
                        点击上传图片（选填）
                      </p>
                      <p className="text-xs text-ink-400 mt-1">
                        支持 JPG/PNG，最多 9 张
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleAddImages}
                  />

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-orange-500 shrink-0" />
                      <span className="text-sm font-medium text-ink-700">
                        话题标签
                      </span>
                      <span className="text-xs text-ink-400">
                        ({tags.length}/5)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <motion.span
                          key={t}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-brand-50 text-brand-600 border border-brand-100"
                        >
                          #{t}
                          <button
                            onClick={() => handleRemoveTag(t)}
                            className="hover:text-brand-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.span>
                      ))}
                      {tags.length < 5 && (
                        <div className="flex items-center gap-1 bg-ink-50 rounded-full px-2 py-1">
                          <span className="text-xs text-brand-500">#</span>
                          <input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                            onBlur={handleAddTag}
                            placeholder="添加标签"
                            maxLength={12}
                            className="w-20 bg-transparent outline-none text-xs text-ink-700 placeholder:text-ink-400"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {HOT_TAGS.filter((t) => !tags.includes(t))
                        .slice(0, 5)
                        .map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              if (tags.length < 5) setTags((p) => [...p, t]);
                            }}
                            disabled={tags.length >= 5}
                            className="text-xs px-2.5 py-1 rounded-full bg-ink-100 text-ink-500 hover:bg-brand-100 hover:text-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            + {t}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-ink-100 flex items-center justify-between gap-3 shrink-0 bg-gradient-to-t from-ink-50/50 to-transparent">
              <div className="text-xs text-ink-400 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                动态将发布到社区广场
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-ink-600 hover:bg-ink-100 transition-colors"
                >
                  取消
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  className="px-7 py-2.5 rounded-xl bg-brand-gradient text-white font-semibold text-sm shadow-brand-glow hover:shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  发布
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getActivityById = useStore((s) => s.getActivityById);
  const activities = useStore((s) => s.activities);
  const toggleFavoriteRoute = useStore((s) => s.toggleFavoriteRoute);
  const routes = useStore((s) => s.routes);
  const addPost = useStore((s) => s.addPost);
  const user = useStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<TabType>('pace');
  const [mapStyle, setMapStyle] = useState<MapStyleType>('standard');
  const [isFavorited, setIsFavorited] = useState(false);
  const [isRouteSaved, setIsRouteSaved] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const activity = id ? getActivityById(id) : undefined;

  useEffect(() => {
    if (activity?.routeId) {
      const route = routes.find((r) => r.id === activity.routeId);
      setIsRouteSaved(!!route?.isFavorite);
    }
  }, [activity, routes]);

  const previousActivity = useMemo<Activity | null>(() => {
    if (!activity?.routeId) return null;
    const sameRoute = activities
      .filter(
        (a) => a.routeId === activity.routeId && a.id !== activity.id
      )
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
    return sameRoute[0] ?? null;
  }, [activity, activities]);

  const mapBounds = useMemo(() => {
    if (!activity?.trackPoints || activity.trackPoints.length < 2) return null;
    const lats = activity.trackPoints.map((p) => p.latitude);
    const lngs = activity.trackPoints.map((p) => p.longitude);
    return [
      [Math.min(...lats), Math.min(...lngs)] as [number, number],
      [Math.max(...lats), Math.max(...lngs)] as [number, number],
    ];
  }, [activity]);

  const mapCenter = useMemo<[number, number] | null>(() => {
    if (!mapBounds) return null;
    return [
      (mapBounds[0][0] + mapBounds[1][0]) / 2,
      (mapBounds[0][1] + mapBounds[1][1]) / 2,
    ];
  }, [mapBounds]);

  const trackSegments = useMemo<MapSegment[]>(() => {
    if (!activity?.trackPoints || activity.trackPoints.length < 2) return [];
    const segs: MapSegment[] = [];
    const pts = activity.trackPoints;

    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const dLat = (p2.latitude - p1.latitude) * 111000;
      const dLng =
        (p2.longitude - p1.longitude) *
        111000 *
        Math.cos((p1.latitude * Math.PI) / 180);
      const geoDistance = Math.sqrt(dLat * dLat + dLng * dLng) / 1000;
      const timeDiff = (p2.timestamp - p1.timestamp) / 1000;
      let pace = 360;
      if (geoDistance > 0 && timeDiff > 0) {
        pace = timeDiff / geoDistance;
      }
      const { color } = getPaceColor(pace);
      segs.push({
        positions: [
          [p1.latitude, p1.longitude],
          [p2.latitude, p2.longitude],
        ],
        color,
      });
    }
    return segs;
  }, [activity]);

  const paceStats = useMemo<PaceSegmentStats>(() => {
    if (!activity?.splits || activity.splits.length === 0) {
      return { minPace: null, maxPace: null };
    }
    const valid = activity.splits.filter((s) => s.pace > 0);
    if (valid.length === 0) return { minPace: null, maxPace: null };
    const min = valid.reduce((a, b) => (a.pace < b.pace ? a : b));
    const max = valid.reduce((a, b) => (a.pace > b.pace ? a : b));
    return { minPace: min, maxPace: max };
  }, [activity]);

  const hrChartData = useMemo<HRChartPoint[]>(() => {
    if (
      !activity?.heartRateSamples ||
      activity.heartRateSamples.length === 0
    ) {
      return [];
    }
    const samples = activity.heartRateSamples;
    const startTs = samples[0].timestamp;
    const maxSamples = 120;
    const step = Math.max(1, Math.floor(samples.length / maxSamples));
    const result: HRChartPoint[] = [];
    for (let i = 0; i < samples.length; i += step) {
      const s = samples[i];
      const elapsedSec = (s.timestamp - startTs) / 1000;
      const mins = Math.floor(elapsedSec / 60);
      const secs = Math.floor(elapsedSec % 60);
      result.push({
        time: `${mins}'${secs.toString().padStart(2, '0')}"`,
        timeSeconds: elapsedSec,
        bpm: s.bpm,
      });
    }
    if (result[result.length - 1]?.timeSeconds !== samples[samples.length - 1].timestamp) {
      const last = samples[samples.length - 1];
      const elapsedSec = (last.timestamp - startTs) / 1000;
      const mins = Math.floor(elapsedSec / 60);
      const secs = Math.floor(elapsedSec % 60);
      result.push({
        time: `${mins}'${secs.toString().padStart(2, '0')}"`,
        timeSeconds: elapsedSec,
        bpm: last.bpm,
      });
    }
    return result;
  }, [activity]);

  const hrZoneData = useMemo<HRZoneData[]>(() => {
    if (
      !activity?.heartRateSamples ||
      activity.heartRateSamples.length === 0
    ) {
      return [];
    }
    const zones = DEFAULT_HEART_RATE_ZONES;
    const counts = new Array(zones.length).fill(0);
    const total = activity.heartRateSamples.length;

    for (const sample of activity.heartRateSamples) {
      for (let i = 0; i < zones.length; i++) {
        const z = zones[i];
        if (sample.bpm >= z.minRate && sample.bpm < z.maxRate) {
          counts[i]++;
          break;
        }
      }
    }

    return zones.map((z, i) => ({
      name: z.name,
      value: counts[i],
      percent: total > 0 ? Math.round((counts[i] / total) * 100) : 0,
      color: z.color,
    }));
  }, [activity]);

  const elevationLoss = useMemo(() => {
    if (!activity?.trackPoints || activity.trackPoints.length < 2) return 0;
    let loss = 0;
    for (let i = 1; i < activity.trackPoints.length; i++) {
      const prev = activity.trackPoints[i - 1].elevation;
      const curr = activity.trackPoints[i].elevation;
      const diff = prev - curr;
      if (diff > 0 && diff < 50) loss += diff;
    }
    return Math.round(loss);
  }, [activity]);

  const tileLayerUrl = useMemo(() => {
    switch (mapStyle) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'dark':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  }, [mapStyle]);

  if (!activity) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="min-h-[60vh] flex flex-col items-center justify-center"
      >
        <div className="w-20 h-20 rounded-3xl bg-ink-100 flex items-center justify-center mb-5">
          <ActivityIcon className="w-10 h-10 text-ink-400" />
        </div>
        <h2 className="text-xl font-bold text-ink-700 mb-2">运动未找到</h2>
        <p className="text-ink-500 mb-6">ID: {id ?? '未知'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-xl bg-brand-gradient text-white font-medium shadow-brand-glow hover:shadow-lg transition-all inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回上一页
        </button>
      </motion.div>
    );
  }

  const hasHeartRate = !!activity.heartRateSamples && activity.heartRateSamples.length > 0;
  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'pace', label: '配速分析', icon: <Gauge className="w-4 h-4" /> },
    {
      key: 'elevation',
      label: '海拔剖面',
      icon: <Mountain className="w-4 h-4" />,
    },
    {
      key: 'heartrate',
      label: '心率分析',
      icon: <HeartPulse className="w-4 h-4" />,
    },
  ];

  return (
    <>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-6 pb-24"
      >
      {/* 顶部操作栏 */}
      <motion.div variants={itemVariants} className="sticky top-0 z-40 -mx-4 px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 glass-sm border-b border-ink-100/50">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white border border-ink-200 flex items-center justify-center hover:border-brand-300 hover:text-brand-500 transition-all shadow-sm shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-ink-600" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold font-display text-ink-800 truncate">
              {activity.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-ink-500 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(activity.startTime, 'yyyy年MM月dd日 HH:mm')}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setIsFavorited((v) => !v)}
              className={cn(
                'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all shadow-sm shrink-0',
                isFavorited
                  ? 'bg-red-50 border border-red-200 text-red-500'
                  : 'bg-white border border-ink-200 text-ink-600 hover:border-red-300 hover:text-red-500'
              )}
              title={isFavorited ? '取消收藏' : '收藏运动'}
            >
              <Heart
                className={cn('w-4.5 h-4.5 sm:w-5 sm:h-5', isFavorited && 'fill-current')}
              />
            </button>

            <button
              onClick={() => setShareModalOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-ink-200 flex items-center justify-center hover:border-brand-300 hover:text-brand-500 transition-all shadow-sm shrink-0 text-ink-600"
              title="分享"
            >
              <Share2 className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={() => id && navigate(`/share/${id}`)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-ink-200 flex items-center justify-center hover:border-purple-300 hover:text-purple-500 transition-all shadow-sm shrink-0 text-ink-600"
              title="生成海报"
            >
              <ImageIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </button>

            <Link
              to="/record"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-medium shadow-brand-glow hover:shadow-lg transition-all shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              重跑
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Hero 数据卡片 */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 gradient-border shadow-soft-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-50/70 via-white to-teal-50/50" />
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-brand-200/30 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-teal-200/30 blur-3xl" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-gradient shadow-brand-glow flex items-center justify-center text-white">
                  <ActivityIcon className="w-6 h-6" strokeWidth={2.2} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 text-ink-600">
                      {activity.type === 'running' ? '跑步' : '骑行'}
                    </span>
                    {activity.weather && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 text-ink-600 inline-flex items-center gap-1.5">
                        <WeatherIcon condition={activity.weather.condition} />
                        {activity.weather.temperature}°C · {activity.weather.condition}
                        {activity.weather.humidity && (
                          <span className="text-ink-400 ml-1">
                            湿度 {activity.weather.humidity}%
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-500 mt-1.5">
                    {formatDate(activity.startTime, 'HH:mm')} -{' '}
                    {formatDate(activity.endTime, 'HH:mm')}
                  </p>
                </div>
              </div>
            </div>

            {/* 主指标 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-ink-500 mb-1 flex items-center justify-center sm:justify-start gap-1.5">
                  <MapIcon className="w-3.5 h-3.5 text-brand-500" />
                  总距离
                </p>
                <div className="flex items-baseline justify-center sm:justify-start gap-1">
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-black font-display gradient-text tracking-tight">
                    {formatDistance(activity.distance, 2).split(' ')[0]}
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-ink-500 pb-1">
                    km
                  </span>
                </div>
              </div>

              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-ink-500 mb-1 flex items-center justify-center sm:justify-start gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-teal-500" />
                  总时长
                </p>
                <p className="text-3xl sm:text-4xl font-bold font-display text-ink-800">
                  {formatDuration(activity.duration)}
                </p>
              </div>

              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-ink-500 mb-1 flex items-center justify-center sm:justify-start gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-purple-500" />
                  平均配速
                </p>
                <p className="text-3xl sm:text-4xl font-bold font-display text-ink-800">
                  {formatPace(activity.avgPace).split(' ')[0]}
                  <span className="text-lg text-ink-400 font-medium ml-1">
                    /km
                  </span>
                </p>
              </div>
            </div>

            {/* 副指标 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-white/70 px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-ink-500 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  平均速度
                </div>
                <p className="text-xl font-bold font-display text-ink-800">
                  {activity.avgSpeed.toFixed(1)}{' '}
                  <span className="text-xs font-medium text-ink-400">km/h</span>
                </p>
              </div>

              <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-white/70 px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-ink-500 mb-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  卡路里
                </div>
                <p className="text-xl font-bold font-display text-ink-800">
                  {formatCalories(activity.calories)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-white/70 px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-ink-500 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  累计爬升
                </div>
                <p className="text-xl font-bold font-display text-ink-800">
                  +{Math.round(activity.elevationGain)}{' '}
                  <span className="text-xs font-medium text-ink-400">m</span>
                </p>
              </div>

              <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-white/70 px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-ink-500 mb-1">
                  <Mountain className="w-3.5 h-3.5 text-sky-500" />
                  最高海拔
                </div>
                <p className="text-xl font-bold font-display text-ink-800">
                  {Math.round(activity.maxElevation)}{' '}
                  <span className="text-xs font-medium text-ink-400">m</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 全景地图 */}
      <motion.div variants={itemVariants}>
        <div className="rounded-3xl overflow-hidden border border-ink-100 shadow-soft bg-white">
          <div className="flex items-center justify-between px-5 py-3 border-b border-ink-100">
            <div className="flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-brand-500" />
              <h3 className="font-bold text-ink-800">全景轨迹</h3>
              <span className="text-xs text-ink-400 font-medium">
                {activity.trackPoints.length} 个追踪点
              </span>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-50 border border-ink-100">
              {([
                { k: 'standard' as MapStyleType, icon: MapIcon, label: '标准' },
                { k: 'satellite' as MapStyleType, icon: Satellite, label: '卫星' },
                { k: 'dark' as MapStyleType, icon: Moon, label: '暗色' },
              ]).map(({ k, icon: Icon, label }) => (
                <button
                  key={k}
                  onClick={() => setMapStyle(k)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1.5',
                    mapStyle === k
                      ? 'bg-white text-brand-600 shadow-sm border border-brand-100'
                      : 'text-ink-500 hover:text-ink-700'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[360px] sm:h-[420px] relative">
            {mapBounds && activity.trackPoints.length >= 2 ? (
              <MapContainer
                bounds={mapBounds}
                boundsOptions={{ padding: [40, 40] }}
                className="w-full h-full map-container"
                zoomControl={true}
              >
                <ChangeMapView center={mapCenter} />
                <TileLayer
                  url={tileLayerUrl}
                  attribution={
                    mapStyle === 'satellite'
                      ? 'Tiles &copy; Esri'
                      : '&copy; OpenStreetMap contributors'
                  }
                />

                {trackSegments.map((seg, i) => (
                  <Polyline
                    key={i}
                    positions={seg.positions}
                    color={seg.color}
                    weight={6}
                    opacity={0.92}
                    lineCap="round"
                    lineJoin="round"
                  />
                ))}

                <Marker
                  position={[
                    activity.trackPoints[0].latitude,
                    activity.trackPoints[0].longitude,
                  ]}
                  icon={createFlagIcon('#22C55E')}
                >
                  <Popup>
                    <div className="text-center p-1">
                      <p className="text-xs font-bold text-emerald-600 mb-1">🚩 起点</p>
                      <p className="text-xs text-ink-500">
                        {formatDate(activity.startTime, 'HH:mm:ss')}
                      </p>
                    </div>
                  </Popup>
                </Marker>

                <Marker
                  position={[
                    activity.trackPoints[activity.trackPoints.length - 1]
                      .latitude,
                    activity.trackPoints[activity.trackPoints.length - 1]
                      .longitude,
                  ]}
                  icon={createFlagIcon('#EF4444')}
                >
                  <Popup>
                    <div className="text-center p-1">
                      <p className="text-xs font-bold text-red-500 mb-1">🏁 终点</p>
                      <p className="text-xs text-ink-500">
                        {formatDate(activity.endTime, 'HH:mm:ss')}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-ink-50">
                <div className="text-center">
                  <MapIcon className="w-12 h-12 text-ink-300 mx-auto mb-3" />
                  <p className="text-ink-500 text-sm">暂无轨迹数据</p>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-4 z-[400] glass rounded-xl px-3 py-2 border border-white/60 shadow-sm">
              <p className="text-[10px] font-semibold text-ink-500 mb-1.5">配速图例</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm" style={{ background: '#10B981' }} />
                  <span className="text-[10px] text-ink-600 font-medium">快</span>
                </div>
                <div className="h-1.5 w-16 rounded-full" style={{ background: 'linear-gradient(90deg, #10B981 0%, #F59E0B 50%, #DC2626 100%)' }} />
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-ink-600 font-medium">慢</span>
                  <span className="w-3 h-3 rounded-sm" style={{ background: '#DC2626' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs 切换 */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-white border border-ink-100 shadow-soft w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2',
                activeTab === tab.key
                  ? 'bg-brand-gradient text-white shadow-brand-glow'
                  : 'text-ink-600 hover:text-ink-800 hover:bg-ink-50'
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab 内容 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabContentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {activeTab === 'pace' && (
            <div className="space-y-6">
              <PaceChart
                splits={activity.splits ?? []}
                avgPace={activity.avgPace}
              />

              {/* 最快/最慢公里 */}
              {paceStats.minPace && paceStats.maxPace && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                    <div className="absolute top-3 right-3 w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-xs font-semibold text-emerald-700 mb-2">
                      🏆 最快公里
                    </p>
                    <div className="flex items-end gap-3">
                      <p className="text-3xl font-black font-display text-emerald-700">
                        {formatPace(paceStats.minPace.pace).split(' ')[0]}
                      </p>
                      <div className="pb-1.5">
                        <p className="text-xs font-medium text-emerald-600">
                          K{paceStats.minPace.index + 1}
                        </p>
                        <p className="text-xs text-emerald-500/80">
                          用时 {formatDuration(paceStats.minPace.duration, false)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-red-50 to-orange-50 border border-red-100">
                    <div className="absolute top-3 right-3 w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-xs font-semibold text-red-700 mb-2">
                      📉 最慢公里
                    </p>
                    <div className="flex items-end gap-3">
                      <p className="text-3xl font-black font-display text-red-600">
                        {formatPace(paceStats.maxPace.pace).split(' ')[0]}
                      </p>
                      <div className="pb-1.5">
                        <p className="text-xs font-medium text-red-600">
                          K{paceStats.maxPace.index + 1}
                        </p>
                        <p className="text-xs text-red-500/80">
                          用时 {formatDuration(paceStats.maxPace.duration, false)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 分段记录表 */}
              {activity.splits && activity.splits.length > 0 && (
                <div className="rounded-3xl overflow-hidden border border-ink-100 shadow-soft bg-white">
                  <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
                    <h3 className="font-bold text-ink-800 flex items-center gap-2">
                      <Flag className="w-5 h-5 text-brand-500" />
                      分段记录
                    </h3>
                    <span className="text-xs text-ink-400 font-medium">
                      共 {activity.splits.length} 段
                    </span>
                  </div>
                  <div className="overflow-x-auto custom-scrollbar-thin">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-ink-50/50 text-ink-500">
                          <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wide">
                            分段
                          </th>
                          <th className="text-right px-5 py-3 font-semibold text-xs uppercase tracking-wide">
                            距离
                          </th>
                          <th className="text-right px-5 py-3 font-semibold text-xs uppercase tracking-wide">
                            配速
                          </th>
                          <th className="text-right px-5 py-3 font-semibold text-xs uppercase tracking-wide">
                            时长
                          </th>
                          <th className="text-right px-5 py-3 font-semibold text-xs uppercase tracking-wide">
                            爬升
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {activity.splits.map((split, i) => {
                          const isMin =
                            paceStats.minPace?.index === split.index;
                          const isMax =
                            paceStats.maxPace?.index === split.index;
                          const belowAvg = split.pace < activity.avgPace;
                          return (
                            <tr
                              key={split.index}
                              className={cn(
                                'border-t border-ink-50 transition-colors',
                                isMin && 'bg-emerald-50/40',
                                isMax && 'bg-red-50/40',
                                !isMin && !isMax && 'hover:bg-ink-50/40'
                              )}
                            >
                              <td className="px-5 py-3.5">
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1.5 font-bold',
                                    isMin && 'text-emerald-600',
                                    isMax && 'text-red-600',
                                    !isMin && !isMax && 'text-ink-700'
                                  )}
                                >
                                  K{split.index + 1}
                                  {isMin && <Award className="w-3.5 h-3.5" />}
                                </span>
                              </td>
                              <td className="text-right px-5 py-3.5 font-medium text-ink-600">
                                {formatDistance(split.distance, 2)}
                              </td>
                              <td className="text-right px-5 py-3.5">
                                <span
                                  className={cn(
                                    'font-bold font-display',
                                    belowAvg ? 'text-emerald-600' : 'text-orange-500'
                                  )}
                                >
                                  {formatPace(split.pace).split(' ')[0]}
                                </span>
                              </td>
                              <td className="text-right px-5 py-3.5 font-medium text-ink-600">
                                {formatDuration(split.duration, false)}
                              </td>
                              <td className="text-right px-5 py-3.5">
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 font-semibold',
                                    split.elevationGain > 0
                                      ? 'text-teal-600'
                                      : 'text-ink-400'
                                  )}
                                >
                                  {split.elevationGain > 0 && (
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  )}
                                  +{Math.round(split.elevationGain)}m
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'elevation' && (
            <div className="space-y-6">
              <ElevationChart
                trackPoints={activity.trackPoints}
                elevationGain={activity.elevationGain}
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-700 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-semibold">累计爬升</span>
                  </div>
                  <p className="text-2xl font-black font-display text-emerald-700">
                    +{Math.round(activity.elevationGain)}
                    <span className="text-sm font-semibold ml-1 opacity-80">m</span>
                  </p>
                </div>

                <div className="rounded-3xl p-5 bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-xs font-semibold">累计下降</span>
                  </div>
                  <p className="text-2xl font-black font-display text-blue-700">
                    -{elevationLoss}
                    <span className="text-sm font-semibold ml-1 opacity-80">m</span>
                  </p>
                </div>

                <div className="rounded-3xl p-5 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100">
                  <div className="flex items-center gap-2 text-amber-700 mb-2">
                    <Mountain className="w-4 h-4" />
                    <span className="text-xs font-semibold">最高海拔</span>
                  </div>
                  <p className="text-2xl font-black font-display text-amber-700">
                    {Math.round(activity.maxElevation)}
                    <span className="text-sm font-semibold ml-1 opacity-80">m</span>
                  </p>
                </div>

                <div className="rounded-3xl p-5 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
                  <div className="flex items-center gap-2 text-violet-700 mb-2">
                    <ActivityIcon className="w-4 h-4" />
                    <span className="text-xs font-semibold">起伏程度</span>
                  </div>
                  <p className="text-2xl font-black font-display text-violet-700">
                    {Math.round(activity.elevationGain + elevationLoss)}
                    <span className="text-sm font-semibold ml-1 opacity-80">m</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'heartrate' && (
            <div className="space-y-6">
              {!hasHeartRate ? (
                <div className="rounded-3xl p-10 sm:p-16 border border-ink-100 bg-white text-center shadow-soft">
                  <div className="w-20 h-20 rounded-3xl bg-ink-50 flex items-center justify-center mx-auto mb-5">
                    <HeartPulse className="w-10 h-10 text-ink-300" />
                  </div>
                  <h3 className="text-xl font-bold text-ink-700 mb-2">
                    本次运动未连接心率设备
                  </h3>
                  <p className="text-ink-500 text-sm max-w-md mx-auto">
                    在下次运动时连接心率带或智能手表，即可获得详细的心率分析与卡路里消耗报告。
                  </p>
                </div>
              ) : (
                <>
                  {/* 心率概览 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-3xl p-5 bg-gradient-to-br from-red-50 to-pink-50 border border-red-100">
                      <div className="flex items-center gap-2 text-red-700 mb-2">
                        <HeartPulse className="w-4 h-4" />
                        <span className="text-xs font-semibold">平均心率</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-black font-display text-red-600">
                          {activity.avgHeartRate}
                        </p>
                        <span className="text-sm font-semibold text-red-500 opacity-80">
                          bpm
                        </span>
                      </div>
                    </div>

                    <div className="rounded-3xl p-5 bg-gradient-to-br from-rose-50 to-red-50 border border-rose-100">
                      <div className="flex items-center gap-2 text-rose-700 mb-2">
                        <Zap className="w-4 h-4" />
                        <span className="text-xs font-semibold">最大心率</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-black font-display text-rose-600">
                          {activity.maxHeartRate}
                        </p>
                        <span className="text-sm font-semibold text-rose-500 opacity-80">
                          bpm
                        </span>
                      </div>
                    </div>

                    <div className="rounded-3xl p-5 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
                      <div className="flex items-center gap-2 text-orange-700 mb-2">
                        <Flame className="w-4 h-4" />
                        <span className="text-xs font-semibold">消耗卡路里</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-black font-display text-orange-600">
                          {activity.calories}
                        </p>
                        <span className="text-sm font-semibold text-orange-500 opacity-80">
                          kcal
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 心率曲线图 */}
                  <div className="glass rounded-3xl p-5 border border-white/40">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="font-bold text-ink-800 text-lg">心率曲线</h3>
                        <p className="text-xs text-ink-500 mt-0.5">
                          运动过程中的实时心率变化
                        </p>
                      </div>
                    </div>

                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={hrChartData}
                          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="hrGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#EF4444"
                                stopOpacity={0.5}
                              />
                              <stop
                                offset="40%"
                                stopColor="#F87171"
                                stopOpacity={0.22}
                              />
                              <stop
                                offset="100%"
                                stopColor="#FECACA"
                                stopOpacity={0.02}
                              />
                            </linearGradient>
                            <linearGradient
                              id="hrLineGradient"
                              x1="0"
                              y1="0"
                              x2="1"
                              y2="0"
                            >
                              <stop offset="0%" stopColor="#DC2626" />
                              <stop offset="50%" stopColor="#EF4444" />
                              <stop offset="100%" stopColor="#F87171" />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            strokeDasharray="4 4"
                            stroke="#E5E5E5"
                            vertical={false}
                          />

                          <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: '#A3A3A3',
                              fontSize: 10,
                              fontWeight: 500,
                            }}
                            interval="preserveStartEnd"
                            dy={6}
                          />

                          <YAxis
                            domain={['auto', 'auto']}
                            tickFormatter={(v) => `${v}`}
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: '#A3A3A3',
                              fontSize: 10,
                              fontWeight: 500,
                            }}
                            width={40}
                          />

                          <RechartsTooltip
                            contentStyle={{
                              borderRadius: '16px',
                              border: 'none',
                              background:
                                'rgba(255,255,255,0.95)',
                              boxShadow:
                                '0 10px 30px -10px rgba(0,0,0,0.2)',
                              padding: '12px 16px',
                            }}
                            labelStyle={{
                              fontSize: '11px',
                              color: '#737373',
                              fontWeight: 600,
                              marginBottom: '6px',
                            }}
                            formatter={(value: number) => [
                              <span
                                key="v"
                                className="font-bold text-red-600 text-lg font-display"
                              >
                                {value} <span className="text-xs font-medium text-ink-400">bpm</span>
                              </span>,
                              <span
                                key="l"
                                className="text-xs font-medium text-ink-500"
                              >
                                心率
                              </span>,
                            ]}
                          />

                          <Area
                            type="monotone"
                            dataKey="bpm"
                            stroke="url(#hrLineGradient)"
                            strokeWidth={2.5}
                            fill="url(#hrGradient)"
                            isAnimationActive={true}
                            animationDuration={800}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 心率区间分布 */}
                  <div className="grid lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-2 glass rounded-3xl p-5 border border-white/40">
                      <div className="mb-4">
                        <h3 className="font-bold text-ink-800 text-lg">心率区间</h3>
                        <p className="text-xs text-ink-500 mt-0.5">
                          各区间停留时间分布
                        </p>
                      </div>

                      <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={hrZoneData.filter((z) => z.value > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={3}
                              dataKey="value"
                              isAnimationActive={true}
                              animationDuration={700}
                            >
                              {hrZoneData
                                .filter((z) => z.value > 0)
                                .map((entry, i) => (
                                  <Cell
                                    key={`cell-${i}`}
                                    fill={entry.color}
                                    stroke="#fff"
                                    strokeWidth={2}
                                  />
                                ))}
                            </Pie>
                            <Legend
                              verticalAlign="bottom"
                              iconType="circle"
                              iconSize={8}
                              formatter={(value: string) => (
                                <span className="text-xs font-medium text-ink-600">
                                  {value}
                                </span>
                              )}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                padding: '10px 14px',
                                fontSize: '12px',
                              }}
                              formatter={(value: number, name: string, props: { payload: HRZoneData }) => [
                                <span key="v" className="font-bold">
                                  {props.payload.percent}% ({value} 个采样)
                                </span>,
                                <span key="n" className="text-xs text-ink-500">
                                  {name}
                                </span>,
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="lg:col-span-3 rounded-3xl border border-ink-100 bg-white shadow-soft p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-bold text-ink-800 text-lg">区间详情</h3>
                      </div>
                      <div className="space-y-3.5">
                        {DEFAULT_HEART_RATE_ZONES.map((zone: HeartRateZoneConfig, i: number) => {
                          const data = hrZoneData[i] ?? { value: 0, percent: 0 };
                          return (
                            <div
                              key={zone.name}
                              className="flex items-center gap-3"
                            >
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{
                                  background: `${zone.color}15`,
                                }}
                              >
                                <HeartPulse
                                  className="w-4.5 h-4.5"
                                  style={{ color: zone.color }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-ink-700">
                                      {zone.name}
                                    </span>
                                    <span className="text-xs text-ink-400">
                                      {zone.minRate} - {zone.maxRate} bpm
                                    </span>
                                  </div>
                                  <span
                                    className="text-sm font-bold font-display"
                                    style={{ color: zone.color }}
                                  >
                                    {data.percent}%
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${data.percent}%` }}
                                    transition={{
                                      duration: 0.8,
                                      delay: i * 0.08,
                                      ease: 'easeOut',
                                    }}
                                    className="h-full rounded-full"
                                    style={{ background: zone.color }}
                                  />
                                </div>
                                <p className="text-[11px] text-ink-400 mt-1">
                                  {zone.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-5 pt-4 border-t border-ink-100">
                        <div className="flex items-start gap-3 rounded-2xl bg-amber-50/60 border border-amber-100 p-4">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                            <Flame className="w-4.5 h-4.5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-amber-800 mb-1">
                              卡路里消耗说明
                            </p>
                            <p className="text-xs text-amber-700/90 leading-relaxed">
                              本次运动共消耗{' '}
                              <span className="font-bold">
                                {activity.calories} kcal
                              </span>
                              ，其中脂肪供能约占{' '}
                              <span className="font-bold">
                                {hrZoneData[0]?.percent + hrZoneData[1]?.percent || 0}%
                              </span>{' '}
                              （热身+燃脂区间），建议每周保持 3-5 次中等强度有氧训练以获得最佳减脂效果。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 对比区域 */}
      {previousActivity && (
        <motion.div variants={itemVariants}>
          <div className="relative overflow-hidden rounded-3xl p-6 border border-brand-100 shadow-soft bg-gradient-to-br from-white via-brand-50/30 to-white">
            <div className="absolute top-0 right-0 w-40 h-40 bg-brand-200/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-brand-gradient shadow-brand-glow flex items-center justify-center text-white">
                    <RefreshCw className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink-800 text-lg flex items-center gap-2">
                      路线对比
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                        上次 vs 本次
                      </span>
                    </h3>
                    <p className="text-xs text-ink-500 mt-0.5">
                      相同路线的两次运动表现对比
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-ink-400" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: '距离',
                    prev: formatDistance(previousActivity.distance, 2),
                    curr: formatDistance(activity.distance, 2),
                    diff:
                      activity.distance - previousActivity.distance,
                    fmt: (v: number) =>
                      `${v >= 0 ? '+' : ''}${formatDistance(Math.abs(v), 2)}`,
                    better: (v: number) => v >= 0,
                  },
                  {
                    label: '时长',
                    prev: formatDuration(previousActivity.duration),
                    curr: formatDuration(activity.duration),
                    diff: activity.duration - previousActivity.duration,
                    fmt: (v: number) =>
                      `${v >= 0 ? '+' : '-'}${formatDuration(Math.abs(v), false)}`,
                    better: (v: number) => v <= 0,
                  },
                  {
                    label: '平均配速',
                    prev: formatPace(previousActivity.avgPace).split(' ')[0],
                    curr: formatPace(activity.avgPace).split(' ')[0],
                    diff: activity.avgPace - previousActivity.avgPace,
                    fmt: (v: number) =>
                      `${v <= 0 ? '快 ' : '慢 '}${formatPace(Math.abs(v)).split(' ')[0]}`,
                    better: (v: number) => v <= 0,
                  },
                  {
                    label: '爬升',
                    prev: `+${Math.round(previousActivity.elevationGain)}m`,
                    curr: `+${Math.round(activity.elevationGain)}m`,
                    diff:
                      activity.elevationGain - previousActivity.elevationGain,
                    fmt: (v: number) =>
                      `${v >= 0 ? '+' : '-'}${Math.round(Math.abs(v))}m`,
                    better: () => true,
                  },
                ].map((item, i) => {
                  const isBetter = item.better(item.diff);
                  return (
                    <div
                      key={i}
                      className="rounded-2xl p-4 bg-white/70 backdrop-blur-sm border border-white/80"
                    >
                      <p className="text-xs font-medium text-ink-500 mb-2">
                        {item.label}
                      </p>
                      <div className="flex items-end gap-2 mb-2">
                        <div>
                          <p className="text-[10px] font-medium text-ink-400 mb-0.5">
                            上次
                          </p>
                          <p className="text-sm font-semibold text-ink-500 line-through decoration-ink-300">
                            {item.prev}
                          </p>
                        </div>
                        <div className="pb-0.5">
                          <ChevronRight className="w-3.5 h-3.5 text-ink-300" />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-ink-500 mb-0.5">
                            本次
                          </p>
                          <p className="text-sm font-bold text-ink-800">
                            {item.curr}
                          </p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold',
                          isBetter
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-orange-50 text-orange-700'
                        )}
                      >
                        {isBetter ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <TrendingUp className="w-3 h-3" />
                        )}
                        {item.fmt(item.diff)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 底部操作区 */}
      <motion.div
        variants={itemVariants}
        className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-3 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-2 sm:p-2.5 border border-white/50 shadow-card-hover flex items-center gap-2">
            <button
              onClick={() => {
                if (activity.routeId) {
                  toggleFavoriteRoute(activity.routeId);
                  setIsRouteSaved((v) => !v);
                }
              }}
              disabled={!activity.routeId}
              className={cn(
                'flex-1 px-3 sm:px-5 py-3 rounded-xl font-semibold text-sm transition-all inline-flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
                isRouteSaved
                  ? 'bg-teal-gradient text-white shadow-teal-glow'
                  : 'bg-white border border-ink-200 text-ink-700 hover:border-teal-300 hover:text-teal-600'
              )}
            >
              <BookmarkPlus
                className={cn('w-4 h-4 sm:w-5 sm:h-5', isRouteSaved && 'fill-current')}
              />
              <span className="hidden sm:inline">
                {isRouteSaved ? '已保存路线' : '保存路线'}
              </span>
              <span className="sm:hidden">保存</span>
            </button>

            <button
              onClick={() => setShareModalOpen(true)}
              className="flex-1 px-3 sm:px-5 py-3 rounded-xl bg-white border border-ink-200 text-ink-700 hover:border-brand-300 hover:text-brand-600 font-semibold text-sm transition-all inline-flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">分享到社区</span>
              <span className="sm:hidden">社区</span>
            </button>

            <Link
              to={id ? `/share/${id}` : '/'}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-xl bg-brand-gradient text-white font-semibold text-sm shadow-brand-glow hover:shadow-lg transition-all inline-flex items-center justify-center gap-2 shrink-0"
            >
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">生成海报</span>
              <span className="sm:hidden">海报</span>
            </Link>
          </div>
        </div>
      </motion.div>
      </motion.div>

      {activity && (
        <ShareToCommunityModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          activity={activity}
          user={user}
          onPublish={(post) => addPost(post)}
        />
      )}
    </>
  );
}