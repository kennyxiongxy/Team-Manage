import { memo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Target } from 'lucide-react';
import type { AiInsight } from '@/data/mockData';

interface AiInsightCardProps {
  insight: AiInsight;
  index?: number;
}

const typeConfig = {
  risk: { color: '#EF4444', icon: AlertTriangle, borderClass: 'border-l-destructive' },
  suggestion: { color: '#3B82F6', icon: TrendingUp, borderClass: 'border-l-primary' },
  'ai-generated': { color: '#A855F7', icon: Target, borderClass: 'border-l-[#A855F7]' },
};

const AiInsightCard = memo(function AiInsightCard({ insight, index = 0 }: AiInsightCardProps) {
  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1 + 0.3,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
      }}
      className="flex gap-3 py-3 border-l-[3px] pl-3"
      style={{ borderLeftColor: config.color }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: `${config.color}26` }}
      >
        <Icon size={12} style={{ color: config.color }} />
      </div>
      <div>
        <h4 className="text-body font-semibold text-foreground">{insight.title}</h4>
        <p className="text-body text-muted-foreground mt-0.5 leading-relaxed">{insight.description}</p>
      </div>
    </motion.div>
  );
});

export default AiInsightCard;
