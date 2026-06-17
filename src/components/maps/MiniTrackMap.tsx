import { useMemo } from 'react';
import type { TrackPoint } from '@/types';
import { getPaceColor } from '@/utils/colors';

interface MiniTrackMapProps {
  trackPoints: TrackPoint[];
  width?: number;
  height?: number;
  padding?: number;
  showMarkers?: boolean;
  colorByPace?: boolean;
  className?: string;
}

export function MiniTrackMap({
  trackPoints,
  width = 320,
  height = 180,
  padding = 16,
  showMarkers = true,
  colorByPace = true,
  className = '',
}: MiniTrackMapProps) {
  const { svgPaths, bounds } = useMemo(() => {
    if (!trackPoints || trackPoints.length < 2) {
      return {
        svgPaths: [],
        bounds: { minX: 0, minY: 0, maxX: width, maxY: height },
      };
    }

    const lats = trackPoints.map((p) => p.latitude);
    const lngs = trackPoints.map((p) => p.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;

    const aspectRatio = lngRange / latRange;
    const containerRatio = (width - padding * 2) / (height - padding * 2);

    let drawWidth: number;
    let drawHeight: number;
    let offsetX: number;
    let offsetY: number;

    if (aspectRatio > containerRatio) {
      drawWidth = width - padding * 2;
      drawHeight = drawWidth / aspectRatio;
      offsetX = padding;
      offsetY = padding + ((height - padding * 2) - drawHeight) / 2;
    } else {
      drawHeight = height - padding * 2;
      drawWidth = drawHeight * aspectRatio;
      offsetX = padding + ((width - padding * 2) - drawWidth) / 2;
      offsetY = padding;
    }

    const project = (lat: number, lng: number): [number, number] => {
      const x = offsetX + ((lng - minLng) / lngRange) * drawWidth;
      const y = offsetY + drawHeight - ((lat - minLat) / latRange) * drawHeight;
      return [x, y];
    };

    const paths: Array<{ path: string; color: string }> = [];

    if (colorByPace) {
      for (let i = 0; i < trackPoints.length - 1; i++) {
        const p1 = trackPoints[i];
        const p2 = trackPoints[i + 1];
        const [x1, y1] = project(p1.latitude, p1.longitude);
        const [x2, y2] = project(p2.latitude, p2.longitude);

        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        if (distance < 0.5) continue;

        const timeDiff = (p2.timestamp - p1.timestamp) / 1000;
        const geoDistance =
          Math.sqrt(
            ((p2.latitude - p1.latitude) * 111000) ** 2 +
              ((p2.longitude - p1.longitude) * 111000 * Math.cos((p1.latitude * Math.PI) / 180)) ** 2
          ) / 1000;

        let pace = 360;
        if (geoDistance > 0 && timeDiff > 0) {
          pace = timeDiff / geoDistance;
        }

        const { color } = getPaceColor(pace);
        paths.push({
          path: `M ${x1} ${y1} L ${x2} ${y2}`,
          color,
        });
      }
    } else {
      const points: string[] = [];
      for (const p of trackPoints) {
        const [x, y] = project(p.latitude, p.longitude);
        points.push(`${x} ${y}`);
      }
      paths.push({
        path: `M ${points.join(' L ')}`,
        color: '#FF6B35',
      });
    }

    const firstPoint = project(trackPoints[0].latitude, trackPoints[0].longitude);
    const lastPoint = project(
      trackPoints[trackPoints.length - 1].latitude,
      trackPoints[trackPoints.length - 1].longitude
    );

    return {
      svgPaths: paths,
      bounds: {
        minX: firstPoint[0],
        minY: firstPoint[1],
        maxX: lastPoint[0],
        maxY: lastPoint[1],
      },
    };
  }, [trackPoints, width, height, padding, colorByPace]);

  if (!trackPoints || trackPoints.length < 2) {
    return (
      <div
        className={`flex items-center justify-center bg-ink-50 rounded-2xl border border-ink-100 ${className}`}
        style={{ width, height }}
      >
        <div className="text-ink-400 text-sm">暂无轨迹数据</div>
      </div>
    );
  }

  const startX = bounds.minX;
  const startY = bounds.minY;
  const endX = bounds.maxX;
  const endY = bounds.maxY;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`rounded-2xl ${className}`}
      style={{ background: 'linear-gradient(180deg, #F0FDFA 0%, #CCFBF1 100%)' }}
    >
      <defs>
        <filter id="miniTrackGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="startMarker" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#16A34A" />
        </radialGradient>
        <radialGradient id="endMarker" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </radialGradient>
      </defs>

      <g filter="url(#miniTrackGlow)">
        {svgPaths.map((seg, i) => (
          <path
            key={i}
            d={seg.path}
            stroke={seg.color}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.95}
          />
        ))}
      </g>

      {showMarkers && (
        <>
          <circle cx={startX} cy={startY} r={10} fill="#22C55E" opacity={0.2} />
          <circle cx={startX} cy={startY} r={6} fill="url(#startMarker)" stroke="#fff" strokeWidth={2} />

          <circle cx={endX} cy={endY} r={10} fill="#EF4444" opacity={0.2} />
          <circle cx={endX} cy={endY} r={6} fill="url(#endMarker)" stroke="#fff" strokeWidth={2} />
        </>
      )}
    </svg>
  );
}
