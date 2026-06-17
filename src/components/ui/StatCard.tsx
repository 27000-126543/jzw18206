import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ColorScheme = 'brand' | 'teal' | 'blue' | 'purple';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: string | number;
  trendUp?: boolean;
  colorScheme?: ColorScheme;
}

const colorSchemeConfig: Record<
  ColorScheme,
  {
    gradient: string;
    glow: string;
    text: string;
    trendUp: string;
    trendDown: string;
  }
> = {
  brand: {
    gradient: 'from-brand-500 to-brand-600',
    glow: 'shadow-brand-glow',
    text: 'text-brand-500',
    trendUp: 'text-emerald-500',
    trendDown: 'text-red-500',
  },
  teal: {
    gradient: 'from-teal-500 to-teal-400',
    glow: 'shadow-teal-glow',
    text: 'text-teal-500',
    trendUp: 'text-emerald-500',
    trendDown: 'text-red-500',
  },
  blue: {
    gradient: 'from-blue-500 to-blue-400',
    glow: 'shadow-[0_0_40px_rgba(59,130,246,0.3)]',
    text: 'text-blue-500',
    trendUp: 'text-emerald-500',
    trendDown: 'text-red-500',
  },
  purple: {
    gradient: 'from-purple-500 to-purple-400',
    glow: 'shadow-[0_0_40px_rgba(139,92,246,0.3)]',
    text: 'text-purple-500',
    trendUp: 'text-emerald-500',
    trendDown: 'text-red-500',
  },
};

export function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendUp = true,
  colorScheme = 'brand',
}: StatCardProps) {
  const config = colorSchemeConfig[colorScheme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'glass rounded-3xl p-6 shadow-glass hover:shadow-card-hover',
        'transition-all duration-300 ease-out'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <motion.span
              key={String(value)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'text-3xl font-bold font-display tracking-tight',
                config.text
              )}
            >
              {value}
            </motion.span>
            {unit && (
              <span className="text-sm font-medium text-ink-400">{unit}</span>
            )}
          </div>

          {trend !== undefined && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex items-center gap-1 mt-2"
            >
              <motion.span
                animate={
                  trendUp
                    ? { y: [0, -3, 0] }
                    : { y: [0, 3, 0] }
                }
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className={cn(
                  'inline-flex items-center justify-center',
                  trendUp ? config.trendUp : config.trendDown
                )}
              >
                {trendUp ? (
                  <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                ) : (
                  <ArrowDown className="w-4 h-4" strokeWidth={2.5} />
                )}
              </motion.span>
              <span
                className={cn(
                  'text-sm font-semibold',
                  trendUp ? config.trendUp : config.trendDown
                )}
              >
                {trend}
              </span>
              <span className="text-xs text-ink-400 ml-0.5">较上周</span>
            </motion.div>
          )}
        </div>

        <motion.div
          whileHover={{ scale: 1.05, rotate: 3 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          className={cn(
            'relative flex-shrink-0 w-14 h-14 rounded-2xl',
            'bg-gradient-to-br',
            config.gradient,
            config.glow,
            'flex items-center justify-center'
          )}
        >
          <div className="absolute inset-0 rounded-2xl bg-white/15" />
          <Icon className="relative w-7 h-7 text-white" strokeWidth={2} />
        </motion.div>
      </div>
    </motion.div>
  );
}
