import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/context/UserRoleContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ChatInterface from '@/components/ai-assistant/ChatInterface';
import AiDecisionLog from '@/components/ai-assistant/AiDecisionLog';
import AiCapabilitySwitches from '@/components/ai-assistant/AiCapabilitySwitches';
import QuickPrompts from '@/components/ai-assistant/QuickPrompts';
import PageHeader from '@/components/PageHeader';
import { X, ChevronRight, Bot, Brain, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '@/api/client';
import type { ChatMessage, RiskProject, EfficiencyDimension, ManagementSuggestion } from '@/data/mockData';
import type { TeamContext } from '@/types/memory';
import { useSystemData } from '@/hooks/useSystemData';
import { cn } from '@/lib/utils';
import Layout from '@/components/Layout';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  decisionLogs,
  aiCapabilities,
  arTeamMembers,
  riskProjects as _mockRiskProjects,
  efficiencyRadarData as _mockEfficiencyRadarData,
  managementSuggestions as _mockManagementSuggestions,
} from '@/data/mockData';

// Module-level data refs (populated by DataLoader)
let initialChatMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'ai',
    content: '👋 你好，我是陈总。在这个团队里做了十几年管理，从一线销售一路带到了 VP。\n\n团队的事就是我的事。你可以问我：\n• 项目进度怎么样？有什么风险？\n• 谁最近比较忙？需要调配人手吗？\n• 给我一个本周的总结\n• 有什么管理上的建议？\n\n数据我随时在看，你直接问。',
    timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    actions: [
      { label: '查看任务概览', action: 'view-tasks' },
      { label: '分析团队效率', action: 'view-efficiency' },
    ],
  },
];
let riskProjects: RiskProject[] = _mockRiskProjects;
let efficiencyRadarData: EfficiencyDimension[] = _mockEfficiencyRadarData;
let managementSuggestions: ManagementSuggestion[] = _mockManagementSuggestions;
let aiEffectiveness: any = { adoptionRate: 0, overdueReduction: 0, decisionTimeReduction: 0, weeklyAdoption: [], completionRateImprovement: [] };
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts';

const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number];


