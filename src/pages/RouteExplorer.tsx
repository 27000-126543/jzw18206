import { useState, useMemo, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
  Circle,
} from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
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
  Search,
  Activity as ActivityIcon,
  Bike,
  Map as MapIcon,
  List,
  Star,
  Users,
  Mountain,
  Navigation,
  Heart,
  Share2,
  X,
  Trophy,
  Clock,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  Filter,
  SlidersHorizontal,
  MapPin,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import type { Route, ActivityType, Difficulty, TrackPoint } from '@/types';
import useStore from '@/store/useStore';
import { formatDistance, formatDuration } from '@/utils/formatters';
import { getDifficultyColor } from '@/utils/colors';
import { cn } from '@/lib/utils';
import { MiniTrackMap } from '@/components/maps/MiniTrackMap';
import { mockUsers } from '@/data/mockUser';

type ViewMode = 'map' | 'list' | 'split';
type ActivityFilter = 'all' | ActivityType;
type DifficultyFilter = 'all' | Difficulty;

interface ElevationPoint {
  distance: number;
  elevation: number;
  label: string;
}

const ROUTE_COLORS = [
  '#FF6B35',
  '#0D9488',
  '#8B5CF6',
  '#EC4899',
  '#3B82F6',
  '#F59E0B',
];

const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background: linear-gradient(135deg, #FF6B35, #F7931E); width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(255,107,53,0.4);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapAutoFit({ routes, highlightedId }: { routes: Route[]; highlightedId: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (routes.length === 0) return;

    if (highlightedId) {
      const route = routes.find((r) => r.id === highlightedId);
      if (route && route.trackData.length > 0) {
        const bounds = L.latLngBounds(
          route.trackData.map((p) => [p.latitude, p.longitude])
        );
        map.fitBounds(bounds, { padding: [60, 60] });
      }
    } else {
      const allPoints: L.LatLngTuple[] = [];
      routes.forEach((route) => {
        route.trackData.forEach((p) => {
          allPoints.push([p.latitude, p.longitude]);
        });
      });
      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [80, 80] });
      }
    }
  }, [routes, highlightedId, map]);

  return null;
}

function createElevationData(trackData: TrackPoint[]): ElevationPoint[] {
  if (!trackData || trackData.length < 2) return [];

  const points: ElevationPoint[] = [];
  let cumDistance = 0;
  const sampleInterval = Math.max(1, Math.floor(trackData.length / 40));

  for (let i = 1; i < trackData.length; i++) {
    const p1 = trackData[i - 1];
    const p2 = trackData[i];
    const dLat = (p2.latitude - p1.latitude) * 111000;
    const dLng =
      (p2.longitude - p1.longitude) *
      111000 *
      Math.cos((p1.latitude * Math.PI) / 180);
    cumDistance += Math.sqrt(dLat * dLat + dLng * dLng);

    if (i % sampleInterval === 0 || i === trackData.length - 1) {
      points.push({
        distance: Math.round(cumDistance),
        elevation: Math.round(p2.elevation),
        label: formatDistance(cumDistance, 1),
      });
    }
  }

  return points;
}

