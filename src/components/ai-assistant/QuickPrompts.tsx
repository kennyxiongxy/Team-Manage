import { motion } from 'framer-motion';
import { BarChart3, Users, AlertTriangle, Target } from 'lucide-react';
import { quickPrompts } from '@/data/mockData';

const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

const promptIcons = [BarChart3, Users, AlertTriangle, Target];

interface QuickPromptsProps {
  onPromptClick?: (prompt: string) => void;
}

export default function QuickPrompts({ onPromptClick }: QuickPromptsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {quickPrompts.map((prompt, index) => {
        const Icon = promptIcons[index % promptIcons.length];
        return (
          <motion.button
            key={prompt}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05, ease }}
            whileHover={{ scale: 1.03, borderColor: '#06B6D4' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onPromptClick?.(prompt)}
            className="flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-accent"
          >
            <Icon className="h-3.5 w-3.5" />
            {prompt}
          </motion.button>
        );
      })}
    </div>
  );
}
