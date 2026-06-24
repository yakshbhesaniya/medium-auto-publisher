'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  change?: number; // percentage change vs last period
  icon: React.ComponentType<{ className?: string }>;
  color?: 'violet' | 'purple' | 'green' | 'blue' | 'orange' | 'red';
  prefix?: string;
  suffix?: string;
  loading?: boolean;
}

const colorMap = {
  violet: {
    icon: 'from-violet-600 to-violet-500',
    glow: 'rgba(124,58,237,0.3)',
    text: 'text-violet-400',
    bg: 'rgba(124,58,237,0.1)',
  },
  purple: {
    icon: 'from-purple-600 to-purple-500',
    glow: 'rgba(168,85,247,0.3)',
    text: 'text-purple-400',
    bg: 'rgba(168,85,247,0.1)',
  },
  green: {
    icon: 'from-green-600 to-emerald-500',
    glow: 'rgba(34,197,94,0.3)',
    text: 'text-green-400',
    bg: 'rgba(34,197,94,0.1)',
  },
  blue: {
    icon: 'from-blue-600 to-blue-500',
    glow: 'rgba(59,130,246,0.3)',
    text: 'text-blue-400',
    bg: 'rgba(59,130,246,0.1)',
  },
  orange: {
    icon: 'from-orange-600 to-amber-500',
    glow: 'rgba(249,115,22,0.3)',
    text: 'text-orange-400',
    bg: 'rgba(249,115,22,0.1)',
  },
  red: {
    icon: 'from-red-600 to-rose-500',
    glow: 'rgba(239,68,68,0.3)',
    text: 'text-red-400',
    bg: 'rgba(239,68,68,0.1)',
  },
};

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color = 'violet',
  prefix = '',
  suffix = '',
  loading = false,
}: StatsCardProps) {
  const colors = colorMap[color];
  const numericValue = typeof value === 'number' ? value : 0;
  const displayCount = useCountUp(numericValue);
  const isPositive = (change ?? 0) >= 0;

  if (loading) {
    return (
      <div className="glass-card p-5 rounded-2xl">
        <div className="skeleton h-4 w-24 mb-4 rounded" />
        <div className="skeleton h-8 w-32 mb-3 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-5 rounded-2xl group cursor-default"
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-zinc-400 font-medium">{title}</p>
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br',
            colors.icon,
            'group-hover:scale-110 transition-transform duration-300'
          )}
          style={{ boxShadow: `0 4px 15px ${colors.glow}` }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="mb-2">
        <p className="text-3xl font-bold text-white">
          {prefix}
          {typeof value === 'number' ? displayCount.toLocaleString() : value}
          {suffix}
        </p>
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              'flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium',
              isPositive
                ? 'bg-green-500/15 text-green-400'
                : 'bg-red-500/15 text-red-400'
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(change)}%
          </div>
          <span className="text-xs text-zinc-500">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}
