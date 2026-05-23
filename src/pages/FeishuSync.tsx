import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  RefreshCw, Play, Pause, Clock, ArrowDownToLine, ArrowUpFromLine,
  CheckCircle2, AlertCircle, AlertTriangle, Database, Wifi,
  Settings2, Table2, Filter, Loader2
} from 'lucide-react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  mockSyncLogs,
  type SyncConfig,
  type SyncLog,
  defaultSyncConfig,
} from '@/data/feishuMockData';
import { fetchFeishuBases, fetchBaseTables } from '@/api/feishuClient';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

type SyncDirection = 'bidirectional' | 'import_only' | 'export_only';
type ConflictStrategy = 'manual' | 'override' | 'skip';
type SyncFilterType = 'all' | 'import' | 'export' | 'sync';

const syncDirectionOptions: { value: SyncDirection; label: string; icon: typeof ArrowDownToLine }[] = [
  { value: 'bidirectional', label: '双向同步', icon: RefreshCw },
  { value: 'import_only', label: '仅从飞书导入', icon: ArrowDownToLine },
  { value: 'export_only', label: '仅导出到飞书', icon: ArrowUpFromLine },
];

const conflictStrategyOptions: { value: ConflictStrategy; label: string; desc: string }[] = [
  { value: 'manual', label: '手动处理', desc: '冲突时手动选择' },
  { value: 'override', label: '飞书优先', desc: '飞书数据覆盖系统' },
  { value: 'skip', label: '系统优先', desc: '系统数据保持不变' },
];

const intervalOptions = [5, 10, 15, 30, 60];

function getStatusBadge(status: SyncLog['status']) {
  switch (status) {
    case 'success':
      return (
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
          <CheckCircle2 size={10} className="mr-1" />
          成功
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/20">
          <AlertCircle size={10} className="mr-1" />
          失败
        </Badge>
      );
    case 'partial':
      return (
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/20">
          <AlertTriangle size={10} className="mr-1" />
          部分成功
        </Badge>
      );
  }
}

function getTypeIcon(type: SyncLog['type']) {
  switch (type) {
    case 'import':
      return <ArrowDownToLine size={14} className="text-blue-400" />;
    case 'export':
      return <ArrowUpFromLine size={14} className="text-purple-400" />;
    case 'sync':
      return <RefreshCw size={14} className="text-cyan-400" />;
  }
}

function getTypeLabel(type: SyncLog['type']) {
  switch (type) {
    case 'import':
      return '导入';
    case 'export':
      return '导出';
    case 'sync':
      return '同步';
  }
}

// Mock conflict data
interface ConflictEntry {
  id: string;
  fieldName: string;
  feishuValue: string;
  systemValue: string;
  tableName: string;
}

const mockConflicts: ConflictEntry[] = [
  {
    id: 'conf_001',
    fieldName: '任务状态',
    feishuValue: '已完成',
    systemValue: '进行中',
    tableName: '任务跟踪表',
  },
  {
    id: 'conf_002',
    fieldName: '负责人',
    feishuValue: '王强',
    systemValue: '张伟',
    tableName: '任务跟踪表',
  },
  {
    id: 'conf_003',
    fieldName: '截止日期',
    feishuValue: '2024-07-25',
    systemValue: '2024-07-20',
    tableName: '项目排期表',
  },
];

// Mock sync status for tables
interface TableSyncStatus {
  tableId: string;
  connected: boolean;
  lastSyncTime: string;
  syncing: boolean;
  progress: number;
}

interface RealTable {
  tableId: string;
  name: string;
  recordCount: number;
}

