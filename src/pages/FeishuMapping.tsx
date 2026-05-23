import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowRight, Sparkles, CheckCircle2, AlertTriangle,
  RefreshCw, ChevronDown, Layers, Table2, Bot, ChevronLeft, Loader2
} from 'lucide-react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type FeishuTable,
  type FeishuTableField,
  type FieldMapping,
  type SystemField,
  systemFieldLabels,
  generateAiMapping,
} from '@/data/feishuMockData';
import { fetchFeishuBases, fetchBaseTables, fetchTableFields } from '@/api/feishuClient';

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

const fieldTypeColors: Record<string, string> = {
  text: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  number: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  date: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  singleSelect: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  multiSelect: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  user: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  checkbox: 'bg-green-500/15 text-green-400 border-green-500/20',
  url: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  phone: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
};

const fieldTypeLabels: Record<string, string> = {
  text: '文本',
  number: '数字',
  date: '日期',
  singleSelect: '单选',
  multiSelect: '多选',
  user: '人员',
  checkbox: '复选',
  url: '链接',
  phone: '电话',
};

const transformLabels: Record<string, string> = {
  direct: '直接映射',
  convert_status: '状态转换',
  convert_priority: '优先级转换',
  convert_date: '日期转换',
  custom: '自定义规则',
};

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.7) return 'bg-emerald-500';
  if (confidence >= 0.4) return 'bg-amber-500';
  return 'bg-red-500';
}

function getConfidenceText(confidence: number): string {
  if (confidence >= 0.7) return '高置信度';
  if (confidence >= 0.4) return '中置信度';
  return '低置信度';
}

