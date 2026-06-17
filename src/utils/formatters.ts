import { format } from 'date-fns';
import type { Activity } from '../types';

export function formatDistance(meters: number, decimals: number = 2): string {
  if (!isFinite(meters) || meters < 0) {
    return '0.00 km';
  }
  const kilometers = meters / 1000;
  if (kilometers < 1) {
    return `${meters.toFixed(0)} m`;
  }
  return `${kilometers.toFixed(decimals)} km`;
}

export function formatDuration(seconds: number, showHours: boolean = true): string {
  if (!isFinite(seconds) || seconds < 0) {
    return showHours ? '00:00:00' : '00:00';
  }
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const pad = (n: number): string => n.toString().padStart(2, '0');

  if (showHours || hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
}

export function formatPace(secondsPerKm: number): string {
  if (!isFinite(secondsPerKm) || secondsPerKm <= 0 || secondsPerKm === Infinity) {
    return '--:-- /km';
  }
  const totalSeconds = Math.floor(secondsPerKm);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number): string => n.toString().padStart(2, '0');

  return `${pad(minutes)}:${pad(seconds)} /km`;
}

export function formatCalories(calories: number, decimals: number = 0): string {
  if (!isFinite(calories) || calories < 0) {
    return '0 kcal';
  }
  if (calories >= 1000) {
    return `${(calories / 1000).toFixed(1)} kcal`;
  }
  return `${calories.toFixed(decimals)} kcal`;
}

export function formatDate(
  date: Date | number | string,
  pattern: string = 'yyyy-MM-dd HH:mm'
): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, pattern);
  } catch {
    return '-';
  }
}

export function calculateActivityCalories(activity: Activity, weightKg: number = 70): number {
  const durationHours = activity.duration / 3600;
  const avgSpeedKmH = activity.distance > 0 ? (activity.distance / 1000) / durationHours : 0;

  let met = 1.0;
  if (avgSpeedKmH < 4) {
    met = 2.5;
  } else if (avgSpeedKmH < 6) {
    met = 3.5;
  } else if (avgSpeedKmH < 8) {
    met = 5.0;
  } else if (avgSpeedKmH < 10) {
    met = 8.3;
  } else if (avgSpeedKmH < 12) {
    met = 9.8;
  } else if (avgSpeedKmH < 14) {
    met = 11.0;
  } else if (avgSpeedKmH < 16) {
    met = 11.8;
  } else {
    met = 12.8;
  }

  return Math.round(met * weightKg * durationHours);
}