export default function FeishuSync() {
  const [syncConfig, setSyncConfig] = useState<SyncConfig>(defaultSyncConfig);
  const [realTables, setRealTables] = useState<RealTable[]>([]);
  const [tableStatuses, setTableStatuses] = useState<TableSyncStatus[]>([]);
  const [conflicts, setConflicts] = useState<ConflictEntry[]>(mockConflicts);
  const [syncFilter, setSyncFilter] = useState<SyncFilterType>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchFeishuBases()
      .then(async (res) => {
        const bases = res.data?.data || [];
        const tbls: RealTable[] = [];
        for (const base of bases) {
          try {
            const tRes = await fetchBaseTables(base.token);
            const ts = tRes.data?.data || [];
            for (const t of ts) {
              tbls.push({
                tableId: t.tableId,
                name: `${base.name} / ${t.name}`,
                recordCount: t.recordCount,
              });
            }
          } catch { /* ignore */ }
        }
        setRealTables(tbls);
        setTableStatuses(tbls.map((t, i) => ({
          tableId: t.tableId,
          connected: i < 2,
          lastSyncTime: i < 2 ? new Date().toLocaleString('zh-CN') : '—',
          syncing: false,
          progress: 100,
        })));
      })
      .catch(() => toast.error('加载飞书表格失败'))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = useMemo(() => {
    if (syncFilter === 'all') return mockSyncLogs;
    return mockSyncLogs.filter((log) => {
      if (syncFilter === 'sync') return log.type === 'sync';
      return log.type === syncFilter;
    });
  }, [syncFilter]);

  const handleAutoSyncToggle = (checked: boolean) => {
    setSyncConfig((prev) => ({ ...prev, autoSync: checked }));
    toast(checked ? '自动同步已开启' : '自动同步已关闭', {
      description: checked
        ? `系统每 ${syncConfig.syncInterval} 分钟自动同步一次`
        : '自动同步任务已停止',
    });
  };

  const handleIntervalChange = (value: string) => {
    const interval = parseInt(value, 10);
    setSyncConfig((prev) => ({ ...prev, syncInterval: interval }));
    toast.success(`同步间隔已设置为 ${interval} 分钟`);
  };

  const handleDirectionChange = (direction: SyncDirection) => {
    setSyncConfig((prev) => ({ ...prev, syncDirection: direction }));
    const label = syncDirectionOptions.find((o) => o.value === direction)?.label;
    toast.success(`同步方向已设置为"${label}"`);
  };

  const handleConflictStrategyChange = (strategy: ConflictStrategy) => {
    setSyncConfig((prev) => ({ ...prev, conflictStrategy: strategy }));
    const label = conflictStrategyOptions.find((o) => o.value === strategy)?.label;
    toast.success(`冲突处理策略已设置为"${label}"`);
  };

  const handleSyncNow = (tableId: string) => {
    setTableStatuses((prev) =>
      prev.map((s) =>
        s.tableId === tableId
          ? { ...s, syncing: true, progress: 0 }
          : s
      )
    );

    // Simulate sync progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTableStatuses((prev) =>
          prev.map((s) =>
            s.tableId === tableId
              ? {
                  ...s,
                  syncing: false,
                  progress: 100,
                  lastSyncTime: new Date().toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  }).replace(/\//g, '-'),
                }
              : s
          )
        );
        const table = realTables.find((t) => t.tableId === tableId);
        toast.success('同步任务已完成', {
          description: `${table?.name || ''} 已成功同步`,
        });
      } else {
        setTableStatuses((prev) =>
          prev.map((s) =>
            s.tableId === tableId ? { ...s, progress } : s
          )
        );
      }
    }, 300);

    toast.info('同步任务已启动', {
      description: '正在同步数据，请稍候...',
    });
  };

  const handlePauseSync = (tableId: string) => {
    setTableStatuses((prev) =>
      prev.map((s) =>
        s.tableId === tableId ? { ...s, syncing: false } : s
      )
    );
    const table = realTables.find((t) => t.tableId === tableId);
    toast('同步已暂停', {
      description: `${table?.name || ''} 同步任务已暂停`,
    });
  };

  const handleResolveConflict = (conflictId: string, resolution: 'feishu' | 'system' | 'manual') => {
    const conflict = conflicts.find((c) => c.id === conflictId);
    if (!conflict) return;

    if (resolution === 'feishu') {
      toast.success(`已采用飞书值: ${conflict.feishuValue}`, {
        description: `${conflict.tableName} - ${conflict.fieldName}`,
      });
    } else if (resolution === 'system') {
      toast.success(`已采用系统值: ${conflict.systemValue}`, {
        description: `${conflict.tableName} - ${conflict.fieldName}`,
      });
    } else {
      toast.info('手动编辑冲突', {
        description: `${conflict.tableName} - ${conflict.fieldName}`,
      });
    }

    setConflicts((prev) => prev.filter((c) => c.id !== conflictId));
  };

  return (
    <Layout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-[1200px]"
      >
        {/* Page Header */}
        <motion.div variants={itemVariants}>
          <PageHeader
            title="同步管理"
            subtitle="管理系统与飞书之间的数据同步"
          />
        </motion.div>

        {/* Sync Status Cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          {/* Card 1: Auto Sync */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15">
                  <Wifi size={18} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">自动同步</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {syncConfig.autoSync ? '已开启' : '已关闭'}
                  </p>
                </div>
              </div>
              <Switch
                checked={syncConfig.autoSync}
                onCheckedChange={handleAutoSyncToggle}
              />
            </div>
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">每</span>
              <Select
                value={String(syncConfig.syncInterval)}
                onValueChange={handleIntervalChange}
                disabled={!syncConfig.autoSync}
              >
                <SelectTrigger className="h-7 w-20 border-border bg-muted text-foreground text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-muted">
                  {intervalOptions.map((opt) => (
                    <SelectItem
                      key={opt}
                      value={String(opt)}
                      className="text-foreground focus:bg-muted focus:text-foreground text-xs"
                    >
                      {opt} 分钟
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">同步一次</span>
            </div>
          </div>

          {/* Card 2: Sync Direction */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15">
                <RefreshCw size={18} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">同步方向</h3>
                <p className="text-[10px] text-muted-foreground">数据流向设置</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {syncDirectionOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleDirectionChange(opt.value)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all text-left ${
                      syncConfig.syncDirection === opt.value
                        ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                        : 'text-muted-foreground hover:bg-muted border border-transparent'
                    }`}
                  >
                    <Icon size={13} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 3: Conflict Handling */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15">
                <Settings2 size={18} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">冲突处理</h3>
                <p className="text-[10px] text-muted-foreground">数据冲突时策略</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {conflictStrategyOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleConflictStrategyChange(opt.value)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-all text-left ${
                    syncConfig.conflictStrategy === opt.value
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                      : 'text-muted-foreground hover:bg-muted border border-transparent'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-[10px] opacity-60">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Active Sync Table List */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">同步表格列表</h3>
              </div>
              <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                {tableStatuses.filter((s) => s.connected).length} / {realTables.length} 已连接
              </Badge>
            </div>

            <div className="divide-y divide-border/50">
              {loading ? (
                <div className="px-5 py-8 flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-cyan-400" />
                </div>
              ) : (
                realTables.map((table, index) => {
                  const status = tableStatuses.find((s) => s.tableId === table.tableId);
                  return (
                    <motion.div
                      key={table.tableId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-5 py-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Table Info */}
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-1">
                            <Table2 size={14} className="text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              {table.name}
                            </span>
                            {status?.connected ? (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px]">
                                已连接
                              </Badge>
                            ) : (
                              <Badge className="bg-muted text-muted-foreground border-border text-[10px]">
                                未连接
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span>{table.recordCount} 条记录</span>
                            <span className="text-[#334155]">|</span>
                            <span>
                              上次同步: {status?.lastSyncTime || '—'}
                            </span>
                          </div>
                        </div>

                      {/* Sync Status */}
                      <div className="flex items-center gap-3 min-w-[200px] flex-1">
                        {status?.syncing ? (
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] text-cyan-400">同步中...</span>
                              <span className="text-[11px] text-muted-foreground">
                                {Math.round(status.progress)}%
                              </span>
                            </div>
                            <Progress
                              value={status.progress}
                              className="h-1.5 bg-muted"
                            />
                          </div>
                        ) : status?.connected ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <CheckCircle2 size={12} />
                            <span>已同步</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Pause size={12} />
                            <span>未同步</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {status?.connected && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                              onClick={() => handleSyncNow(table.tableId)}
                              disabled={status?.syncing}
                            >
                              {status?.syncing ? (
                                <RefreshCw size={12} className="mr-1 animate-spin" />
                              ) : (
                                <Play size={12} className="mr-1" />
                              )}
                              {status?.syncing ? '同步中' : '立即同步'}
                            </Button>
                            {status?.syncing && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                                onClick={() => handlePauseSync(table.tableId)}
                              >
                                <Pause size={12} className="mr-1" />
                                暂停
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
              )}
            </div>
          </div>
        </motion.div>

        {/* Sync Log Section */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">同步日志</h3>
              </div>
            </div>

            {/* Filter Tabs */}
            <Tabs
              value={syncFilter}
              onValueChange={(val) => setSyncFilter(val as SyncFilterType)}
              className="px-5 pt-3"
            >
              <TabsList className="bg-muted border border-border">
                <TabsTrigger
                  value="all"
                  className="text-xs data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground"
                >
                  全部
                </TabsTrigger>
                <TabsTrigger
                  value="import"
                  className="text-xs data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground"
                >
                  导入
                </TabsTrigger>
                <TabsTrigger
                  value="export"
                  className="text-xs data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground"
                >
                  导出
                </TabsTrigger>
                <TabsTrigger
                  value="sync"
                  className="text-xs data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground"
                >
                  同步
                </TabsTrigger>
              </TabsList>

              <TabsContent value={syncFilter} className="mt-0">
                <div className="divide-y divide-border/50 pb-3">
                  {filteredLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="py-3 flex items-start gap-3"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted shrink-0 mt-0.5">
                        {getTypeIcon(log.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-foreground">
                            {log.tableName}
                          </span>
                          {getStatusBadge(log.status)}
                          <Badge
                            variant="outline"
                            className="border-border text-muted-foreground text-[10px]"
                          >
                            {getTypeLabel(log.type)}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {log.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.details}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          影响 {log.recordsAffected} 条记录
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {filteredLogs.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      暂无相关日志
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>

        {/* Conflict Resolution Panel */}
        <AnimatePresence>
          {conflicts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <div className="rounded-xl border border-amber-500/30 bg-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-400" />
                    <h3 className="text-sm font-semibold text-amber-400">冲突处理</h3>
                    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-xs">
                      {conflicts.length} 个待处理
                    </Badge>
                  </div>
                </div>

                <div className="divide-y divide-border/50">
                  {conflicts.map((conflict) => (
                    <motion.div
                      key={conflict.id}
                      layout
                      exit={{ opacity: 0, x: 50 }}
                      className="px-5 py-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-foreground">
                          {conflict.tableName}
                        </span>
                        <span className="text-[#334155]">·</span>
                        <span className="text-xs text-muted-foreground">
                          {conflict.fieldName}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="rounded-lg border border-border bg-muted p-3">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <ArrowDownToLine size={11} className="text-blue-400" />
                            <span className="text-[10px] text-muted-foreground">飞书值</span>
                          </div>
                          <span className="text-sm text-foreground">
                            {conflict.feishuValue}
                          </span>
                        </div>

                        <div className="rounded-lg border border-border bg-muted p-3">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Database size={11} className="text-purple-400" />
                            <span className="text-[10px] text-muted-foreground">系统值</span>
                          </div>
                          <span className="text-sm text-foreground">
                            {conflict.systemValue}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
                          onClick={() =>
                            handleResolveConflict(conflict.id, 'feishu')
                          }
                        >
                          <ArrowDownToLine size={11} className="mr-1" />
                          使用飞书值
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300"
                          onClick={() =>
                            handleResolveConflict(conflict.id, 'system')
                          }
                        >
                          <Database size={11} className="mr-1" />
                          使用系统值
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={() =>
                            handleResolveConflict(conflict.id, 'manual')
                          }
                        >
                          <Settings2 size={11} className="mr-1" />
                          手动编辑
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
}
