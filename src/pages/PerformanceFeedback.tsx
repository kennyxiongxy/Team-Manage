import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Star, Target, TrendingUp, ChevronDown, ChevronUp, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import { useSystemData } from '@/hooks/useSystemData';

interface PerformanceReview {
  id: string;
  quarter: string;
  overallScore: number;
  status: 'completed' | 'pending' | 'in-review';
  completedDate?: string;
  dimensions: { name: string; score: number; max: number; comment: string }[];
  managerComment: string;
  employeeReply: string;
  goals: string[];
}

const mockReviews: PerformanceReview[] = [
  {
    id: 'perf-001',
    quarter: '2024 Q2',
    overallScore: 85,
    status: 'completed',
    completedDate: '2024-07-10',
    dimensions: [
      { name: '任务完成质量', score: 88, max: 100, comment: '代码质量高，review通过率优秀' },
      { name: '团队协作', score: 82, max: 100, comment: '积极参与技术分享，跨组协作良好' },
      { name: '工作效率', score: 85, max: 100, comment: '按时交付率90%，偶有延期' },
      { name: '技术能力', score: 90, max: 100, comment: '前端架构设计能力提升明显' },
      { name: '主动性', score: 78, max: 100, comment: '建议更多主动承担核心模块' },
    ],
    managerComment: '本季度整体表现良好，技术能力有显著提升。建议下季度加强在项目前期需求分析阶段的参与度，提高对业务理解深度。',
    employeeReply: '感谢认可！我会在下个季度加强对业务逻辑的学习，争取更多参与核心模块的机会。',
    goals: ['主导完成Q3前端重构项目', '每月至少1次技术分享', '准时交付率达到95%以上'],
  },
  {
    id: 'perf-002',
    quarter: '2024 Q1',
    overallScore: 78,
    status: 'completed',
    completedDate: '2024-04-10',
    dimensions: [
      { name: '任务完成质量', score: 75, max: 100, comment: '基础扎实，但代码review偶有遗漏' },
      { name: '团队协作', score: 80, max: 100, comment: '沟通积极主动' },
      { name: '工作效率', score: 76, max: 100, comment: '初期适应期导致部分延期' },
      { name: '技术能力', score: 82, max: 100, comment: 'React生态掌握良好' },
      { name: '主动性', score: 72, max: 100, comment: '需要更多主动发现问题' },
    ],
    managerComment: '入职第一季度，整体适应良好。建议提升代码审查细致度，加强主动发现问题的意识。',
    employeeReply: '已收到反馈，会加强自测环节。',
    goals: ['独立负责一个完整功能模块', '通过前端架构师认证'],
  },
];

function ScoreBadge({ score }: { score: number }) {
  let color = '#EF4444';
  let label = '需改进';
  if (score >= 90) { color = '#22C55E'; label = '优秀'; }
  else if (score >= 80) { color = '#3B82F6'; label = '良好'; }
  else if (score >= 70) { color = '#F97316'; label = '合格'; }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: color + '20', color }}>
      {score}分 · {label}
    </span>
  );
}

function ReviewCard({ review }: { review: PerformanceReview }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div layout className="bg-muted rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Award size={24} className="text-amber-400" />
          </div>
          <div className="text-left">
            <h3 className="text-foreground font-semibold">{review.quarter} 绩效评估</h3>
            <div className="flex items-center gap-2 mt-1">
              <ScoreBadge score={review.overallScore} />
              {review.status === 'completed' && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-[#22C55E]" />
                  已完成 · {review.completedDate}
                </span>
              )}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
      </button>

      {/* Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border pt-4 space-y-5">
              {/* Dimensions */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Target size={16} className="text-primary" />
                  评估维度
                </h4>
                <div className="space-y-3">
                  {review.dimensions.map((d) => (
                    <div key={d.name} className="bg-card rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-foreground">{d.name}</span>
                        <span className="text-sm font-medium" style={{ color: d.score >= 80 ? '#22C55E' : d.score >= 70 ? '#F97316' : '#EF4444' }}>
                          {d.score}/{d.max}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(d.score / d.max) * 100}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: d.score >= 80 ? '#22C55E' : d.score >= 70 ? '#F97316' : '#EF4444' }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{d.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Star size={14} className="text-[#A855F7]" />
                    管理者评语
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.managerComment}</p>
                </div>
                <div className="bg-card rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <TrendingUp size={14} className="text-accent" />
                    我的回复
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.employeeReply}</p>
                </div>
              </div>

              {/* Goals */}
              <div className="bg-card rounded-lg p-4">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar size={14} className="text-[#22C55E]" />
                  下季度目标
                </h4>
                <div className="space-y-2">
                  {review.goals.map((goal, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] text-foreground">{i + 1}</span>
                      {goal}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PerformanceFeedback() {
  const { data: perfData } = useSystemData('performanceData');
  const reviews: PerformanceReview[] = perfData?.evaluations ?? [];

  if (!perfData) {
    return (
      <Layout>
        <div className="min-h-[100dvh] bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8">
        <PageHeader title="绩效反馈" subtitle="查看您的季度绩效评估与管理者反馈" />

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">最新季度评分</p>
            <p className="text-3xl font-bold text-[#22C55E]">{perfData!.latestScore}<span className="text-lg text-muted-foreground">/100</span></p>
          </div>
          <div className="bg-muted rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">评估次数</p>
            <p className="text-3xl font-bold text-foreground">{perfData!.totalAssessments}<span className="text-lg text-muted-foreground">次</span></p>
          </div>
          <div className="bg-muted rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">趋势</p>
            <p className="text-lg font-bold text-[#22C55E] flex items-center gap-1">
              <TrendingUp size={18} /> +{perfData!.scoreTrend}分
            </p>
            <p className="text-xs text-muted-foreground">较上季度提升</p>
          </div>
        </div>

        {/* Review List */}
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