export default function RouteExplorer() {
  const navigate = useNavigate();
  const { routes, toggleFavoriteRoute } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [distanceRange, setDistanceRange] = useState<[number, number]>([0, 100000]);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');
  const [highlightedRouteId, setHighlightedRouteId] = useState<string | null>(null);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileListExpanded, setMobileListExpanded] = useState(false);

  const currentPosition: [number, number] = [39.9042, 116.4074];

  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      const matchesSearch =
        route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesActivity =
        activityFilter === 'all' || route.type === activityFilter;
      const matchesDifficulty =
        difficultyFilter === 'all' || route.difficulty === difficultyFilter;
      const matchesDistance =
        route.distance >= distanceRange[0] && route.distance <= distanceRange[1];

      return matchesSearch && matchesActivity && matchesDifficulty && matchesDistance;
    });
  }, [routes, searchQuery, activityFilter, difficultyFilter, distanceRange]);

  const topRoutes = useMemo(() => {
    return [...routes]
      .sort((a, b) => b.completionCount - a.completionCount)
      .slice(0, 5);
  }, [routes]);

  const recentCompleters = useMemo(() => {
    if (!selectedRoute) return [];
    const shuffled = [...mockUsers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  }, [selectedRoute]);

  const handleRunRoute = (routeId: string) => {
    navigate(`/record?routeId=${routeId}`);
  };

  const handleShare = (route: Route) => {
    if (navigator.share) {
      navigator.share({
        title: route.name,
        text: `来跑这条路线：${route.name}，距离${formatDistance(route.distance)}，评分${route.rating}⭐`,
        url: window.location.href,
      });
    }
  };

  const getRouteColor = (index: number, isHighlighted: boolean) => {
    const base = ROUTE_COLORS[index % ROUTE_COLORS.length];
    return isHighlighted ? base : base;
  };

  return (
    <div className="space-y-4 lg:space-y-6 min-h-0 flex flex-col h-[calc(100vh-7rem)] lg:h-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink-800">
            路线探索
          </h1>
          <p className="text-ink-500 mt-1 text-sm">发现附近优质运动路线</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'lg:hidden px-4 py-2.5 rounded-xl bg-white border text-sm font-medium transition-all flex items-center gap-2 shadow-sm',
              showFilters
                ? 'border-brand-300 text-brand-500'
                : 'border-ink-200 text-ink-700 hover:border-brand-300 hover:text-brand-500'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            筛选
          </button>
          <div className="hidden sm:flex items-center bg-white rounded-xl border border-ink-200 p-1 shadow-sm">
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                viewMode === 'map'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-ink-500 hover:text-ink-700'
              )}
            >
              <MapIcon className="w-4 h-4" />
              地图
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                viewMode === 'list'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-ink-500 hover:text-ink-700'
              )}
            >
              <List className="w-4 h-4" />
              列表
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <motion.div
        className="flex-shrink-0"
        initial={false}
        animate={{ height: showFilters || window.innerWidth >= 1024 ? 'auto' : 0 }}
        style={{ overflow: 'hidden' }}
      >
        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
            <input
              type="text"
              placeholder="搜索路线名称、位置或标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-ink-50 border border-transparent text-sm text-ink-700 placeholder:text-ink-400 focus:outline-none focus:border-brand-300 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-ink-100 text-ink-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Activity Type */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-ink-500 flex items-center gap-1">
                <ActivityIcon className="w-3.5 h-3.5" />
                运动类型
              </span>
              <div className="flex bg-ink-50 rounded-lg p-0.5">
                {(['all', 'running', 'cycling'] as ActivityFilter[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setActivityFilter(type)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1',
                      activityFilter === type
                        ? 'bg-white text-brand-600 shadow-sm'
                        : 'text-ink-500 hover:text-ink-700'
                    )}
                  >
                    {type === 'all' ? '全部' : type === 'running' ? (
                      <>
                        <ActivityIcon className="w-3 h-3" />跑步
                      </>
                    ) : (
                      <>
                        <Bike className="w-3 h-3" />骑行
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-ink-500 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                难度
              </span>
              <div className="flex bg-ink-50 rounded-lg p-0.5">
                {(['all', 'easy', 'moderate', 'hard'] as DifficultyFilter[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                      difficultyFilter === diff
                        ? 'bg-white shadow-sm'
                        : 'text-ink-500 hover:text-ink-700'
                    )}
                    style={
                      difficultyFilter === diff
                        ? { color: diff === 'all' ? '#FF6B35' : getDifficultyColor(diff).color }
                        : undefined
                    }
                  >
                    {diff === 'all' ? '全部' : getDifficultyColor(diff).label}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance Range */}
            <div className="flex-1 min-w-[200px] flex items-center gap-3">
              <span className="text-xs font-medium text-ink-500 flex items-center gap-1 whitespace-nowrap">
                <Navigation className="w-3.5 h-3.5" />
                距离
              </span>
              <div className="flex-1 flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100000}
                  step={1000}
                  value={distanceRange[1]}
                  onChange={(e) =>
                    setDistanceRange([0, parseInt(e.target.value)])
                  }
                  className="flex-1 h-2 bg-ink-100 rounded-full appearance-none cursor-pointer accent-brand-500"
                />
                <span className="text-xs font-semibold text-ink-700 whitespace-nowrap min-w-[60px]">
                  0 - {formatDistance(distanceRange[1], 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Result Count */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-ink-500">
              找到 <span className="font-bold text-ink-700">{filteredRoutes.length}</span> 条路线
            </p>
            {(searchQuery || activityFilter !== 'all' || difficultyFilter !== 'all' || distanceRange[1] < 100000) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActivityFilter('all');
                  setDifficultyFilter('all');
                  setDistanceRange([0, 100000]);
                }}
                className="text-xs font-medium text-brand-500 hover:text-brand-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                重置筛选
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Hot Routes - Horizontal Scroll */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-ink-700 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            热门路线榜
          </h2>
          <span className="text-xs text-ink-400">按完成人数排行</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar -mx-1 px-1">
          {topRoutes.map((route, index) => (
            <motion.div
              key={route.id}
              whileHover={{ y: -2, scale: 1.01 }}
              onClick={() => setSelectedRoute(route)}
              className={cn(
                'flex-shrink-0 w-56 rounded-2xl p-4 cursor-pointer transition-all',
                'border shadow-soft',
                index === 0 && 'bg-gold-gradient border-amber-200',
                index === 1 && 'bg-silver-gradient border-gray-200',
                index === 2 && 'bg-bronze-gradient border-orange-200',
                index > 2 && 'bg-white border-ink-100 hover:border-brand-200'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm',
                    index === 0 && 'bg-amber-600/20 text-amber-800',
                    index === 1 && 'bg-gray-600/20 text-gray-700',
                    index === 2 && 'bg-orange-700/20 text-orange-800',
                    index > 2 && 'bg-ink-100 text-ink-500'
                  )}
                >
                  #{index + 1}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  <span
                    className={cn(
                      'text-xs font-bold',
                      index < 3 ? 'text-gray-800' : 'text-ink-700'
                    )}
                  >
                    {route.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              <h3
                className={cn(
                  'font-bold text-sm leading-tight line-clamp-2 mb-2',
                  index < 3 ? 'text-gray-900' : 'text-ink-800'
                )}
              >
                {route.name}
              </h3>
              <div className="flex items-center justify-between text-xs">
                <span
                  className={cn(
                    'flex items-center gap-1',
                    index < 3 ? 'text-gray-700' : 'text-ink-500'
                  )}
                >
                  <Users className="w-3 h-3" />
                  {route.completionCount.toLocaleString()}
                </span>
                <span
                  className={cn(
                    'font-semibold',
                    index < 3 ? 'text-gray-800' : 'text-ink-600'
                  )}
                >
                  {formatDistance(route.distance, 1)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Desktop: Split Layout | Mobile: Tab Layout */}
      <div className="flex-1 min-h-0 hidden lg:flex flex-col">
        <div
          className={cn(
            'flex-1 min-h-0 gap-4 lg:gap-6',
            viewMode === 'map' ? 'flex' : viewMode === 'list' ? 'block' : 'flex'
          )}
        >
          {/* Map - 60% */}
          {(viewMode === 'map' || viewMode === 'split') && (
            <div
              className={cn(
                'relative bg-white rounded-3xl border border-ink-100 shadow-soft overflow-hidden',
                viewMode === 'map' ? 'flex-1' : 'w-3/5'
              )}
              style={{ minHeight: 500 }}
            >
              <MapContainer
                center={currentPosition}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapAutoFit routes={filteredRoutes} highlightedId={highlightedRouteId} />

                {/* Heatmap Effect - Circles at start points */}
                {filteredRoutes.map((route, idx) => (
                  <Circle
                    key={`heat-${route.id}`}
                    center={route.startPoint}
                    radius={80 + route.completionCount / 200}
                    pathOptions={{
                      color: 'transparent',
                      fillColor: ROUTE_COLORS[idx % ROUTE_COLORS.length],
                      fillOpacity: 0.08 + Math.min(route.completionCount / 50000, 0.12),
                    }}
                  />
                ))}

                {/* Route Polylines */}
                {filteredRoutes.map((route, idx) => {
                  const positions = route.trackData.map((p) => [p.latitude, p.longitude]) as [number, number][];
                  const isHighlighted =
                    highlightedRouteId === route.id || expandedRouteId === route.id;
                  return (
                    <Polyline
                      key={route.id}
                      positions={positions}
                      pathOptions={{
                        color: getRouteColor(idx, isHighlighted),
                        weight: isHighlighted ? 6 : 3.5,
                        opacity: isHighlighted ? 0.95 : 0.65,
                        lineCap: 'round',
                        lineJoin: 'round',
                      }}
                      eventHandlers={{
                        mouseover: () => setHighlightedRouteId(route.id),
                        mouseout: () =>
                          setHighlightedRouteId((prev) =>
                            prev === route.id ? null : prev
                          ),
                        click: () => setSelectedRoute(route),
                      }}
                    />
                  );
                })}

                {/* Current Position Marker */}
                <Marker position={currentPosition} icon={customIcon}>
                  <Popup>
                    <div className="text-sm font-medium text-ink-700">我的位置</div>
                  </Popup>
                </Marker>
              </MapContainer>

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-soft border border-ink-100">
                <div className="flex items-center gap-3 text-xs">
                  {filteredRoutes.slice(0, 4).map((route, idx) => (
                    <div key={route.id} className="flex items-center gap-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ROUTE_COLORS[idx % ROUTE_COLORS.length] }}
                      />
                      <span className="text-ink-600 max-w-[80px] truncate">
                        {route.name.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Route List - 40% or Full */}
          <div
            className={cn(
              'bg-white rounded-3xl border border-ink-100 shadow-soft overflow-hidden flex flex-col',
              viewMode === 'list' ? 'flex-1' : 'w-2/5'
            )}
            style={{ minHeight: 500 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 flex-shrink-0">
              <h3 className="font-bold text-ink-800">
                路线列表
                <span className="ml-2 text-xs font-normal text-ink-400">
                  {filteredRoutes.length} 条
                </span>
              </h3>
              <button className="text-xs font-medium text-brand-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                排序
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {filteredRoutes.map((route, idx) => {
                  const isExpanded = expandedRouteId === route.id;
                  const isHovered = highlightedRouteId === route.id;
                  const isRunning = route.type === 'running';
                  const TypeIcon = isRunning ? ActivityIcon : Bike;
                  const { color: diffColor, label: diffLabel } = getDifficultyColor(
                    route.difficulty
                  );
                  return (
                    <motion.div
                      key={route.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      whileHover={{ y: -2 }}
                      onMouseEnter={() => setHighlightedRouteId(route.id)}
                      onMouseLeave={() =>
                        setHighlightedRouteId((prev) =>
                          prev === route.id ? null : prev
                        )
                      }
                      onClick={() => setSelectedRoute(route)}
                      className={cn(
                        'relative rounded-2xl border overflow-hidden cursor-pointer transition-all',
                        isHovered
                          ? 'border-brand-300 shadow-card-hover bg-brand-50/30'
                          : 'border-ink-100 bg-white hover:border-ink-200',
                        isExpanded && 'ring-2 ring-brand-200'
                      )}
                    >
                      <div className="flex gap-3 p-3">
                        {/* Thumbnail */}
                        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-ink-50">
                          <MiniTrackMap
                            trackPoints={route.trackData}
                            width={96}
                            height={96}
                            padding={8}
                            showMarkers={false}
                            colorByPace={false}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-ink-800 text-sm leading-tight line-clamp-2 flex-1">
                              {route.name}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavoriteRoute(route.id);
                              }}
                              className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                                route.isFavorite
                                  ? 'bg-red-50 text-red-500'
                                  : 'bg-ink-50 text-ink-400 hover:bg-red-50 hover:text-red-500'
                              )}
                            >
                              <Heart
                                className={cn(
                                  'w-3.5 h-3.5',
                                  route.isFavorite && 'fill-current'
                                )}
                              />
                            </button>
                          </div>

                          {/* Tags */}
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <div
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                                isRunning
                                  ? 'bg-brand-50 text-brand-600'
                                  : 'bg-blue-50 text-blue-600'
                              )}
                            >
                              <TypeIcon className="w-2.5 h-2.5" />
                              {isRunning ? '跑步' : '骑行'}
                            </div>
                            <div
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ backgroundColor: `${diffColor}15`, color: diffColor }}
                            >
                              {diffLabel}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-3 mt-auto pt-2">
                            <div className="flex items-center gap-1 text-xs text-ink-500">
                              <Navigation className="w-3 h-3 text-brand-500" />
                              <span className="font-semibold text-ink-700">
                                {formatDistance(route.distance, 1)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-ink-500">
                              <Mountain className="w-3 h-3 text-teal-500" />
                              <span className="font-semibold text-ink-700">
                                +{route.elevationGain}m
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-amber-500 fill-current" />
                              <span className="text-xs font-semibold text-ink-700">
                                {route.rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Color Accent */}
                      <div
                        className="absolute bottom-0 left-0 h-0.5 transition-all"
                        style={{
                          width: isHovered ? '100%' : '0%',
                          backgroundColor: ROUTE_COLORS[idx % ROUTE_COLORS.length],
                        }}
                      />

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-0 border-t border-ink-100 space-y-3">
                              <p className="text-xs text-ink-500 line-clamp-2 pt-3">
                                {route.description}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRunRoute(route.id);
                                  }}
                                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:shadow-lg transition-all"
                                >
                                  <TypeIcon className="w-3.5 h-3.5" />
                                  跑这条路线
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavoriteRoute(route.id);
                                  }}
                                  className={cn(
                                    'px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all',
                                    route.isFavorite
                                      ? 'bg-red-50 border-red-200 text-red-600'
                                      : 'bg-white border-ink-200 text-ink-600 hover:border-red-200 hover:text-red-500'
                                  )}
                                >
                                  <Heart
                                    className={cn(
                                      'w-3.5 h-3.5',
                                      route.isFavorite && 'fill-current'
                                    )}
                                  />
                                  收藏
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Expand Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRouteId(isExpanded ? null : route.id);
                        }}
                        className="absolute top-3 left-3 w-5 h-5 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3 text-ink-500" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-ink-500" />
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredRoutes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MapPin className="w-12 h-12 text-ink-300 mb-3" />
                  <p className="text-sm font-medium text-ink-500">没有找到匹配的路线</p>
                  <p className="text-xs text-ink-400 mt-1">试试调整筛选条件</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex-1 min-h-0 flex flex-col lg:hidden relative">
        {/* Mobile Tabs */}
        <div className="flex-shrink-0 flex items-center bg-white rounded-xl border border-ink-100 p-1 shadow-soft mb-3">
          <button
            onClick={() => setMobileTab('map')}
            className={cn(
              'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5',
              mobileTab === 'map'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-ink-500'
            )}
          >
            <MapIcon className="w-4 h-4" />
            地图
          </button>
          <button
            onClick={() => setMobileTab('list')}
            className={cn(
              'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5',
              mobileTab === 'list'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-ink-500'
            )}
          >
            <List className="w-4 h-4" />
            列表
          </button>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 min-h-0 relative rounded-3xl overflow-hidden border border-ink-100 shadow-soft bg-white">
          {/* Mobile Map */}
          {mobileTab === 'map' && (
            <div className="absolute inset-0">
              <MapContainer
                center={currentPosition}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapAutoFit routes={filteredRoutes} highlightedId={highlightedRouteId} />

                {filteredRoutes.map((route, idx) => (
                  <Circle
                    key={`heat-m-${route.id}`}
                    center={route.startPoint}
                    radius={60 + route.completionCount / 300}
                    pathOptions={{
                      color: 'transparent',
                      fillColor: ROUTE_COLORS[idx % ROUTE_COLORS.length],
                      fillOpacity: 0.1,
                    }}
                  />
                ))}

                {filteredRoutes.map((route, idx) => {
                  const positions = route.trackData.map((p) => [p.latitude, p.longitude]) as [number, number][];
                  const isHighlighted = highlightedRouteId === route.id;
                  return (
                    <Polyline
                      key={`poly-m-${route.id}`}
                      positions={positions}
                      pathOptions={{
                        color: ROUTE_COLORS[idx % ROUTE_COLORS.length],
                        weight: isHighlighted ? 5 : 3,
                        opacity: isHighlighted ? 0.95 : 0.7,
                        lineCap: 'round',
                      }}
                      eventHandlers={{
                        click: () => setSelectedRoute(route),
                      }}
                    />
                  );
                })}

                <Marker position={currentPosition} icon={customIcon} />
              </MapContainer>

              {/* Bottom Sheet Handle */}
              <motion.div
                drag="y"
                dragConstraints={{ top: -200, bottom: 0 }}
                onDragEnd={(e, { offset }) => {
                  if (offset.y < -100) {
                    setMobileListExpanded(true);
                  } else if (offset.y > 50) {
                    setMobileListExpanded(false);
                  }
                }}
                className={cn(
                  'absolute left-0 right-0 bg-white rounded-t-3xl shadow-card-hover border-t border-x border-ink-100 transition-all',
                  mobileListExpanded ? 'bottom-0 h-[60%]' : 'bottom-0 h-28'
                )}
                style={{ touchAction: 'none' }}
              >
                <div className="flex justify-center py-2 cursor-grab active:cursor-grabbing">
                  <div className="w-10 h-1 rounded-full bg-ink-300" />
                </div>
                <div className="px-4 pb-2 flex items-center justify-between">
                  <h4 className="font-bold text-ink-800 text-sm">
                    附近路线 ({filteredRoutes.length})
                  </h4>
                  <button
                    onClick={() => setMobileListExpanded(!mobileListExpanded)}
                    className="text-xs font-medium text-brand-500"
                  >
                    {mobileListExpanded ? '收起' : '展开全部'}
                  </button>
                </div>
                <div className="px-4 pb-4 overflow-y-auto h-[calc(100%-4rem)] custom-scrollbar space-y-2">
                  {filteredRoutes.slice(0, mobileListExpanded ? undefined : 2).map((route, idx) => {
                    const isRunning = route.type === 'running';
                    const TypeIcon = isRunning ? ActivityIcon : Bike;
                    return (
                      <div
                        key={`mobile-card-${route.id}`}
                        onClick={() => setSelectedRoute(route)}
                        className="flex gap-3 p-2.5 rounded-xl bg-ink-50 hover:bg-brand-50 cursor-pointer transition-all"
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                          <MiniTrackMap
                            trackPoints={route.trackData}
                            width={56}
                            height={56}
                            padding={4}
                            showMarkers={false}
                            colorByPace={false}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-ink-800 text-xs leading-tight line-clamp-1">
                            {route.name}
                          </h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-ink-500 flex items-center gap-0.5">
                              <TypeIcon className="w-2.5 h-2.5" />
                              {formatDistance(route.distance, 1)}
                            </span>
                            <span className="text-[10px] text-ink-500 flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 text-amber-500 fill-current" />
                              {route.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}

          {/* Mobile List */}
          {mobileTab === 'list' && (
            <div className="absolute inset-0 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 flex-shrink-0">
                <span className="font-bold text-ink-800 text-sm">
                  全部路线
                </span>
                <span className="text-xs text-ink-400">
                  共 {filteredRoutes.length} 条
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {filteredRoutes.map((route, idx) => {
                  const isRunning = route.type === 'running';
                  const TypeIcon = isRunning ? ActivityIcon : Bike;
                  const { color: diffColor, label: diffLabel } = getDifficultyColor(
                    route.difficulty
                  );
                  return (
                    <div
                      key={`mobile-full-${route.id}`}
                      onClick={() => setSelectedRoute(route)}
                      className="rounded-2xl border border-ink-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="relative h-32 bg-ink-50">
                        <MiniTrackMap
                          trackPoints={route.trackData}
                          width={400}
                          height={128}
                          padding={16}
                          showMarkers={true}
                          colorByPace={false}
                          className="w-full h-full"
                        />
                        <div className="absolute top-2 left-2 flex gap-1.5">
                          <div
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm',
                              isRunning
                                ? 'bg-brand-500/90 text-white'
                                : 'bg-blue-500/90 text-white'
                            )}
                          >
                            <TypeIcon className="w-3 h-3" />
                            {isRunning ? '跑步' : '骑行'}
                          </div>
                          <div
                            className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm"
                            style={{ backgroundColor: `${diffColor}CC`, color: 'white' }}
                          >
                            {diffLabel}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteRoute(route.id);
                          }}
                          className={cn(
                            'absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-all',
                            route.isFavorite
                              ? 'bg-red-500 text-white'
                              : 'bg-white/80 text-ink-500'
                          )}
                        >
                          <Heart
                            className={cn('w-3.5 h-3.5', route.isFavorite && 'fill-current')}
                          />
                        </button>
                      </div>
                      <div className="p-3">
                        <h4 className="font-bold text-ink-800 text-sm leading-tight">
                          {route.name}
                        </h4>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-ink-600 font-semibold">
                              {formatDistance(route.distance, 1)}
                            </span>
                            <span className="text-xs text-ink-600 font-semibold">
                              +{route.elevationGain}m
                            </span>
                            <span className="text-xs text-ink-600 font-semibold flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-amber-500 fill-current" />
                              {route.rating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-[10px] text-ink-400">
                            {route.completionCount.toLocaleString()}人完成
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Route Detail Modal */}
      <AnimatePresence>
        {selectedRoute && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRoute(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:p-8"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 lg:inset-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-50 lg:w-full lg:max-w-3xl lg:max-h-[90vh] bg-white lg:rounded-3xl shadow-card-hover overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex-shrink-0 relative">
                <div className="h-56 lg:h-64 relative overflow-hidden bg-ink-50">
                  <MiniTrackMap
                    trackPoints={selectedRoute.trackData}
                    width={800}
                    height={260}
                    padding={32}
                    showMarkers={true}
                    colorByPace={false}
                    className="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <button
                    onClick={() => setSelectedRoute(null)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-soft hover:bg-white transition-all"
                  >
                    <X className="w-4.5 h-4.5 text-ink-600" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRoute(null);
                      setViewMode('map');
                      setHighlightedRouteId(selectedRoute.id);
                    }}
                    className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-soft hover:bg-white transition-all"
                  >
                    <ChevronLeft className="w-4.5 h-4.5 text-ink-600" />
                  </button>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-semibold',
                          selectedRoute.type === 'running'
                            ? 'bg-brand-500'
                            : 'bg-blue-500'
                        )}
                      >
                        {selectedRoute.type === 'running' ? (
                          <ActivityIcon className="w-3.5 h-3.5" />
                        ) : (
                          <Bike className="w-3.5 h-3.5" />
                        )}
                        {selectedRoute.type === 'running' ? '跑步路线' : '骑行路线'}
                      </div>
                      <div
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: getDifficultyColor(selectedRoute.difficulty).color }}
                      >
                        {getDifficultyColor(selectedRoute.difficulty).label}
                      </div>
                    </div>
                    <h2 className="text-white font-bold text-xl lg:text-2xl leading-tight drop-shadow-lg">
                      {selectedRoute.name}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-5 custom-scrollbar">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-2xl bg-brand-50/50 p-4 border border-brand-100/50">
                    <div className="flex items-center gap-1.5 text-brand-600 mb-1.5">
                      <Navigation className="w-4 h-4" strokeWidth={2.2} />
                      <span className="text-[10px] font-semibold uppercase tracking-wide">距离</span>
                    </div>
                    <p className="font-bold font-display text-xl text-ink-800">
                      {formatDistance(selectedRoute.distance, 1)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-teal-50/50 p-4 border border-teal-100/50">
                    <div className="flex items-center gap-1.5 text-teal-600 mb-1.5">
                      <Mountain className="w-4 h-4" strokeWidth={2.2} />
                      <span className="text-[10px] font-semibold uppercase tracking-wide">爬升</span>
                    </div>
                    <p className="font-bold font-display text-xl text-ink-800">
                      +{selectedRoute.elevationGain} m
                    </p>
                  </div>
                  <div className="rounded-2xl bg-purple-50/50 p-4 border border-purple-100/50">
                    <div className="flex items-center gap-1.5 text-purple-600 mb-1.5">
                      <Clock className="w-4 h-4" strokeWidth={2.2} />
                      <span className="text-[10px] font-semibold uppercase tracking-wide">预计时长</span>
                    </div>
                    <p className="font-bold font-display text-xl text-ink-800">
                      {formatDuration(selectedRoute.estimatedDuration, false)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-amber-50/50 p-4 border border-amber-100/50">
                    <div className="flex items-center gap-1.5 text-amber-600 mb-1.5">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-[10px] font-semibold uppercase tracking-wide">评分</span>
                    </div>
                    <p className="font-bold font-display text-xl text-ink-800">
                      {selectedRoute.rating.toFixed(1)}
                      <span className="text-xs font-normal text-ink-400 ml-1">
                        ({selectedRoute.reviewCount})
                      </span>
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="font-bold text-ink-800 text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-500" />
                    路线介绍
                  </h3>
                  <p className="text-sm text-ink-600 leading-relaxed">
                    {selectedRoute.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedRoute.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full bg-ink-50 text-xs font-medium text-ink-600 border border-ink-100"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Elevation Chart */}
                <div className="space-y-3">
                  <h3 className="font-bold text-ink-800 text-sm flex items-center gap-1.5">
                    <Mountain className="w-4 h-4 text-teal-500" />
                    海拔剖面
                  </h3>
                  <div className="rounded-2xl bg-ink-50 p-4 border border-ink-100">
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={createElevationData(selectedRoute.trackData)}>
                          <defs>
                            <linearGradient id="modalElevGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0D9488" stopOpacity={0.45} />
                              <stop offset="100%" stopColor="#5EEAD4" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
                          <XAxis
                            dataKey="label"
                            tick={{ fill: '#A3A3A3', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fill: '#A3A3A3', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `${v}m`}
                            width={40}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: '12px',
                              border: 'none',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                              fontSize: '12px',
                            }}
                            formatter={(value: number) => [`${value} m`, '海拔']}
                          />
                          <Area
                            type="monotone"
                            dataKey="elevation"
                            stroke="#0D9488"
                            strokeWidth={2}
                            fill="url(#modalElevGrad)"
                            isAnimationActive={true}
                            animationDuration={600}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Recent Completers */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-ink-800 text-sm flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-500" />
                      最近完成的跑友
                    </h3>
                    <span className="text-xs text-ink-400">
                      共 {selectedRoute.completionCount.toLocaleString()} 人完成
                    </span>
                  </div>
                  <div className="flex items-center gap-3 overflow-x-auto pb-1">
                    {recentCompleters.map((user, i) => (
                      <div
                        key={user.id}
                        className="flex-shrink-0 flex flex-col items-center gap-1.5"
                      >
                        <div className="relative">
                          <div
                            className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-teal-400 p-0.5"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          >
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-full h-full rounded-full object-cover border-2 border-white"
                            />
                          </div>
                          {i < 2 && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                              <span className="text-[8px] text-white font-bold">✓</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-ink-600 max-w-[50px] truncate">
                          {user.name}
                        </span>
                      </div>
                    ))}
                    <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                      <div className="w-12 h-12 rounded-full bg-ink-100 border-2 border-ink-50 flex items-center justify-center text-ink-500 font-bold text-sm">
                        +{Math.floor(selectedRoute.completionCount / 100)}
                      </div>
                      <span className="text-[10px] text-ink-400">更多</span>
                    </div>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="rounded-2xl bg-ink-50 p-4 border border-ink-100 flex items-center gap-3">
                  <img
                    src={selectedRoute.creator.avatar}
                    alt={selectedRoute.creator.name}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ink-400">路线创建者</p>
                    <p className="font-semibold text-ink-800 text-sm truncate">
                      {selectedRoute.creator.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-bold">{selectedRoute.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-[10px] text-ink-400">平均评分</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex-shrink-0 p-4 lg:p-5 border-t border-ink-100 bg-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleFavoriteRoute(selectedRoute.id)}
                    className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2',
                      selectedRoute.isFavorite
                        ? 'bg-red-50 border-red-200 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                        : 'bg-white border-ink-200 text-ink-500 hover:border-red-200 hover:text-red-500'
                    )}
                  >
                    <motion.div
                      animate={selectedRoute.isFavorite ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <Heart
                        className={cn(
                          'w-5 h-5',
                          selectedRoute.isFavorite && 'fill-current'
                        )}
                      />
                    </motion.div>
                  </button>
                  <button
                    onClick={() => handleShare(selectedRoute)}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border-2 border-ink-200 text-ink-500 hover:border-blue-200 hover:text-blue-500 transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleRunRoute(selectedRoute.id)}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    {selectedRoute.type === 'running' ? (
                      <ActivityIcon className="w-5 h-5" strokeWidth={2.5} />
                    ) : (
                      <Bike className="w-5 h-5" strokeWidth={2.5} />
                    )}
                    跑这条路线
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
