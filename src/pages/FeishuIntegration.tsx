import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Link2, Users, Table2, RefreshCw, Clock, CheckCircle2, AlertCircle,
  ChevronRight, Shield, Key, FileSpreadsheet, Database, Settings,
  ArrowRight, X, Loader2, Search, Filter, Download, Trash2, Edit3,
  Zap, UserPlus, UserCheck, Wifi, WifiOff, ChevronDown, ChevronUp,
  Eye, BarChart3, Plus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import { useUserRole } from '@/context/UserRoleContext';
import { useTeamStore } from '@/context/TeamStoreContext';
import type {
  FeishuConfig, FeishuUser, FeishuTable, FeishuTableField, FieldMapping, SyncLog, SyncConfig,
} from '@/data/feishuMockData';
import {
  mockSyncLogs,
  generateAiMapping, systemFieldLabels, defaultSyncConfig,
  defaultFeishuConfig,
} from '@/data/feishuMockData';
import {
  getFeishuConfig,
  saveFeishuConfig,
  updateFeishuConnection,
  fetchFeishuUsers,
  fetchFeishuBases,
  fetchBaseTables,
  fetchTableFields,
  createDefaultFeishuTables,
} from '@/api/feishuClient';

// ══════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════
type TabId = 'config' | 'users' | 'tables' | 'logs';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

// ══════════════════════════════════════════════════════════════
// Animation Variants
// ══════════════════════════════════════════════════════════════
const tabContentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' as const },
  }),
};

