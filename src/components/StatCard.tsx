import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  gradientFrom?: string;
  gradientTo?: string;
  delay?: number;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel = '较上周',
  gradientFrom = 'from-brand-500',
  gradientTo = 'to-brand-600',
  delay = 0,
}: StatCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined) return null;
    if (trend > 0) return <TrendingUp className="h-3.5 w-3.5" />;
    if (trend < 0) return <TrendingDown className="h-3.5 w-3.5" />;
    return <Minus className="h-3.5 w-3.5" />;
  };

  const getTrendColor = () => {
    if (trend === undefined) return '';
    if (trend > 0) return 'text-emerald-600 bg-emerald-50';
    if (trend < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-soft border border-ink-100 group"
    >
      <div
        className={cn(
          'absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 bg-gradient-to-br',
          gradientFrom,
          gradientTo
        )}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              'flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br shadow-lg',
              gradientFrom,
              gradientTo
            )}
          >
            <div className="text-white">{icon}</div>
          </div>

          {trend !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
                getTrendColor()
              )}
            >
              {getTrendIcon()}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-ink-500">{title}</p>
          <p
            className={cn(
              'text-2xl font-bold tracking-tight bg-gradient-to-r bg-clip-text text-transparent',
              gradientFrom,
              gradientTo
            )}
          >
            {value}
          </p>
          {trend !== undefined && (
            <p className="text-xs text-ink-400">{trendLabel}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
