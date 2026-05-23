import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Zap, ArrowRight, Check, X, Loader2, 
  RefreshCw, Table2, BarChart3, AlertCircle, Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/client';

interface FieldMapping {
  [feishuField: string]: string;
}

interface TableMatch {
  baseToken: string;
  tableId: string;
  tableName: string;
  tableType: 'tasks' | 'projects' | 'reports' | 'help' | 'unknown';
  confidence: number;
  fieldMap: FieldMapping;
  fieldConfidence: Record<string, number>;
  unmatchedFields: string[];
  recordCount: number;
}

interface ScanResult {
  tasksTable: TableMatch | null;
  projectsTable: TableMatch | null;
  reportsTable: TableMatch | null;
  helpTable: TableMatch | null;
  allMatches: TableMatch[];
  message: string;
}

const tableTypeLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  tasks: { label: '任务表', icon: Table2, color: '#3B82F6' },
  projects: { label: '项目表', icon: BarChart3, color: '#22C55E' },
  reports: { label: '日报表', icon: FileSpreadsheet, color: '#A855F7' },
  help: { label: '求助表', icon: AlertCircle, color: '#F97316' },
  unknown: { label: '未识别', icon: AlertCircle, color: '#94A3B8' },
};

export default function AutoScanPanel() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await api.get<{ success: boolean; data: ScanResult }>('/api/feishu/auto-scan');
      if (res.success) {
        setScanResult(res.data);
        toast.success(res.data.message || '扫描完成');
      }
    } catch (err: any) {
      toast.error(err.message || '扫描失败，请确认飞书已连接');
    } finally {
      setScanning(false);
    }
  };

  const handleSync = async () => {
    if (!scanResult) return;
    
    const tables = [
      scanResult.tasksTable, 
      scanResult.projectsTable, 
      scanResult.reportsTable, 
      scanResult.helpTable
    ].filter(Boolean).map(t => ({
      tableType: t!.tableType,
      baseToken: t!.baseToken,
      tableId: t!.tableId,
      fieldMap: t!.fieldMap
    }));

    if (tables.length === 0) {
      toast.error('没有可同步的表格');
      return;
    }

    setSyncing(true);
    try {
      const res = await api.post<{ success: boolean; data: any }>('/api/feishu/auto-sync', { tables });
      if (res.success) {
        toast.success(`同步完成！共处理 ${res.data.totalSynced} 条记录`);
      }
    } catch (err: any) {
      toast.error(err.message || '同步失败');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* 顶部说明 */}
      <div className="bg-gradient-to-r from-accent/8 to-purple-500/8 rounded-2xl border border-accent/20 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
            <Zap size={22} className="text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">智能表格识别与自动映射</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              一键扫描飞书中的所有多维表格，自动识别任务、项目、日报、求助等表格类型，
              并智能匹配字段映射关系。支持任意结构的表格，无需按标准格式创建。
            </p>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {scanning ? (
            <><Loader2 size={18} className="animate-spin" /> 正在扫描飞书表格...</>
          ) : (
            <><Search size={18} /> 开始自动扫描</>
          )}
        </button>
        {scanResult && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500/15 text-green-400 font-semibold text-sm border border-green-500/30 hover:bg-green-500/25 transition-colors disabled:opacity-50"
          >
            {syncing ? (
              <><Loader2 size={18} className="animate-spin" /> 同步中...</>
            ) : (
              <><RefreshCw size={18} /> 一键同步到系统</>
            )}
          </button>
        )}
      </div>

      {/* 扫描结果 */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-5"
          >
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles size={14} className="text-accent" />
              {scanResult.message}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {(['tasks', 'projects', 'reports', 'help'] as const).map((type) => {
                const match = scanResult[`${type}Table` as keyof ScanResult] as TableMatch | null;
                const config = tableTypeLabels[type];
                const Icon = config.icon;

                return (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border transition-colors ${
                      match 
                        ? 'bg-card border-border hover:border-accent/30' 
                        : 'bg-muted/50 border-border/30 opacity-60'
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${config.color}18` }}
                        >
                          <Icon size={18} style={{ color: config.color }} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-foreground">{config.label}</h4>
                          {match ? (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground truncate max-w-[160px]">{match.tableName}</span>
                              <span className="text-xs text-muted-foreground/60">{match.recordCount} 条记录</span>
                              <span 
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex-shrink-0"
                                style={{ 
                                  backgroundColor: match.confidence > 0.7 ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)', 
                                  color: match.confidence > 0.7 ? '#22C55E' : '#F97316'
                                }}
                              >
                                {Math.round(match.confidence * 100)}%
                              </span>
                              <Check size={14} className="text-green-400" />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground mt-1">未找到匹配的表格</span>
                          )}
                        </div>
                      </div>

                      {match && (
                        <>
                          <button
                            onClick={() => setExpandedMatch(expandedMatch === type ? null : type)}
                            className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                          >
                            查看字段映射 ({Object.keys(match.fieldMap).length} 个字段)
                          </button>
                          
                          <AnimatePresence>
                            {expandedMatch === type && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 pt-3 border-t border-border space-y-1.5 max-h-[200px] overflow-y-auto">
                                  {Object.entries(match.fieldMap).map(([feishu, system]) => (
                                    <div key={feishu} className="flex items-center gap-2 text-xs">
                                      <span className="text-muted-foreground w-[100px] truncate flex-shrink-0">{feishu}</span>
                                      <ArrowRight size={10} className="text-muted-foreground/30 flex-shrink-0" />
                                      <span className="text-accent font-mono flex-shrink-0">{system}</span>
                                      {match.fieldConfidence[system] !== undefined && (
                                        <span className="text-[10px] text-muted-foreground/50">
                                          ({Math.round(match.fieldConfidence[system] * 100)}%)
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                  {match.unmatchedFields.length > 0 && (
                                    <div className="text-xs text-muted-foreground/40 pt-1 border-t border-border/50 mt-1">
                                      未匹配: {match.unmatchedFields.join(', ')}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* 所有匹配表格列表 */}
            {scanResult.allMatches.length > 1 && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground transition-colors inline-block">
                  查看所有匹配表格 ({scanResult.allMatches.length} 个)
                </summary>
                <div className="mt-2 space-y-1">
                  {scanResult.allMatches.map(m => (
                    <div key={m.tableId} className="flex items-center gap-2">
                      <span className="w-20 truncate" style={{ color: tableTypeLabels[m.tableType]?.color }}>
                        [{tableTypeLabels[m.tableType]?.label || m.tableType}]
                      </span>
                      <span>{m.tableName}</span>
                      <span className="text-muted-foreground/50">{Math.round(m.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
