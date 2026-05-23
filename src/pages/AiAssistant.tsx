import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ChatInterface from '@/components/ai-assistant/ChatInterface';
import AiDecisionLog from '@/components/ai-assistant/AiDecisionLog';
import AiCapabilitySwitches from '@/components/ai-assistant/AiCapabilitySwitches';
import QuickPrompts from '@/components/ai-assistant/QuickPrompts';
import PageHeader from '@/components/PageHeader';
import type { ChatMessage, RiskProject, EfficiencyDimension, ManagementSuggestion } from '@/data/mockData';
import { useSystemData } from '@/hooks/useSystemData';
import { cn } from '@/lib/utils';
import { decisionLogs, aiCapabilities, arTeamMembers } from '@/data/mockData';

// Module-level data refs (populated by DataLoader)
let initialChatMessages: ChatMessage[] = [];
let riskProjects: RiskProject[] = [];
let efficiencyRadarData: EfficiencyDimension[] = [];
let managementSuggestions: ManagementSuggestion[] = [];
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

// ─── AI Report Cards ───
function DataLoader() {
  const { data: chat } = useSystemData('initialChatMessages');
  const { data: risk } = useSystemData('riskProjects');
  const { data: radar } = useSystemData('efficiencyRadarData');
  const { data: suggestions } = useSystemData('managementSuggestions');
  const { data: effectiveness } = useSystemData('aiEffectiveness');
  if (chat) initialChatMessages = chat;
  if (risk) riskProjects = risk;
  if (radar) efficiencyRadarData = radar;
  if (suggestions) managementSuggestions = suggestions;
  if (effectiveness) aiEffectiveness = effectiveness;
  return null;
}

function RiskReportCard() {
  return (
    <motion.div
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
      <button className="mt-4 text-sm text-accent hover:underline flex items-center gap-1">
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
              <span className="text-xs text-foreground">数据加载中...</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)] px-3 py-2">
              <span className="text-xs text-[#F97316] font-medium">⚠️ 需关注</span>
              <span className="text-xs text-foreground">数据加载中...</span>
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
        className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#A855F7] to-[#3B82F6] py-2.5 text-sm font-medium text-primary-foreground transition-shadow hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
      >
        一键采纳全部建议
      </motion.button>
    </motion.div>
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
function generateAiResponse(userContent: string): { content: string; actions: { label: string; action: string }[] } {
  const text = userContent.toLowerCase();

  // 1. 项目进度/风险查询
  if (text.includes('进度') || text.includes('风险') || text.includes('滞后') || text.includes('逾期') || text.includes('延期')) {
    return {
      content: `📊 项目风险分析\n\n暂无项目数据。\n\n请先连接飞书多维表格，同步项目信息后再进行风险分析。`,
      actions: [
        { label: '查看项目看板', action: 'view-projects' },
        { label: '生成追赶计划', action: 'generate-plan' },
      ],
    };
  }

  // 2. 人员/负载查询
  if (text.includes('谁') || text.includes('人员') || text.includes('负荷') || text.includes('负载') || text.includes('忙') || text.includes('闲') || text.includes('效率')) {
    return {
      content: `👥 团队人员效率分析\n\n暂无人员数据。\n\n请先连接飞书多维表格，同步团队人员信息后再进行效率分析。`,
      actions: [
        { label: '查看效率矩阵', action: 'view-efficiency' },
        { label: '执行人员调配', action: 'adjust-resource' },
      ],
    };
  }

  // 3. 任务相关查询
  if (text.includes('任务') || text.includes('完成') || text.includes('今日') || text.includes('今天') || text.includes('todo') || text.includes('待办')) {
    return {
      content: `📋 今日任务概览\n\n暂无任务数据。\n\n请先连接飞书多维表格，同步任务信息后再查看任务概览。`,
      actions: [
        { label: '查看任务中心', action: 'view-tasks' },
        { label: '一键提醒逾期', action: 'remind-overdue' },
      ],
    };
  }

  // 4. 周报/日报
  if (text.includes('周报') || text.includes('日报') || text.includes('报告') || text.includes('总结')) {
    return {
      content: `📊 本周总结报告\n\n暂无周报数据。\n\n请先连接飞书多维表格，同步任务和日报信息后再生成周报。`,
      actions: [
        { label: '查看完整周报', action: 'view-weekly' },
        { label: '导出 PDF', action: 'export-pdf' },
      ],
    };
  }

  // 5. 建议/优化
  if (text.includes('建议') || text.includes('优化') || text.includes('怎么做') || text.includes('怎么办') || text.includes('如何')) {
    return {
      content: `💡 AI 管理建议\n\n暂无团队数据，无法生成针对性建议。\n\n请先连接飞书多维表格，同步任务、项目和人员信息后再获取 AI 管理建议。`,
      actions: [
        { label: '生成执行方案', action: 'generate-plan' },
        { label: '添加到日历', action: 'add-calendar' },
      ],
    };
  }

  // 默认回复
  return {
    content: `👋 您好！我是您的 AI 管理助手「统御」。\n\n我可以帮您分析以下内容：\n• 📊 项目进度与风险\n• 👥 人员效率与负荷\n• 📋 任务分配与跟踪\n• 📈 周报日报生成\n• 💡 管理建议与优化\n\n您可以这样提问：\n「谁现在最闲？」\n「项目进度怎么样？」\n「给我本周的总结」\n「有什么建议？」\n\n请告诉我您想了解什么，我会为您深入分析团队数据。`,
    actions: [
      { label: '查看快速指令', action: 'quick-prompts' },
      { label: '查看团队概况', action: 'view-overview' },
    ],
  };
}

// ─── Main Page ───
export default function AiAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);

  const handleSendMessage = useCallback((content: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };

    const aiReply = generateAiResponse(content);

    const aiResponse: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'ai',
      content: aiReply.content,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      actions: aiReply.actions,
    };

    setMessages((prev) => [...prev, userMsg]);
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
    <div className="min-h-[100dvh] bg-background">
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
            <ChatInterface messages={messages} onSendMessage={handleSendMessage} />
          </div>

          {/* Right: Insights Panel (45%) */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3, ease }}
            className="flex-1 lg:max-w-[45%] space-y-5"
          >
            <AiDecisionLog />
            <AiCapabilitySwitches />
            <AiStatsPanel />
          </motion.div>
        </div>

        {/* ─── Structured Report Cards ─── */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <RiskReportCard />
          <EfficiencyReportCard />
          <SuggestionsReportCard />
        </div>
      </div>
    </div>
  );
}