export default function FeishuMapping() {
  const [allTables, setAllTables] = useState<FeishuTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<FeishuTable | null>(null);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalyzed, setAiAnalyzed] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchFeishuBases()
      .then(async (res) => {
        const bases = res.data || [];
        const tbls: FeishuTable[] = [];
        for (const base of bases) {
          try {
            const tRes = await fetchBaseTables(base.token);
            const ts = tRes.data || [];
            for (const t of ts) {
              tbls.push({
                tableId: t.tableId,
                name: `${base.name} / ${t.name}`,
                sheetName: t.name,
                recordCount: t.recordCount,
                lastModified: t.lastModified || base.updateTime,
                selected: false,
                fields: [],
                baseToken: base.token,
              });
            }
          } catch { /* ignore */ }
        }
        setAllTables(tbls);
        if (tbls.length > 0) {
          setSelectedTable(tbls[0]);
        }
      })
      .catch(() => toast.error('加载飞书表格失败'))
      .finally(() => setLoading(false));
  }, []);

  const systemFieldOptions = useMemo(
    () => Object.entries(systemFieldLabels) as [SystemField, string][],
    []
  );

  const analyzedCount = useMemo(
    () => mappings.filter((m) => m.systemField !== null).length,
    [mappings]
  );

  const manualCount = useMemo(
    () => mappings.filter((m) => m.systemField === null).length,
    [mappings]
  );

  const handleTableChange = async (tableId: string) => {
    const table = allTables.find((t) => t.tableId === tableId);
    if (!table) return;
    setSelectedTable(table);
    setMappings([]);
    setAiAnalyzed(false);
    setProgressValue(0);
    if (table.baseToken && table.fields.length === 0) {
      try {
        const fRes = await fetchTableFields(table.baseToken, tableId);
        const fields = (fRes.data || []).map((f: any) => ({
          fieldId: f.fieldId,
          name: f.name,
          type: f.type,
          sampleValues: [],
        }));
        const updated = { ...table, fields };
        setSelectedTable(updated);
        setAllTables((prev) => prev.map((t) => (t.tableId === tableId ? updated : t)));
      } catch {
        toast.error('加载字段失败');
      }
    }
  };

  const runAiAnalysis = () => {
    if (!selectedTable || selectedTable.fields.length === 0) {
      toast.error('请先选择表格并加载字段');
      return;
    }
    setAiAnalyzing(true);
    setAiAnalyzed(false);
    setProgressValue(0);

    const interval = setInterval(() => {
      setProgressValue((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 25;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      const result = generateAiMapping(selectedTable.fields);
      setMappings(result);
      setAiAnalyzing(false);
      setAiAnalyzed(true);
      setProgressValue(100);

      const matched = result.filter((r) => r.systemField !== null).length;
      toast.success(`AI 分析完成！${matched} 个字段已自动映射`);
    }, 800);
  };

  const handleMappingChange = (fieldId: string, systemField: string | null) => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.feishuFieldId !== fieldId) return m;
        if (systemField === null || systemField === 'none') {
          return { ...m, systemField: null, confidence: 0.1, transform: 'direct' as const };
        }
        let transform: FieldMapping['transform'] = 'direct';
        if (systemField === 'status') transform = 'convert_status';
        else if (systemField === 'priority') transform = 'convert_priority';
        else if (systemField === 'dueDate') transform = 'convert_date';
        return { ...m, systemField: systemField as SystemField, transform, confidence: 0.95 };
      })
    );
    toast('映射已更新', {
      description: `字段映射关系已修改`,
      icon: <CheckCircle2 size={14} className="text-emerald-400" />,
    });
  };

  const handleSaveMapping = () => {
    toast.success('映射配置已保存', {
      description: `已保存 ${selectedTable?.name || ''} 的 ${analyzedCount} 个字段映射`,
    });
  };

  const handleGenerateStandardTable = () => {
    toast.success('已根据映射规则生成标准化数据表', {
      description: `基于 ${analyzedCount} 个映射字段生成`,
    });
  };

  const handleStartImport = () => {
    toast.success('数据导入任务已启动，预计 2 分钟完成', {
      description: `正在导入 ${selectedTable?.recordCount || 0} 条记录`,
    });
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
            title="数据映射配置"
            subtitle="AI 智能分析飞书表格结构，自动映射到系统字段"
          />
        </motion.div>

        {/* Table Selector */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Table2 size={18} />
                <span className="text-sm">选择飞书表格</span>
              </div>
              {loading ? (
                <Loader2 size={16} className="animate-spin text-cyan-400" />
              ) : (
                <Select
                  value={selectedTable?.tableId || ''}
                  onValueChange={handleTableChange}
                >
                  <SelectTrigger className="w-64 border-border bg-muted text-foreground">
                    <SelectValue placeholder="选择表格" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-muted">
                    {allTables.map((table) => (
                      <SelectItem
                        key={table.tableId}
                        value={table.tableId}
                        className="text-foreground focus:bg-muted focus:text-foreground"
                      >
                        <div className="flex items-center gap-2">
                          <Layers size={14} className="text-muted-foreground" />
                          {table.name}
                          <span className="text-xs text-muted-foreground">
                            ({table.recordCount} 条)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
                {selectedTable && (
                  <>
                    <span>
                      工作表:{' '}
                      <span className="text-muted-foreground">{selectedTable.sheetName || '—'}</span>
                    </span>
                    <span className="text-[#334155]">|</span>
                    <span>
                      记录数:{' '}
                      <span className="text-muted-foreground">{selectedTable.recordCount}</span>
                    </span>
                    <span className="text-[#334155]">|</span>
                    <span>
                      最后修改:{' '}
                      <span className="text-muted-foreground">{selectedTable.lastModified}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Analysis Section */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/15">
                  <Bot size={20} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">AI 智能分析</h3>
                  <p className="text-xs text-muted-foreground">
                    {aiAnalyzed
                      ? '分析完成，请检查并调整映射结果'
                      : '点击按钮开始分析表格字段结构'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {aiAnalyzed && (
                  <div className="flex items-center gap-3 mr-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-emerald-400">{analyzedCount} 已映射</span>
                    </div>
                    {manualCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-amber-400">{manualCount} 需手动配置</span>
                      </div>
                    )}
                  </div>
                )}

                {aiAnalyzed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runAiAnalysis}
                    className="border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <RefreshCw size={14} className="mr-1.5" />
                    重新分析
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={runAiAnalysis}
                    disabled={aiAnalyzing}
                    className="bg-purple-600 hover:bg-purple-700 text-primary-foreground"
                  >
                    {aiAnalyzing ? (
                      <RefreshCw size={14} className="mr-1.5 animate-spin" />
                    ) : (
                      <Sparkles size={14} className="mr-1.5" />
                    )}
                    {aiAnalyzing ? 'AI 正在分析表格结构...' : 'AI 智能分析'}
                  </Button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <AnimatePresence>
              {aiAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <Progress
                    value={Math.min(progressValue, 100)}
                    className="h-1.5 bg-muted"
                  />
                  <p className="mt-2 text-xs text-muted-foreground text-center">
                    AI 正在分析 {selectedTable?.fields.length || 0} 个字段的语义...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Mapping Table */}
        <AnimatePresence mode="wait">
          {aiAnalyzed && mappings.length > 0 && (
            <motion.div
              key="mapping-table"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="mb-6"
            >
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 px-5 py-3 border-b border-border bg-muted/50">
                  <div className="text-xs font-medium text-muted-foreground">飞书字段</div>
                  <div className="text-xs font-medium text-muted-foreground w-10 text-center" />
                  <div className="text-xs font-medium text-muted-foreground">系统字段</div>
                </div>

                {/* Mapping Rows */}
                <div className="divide-y divide-border/50">
                  {mappings.map((mapping, index) => (
                    <motion.div
                      key={mapping.feishuFieldId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.25 }}
                      className="grid grid-cols-[1fr_auto_1fr] gap-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors"
                    >
                      {/* Left: Feishu Field */}
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-medium text-foreground">
                            {mapping.feishuFieldName}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${
                              fieldTypeColors[
                                selectedTable.fields.find(
                                  (f) => f.fieldId === mapping.feishuFieldId
                                )?.type || 'text'
                              ]
                            }`}
                          >
                            {
                              fieldTypeLabels[
                                selectedTable.fields.find(
                                  (f) => f.fieldId === mapping.feishuFieldId
                                )?.type || 'text'
                              ]
                            }
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {selectedTable.fields
                            .find((f) => f.fieldId === mapping.feishuFieldId)
                            ?.sampleValues.slice(0, 2)
                            .map((v, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                              >
                                {v}
                              </span>
                            ))}
                        </div>
                      </div>

                      {/* Middle: Arrow */}
                      <div className="flex flex-col items-center gap-1 w-10">
                        <ArrowRight
                          size={16}
                          className={`transition-colors ${
                            mapping.systemField
                              ? 'text-purple-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </div>

                      {/* Right: System Field Selector */}
                      <div className="space-y-2">
                        <Select
                          value={mapping.systemField || 'none'}
                          onValueChange={(val) =>
                            handleMappingChange(
                              mapping.feishuFieldId,
                              val === 'none' ? null : val
                            )
                          }
                        >
                          <SelectTrigger className="w-full border-border bg-muted text-foreground h-8 text-xs">
                            <SelectValue placeholder="选择系统字段" />
                          </SelectTrigger>
                          <SelectContent className="border-border bg-muted">
                            <SelectItem
                              value="none"
                              className="text-foreground focus:bg-muted focus:text-foreground text-xs"
                            >
                              不映射
                            </SelectItem>
                            {systemFieldOptions.map(([key, label]) => (
                              <SelectItem
                                key={key}
                                value={key}
                                className="text-foreground focus:bg-muted focus:text-foreground text-xs"
                              >
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Confidence & Transform Info */}
                        {mapping.systemField && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="flex items-center gap-2"
                          >
                            <div className="flex-1">
                              <div className="h-1 rounded-full bg-muted overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${mapping.confidence * 100}%`,
                                  }}
                                  transition={{ duration: 0.5, delay: 0.1 }}
                                  className={`h-full rounded-full ${getConfidenceColor(
                                    mapping.confidence
                                  )}`}
                                />
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {getConfidenceText(mapping.confidence)}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-border text-muted-foreground shrink-0"
                            >
                              {transformLabels[mapping.transform]}
                            </Badge>
                          </motion.div>
                        )}

                        {!mapping.systemField && (
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-500/80">
                            <AlertTriangle size={10} />
                            <span>未映射，请手动选择系统字段</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <AnimatePresence>
          {aiAnalyzed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={runAiAnalysis}
                className="border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <RefreshCw size={14} className="mr-1.5" />
                重新分析
              </Button>

              <Button
                size="sm"
                onClick={handleSaveMapping}
                className="bg-purple-600 hover:bg-purple-700 text-primary-foreground"
              >
                <CheckCircle2 size={14} className="mr-1.5" />
                保存映射
              </Button>

              <Button
                size="sm"
                onClick={handleGenerateStandardTable}
                variant="outline"
                className="border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Table2 size={14} className="mr-1.5" />
                生成标准表
              </Button>

              <Button
                size="sm"
                onClick={handleStartImport}
                className="bg-emerald-600 hover:bg-emerald-700 text-primary-foreground"
              >
                <ArrowRight size={14} className="mr-1.5" />
                开始导入
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
}
