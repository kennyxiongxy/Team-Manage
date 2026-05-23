import { db } from '../src/utils/db';

const systemData: Record<string, any> = {
  // ─── 首页仪表盘数据 ───
  mockKpis: [],
  mockAiInsights: [],
  mockActivities: [],
  mockDailyCompletionData: [],
  mockMorningBriefPoints: [],
  mockWeeklyReport: { completed: 0, new: 0, overdue: 0, aiInterventions: 0, summary: '' },
  mockWeeklySuggestions: [],

  // ─── 工作台数据 ───
  currentUser: { name: '', role: '', avatar: '', department: '', level: '' },

  personalStats: {
    completedThisWeek: 0, completedLastWeek: 0, onTimeRate: 0,
    avgTaskDuration: '', collaborationIndex: 0,
    completed: 0, remaining: 0, weekCompletion: 0, overdue: 0,
  },

  todayTasks: [],
  yesterdayTasks: [],
  tomorrowTasks: [],

  taskOverview: {
    total: 0, completed: 0, inProgress: 0, overdue: 0, highPriority: 0, pending: 0, dueToday: 0,
    categories: [],
  },

  aiReminders: [],
  teamActivities: [],
  wsTeamMembers: [],

  dailyReportData: {
    date: '',
    summary: '',
    achievements: [],
    blockers: '',
    tomorrowPlan: [],
    aiSuggestions: [],
    submitted: false, support: '',
    completedTasks: [],
  },

  // ─── AI 助手数据 ───
  arTeamMembers: [],

  initialChatMessages: [
    {
      id: 'welcome',
      role: 'ai',
      content: '👋 您好！我是您的 AI 管理助手「统御」。\\n\\n当前系统中有 30 项任务、7 个项目、8 名团队成员。\\n\\n我可以帮您分析以下内容：\\n• 📊 项目进度与风险\\n• 👥 人员效率与负荷\\n• 📋 任务分配与跟踪\\n• 📈 周报日报生成\\n• 💡 管理建议与优化\\n\\n请告诉我您想了解什么，我会为您深入分析团队数据。',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { label: '查看任务概览', action: 'view-tasks' },
        { label: '分析团队效率', action: 'view-efficiency' },
      ],
    },
  ],
  quickPrompts: [],
  decisionLogs: [],

  aiCapabilities: [
    { id: 'cap-1', name: '智能任务分配', description: '基于负荷和技能自动推荐任务分配', enabled: false },
    { id: 'cap-2', name: '风险预测', description: '提前 48 小时预警潜在延期风险', enabled: false },
    { id: 'cap-3', name: '日报生成', description: '自动汇总成员日报内容', enabled: false },
    { id: 'cap-4', name: '效率优化', description: '分析工作模式，给出效率提升建议', enabled: false },
    { id: 'cap-5', name: '智能排期', description: '根据任务依赖和资源自动排期', enabled: false },
    { id: 'cap-6', name: '代码质量预警', description: '监控代码提交质量，提前发现隐患', enabled: false },
  ],

  aiEffectiveness: {
    adoptionRate: 0, overdueReduction: 0, decisionTimeReduction: 0,
    weeklyAdoption: [],
    completionRateImprovement: [],
  },

  riskProjects: [],
  efficiencyRadarData: [],
  managementSuggestions: [],

  // ─── 报告数据 ───
  dailyReports: [],

  dailySummary: { completedTasks: 0, completedChange: 0, inProgressTasks: 0, inProgressChange: 0, newOverdue: 0, aiGeneratedReports: 0 },

  dailyAiSummary: [],

  weeklySummary: {
    week: '', period: '', completedTasks: 0, activeProjects: 0, overdueTasks: 0, teamLoadAvg: 0,
    highlights: [],
    concerns: [],
    totalCompleted: 0, weekNumber: 0, dateRange: '',
    summary: '',
    generatedAt: '', status: '',
    completionStats: { completed: 0, total: 0, overdue: 0, inProgress: 0, pendingReview: 0 },
  },

  weeklyKpis: [],

  dailyTrendData: [],

  projectProgressData: [],

  weeklyMemberStats: [],

  weeklyAiAnalysis: {
    taskAnalysis: '',
    peopleAnalysis: '',
    suggestions: [],
    risks: [],
  },

  weeklyHistoryData: [],

  // ─── 团队分析数据 ───
  taTeamMembers: [],
  taProjects: [],
  taWorkloadData: [],
  taTrendData: [],

  mockProjects: [],

  exportFormats: [
    { id: 'pdf', name: 'PDF 报告', extension: '.pdf', description: '适合打印和邮件发送' },
    { id: 'excel', name: 'Excel 表格', extension: '.xlsx', description: '包含所有原始数据' },
    { id: 'ppt', name: 'PPT 演示', extension: '.pptx', description: '适合会议汇报' },
    { id: 'markdown', name: 'Markdown', extension: '.md', description: '适合文档系统导入' },
  ],

  // ─── 绩效评估数据 ───
  performanceData: {
    latestScore: 0, totalAssessments: 0, scoreTrend: 0,
    evaluations: [],
  },

  // ─── 飞书数据 ───
  feishuConfig: { appId: '', appSecret: '', webhookUrl: '', connected: false, connectedAt: null },

  feishuUsers: [],

  feishuTables: [],

  feishuSyncConfig: { autoSync: false, syncInterval: 10, syncDirection: 'bidirectional', conflictStrategy: 'manual' },

  feishuFieldMapping: [],
};

export default systemData;