// ─── Team Memory Panel ───
function TeamMemoryPanel() {
  const [facts, setFacts] = useState<TeamContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchFacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: TeamContext[] }>('/api/ai/context');
      if (res.success) setFacts(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFacts();
  }, [fetchFacts]);

  const dismissFact = async (id: number) => {
    try {
      await api.delete(`/api/ai/context/${id}`);
      setFacts(prev => prev.filter(f => f.id !== id));
      toast.success('已忽略');
    } catch {
      toast.error('操作失败');
    }
  };

  const categoryColors: Record<string, string> = {
    personnel: 'border-l-[#A855F7] bg-[rgba(168,85,247,0.06)]',
    project: 'border-l-[#3B82F6] bg-[rgba(59,130,246,0.06)]',
    constraint: 'border-l-[#F97316] bg-[rgba(249,115,22,0.06)]',
    preference: 'border-l-[#22C55E] bg-[rgba(34,197,94,0.06)]',
    decision: 'border-l-accent bg-accent/5',
  };

  const categoryLabels: Record<string, string> = {
    personnel: '人事',
    project: '项目',
    constraint: '约束',
    preference: '偏好',
    decision: '决策',
  };

  if (facts.length === 0 && !loading) return null;

  return (
    <div className="rounded-2xl bg-muted border border-border p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-[#A855F7]" />
          <span className="text-sm font-semibold text-foreground">AI 记忆</span>
          <span className="rounded-full bg-[rgba(168,85,247,0.15)] px-1.5 py-0.5 text-[10px] font-mono text-[#A855F7]">
            {facts.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); fetchFacts(); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); fetchFacts(); } }}
            className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="刷新"
          >
            <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
          </span>
          <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-3 space-y-2 overflow-hidden"
        >
          {loading && facts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">加载中...</p>
          ) : (
            facts.map(fact => (
              <div
                key={fact.id}
                className={cn(
                  'rounded-lg border-l-2 px-3 py-2 text-xs',
                  categoryColors[fact.category] || 'border-l-muted bg-muted/30'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {categoryLabels[fact.category] || fact.category}
                    </span>
                    <p className="mt-0.5 text-foreground leading-relaxed">{fact.content}</p>
                    {fact.confidence < 0.6 && (
                      <span className="mt-1 inline-block text-[10px] text-[#F97316]">⚠️ 待确认</span>
                    )}
                  </div>
                  <button
                    onClick={() => dismissFact(fact.id)}
                    className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                    title="忽略"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
          {facts.length === 0 && !loading && (
            <p className="text-xs text-muted-foreground py-2">
              暂无记忆。在和 AI 对话时提到关键信息（如人员变动、重要决策），AI 会自动记录。
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── AI Report Cards ───
function DataLoader() {
  const { data: chat } = useSystemData('initialChatMessages');
  const { data: risk } = useSystemData('riskProjects');
  const { data: radar } = useSystemData('efficiencyRadarData');
  const { data: suggestions } = useSystemData('managementSuggestions');
  const { data: effectiveness } = useSystemData('aiEffectiveness');

  // 优先使用 API 数据，为空时回退到 mockData
  // 修复：API 返回的 \n 是字面字符串，需转为真正的换行符
  if (chat && (Array.isArray(chat) ? chat.length > 0 : true)) {
    initialChatMessages = chat.map((msg: any) => ({
      ...msg,
      content: typeof msg.content === 'string' ? msg.content.replace(/\\n/g, '\n') : msg.content,
    }));
  }
  if (risk && (Array.isArray(risk) ? risk.length > 0 : false)) {
    riskProjects = risk;
  }
  if (radar && (Array.isArray(radar) ? radar.length > 0 : false)) {
    efficiencyRadarData = radar;
  }
  if (suggestions && (Array.isArray(suggestions) ? suggestions.length > 0 : false)) {
    managementSuggestions = suggestions;
  }
  if (effectiveness) aiEffectiveness = effectiveness;
  return null;
}

function RiskReportCard() {
  return (
    <motion.div
      id="risk-report-section"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.15, ease }}
      whileHover={{ y: -2 }}
      className="rounded-2xl bg-muted border border-border border-l-[3px] border-l-destructive p-6 transition-shadow hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">⚠️</span>
        <h3 className="text-base font-semibold text-foreground">项目风险预警</h3>
      </div>
      <p className="text-2xl font-bold text-destructive font-mono mb-4">
        {riskProjects.length} 个项目存在风险
      </p>
      <div className="space-y-3">
        {riskProjects.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-xs">
            <p>暂无项目风险数据</p>
            <p className="mt-1">连接飞书后可同步项目风险评估</p>
          </div>
        ) : (
          riskProjects.map((project) => (
            <div
              key={project.name}
              className="rounded-lg bg-card p-3 border border-border"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{project.name}</span>
                <span className="text-xs font-mono text-destructive font-bold">{project.lag}</span>
              </div>
              <p className="text-xs text-muted-foreground">{project.issue}</p>
            </div>
          ))
        )}
      </div>
      <button
        onClick={() => {
          const el = document.getElementById('risk-report-section');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        className="mt-4 text-sm text-accent hover:underline flex items-center gap-1"
      >
        查看完整风险评估 →
      </button>
    </motion.div>
  );
}

function EfficiencyReportCard() {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3, ease }}
      whileHover={{ y: -2 }}
      className="rounded-2xl bg-muted border border-border border-l-[3px] border-l-primary p-6 transition-shadow hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">👥</span>
        <h3 className="text-base font-semibold text-foreground">人员效率分析</h3>
      </div>

      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={efficiencyRadarData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 10 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 9 }} />
            <Radar
              name="团队"
              dataKey="A"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2">
        {efficiencyRadarData.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-xs">
            <p>暂无人员效率数据</p>
            <p className="mt-1">连接飞书后可同步团队效率分析</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-lg bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] px-3 py-2">
              <span className="text-xs text-[#22C55E] font-medium">⭐ 本周之星</span>
              <span className="text-xs text-foreground">
                {aiEffectiveness.weeklyAdoption?.length > 0
                  ? aiEffectiveness.weeklyAdoption[aiEffectiveness.weeklyAdoption.length - 1]?.name || '暂无'
                  : arTeamMembers.length > 0
                    ? arTeamMembers.sort((a: any, b: any) => (b.tasksCompleted || 0) - (a.tasksCompleted || 0))[0]?.name || '暂无'
                    : '暂无数据'}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)] px-3 py-2">
              <span className="text-xs text-[#F97316] font-medium">⚠️ 需关注</span>
              <span className="text-xs text-foreground">
                {aiEffectiveness.overdueReduction > 0
                  ? `${aiEffectiveness.overdueReduction} 项逾期需处理`
                  : riskProjects.length > 0
                    ? `${riskProjects.length} 个项目存在风险`
                    : '暂无异常'}
              </span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function SuggestionsReportCard() {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.45, ease }}
      whileHover={{ y: -2 }}
      className={cn(
        'relative rounded-2xl bg-muted p-6 transition-shadow hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)] overflow-hidden'
      )}
      style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #1E293B 100%)',
        padding: '23px',
      }}
    >
      {/* Animated gradient border */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #A855F7 0%, #3B82F6 50%, #06B6D4 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradient-shift 3s ease infinite',
          padding: '2px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
        }}
      />

      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🎯</span>
        <h3 className="text-base font-semibold text-foreground">下周管理建议</h3>
      </div>

      <div className="space-y-2.5">
        {managementSuggestions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-xs">
            <p>暂无管理建议</p>
            <p className="mt-1">连接飞书后可基于数据生成 AI 建议</p>
          </div>
        ) : (
          managementSuggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1, ease }}
              className="flex items-start gap-2.5"
            >
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  suggestion.priority === 'high'
                    ? 'bg-[#EF4444] text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {suggestion.id}
              </span>
              <p className="text-sm text-foreground leading-relaxed">{suggestion.text}</p>
            </motion.div>
          ))
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={async (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          const suggestions = managementSuggestions;
          console.log('[AdoptAll] suggestions count:', suggestions?.length);
          if (!suggestions || suggestions.length === 0) {
            toast.info('暂无建议可采纳');
            return;
          }
          const highPriority = suggestions.filter((s: ManagementSuggestion) => s.priority === 'high');
          console.log('[AdoptAll] highPriority count:', highPriority.length);
          if (highPriority.length === 0) {
            toast.info('没有高优先级建议需要采纳');
            return;
          }
          toast.info(`正在创建 ${highPriority.length} 条任务...`);
          try {
            const results = await Promise.allSettled(
              highPriority.map((s: ManagementSuggestion) => {
                const today = new Date();
                const dueDate = new Date(today);
                dueDate.setDate(dueDate.getDate() + 7);
                const formatDate = (d: Date) => d.toISOString().split('T')[0];
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                return api.post('/api/tasks', {
                  title: s.text.slice(0, 40),
                  description: s.text,
                  priority: 'high',
                  status: 'not-started',
                  assigneeId: user.id || null,
                  start_date: formatDate(today),
                  due_date: formatDate(dueDate),
                });
              })
            );
            const successCount = results.filter((r: any) => r.status === 'fulfilled').length;
            const failCount = results.filter((r: any) => r.status === 'rejected').length;
            console.log('[AdoptAll] success:', successCount, 'fail:', failCount);
            if (successCount > 0) {
              toast.success(`已创建 ${successCount} 条高优先级任务`);
              window.dispatchEvent(new CustomEvent('task-created'));
            } else if (failCount > 0) {
              toast.error(`创建失败: ${results[0].status === 'rejected' ? (results[0] as any).reason?.message || '未知错误' : '请重试'}`);
            }
          } catch (e: any) {
            console.error('[AdoptAll] error:', e);
            toast.error('创建任务失败: ' + (e?.message || '请重试'));
          }
        }}
        style={{ position: 'relative', zIndex: 20 }}
        className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#A855F7] to-[#3B82F6] py-2.5 text-sm font-medium text-primary-foreground transition-shadow hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] cursor-pointer"
        data-testid="adopt-all-btn"
      >
        一键采纳全部建议
      </motion.button>
    </motion.div>
  );
}

