import { toast } from 'sonner';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw, Download, ChevronDown, Info,
} from 'lucide-react';
import EfficiencyMatrix from '@/components/team-analysis/EfficiencyMatrix';
import ProjectHealthCards from '@/components/team-analysis/ProjectHealthCards';
import WorkloadChart from '@/components/team-analysis/WorkloadChart';
import CollaborationNetwork from '@/components/team-analysis/CollaborationNetwork';
import TrendCharts from '@/components/team-analysis/TrendCharts';
import AiActionPlan from '@/components/team-analysis/AiActionPlan';
import PageHeader from '@/components/PageHeader';
import { kpiData } from '@/data/mockData';
import Layout from '@/components/Layout';

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp = {
  initial: { opacity: 0, y: 25 },
  animate: { opacity: 1, y: 0 },
};

function KpiBlock({ kpi, index }: { kpi: typeof kpiData[0]; index: number }) {
  const isPositive = kpi.trend > 0;
  const isGood = kpi.label === '平均任务耗时' ? !isPositive : isPositive;

  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
      }}
      className="bg-muted rounded-xl p-5 hover:-translate-y-[2px] hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-all duration-200 group cursor-pointer min-w-[180px] flex-1"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{kpi.label}</span>
        <div className="relative">
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>

      <div className="text-foreground text-3xl font-extrabold font-mono tracking-tight mb-2">
        {kpi.value}
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold font-mono ${isGood ? 'text-[#22C55E]' : 'text-destructive'}`}>
          {isPositive ? '+' : ''}{kpi.trendLabel}
        </span>
        {/* Mini sparkline */}
        <div className="flex-1 h-6">
          <svg width="100%" height="24" viewBox={`0 0 ${kpi.sparkline.length * 10} 24`} preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke={isGood ? '#22C55E' : '#EF4444'}
              strokeWidth="2"
              points={kpi.sparkline.map((v, i) => `${i * 10},${24 - ((v - Math.min(...kpi.sparkline)) / (Math.max(...kpi.sparkline) - Math.min(...kpi.sparkline))) * 20}`).join(' ')}
            />
          </svg>
        </div>
      </div>

      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-accent text-[10px]">查看详情 &rarr;</span>
      </div>
    </motion.div>
  );
}

export default function TeamAnalysis() {
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const timeTabs = [
    { key: 'week' as const, label: '本周' },
    { key: 'month' as const, label: '本月' },
    { key: 'quarter' as const, label: '本季度' },
  ];

  return (
    <Layout>
      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <PageHeader title="团队分析" subtitle="数据驱动的管理决策支持" />

        {/* Section 1: Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
          className="bg-card rounded-2xl p-5 border-b border-border"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            <div className="flex items-center gap-3 flex-wrap">
              {/* Time Period Selector */}
              <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
                {timeTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setTimePeriod(tab.key);
                      toast.info(`已切换到${tab.label}视图`);
                    }}
                    className={`px-4 py-2 text-sm rounded-md transition-all flex items-center gap-1 ${
                      timePeriod === tab.key
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label} <ChevronDown className="w-3 h-3" />
                  </button>
                ))}
              </div>

              {/* Compare Toggle */}
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${
                  compareMode
                    ? 'bg-[rgba(168,85,247,0.2)] text-[#A855F7] border border-[#A855F7]/30'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                <div className={`w-8 h-4 rounded-full relative transition-all ${compareMode ? 'bg-[#A855F7]' : 'bg-muted'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${compareMode ? 'left-4' : 'left-0.5'}`} />
                </div>
                与上期对比
              </button>

              {/* Export Button */}
              <button
                onClick={() => toast.success('分析报告已导出')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground rounded-lg bg-gradient-to-r from-[#A855F7] via-[#3B82F6] to-[#06B6D4] hover:brightness-110 transition-all"
              >
                <Download className="w-4 h-4" />
                导出分析报告
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Section 2: KPI Dashboard */}
        <motion.section
          variants={stagger}
          initial="initial"
          animate="animate"
          className="flex flex-wrap gap-4"
        >
          {kpiData.map((kpi, index) => (
            <KpiBlock key={kpi.label} kpi={kpi} index={index} />
          ))}
        </motion.section>

        {/* Section 3: Efficiency Matrix */}
        <EfficiencyMatrix />

        {/* Section 4: Project Health Cards */}
        <ProjectHealthCards />

        {/* Section 5: Workload Distribution */}
        <WorkloadChart />

        {/* Section 6: Collaboration Network */}
        <CollaborationNetwork />

        {/* Section 7: Trend Charts */}
        <TrendCharts />

        {/* Section 8: AI Action Plan */}
        <AiActionPlan />

        {/* Footer spacer */}
        <div className="h-8" />
      </div>
    </Layout>
  );
}