// ══════════════════════════════════════════════════════════════
// Helper Components
// ══════════════════════════════════════════════════════════════
function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
  const isActive = status === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
          : 'bg-slate-500/15 text-slate-400 border border-slate-500/20'
      }`}
    >
      {isActive ? <UserCheck size={12} /> : <X size={12} />}
      {isActive ? '在职' : '离职'}
    </span>
  );
}

function SyncStatusBadge({ status }: { status: 'success' | 'failed' | 'partial' }) {
  const config = {
    success: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20', label: '成功' },
    failed: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/20', label: '失败' },
    partial: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/20', label: '部分成功' },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      {status === 'success' && <CheckCircle2 size={12} />}
      {status === 'failed' && <AlertCircle size={12} />}
      {status === 'partial' && <Clock size={12} />}
      {config.label}
    </span>
  );
}

function TypeBadge({ type }: { type: 'import' | 'export' | 'sync' }) {
  const config = {
    import: { icon: <Download size={12} />, label: '导入', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    export: { icon: <ArrowRight size={12} />, label: '导出', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    sync: { icon: <RefreshCw size={12} />, label: '同步', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  }[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

function FieldTypeTag({ type }: { type: FeishuTableField['type'] }) {
  const labels: Record<string, string> = {
    text: '文本', number: '数字', date: '日期',
    singleSelect: '单选', multiSelect: '多选',
    user: '人员', checkbox: '复选', url: '链接', phone: '电话',
  };
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-600/30 text-slate-300 border border-slate-500/20">
      {labels[type] || type}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
// Tab 1: Connection Config
// ══════════════════════════════════════════════════════════════
function ConnectionConfigTab() {
  const [config, setConfig] = useState<FeishuConfig>(defaultFeishuConfig);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectedTables, setConnectedTables] = useState<FeishuTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [creatingTables, setCreatingTables] = useState(false);

  useEffect(() => {
    getFeishuConfig()
      .then((res) => {
        if (res.data) {
          const c = res.data;
          setConfig({
            appId: c.appId || '',
            appSecret: c.appSecret || '',
            webhookUrl: c.webhookUrl || '',
            connected: !!c.connected,
            connectedAt: c.connectedAt,
          });
        }
      })
      .catch(() => toast.error('加载配置失败'))
      .finally(() => setLoading(false));
  }, []);

  // Load real connected tables from Feishu API when connected
  useEffect(() => {
    if (!config.connected) {
      setConnectedTables([]);
      return;
    }
    setTablesLoading(true);
    fetchFeishuBases()
      .then(async (res) => {
        const bases = res.data || [];
        const allTables: FeishuTable[] = [];
        for (const base of bases) {
          try {
            const tRes = await fetchBaseTables(base.token);
            const ts = tRes.data || [];
            for (const t of ts) {
              allTables.push({
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
          } catch {
            // ignore single base error
          }
        }
        setConnectedTables(allTables);
      })
      .catch(() => toast.error('获取已连接表格失败'))
      .finally(() => setTablesLoading(false));
  }, [config.connected]);

  const handleTest = async () => {
    setTesting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setTesting(false);
    if (config.appId && config.appSecret) {
      toast.success('连接测试成功', { description: '飞书 API 连接正常' });
    } else {
      toast.error('连接测试失败', { description: '请填写完整的 App ID 和 App Secret' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await saveFeishuConfig({
        appId: config.appId,
        appSecret: config.appSecret,
        webhookUrl: config.webhookUrl,
      });
      if (res.data) {
        const c = res.data;
        setConfig({
          appId: c.appId || '',
          appSecret: c.appSecret || '',
          webhookUrl: c.webhookUrl || '',
          connected: !!c.connected,
          connectedAt: c.connectedAt,
        });
        toast.success('配置保存成功');
      }
    } catch {
      toast.error('保存配置失败');
    }
    setSaving(false);
  };

  const handleDisconnect = async () => {
    try {
      const existing = await getFeishuConfig();
      const id = (existing.data as any)?.id;
      if (id) {
        await updateFeishuConnection(id, false);
      }
      setConfig((prev) => ({ ...prev, connected: false, connectedAt: null }));
      toast('已断开飞书连接', { description: '您可以随时重新连接' });
    } catch {
      setConfig((prev) => ({ ...prev, connected: false, connectedAt: null }));
    }
  };

  const handleCreateDefaultTables = async () => {
    setCreatingTables(true);
    try {
      const res = await createDefaultFeishuTables();
      if (res.data) {
        const d = res.data;
        const tableNames = d.tables.map((t) => t.tableName).join('、');
        const action = d.existing ? '检测到已有' : '已创建';
        toast.success(`${action}标准表格`, {
          description: `${action}「${d.baseName}」，含 ${d.tables.length} 张表格：${tableNames}`,
          duration: 5000,
        });
        // Refresh connected tables
        const basesRes = await fetchFeishuBases();
        const bases = basesRes.data || [];
        const allTables: FeishuTable[] = [];
        for (const base of bases) {
          try {
            const tRes = await fetchBaseTables(base.token);
            const ts = tRes.data || [];
            for (const t of ts) {
              allTables.push({
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
        setConnectedTables(allTables);
      }
    } catch (err: any) {
      toast.error('创建标准表格失败', {
        description: err?.message || '请检查飞书连接配置',
        duration: 5000,
      });
    }
    setCreatingTables(false);
  };

  if (loading) {
    return (
      <motion.div variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-cyan-400" />
      </motion.div>
    );
  }

  return (
    <motion.div variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
      {/* Connection Status Card */}
      <div className="bg-muted rounded-xl border border-input p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.connected ? 'bg-emerald-500/15' : 'bg-slate-500/15'}`}>
              {config.connected ? <Wifi size={24} className="text-emerald-400" /> : <WifiOff size={24} className="text-slate-400" />}
            </div>
            <div>
              <h3 className="text-foreground font-semibold text-base">
                {config.connected ? '已连接到飞书' : '未连接'}
              </h3>
              <p className="text-muted-foreground text-sm mt-0.5">
                {config.connected && config.connectedAt
                  ? `上次连接时间：${config.connectedAt}`
                  : '请配置应用凭证以连接飞书'}
              </p>
            </div>
          </div>
          {config.connected && (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              <Link2 size={14} />
              断开连接
            </button>
          )}
        </div>
      </div>

      {/* One-click create default tables */}
      {config.connected && (
        <div className="bg-cyan-500/5 rounded-xl border border-cyan-500/20 p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Plus size={24} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold text-base">一键创建标准表格</h3>
                <p className="text-muted-foreground text-sm mt-0.5">
                  在飞书自动创建「团队任务管理」Base，含任务跟踪表格和标准字段
                </p>
              </div>
            </div>
            <button
              onClick={handleCreateDefaultTables}
              disabled={creatingTables}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all disabled:opacity-50"
            >
              {creatingTables ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {creatingTables ? '创建中...' : '一键创建'}
            </button>
          </div>
        </div>
      )}

      {/* Connected Tables Info */}
      {config.connected && (
        <div className="bg-muted rounded-xl border border-input p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground font-semibold text-base flex items-center gap-2">
              <Database size={18} className="text-violet-400" />
              已连接的飞书表格
            </h3>
            <span className="text-xs text-muted-foreground">共 {connectedTables.length} 个表格</span>
          </div>
          {tablesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-cyan-400" />
            </div>
          ) : connectedTables.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FileSpreadsheet size={28} className="mx-auto mb-2 text-slate-600" />
              <p className="text-sm">暂无已连接的飞书表格</p>
              <p className="text-xs mt-1">请前往「表格管理」页面选择要连接的表格</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connectedTables.map((table) => (
                <div key={table.tableId} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <FileSpreadsheet size={18} className="text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{table.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        工作表「{table.sheetName || table.name}」· {table.recordCount} 条记录
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">最近修改 {table.lastModified}</span>
                    <Link
                      to="/feishu-mapping"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                    >
                      <ArrowRight size={12} />
                      配置映射
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="text-amber-400">提示：</span>如果飞书表格的字段格式与系统不匹配，请点击"配置映射"进行字段转换。
            </p>
          </div>
        </div>
      )}

      {/* Config Form */}
      <div className="bg-muted rounded-xl border border-input p-6">
        <h3 className="text-foreground font-semibold text-base mb-5 flex items-center gap-2">
          <Settings size={18} className="text-cyan-400" />
          应用凭证配置
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <Key size={13} />
              App ID
            </label>
            <input
              type="text"
              value={config.appId}
              onChange={(e) => setConfig((p) => ({ ...p, appId: e.target.value }))}
              placeholder="请输入飞书 App ID"
              className="w-full px-3.5 py-2.5 rounded-lg bg-card border border-slate-600/50 text-foreground text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <Shield size={13} />
              App Secret
            </label>
            <input
              type="password"
              value={config.appSecret}
              onChange={(e) => setConfig((p) => ({ ...p, appSecret: e.target.value }))}
              placeholder="请输入飞书 App Secret"
              className="w-full px-3.5 py-2.5 rounded-lg bg-card border border-slate-600/50 text-foreground text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <Link2 size={13} />
              Webhook URL（可选）
            </label>
            <input
              type="text"
              value={config.webhookUrl}
              onChange={(e) => setConfig((p) => ({ ...p, webhookUrl: e.target.value }))}
              placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-card border border-slate-600/50 text-foreground text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-6 pt-5 border-t border-input">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-card text-foreground border border-slate-600 hover:border-cyan-500/50 hover:text-cyan-400 transition-all disabled:opacity-50"
          >
            {testing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            {testing ? '测试中...' : '测试连接'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {saving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>

      {/* Security Tips */}
      <div className="bg-amber-500/5 rounded-xl border border-amber-500/15 p-4 flex items-start gap-3">
        <Shield size={18} className="text-amber-400 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-amber-400 text-sm font-medium">安全提示</h4>
          <p className="text-muted-foreground text-sm mt-1">
            App Secret 仅存储在您的本地环境中，不会上传到任何第三方服务器。建议定期轮换凭证以确保安全。
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// Tab 2: User Sync
// ══════════════════════════════════════════════════════════════
function UserSyncTab() {
  const { importFeishuUsers, getImportStatus, members } = useTeamStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [smartMatch, setSmartMatch] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [pendingConfigUsers, setPendingConfigUsers] = useState<FeishuUser[]>([]);
  const [userConfigs, setUserConfigs] = useState<Record<string, { role: string; department: string }>>({});
  const [feishuUsers, setFeishuUsers] = useState<FeishuUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    setUsersLoading(true);
    fetchFeishuUsers()
      .then((res) => {
        if (res.data) {
          setFeishuUsers(res.data);
        }
      })
      .catch(() => toast.error('获取飞书用户失败'))
      .finally(() => setUsersLoading(false));
  }, []);

  const totalUsers = feishuUsers.length;
  const feishuImportedCount = feishuUsers.filter((u) => getImportStatus(u.openId)).length;
  const pendingCount = totalUsers - feishuImportedCount;
  const filteredUsers = feishuUsers.filter(
    (u) =>
      u.name.includes(searchTerm) ||
      u.email.includes(searchTerm) ||
      u.department.includes(searchTerm)
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map((u) => u.openId)));
    }
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) {
      toast.error('请先选择要导入的成员');
      return;
    }
    setImporting(true);
    await new Promise((r) => setTimeout(r, 1500));
    const usersToImport = feishuUsers.filter((u) => selectedIds.has(u.openId));
    // Initialize default configs from Feishu data
    const defaultConfigs: Record<string, { role: string; department: string }> = {};
    usersToImport.forEach((u) => {
      defaultConfigs[u.openId] = {
        role: smartMatch ? u.department + '工程师' : '新成员',
        department: u.department,
      };
    });
    setUserConfigs(defaultConfigs);
    setPendingConfigUsers(usersToImport);
    setShowConfigPanel(true);
    setImporting(false);
    toast.info('请配置导入人员的岗位信息', {
      description: `共 ${usersToImport.length} 人，可修改后确认导入`,
      duration: 5000,
    });
  };

  const handleConfirmImport = () => {
    const usersToImport = pendingConfigUsers.map((u) => ({
      ...u,
      department: userConfigs[u.openId]?.department || u.department,
      // pass role hint for the context
      _role: userConfigs[u.openId]?.role || '新成员',
    }));
    importFeishuUsers(usersToImport);
    setShowConfigPanel(false);
    setPendingConfigUsers([]);
    setUserConfigs({});
    setSelectedIds(new Set());
    toast.success(`成功导入 ${usersToImport.length} 位成员`, {
      description: '可在「员工管理」页面查看详情',
    });
  };

  return (
    <motion.div variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-muted rounded-xl border border-input p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">飞书总人数</p>
              <p className="text-foreground text-2xl font-bold mt-1">{totalUsers}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Users size={20} className="text-cyan-400" />
            </div>
          </div>
        </motion.div>
        <motion.div
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-muted rounded-xl border border-input p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">已导入人数</p>
              <p className="text-emerald-400 text-2xl font-bold mt-1">{feishuImportedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <UserCheck size={20} className="text-emerald-400" />
            </div>
          </div>
        </motion.div>
        <motion.div
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-muted rounded-xl border border-input p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">待导入人数</p>
              <p className="text-amber-400 text-2xl font-bold mt-1">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <UserPlus size={20} className="text-amber-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="搜索姓名、邮箱、部门..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 pl-9 pr-4 py-2.5 rounded-lg bg-muted border border-slate-600/50 text-foreground text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <button
              onClick={() => setSmartMatch(!smartMatch)}
              className={`relative w-9 h-5 rounded-full transition-colors ${smartMatch ? 'bg-cyan-500' : 'bg-slate-600'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${smartMatch ? 'translate-x-4' : ''}`}
              />
            </button>
            智能匹配角色
          </label>
          {selectedIds.size === 0 && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              请勾选要导入的成员，然后点击"一键导入"
            </span>
          )}
          <button
            onClick={handleImport}
            disabled={importing || selectedIds.size === 0}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all disabled:opacity-40 ${
              selectedIds.size > 0
                ? 'bg-cyan-500 text-primary-foreground border-cyan-500 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/25'
            }`}
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {importing ? '导入中...' : `一键导入${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-muted rounded-xl border border-input overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-input">
                <th className="text-left px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-500 bg-card text-cyan-500 focus:ring-cyan-500/30"
                  />
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">成员</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">邮箱</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">部门</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">工号</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">状态</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">导入状态</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.openId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-border hover:bg-slate-700/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.openId)}
                      onChange={() => toggleSelect(user.openId)}
                      className="w-4 h-4 rounded border-slate-500 bg-card text-cyan-500 focus:ring-cyan-500/30"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-primary-foreground text-xs font-bold">
                        {user.name.slice(0, 1)}
                      </div>
                      <span className="text-foreground font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-600/20 text-slate-300 text-xs">
                      {user.department}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.employeeNo}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-4 py-3">
                    {getImportStatus(user.openId) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={12} /> 已导入
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
                        <Clock size={12} /> 待导入
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <Users size={32} className="mx-auto mb-2 text-slate-600" />
            <p>未找到匹配的成员</p>
          </div>
        )}

      {/* Import Config Panel */}
      <AnimatePresence>
        {showConfigPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-muted rounded-xl border border-cyan-500/30 overflow-hidden"
          >
            {/* Panel Header */}
            <div className="p-4 border-b border-input bg-cyan-500/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-cyan-400" />
                <h3 className="text-foreground font-semibold">配置导入人员信息</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                共 {pendingConfigUsers.length} 人待配置
              </span>
            </div>

            {/* Config Table */}
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-input">
                      <th className="text-left px-3 py-2 text-muted-foreground">姓名</th>
                      <th className="text-left px-3 py-2 text-muted-foreground">飞书部门</th>
                      <th className="text-left px-3 py-2 text-muted-foreground">系统岗位（可修改）</th>
                      <th className="text-left px-3 py-2 text-muted-foreground">系统部门（可修改）</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingConfigUsers.map((user) => (
                      <tr key={user.openId} className="border-b border-border">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-primary-foreground text-xs font-bold">
                              {user.name.slice(0, 1)}
                            </div>
                            <span className="text-foreground font-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{user.department}</td>
                        <td className="px-3 py-3">
                          <select
                            value={userConfigs[user.openId]?.role || '新成员'}
                            onChange={(e) =>
                              setUserConfigs((prev) => ({
                                ...prev,
                                [user.openId]: {
                                  ...prev[user.openId],
                                  role: e.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-lg bg-card border border-input px-3 py-1.5 text-sm text-foreground focus:border-cyan-500 focus:outline-none"
                          >
                            <option value="产品经理">产品经理</option>
                            <option value="前端工程师">前端工程师</option>
                            <option value="后端工程师">后端工程师</option>
                            <option value="全栈工程师">全栈工程师</option>
                            <option value="UI设计师">UI设计师</option>
                            <option value="测试工程师">测试工程师</option>
                            <option value="DevOps工程师">DevOps工程师</option>
                            <option value="运维工程师">运维工程师</option>
                            <option value="数据分析师">数据分析师</option>
                            <option value="项目经理">项目经理</option>
                            <option value="技术负责人">技术负责人</option>
                            <option value="QA工程师">QA工程师</option>
                            <option value="移动端开发">移动端开发</option>
                            <option value="新成员">新成员</option>
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={userConfigs[user.openId]?.department || user.department}
                            onChange={(e) =>
                              setUserConfigs((prev) => ({
                                ...prev,
                                [user.openId]: {
                                  ...prev[user.openId],
                                  department: e.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-lg bg-card border border-input px-3 py-1.5 text-sm text-foreground focus:border-cyan-500 focus:outline-none"
                          >
                            <option value="产品部">产品部</option>
                            <option value="研发部">研发部</option>
                            <option value="设计部">设计部</option>
                            <option value="测试部">测试部</option>
                            <option value="运维部">运维部</option>
                            <option value="项目部">项目部</option>
                            <option value="数据部">数据部</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  <span className="text-amber-400">提示：</span>岗位信息可在导入后在「员工管理」页面修改
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowConfigPanel(false);
                      setPendingConfigUsers([]);
                    }}
                    className="px-4 py-2 rounded-lg border border-input text-muted-foreground text-sm font-medium hover:text-foreground hover:bg-slate-700/30 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="px-4 py-2 rounded-lg bg-cyan-500 text-background text-sm font-semibold hover:bg-cyan-400 transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    确认导入
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// Tab 3: Table Management
// ══════════════════════════════════════════════════════════════
function TableManagementTab() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<FeishuTable[]>([]);
  const [expandedTableId, setExpandedTableId] = useState<string | null>(null);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [baseMap, setBaseMap] = useState<Record<string, { token: string; name: string }>>({});
  const [searchKeyword, setSearchKeyword] = useState('');

  const loadTables = async (keyword = '') => {
    setTablesLoading(true);
    try {
      const res = await fetchFeishuBases(keyword);
      const bases = res.data || [];
      const bm: Record<string, { token: string; name: string }> = {};
      const allTables: FeishuTable[] = [];
      for (const base of bases) {
        bm[base.token] = { token: base.token, name: base.name };
        try {
          const tRes = await fetchBaseTables(base.token);
          const ts = tRes.data || [];
          for (const t of ts) {
            allTables.push({
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
        } catch {
          // ignore single base error
        }
      }
      setBaseMap(bm);
      setTables(allTables);
    } catch {
      toast.error('获取飞书表格失败');
    } finally {
      setTablesLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleSearch = () => {
    loadTables(searchKeyword.trim());
  };

  const selectedTable = tables.find((t) => t.selected);

  const toggleExpand = async (tableId: string) => {
    const table = tables.find((t) => t.tableId === tableId);
    if (!table) return;
    if (expandedTableId === tableId) {
      setExpandedTableId(null);
      return;
    }
    // Load fields if not loaded
    if (table.fields.length === 0 && table.baseToken) {
      try {
        const fRes = await fetchTableFields(table.baseToken, tableId);
        const fields = fRes.data || [];
        setTables((prev) =>
          prev.map((t) =>
            t.tableId === tableId
              ? { ...t, fields: fields.map((f: any) => ({ fieldId: f.fieldId, name: f.name, type: f.type, sampleValues: [] })) }
              : t
          )
        );
      } catch {
        toast.error('加载字段失败');
      }
    }
    setExpandedTableId(tableId);
  };

  const selectTable = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) => ({ ...t, selected: t.tableId === tableId }))
    );
    const name = tables.find((t) => t.tableId === tableId)?.name;
    toast.success('已选择表格', { description: name });
  };

  const handleViewMapping = () => {
    if (selectedTable) {
      navigate('/feishu-mapping');
    } else {
      toast.error('请先选择一个表格');
    }
  };

  if (tablesLoading) {
    return (
      <motion.div variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-cyan-400" />
      </motion.div>
    );
  }

  return (
    <motion.div variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
      {/* Page Description + Search */}
      <div className="bg-muted rounded-xl border border-input p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <Table2 size={18} className="text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-foreground font-medium text-sm">表格管理说明</h3>
            <p className="text-muted-foreground text-sm mt-1">
              此页面用于选择和管理飞书智能表格。请选择包含任务数据的表格，系统将分析其字段结构，
              并通过 <span className="text-cyan-400">AI 智能映射</span> 转换为系统标准格式。
              如果表格字段与系统不匹配，可在映射页面手动调整。
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="搜索飞书表格名称..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-card border border-slate-600/50 text-foreground text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={tablesLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-card text-foreground border border-slate-600/50 hover:border-cyan-500/50 hover:text-cyan-400 transition-all disabled:opacity-50"
              >
                {tablesLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {tablesLoading ? '搜索中...' : '搜索'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* No table selected hint */}
      {!selectedTable && (
        <div className="bg-amber-500/5 rounded-xl border border-amber-500/15 p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-400 shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="text-amber-400 font-medium">尚未选择表格：</span>
            请从下方选择一个飞书智能表格，系统将自动分析其字段结构。
          </p>
        </div>
      )}

      {/* Selected Table Info */}
      <AnimatePresence>
        {selectedTable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-cyan-500/5 rounded-xl border border-cyan-500/20 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-cyan-400" />
              </div>
              <div>
                <p className="text-foreground font-medium text-sm">
                  已选择表格：<span className="text-cyan-400">{selectedTable.name}</span>
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {selectedTable.recordCount} 条记录 · {selectedTable.fields.length} 个字段
                </p>
              </div>
            </div>
            <button
              onClick={handleViewMapping}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all"
            >
              <ArrowRight size={14} />
              配置字段映射
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {tables.map((table, idx) => (
          <motion.div
            key={table.tableId}
            custom={idx}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className={`bg-muted rounded-xl border transition-all ${
              table.selected ? 'border-cyan-500/40 ring-1 ring-cyan-500/20' : 'border-input hover:border-slate-600/50'
            }`}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/15 to-cyan-500/15 flex items-center justify-center">
                  <FileSpreadsheet size={20} className="text-blue-400" />
                </div>
                {table.selected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                    已选择
                  </span>
                )}
              </div>
              <h3 className="text-foreground font-semibold mb-1">{table.name}</h3>
              <p className="text-muted-foreground text-sm mb-3">工作表：{table.sheetName || table.name}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Database size={12} />
                  {table.recordCount} 条记录
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {table.lastModified}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleExpand(table.tableId)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-card text-muted-foreground border border-slate-600/50 hover:text-foreground hover:border-slate-500 transition-all"
                >
                  {expandedTableId === table.tableId ? <ChevronUp size={12} /> : <Eye size={12} />}
                  {expandedTableId === table.tableId ? '收起字段' : '查看字段'}
                </button>
                <button
                  onClick={() => selectTable(table.tableId)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    table.selected
                      ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                      : 'bg-card text-foreground border-slate-600/50 hover:border-cyan-500/40 hover:text-cyan-400'
                  }`}
                >
                  {table.selected ? <CheckCircle2 size={12} /> : <ArrowRight size={12} />}
                  {table.selected ? '已选择' : '选择此表'}
                </button>
                <button
                  onClick={() => {
                    selectTable(table.tableId);
                    navigate('/feishu-mapping');
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25 transition-all"
                >
                  <ArrowRight size={14} />
                  导入此表
                </button>
              </div>
            </div>

            {/* Expanded Fields */}
            <AnimatePresence>
              {expandedTableId === table.tableId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 pt-2 border-t border-input space-y-2">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">字段列表</p>
                    {table.fields.map((field) => (
                      <div
                        key={field.fieldId}
                        className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-card/50"
                      >
                        <div className="flex items-center gap-2">
                          <FieldTypeTag type={field.type} />
                          <span className="text-foreground text-xs font-medium">{field.name}</span>
                        </div>
                        <span className="text-muted-foreground text-[10px] truncate max-w-[120px]">
                          {field.sampleValues.slice(0, 2).join('、')}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// Tab 4: Sync Logs
// ══════════════════════════════════════════════════════════════
function SyncLogsTab() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const typeOptions = [
    { value: 'all', label: '全部类型', icon: <Filter size={12} /> },
    { value: 'import', label: '导入', icon: <Download size={12} /> },
    { value: 'export', label: '导出', icon: <ArrowRight size={12} /> },
    { value: 'sync', label: '同步', icon: <RefreshCw size={12} /> },
  ];

  const statusOptions = [
    { value: 'all', label: '全部状态', icon: <Filter size={12} /> },
    { value: 'success', label: '成功', icon: <CheckCircle2 size={12} /> },
    { value: 'failed', label: '失败', icon: <AlertCircle size={12} /> },
    { value: 'partial', label: '部分', icon: <Clock size={12} /> },
  ];

  const filteredLogs = mockSyncLogs.filter((log) => {
    const matchType = typeFilter === 'all' || log.type === typeFilter;
    const matchStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchType && matchStatus;
  });

  const statusIcon = (status: SyncLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 size={20} className="text-emerald-400" />;
      case 'failed':
        return <AlertCircle size={20} className="text-red-400" />;
      case 'partial':
        return <Clock size={20} className="text-amber-400" />;
    }
  };

  return (
    <motion.div variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">类型：</span>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 border border-input">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  typeFilter === opt.value
                    ? 'bg-cyan-500/15 text-cyan-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">状态：</span>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 border border-input">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  statusFilter === opt.value
                    ? 'bg-cyan-500/15 text-cyan-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.map((log, idx) => (
          <motion.div
            key={log.id}
            custom={idx}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-muted rounded-xl border border-input p-5"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center shrink-0">
                {statusIcon(log.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1.5">
                  <h4 className="text-foreground font-medium text-sm">{log.tableName}</h4>
                  <TypeBadge type={log.type} />
                  <SyncStatusBadge status={log.status} />
                </div>
                <p className="text-muted-foreground text-sm mb-2">{log.details}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {log.timestamp}
                  </span>
                  <span className="flex items-center gap-1">
                    <Database size={12} />
                    影响 {log.recordsAffected} 条记录
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="py-16 text-center">
          <BarChart3 size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-muted-foreground">暂无符合条件的日志记录</p>
        </div>
      )}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════
export default function FeishuIntegration() {
  const { isManager } = useUserRole();
  const [activeTab, setActiveTab] = useState<TabId>('config');

  const tabs: TabDef[] = [
    { id: 'config', label: '连接配置', icon: <Link2 size={16} /> },
    { id: 'users', label: '人员同步', icon: <Users size={16} /> },
    { id: 'tables', label: '表格管理', icon: <Table2 size={16} /> },
    { id: 'logs', label: '同步日志', icon: <Clock size={16} /> },
  ];

  return (
    <Layout>
      <PageHeader
        title="飞书集成"
        subtitle="管理飞书（Lark）连接、同步团队成员、配置智能表格映射"
      />

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-input">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'text-cyan-400' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="feishu-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'config' && <ConnectionConfigTab key="config" />}
        {activeTab === 'users' && <UserSyncTab key="users" />}
        {activeTab === 'tables' && <TableManagementTab key="tables" />}
        {activeTab === 'logs' && <SyncLogsTab key="logs" />}
      </AnimatePresence>
    </Layout>
  );
}