// ─── AI Settings Modal Button ───
function AiSettingsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl bg-muted border border-border p-4 text-left hover:border-accent/30 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(168,85,247,0.15)]">
              <Bot className="h-5 w-5 text-[#A855F7]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">AI 自动化设置</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {aiCapabilities.filter((c: any) => c.enabled).length}/{aiCapabilities.length} 项已启用
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">AI 自动化设置</h2>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5">
                <AiCapabilitySwitches />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── AI Stats Mini Charts ───
function AiStatsPanel() {
  return (
    <div className="rounded-2xl bg-muted border border-border p-5">
      <h2 className="text-lg font-semibold text-foreground mb-4">AI 介入效果</h2>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="text-center">
          <p className="text-2xl font-bold text-accent font-mono">{aiEffectiveness.adoptionRate}%</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">建议采纳率</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[#22C55E] font-mono">-{aiEffectiveness.overdueReduction}%</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">逾期率降低</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[#A855F7] font-mono">-{aiEffectiveness.decisionTimeReduction}%</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">决策时间缩短</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">近4周建议采纳率</p>
          <div className="h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aiEffectiveness.weeklyAdoption} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="rate" fill="#A855F7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1.5">任务完成率提升</p>
          <div className="h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aiEffectiveness.completionRateImprovement}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[50, 100]} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '11px',
                  }}
                />
                <Line type="monotone" dataKey="before" name="干预前" stroke="#94A3B8" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="after" name="干预后" stroke="#06B6D4" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AI 智能回复引擎 ───
