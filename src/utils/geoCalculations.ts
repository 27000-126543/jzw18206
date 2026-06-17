import type { TrackPoint } from '../types';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function calculateDistance(point1: TrackPoint, point2: TrackPoint): number {
  if (!point1 || !point2) {
    return 0;
  }

  const lat1 = toRadians(point1.latitude);
  const lat2 = toRadians(point2.latitude);
  const deltaLat = toRadians(point2.latitude - point1.latitude);
  const deltaLng = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

export function calculateTotalDistance(points: TrackPoint[]): number {
  if (!points || points.length < 2) {
    return 0;
  }

  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateDistance(points[i - 1], points[i]);
  }

  return totalDistance;
}

export function calculateElevationGain(points: TrackPoint[]): {
  gain: number;
  loss: number;
  min: number;
  max: number;
} {
  if (!points || points.length === 0) {
    return { gain: 0, loss: 0, min: 0, max: 0 };
  }

  let gain = 0;
  let loss = 0;
  let minElevation = Infinity;
  let maxElevation = -Infinity;

  for (let i = 0; i < points.length; i++) {
    const elevation = points[i].elevation;

    if (elevation !== undefined && elevation !== null) {
      if (elevation < minElevation) {
        minElevation = elevation;
      }
      if (elevation > maxElevation) {
        maxElevation = elevation;
      }

      if (i > 0) {
        const prevElevation = points[i - 1].elevation;
        if (prevElevation !== undefined && prevElevation !== null) {
          const diff = elevation - prevElevation;
          if (diff > 0) {
            gain += diff;
          } else if (diff < 0) {
            loss += Math.abs(diff);
          }
        }
      }
    }
  }

  if (minElevation === Infinity) {
    minElevation = 0;
  }
  if (maxElevation === -Infinity) {
    maxElevation = 0;
  }

  return { gain, loss, min: minElevation, max: maxElevation };
}

export function calculatePaceFromPoints(points: TrackPoint[]): number {
  if (!points || points.length < 2) {
    return 0;
  }

  const totalDistance = calculateTotalDistance(points);
  if (totalDistance <= 0) {
    return 0;
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  let duration = 0;
  if (
    firstPoint.timestamp !== undefined &&
    firstPoint.timestamp !== null &&
    lastPoint.timestamp !== undefined &&
    lastPoint.timestamp !== null
  ) {
    duration = (lastPoint.timestamp - firstPoint.timestamp) / 1000;
  }

  if (duration <= 0) {
    return 0;
  }

  const distanceKm = totalDistance / 1000;
  return duration / distanceKm;
}

export function simplifyTrack(
  points: TrackPoint[],
  toleranceMeters: number = 5
): TrackPoint[] {
  if (!points || points.length <= 2) {
    return points || [];
  }

  function perpendicularDistance(
    point: TrackPoint,
    lineStart: TrackPoint,
    lineEnd: TrackPoint
  ): number {
    const lineDistance = calculateDistance(lineStart, lineEnd);
    if (lineDistance === 0) {
      return calculateDistance(point, lineStart);
    }

    const d1 = calculateDistance(point, lineStart);
    const d2 = calculateDistance(point, lineEnd);

    const s = (d1 + d2 + lineDistance) / 2;
    const area = Math.sqrt(Math.abs(s * (s - d1) * (s - d2) * (s - lineDistance)));
    return (2 * area) / lineDistance;
  }

  function douglasPeucker(
    pts: TrackPoint[],
    tolerance: number
  ): TrackPoint[] {
    if (pts.length <= 2) {
      return pts;
    }

    let maxDist = 0;
    let maxIndex = 0;
    const end = pts.length - 1;

    for (let i = 1; i < end; i++) {
      const dist = perpendicularDistance(pts[i], pts[0], pts[end]);
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }

    if (maxDist > tolerance) {
      const left = douglasPeucker(pts.slice(0, maxIndex + 1), tolerance);
      const right = douglasPeucker(pts.slice(maxIndex), tolerance);
      return left.slice(0, -1).concat(right);
    }

    return [pts[0], pts[end]];
  }

  return douglasPeucker(points, toleranceMeters);
}

export function calculateSpeed(point1: TrackPoint, point2: TrackPoint): number {
  const distance = calculateDistance(point1, point2);

  let timeDiff = 0;
  if (
    point1.timestamp !== undefined &&
    point1.timestamp !== null &&
    point2.timestamp !== undefined &&
    point2.timestamp !== null
  ) {
    timeDiff = (point2.timestamp - point1.timestamp) / 1000;
  }

  if (timeDiff <= 0) {
    return 0;
  }

  return (distance / 1000) / (timeDiff / 3600);
}
