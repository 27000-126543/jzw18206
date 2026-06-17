import {
  DEFAULT_PACE_ZONES,
  DEFAULT_HEART_RATE_ZONES,
  DIFFICULTY_CONFIG,
} from '../types';
import type {
  PaceZone,
  HeartRateZoneConfig,
  DifficultyLevel,
} from '../types';

export function getPaceColor(
  secondsPerKm: number,
  zones: PaceZone[] = DEFAULT_PACE_ZONES
): { color: string; zone: PaceZone | null } {
  if (!isFinite(secondsPerKm) || secondsPerKm <= 0) {
    return { color: '#9ca3af', zone: null };
  }

  for (const zone of zones) {
    if (secondsPerKm >= zone.minPace && secondsPerKm < zone.maxPace) {
      return { color: zone.color, zone };
    }
  }

  const lastZone = zones[zones.length - 1];
  return { color: lastZone?.color || '#9ca3af', zone: lastZone || null };
}

export function getHeartRateZone(
  heartRate: number,
  zones: HeartRateZoneConfig[] = DEFAULT_HEART_RATE_ZONES
): { color: string; zone: HeartRateZoneConfig | null } {
  if (!isFinite(heartRate) || heartRate <= 0) {
    return { color: '#9ca3af', zone: null };
  }

  for (const zone of zones) {
    if (heartRate >= zone.minRate && heartRate < zone.maxRate) {
      return { color: zone.color, zone };
    }
  }

  const lastZone = zones[zones.length - 1];
  return { color: lastZone?.color || '#9ca3af', zone: lastZone || null };
}

export function getDifficultyColor(
  difficulty: DifficultyLevel | string
): { color: string; label: string } {
  const key = difficulty as DifficultyLevel;
  const config = DIFFICULTY_CONFIG[key];

  if (config) {
    return { color: config.color, label: config.label };
  }

  return { color: '#9ca3af', label: '未知' };
}

export function getDifficultyFromDistance(
  distanceMeters: number
): DifficultyLevel {
  if (!isFinite(distanceMeters) || distanceMeters < 0) {
    return 'easy';
  }

  if (distanceMeters >= DIFFICULTY_CONFIG.expert.minDistance) {
    return 'expert';
  }
  if (distanceMeters >= DIFFICULTY_CONFIG.hard.minDistance) {
    return 'hard';
  }
  if (distanceMeters >= DIFFICULTY_CONFIG.moderate.minDistance) {
    return 'moderate';
  }
  return 'easy';
}

export function interpolateColor(
  color1: string,
  color2: string,
  factor: number
): string {
  const hex = (x: string): string => {
    const num = parseInt(x, 16);
    return num.toString(16).padStart(2, '0');
  };

  const f = Math.max(0, Math.min(1, factor));

  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * f);
  const g = Math.round(g1 + (g2 - g1) * f);
  const b = Math.round(b1 + (b2 - b1) * f);

  return `#${hex(r.toString(16))}${hex(g.toString(16))}${hex(b.toString(16))}`;
}
