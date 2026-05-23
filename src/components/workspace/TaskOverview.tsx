import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Play, AlertCircle } from 'lucide-react';
import { taskOverview } from '@/data/mockData';

const cards = [
  {
    label: '进行中',
    count: taskOverview.inProgress,
    icon: Play,
    color: '#3B82F6',
    bgColor: 'rgba(59,130,246,0.15)',
  },
  {
    label: '待开始',
    count: taskOverview.pending,
    icon: Clock,
    color: '#94A3B8',
    bgColor: 'rgba(148,163,184,0.15)',
  },
  {
    label: '今日截止',
    count: taskOverview.dueToday,
    icon: AlertCircle,
    color: '#F97316',
    bgColor: 'rgba(249,115,22,0.15)',
  },
];

export default function TaskOverview() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.4,
        delay: 0.08,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
      }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.4,
              delay: 0.08 + index * 0.08,
              ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
            }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            onClick={() => navigate('/tasks')}
            className="cursor-pointer rounded-xl bg-muted p-5 transition-shadow duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: card.bgColor }}
              >
                <Icon className="h-4.5 w-4.5" style={{ color: card.color }} />
              </div>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  delay: 0.3 + index * 0.1,
                }}
                className="text-2xl font-extrabold"
                style={{
                  color: card.color,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {card.count}
              </motion.span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
            {/* Mini progress bar */}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-card">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(card.count / 4) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: card.color }}
              />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
