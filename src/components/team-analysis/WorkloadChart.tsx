import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { Sparkles, AlertTriangle, Play } from 'lucide-react';
import { workloadDistribution, aiRecommendations } from '@/data/mockData';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-muted border border-border rounded-lg p-3 shadow-lg">
      <p className="text-foreground font-semibold text-sm mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.dataKey === 'completed' ? '#22C55E' : p.dataKey === 'inProgress' ? '#3B82F6' : '#94A3B8' }}>
          {p.dataKey === 'completed' ? '已完成' : p.dataKey === 'inProgress' ? '进行中' : '待处理'}: {p.value}%
        </p>
      ))}
    </div>
  );
}

export default function WorkloadChart() {
  const overloadCount = workloadDistribution.filter((w) => w.overload).length;
  const lowLoadCount = workloadDistribution.filter((w) => {
    const total = w.completed + w.inProgress + w.pending;
    return total < 60;
  }).length;

  const resourceRecs = aiRecommendations.filter((r) => r.type === 'resource');

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left - Chart */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
        className="bg-muted rounded-xl p-5"
      >
        <h2 className="text-foreground text-lg font-semibold mb-1">当前负荷分布</h2>
        <p className="text-muted-foreground text-xs mb-4">堆叠柱状图：已完成 / 进行中 / 待处理</p>

        {workloadDistribution.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <p>暂无负荷数据</p>
            <p className="text-xs mt-1">连接飞书后可同步团队成员负荷分布</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={workloadDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="memberName"
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 150]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={100}
                stroke="#F97316"
                strokeDasharray="6 4"
                label={{ value: '100% 警戒线', fill: '#F97316', fontSize: 10, position: 'right' }}
              />
              <Bar dataKey="completed" stackId="a" fill="#22C55E" radius={[0, 0, 0, 0]} />
              <Bar dataKey="inProgress" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pending" stackId="a" radius={[4, 4, 0, 0]}>
                {workloadDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.overload ? '#EF4444' : '#94A3B8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded bg-[#EF4444]" />
            <span className="text-destructive font-semibold">超负荷成员：{overloadCount} 人</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded bg-primary" />
            <span className="text-primary font-semibold">低负荷成员：{lowLoadCount} 人</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <AlertTriangle className="w-3 h-3 text-[#F97316]" />
            <span className="text-[#F97316] font-semibold">负荷均衡度：--</span>
          </div>
        </div>
      </motion.div>

      {/* Right - AI Recommendations */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
        className="bg-muted rounded-xl p-5 border border-[rgba(168,85,247,0.2)] shadow-[0_0_20px_rgba(168,85,247,0.08)]"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#A855F7]" />
          <h2 className="text-foreground text-lg font-semibold">AI 资源调配建议</h2>
        </div>

        <div className="space-y-4">
          {resourceRecs.length === 0 && aiRecommendations.filter((r) => r.type !== 'resource').length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>暂无 AI 建议</p>
              <p className="text-xs mt-1">连接飞书并同步数据后可获取资源调配建议</p>
            </div>
          ) : (
            <>
              {resourceRecs.map((rec, index) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
                  className="border-b border-border last:border-0 pb-4 last:pb-0"
                >
                  <p className="text-foreground text-sm leading-relaxed">{rec.title}</p>
                  <p className="text-muted-foreground text-xs mt-1">{rec.dataSupport}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => toast.success('人员调配指令已发送')}
                      className="flex items-center gap-1 bg-gradient-to-r from-[#A855F7] to-[#3B82F6] text-primary-foreground text-xs px-3 py-1.5 rounded-md hover:brightness-110 transition-all"
                    >
                      <Play className="w-3 h-3" /> 执行调配
                    </button>
                    <button
                      onClick={() => toast.info('功能开发中，敬请期待', { duration: 2000 })}
                      className="text-muted-foreground text-xs px-3 py-1.5 rounded-md hover:bg-muted transition-all"
                    >
                      查看详情
                    </button>
                  </div>
                </motion.div>
              ))}

              {aiRecommendations.filter((r) => r.type !== 'resource').slice(0, 3).map((rec, index) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: (index + resourceRecs.length) * 0.1 + 0.2 }}
                  className="border-b border-border last:border-0 pb-4 last:pb-0"
                >
                  <p className="text-foreground text-sm leading-relaxed">{rec.title}</p>
                  <p className="text-muted-foreground text-xs mt-1">{rec.dataSupport}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => toast.success('方案已生成并发送到您的飞书')}
                      className="text-muted-foreground text-xs px-3 py-1.5 rounded-md hover:bg-muted transition-all"
                    >
                      {rec.action}
                    </button>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => toast.success('人员调配指令已发送')}
          className="w-full mt-5 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground bg-gradient-to-r from-[#A855F7] via-[#3B82F6] to-[#06B6D4] hover:brightness-110 transition-all"
          style={{ backgroundSize: '200% 200%' }}
        >
          一键执行所有可行调配
        </motion.button>
      </motion.div>
    </section>
  );
}
