import { toast } from 'sonner';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import type { AiCapability } from '@/data/mockData';
import { aiCapabilities as initialCapabilities } from '@/data/mockData';
import { cn } from '@/lib/utils';

const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

function ToggleSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={cn(
        'relative h-5 w-9 rounded-full transition-colors duration-200',
        enabled ? 'bg-[#A855F7]' : 'bg-muted'
      )}
    >
      <motion.div
        className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow"
        animate={{ x: enabled ? 14 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export default function AiCapabilitySwitches() {
  const [capabilities, setCapabilities] = useState<AiCapability[]>(initialCapabilities);

  const toggleCapability = (id: string) => {
    const cap = capabilities.find((c) => c.id === id);
    const nextEnabled = !cap?.enabled;
    setCapabilities((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
    toast.success(`${nextEnabled ? '已开启' : '已关闭'} ${cap?.name} 功能`);
  };

  return (
    <div className="rounded-2xl bg-muted border border-border p-5">
      <h2 className="text-lg font-semibold text-foreground mb-4">AI 自动化设置</h2>

      <div className="space-y-3">
        {capabilities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>暂无自动化功能配置</p>
            <p className="text-xs mt-1">连接飞书后可配置 AI 自动化功能</p>
          </div>
        ) : (
          capabilities.map((cap, index) => (
            <motion.div
              key={cap.id}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05, ease }}
              className="group flex items-start justify-between gap-3 rounded-xl p-3 transition-colors hover:bg-muted/20"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{cap.name}</span>
                  <div className="relative">
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100 z-20">
                      <div className="rounded-lg bg-background border border-border px-3 py-2 text-xs text-muted-foreground whitespace-nowrap shadow-modal">
                        {cap.description}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{cap.description}</p>
              </div>
              <ToggleSwitch
                enabled={cap.enabled}
                onChange={() => toggleCapability(cap.id)}
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
