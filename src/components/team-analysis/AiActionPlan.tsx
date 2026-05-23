import { toast } from 'sonner';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, BarChart3, Settings, Sprout, ChevronDown, ChevronUp, Zap, ArrowRight } from 'lucide-react';
import { actionPlans } from '@/data/mockData';

const fadeUp = {
  initial: { opacity: 0, y: 25 },
  animate: { opacity: 1, y: 0 },
};

const iconMap = {
  users: Users,
  chart: BarChart3,
  settings: Settings,
  sprout: Sprout,
};

const colorMap: Record<string, string> = {
  '#3B82F6': 'border-l-primary',
  '#F97316': 'border-l-[#F97316]',
  '#06B6D4': 'border-l-[#06B6D4]',
  '#A855F7': 'border-l-[#A855F7]',
};

export default function AiActionPlan() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="space-y-6">
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        <h2 className="text-foreground text-2xl font-bold mb-1">下周管理行动计划</h2>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-24 bg-gradient-to-r from-[#A855F7] via-[#3B82F6] to-[#06B6D4] rounded-full" />
          <span className="text-muted-foreground text-xs">AI 基于数据分析生成</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actionPlans.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
            <p>暂无行动计划</p>
            <p className="text-xs mt-1">连接飞书并同步数据后可生成 AI 管理行动计划</p>
          </div>
        ) : (
          actionPlans.map((plan, index) => {
          const Icon = iconMap[plan.icon as keyof typeof iconMap];
          const isExpanded = expandedId === plan.id;
          return (
            <motion.div
              key={plan.id}
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.4, delay: index * 0.12, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
              className={`bg-muted rounded-xl p-6 border-l-[3px] ${colorMap[plan.color]} hover:-translate-y-[2px] hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-all duration-200 cursor-pointer`}
              onClick={() => setExpandedId(isExpanded ? null : plan.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: plan.color + '20' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: plan.color }} />
                  </div>
                  <h3 className="text-foreground font-semibold text-base">{plan.title}</h3>
                </div>
                <div className="text-muted-foreground">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {plan.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Zap className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: plan.color }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-border space-y-2">
                      <p className="text-xs text-muted-foreground">
                        建议执行时间: 数据同步后生成
                      </p>
                      <p className="text-xs text-muted-foreground">
                        预期效果: 数据同步后生成
                      </p>
                      <p className="text-xs text-muted-foreground">
                        涉及人员: 数据同步后生成
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                className="mt-4 flex items-center gap-1 text-sm font-medium transition-all hover:gap-2"
                style={{ color: plan.color }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.hash = '#/employees';
                }}
              >
                {plan.button} <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          );
        }))}
      </div>
    </section>
  );
}