async function generateAiResponse(
  userContent: string,
  sessionId: string,
): Promise<{ content: string; actions: { label: string; action: string }[] }> {
  // 收集系统上下文数据
  let taskCount = 0, inProgressCount = 0, projectCount = 0, userCount = 0, overdueCount = 0;
  let recentTasks: string[] = [];
  let recentProjects: string[] = [];

  try {
    const [tasksRes, projectsRes, usersRes, statsRes] = await Promise.all([
      api.get<{ success: boolean; data: any[] }>('/api/tasks'),
      api.get<{ success: boolean; data: any[] }>('/api/projects'),
      api.get<{ success: boolean; data: any[] }>('/api/users'),
      api.get<{ success: boolean; data: { total: number; overdue: number } }>('/api/tasks/stats/overview'),
    ]);
    if (tasksRes.success) {
      const tasks = tasksRes.data;
      taskCount = tasks.length;
      inProgressCount = tasks.filter((t: any) => t.status === 'in-progress').length;
      recentTasks = tasks.filter((t: any) => t.status === 'in-progress').slice(0, 10).map(
        (t: any) => `${t.title}（进度 ${t.progress}%${t.assignee_name ? ', 负责人: ' + t.assignee_name : ''}）`
      );
    }
    if (projectsRes.success) {
      projectCount = projectsRes.data.length;
      recentProjects = projectsRes.data.slice(0, 7).map(
        (p: any) => `${p.name}（负责人: ${p.owner_name || '未分配'}, 健康度: ${p.health_score ?? 'N/A'}, 进度: ${p.progress ?? 0}%）`
      );
    }
    if (usersRes.success) userCount = usersRes.data.length;
    if (statsRes.success) overdueCount = statsRes.data.overdue;
  } catch { /* 保持默认值 */ }

  const context = { taskCount, inProgressCount, overdueCount, projectCount, userCount, recentTasks, recentProjects };

  // 调用后端 AI 接口
  try {
    const aiRes = await api.post<{ success: boolean; data: { reply: string; model?: string; sessionId?: string; memoryFacts?: number } }>(
      '/api/ai/chat',
      { message: userContent, context, sessionId }
    );
    if (aiRes.success) {
      return {
        content: aiRes.data.reply,
        actions: [
          { label: '查看任务中心', action: 'view-tasks' },
          { label: '查看团队概况', action: 'view-overview' },
        ],
      };
    }
  } catch { /* AI 接口失败时走后端规则引擎回退 */ }

  // 最终回退
  return {
    content: `👋 您好！我是统御 AI 助手。\\n\\n当前系统：${taskCount} 项任务 | ${projectCount} 个项目 | ${userCount} 人团队 | ${overdueCount} 项逾期\\n\\n（AI 暂时连不上，这是基础数据，你先看着）`,
    actions: [
      { label: '查看任务中心', action: 'view-tasks' },
      { label: '查看团队概况', action: 'view-overview' },
    ],
  };
}
// ─── Main Page ───
export default function AiAssistant() {
  const navigate = useNavigate();
  const sessionIdRef = useRef<string>(`session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);

  const handleActionClick = useCallback(async (action: string) => {
    // 导航类动作
    const navigationMap: Record<string, string> = {
      'view-tasks': '/tasks',
      'view-projects': '/',
      'view-efficiency': '/',
      'view-employees': '/employees',
      'view-weekly': '/reports',
      'view-overview': '/',
      'view-feishu': '/feishu',
    };

    if (navigationMap[action]) {
      navigate(navigationMap[action]);
      return;
    }

    // 快捷指令
    if (action === 'quick-prompts') {
      toast.info('请在下方快捷指令中选择您想了解的内容');
      return;
    }

    // 一键提醒逾期
    if (action === 'remind-overdue') {
      toast.info('正在获取逾期任务...');
      try {
        const [statsRes, tasksRes] = await Promise.all([
          api.get<{ success: boolean; data: { total: number; overdue: number } }>('/api/tasks/stats/overview'),
          api.get<{ success: boolean; data: any[] }>('/api/tasks'),
        ]);
        const overdueCount = statsRes.success ? statsRes.data.overdue : 0;
        const allTasks = tasksRes.success ? tasksRes.data : [];
        const overdueTasks = allTasks.filter((t: any) => {
          if (t.status === 'overdue') return true;
          if (t.due_date && t.status !== 'completed' && new Date(t.due_date) < new Date()) return true;
          return false;
        });

        if (overdueTasks.length > 0) {
          const taskLines = overdueTasks.slice(0, 8).map((t: any, i: number) =>
            (i + 1) + '. ' + t.title + '（负责人: ' + (t.assignee_name || '未分配') + ', 截止: ' + (t.due_date || '未知') + '）'
          ).join('\\n');

          const aiMsg: ChatMessage = {
            id: 'ai-remind-' + Date.now(),
            role: 'ai',
            content: '⚠️ 逾期任务提醒\\n\\n当前共有 ' + overdueTasks.length + ' 项逾期任务：\\n\\n' + taskLines + '\\n\\n📌 系统建议：\\n1. 立即通知相关责任人确认进度\\n2. 评估是否可调整 deadline\\n3. 对于关键路径任务，建议升级处理\\n\\n💡 可在任务中心查看详情并手动推动。',
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            actions: [
              { label: '查看任务中心', action: 'view-tasks' },
              { label: '生成追赶计划', action: 'generate-plan' },
            ],
          };
          setMessages(prev => [...prev, aiMsg]);
        } else {
          const aiMsg: ChatMessage = {
            id: 'ai-remind-' + Date.now(),
            role: 'ai',
            content: '✅ 好消息！当前没有逾期任务，团队执行状况良好。',
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, aiMsg]);
        }
      } catch (e) {
        toast.error('获取逾期任务失败');
      }
      return;
    }

    // 生成追赶计划
    if (action === 'generate-plan') {
      toast.info('正在基于实际数据生成追赶计划...');
      try {
        const [tasksRes, projectsRes] = await Promise.all([
          api.get<{ success: boolean; data: any[] }>('/api/tasks'),
          api.get<{ success: boolean; data: any[] }>('/api/projects'),
        ]);
        const overdue = tasksRes.success ? tasksRes.data.filter((t: any) => t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date()) : [];
        const planLines = overdue.length > 0
          ? overdue.slice(0, 5).map((t: any, i: number) => (i + 1) + '. ' + t.title + ' —— 建议责任人更新进度或申请延期').join('\\n')
          : '当前所有任务进度正常，无需追赶计划。';

        const aiMsg: ChatMessage = {
          id: 'ai-plan-' + Date.now(),
          role: 'ai',
          content: '📋 追赶计划\\n\\n基于当前 ' + (tasksRes.success ? tasksRes.data.length : 0) + ' 项任务分析：\\n\\n' + planLines + '\\n\\n建议立即召开站会，明确每项逾期任务的下一步动作。',
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          actions: [
            { label: '查看任务中心', action: 'view-tasks' },
          ],
        };
        setMessages(prev => [...prev, aiMsg]);
      } catch {
        toast.error('生成追赶计划失败');
      }
      return;
    }

    // 导出 PDF
    if (action === 'export-pdf') {
      toast.info('PDF 导出功能开发中，敬请期待');
      return;
    }

    // 调整资源
    if (action === 'adjust-resource') {
      navigate('/employees');
      toast.info('请在员工管理页面调整任务分配');
      return;
    }

    // 未知 action
    toast.info('正在执行: ' + action);
  }, [navigate]);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    const aiReply = await generateAiResponse(content, sessionIdRef.current);

    const aiResponse: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'ai',
      content: aiReply.content,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      actions: aiReply.actions,
    };
    setTimeout(() => {
      setMessages((prev) => [...prev, aiResponse]);
    }, 1200);
  }, []);

  const handleQuickPrompt = useCallback(
    (prompt: string) => {
      toast.info('AI 正在分析...');
      handleSendMessage(prompt);
    },
    [handleSendMessage]
  );

  return (
    <Layout>
      <DataLoader />
      {/* Add CSS for gradient animation */}
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader title="AI 智能助手" />

        {/* ─── Structured Report Cards (moved to top) ─── */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <RiskReportCard />
          <EfficiencyReportCard />
          <SuggestionsReportCard />
        </div>

        {/* ─── Header ─── */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease }}
          className="mb-6 rounded-2xl bg-card border border-border p-5 sm:p-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">AI 智能助手</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                基于团队数据为您提供实时分析与决策建议
              </p>
            </div>

            {/* Right: AI Status */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2, ease }}
              className="rounded-xl bg-muted px-4 py-3 flex items-center gap-4"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
                </span>
                <span className="text-sm font-medium text-[#22C55E]">AI 在线</span>
              </div>
              <div className="h-4 w-px bg-muted" />
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  已分析 <span className="font-mono font-bold text-accent">156</span> 条任务
                </span>
                <span>
                  生成 <span className="font-mono font-bold text-accent">42</span> 条建议
                </span>
                <span>
                  介入 <span className="font-mono font-bold text-accent">23</span> 次决策
                </span>
              </div>
            </motion.div>
          </div>

          {/* Quick Prompts */}
          <div className="mt-4 pt-4 border-t border-border">
            <QuickPrompts onPromptClick={handleQuickPrompt} />
          </div>
        </motion.div>

        {/* ─── Main Content: Chat + Insights ─── */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Chat (55%) */}
          <div className="flex-1 lg:max-w-[55%]">
            <ChatInterface messages={messages} onSendMessage={handleSendMessage} onActionClick={handleActionClick} />
          </div>

          {/* Right: Insights Panel (45%) */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3, ease }}
            className="flex-1 lg:max-w-[45%] space-y-5"
          >
            <AiDecisionLog />
            <TeamMemoryPanel />
            <AiSettingsButton />
            <AiStatsPanel />
          </motion.div>
        </div>

      </div>
    </Layout>
  );
}
