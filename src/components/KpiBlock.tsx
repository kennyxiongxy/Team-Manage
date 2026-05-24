import { memo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, FolderOpen, AlertCircle, BarChart3, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiBlockProps {
  label: string;
  value: number;
  unit?: string;
  trend: number;
  trendLabel: string;
  color: string;
  icon: string;
  sparkline: number[];
  index?: number;
  onClick?: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  'clipboard-list': ClipboardList,
  'folder-open': FolderOpen,
  'alert-circle': AlertCircle,
  'bar-chart-3': BarChart3,
  'sparkles': Sparkles,
};

const KpiBlock = memo(function KpiBlock({
  label,
  value,
  unit = '',
  trend,
  trendLabel,
  color,
  icon,
  sparkline,
  index = 0,
  onClick,
}: KpiBlockProps) {
  const Icon = iconMap[icon] || BarChart3;
  const isPositive = trend > 0;
  const isNeutral = trend === 0;

  // Handle edge cases: empty or single-element sparkline to avoid NaN
  const safeSparkline = sparkline && sparkline.length > 1 ? sparkline : sparkline && sparkline.length === 1 ? [sparkline[0], sparkline[0]] : [0, 0];
  const len = safeSparkline.length;
  const minSpark = Math.min(...safeSparkline);
  const maxSpark = Math.max(...safeSparkline);
  const range = maxSpark - minSpark || 1;
  const sparkPoints = safeSparkline.map((v, i) => {
    const x = (i / (len - 1)) * 60;
    const y = 20 - ((v - minSpark) / range) * 16;
    if (isNaN(x) || isNaN(y)) return null;
    return `${x},${y}`;
  }).filter(Boolean).join(' ');

  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const trendColor = isNeutral ? '#94A3B8' : color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08 + 0.2,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
      }}
      whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
      onClick={onClick}
      className="bg-muted rounded-xl p-5 cursor-pointer transition-shadow relative overflow-hidden min-w-[180px]"
    >
      {/* Icon */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}26` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-caption text-muted-foreground font-medium">{label}</span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1 mb-2">
        <span
          className="text-display-xl font-data font-extrabold"
          style={{ color }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-h3 font-data font-bold" style={{ color }}>
            {unit}
          </span>
        )}
      </div>

      {/* Trend */}
      <div className="flex items-center gap-1">
        <TrendIcon size={14} style={{ color: trendColor }} />
        <span className="text-caption font-medium" style={{ color: trendColor }}>
          {isNeutral ? '' : isPositive ? '+' : ''}{trend}
        </span>
        <span className="text-caption text-muted-foreground">{trendLabel}</span>
      </div>

      {/* Sparkline */}
      <svg
        className="absolute bottom-3 right-3 opacity-30"
        width="64"
        height="24"
        viewBox="0 0 64 24"
      >
        <polyline
          points={sparkPoints}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
});

export default KpiBlock;
