import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, CheckCircle2, AlertCircle, Key, Settings, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';

const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

// ─── Types ───

interface PlatformConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgClass: string;
  status: 'connected' | 'disconnected';
  description: string;
  appId?: string;
}

const platforms: PlatformConfig[] = [
  {
    id: 'feishu',
    name: '飞书',
    icon: '🐦',
    color: '#3370FF',
    bgClass: 'from-[#3370FF]/15 to-[#3370FF]/5',
    status: 'connected',
    description: '连接飞书（Lark）智能体，同步通讯录、表格、审批等数据',
    appId: 'cli_a7b3c8d2',
  },
  {
    id: 'dingtalk',
    name: '钉钉',
    icon: '📌',
    color: '#0089FF',
    bgClass: 'from-[#0089FF]/15 to-[#0089FF]/5',
    status: 'disconnected',
    description: '连接钉钉智能体，同步组织架构、DING 消息、OA 审批等',
  },
  {
    id: 'wechat',
    name: '企业微信',
    icon: '💬',
    color: '#07C160',
    bgClass: 'from-[#07C160]/15 to-[#07C160]/5',
    status: 'disconnected',
    description: '连接企业微信智能体，同步客户联系、群聊、日程等',
  },
];

// ─── Platform Card ───

function PlatformCard({ platform }: { platform: PlatformConfig }) {
  const [expanded, setExpanded] = useState(false);
  const isConnected = platform.status === 'connected';

  const handleConnect = (id: string) => {
    if (id === 'feishu') {
      toast.info('飞书连接配置已在原页面中设置，点击展开查看详情');
      return;
    }
    toast.info(`${platform.name} 集成功能开发中，敬请期待`);
  };

  const handleDisconnect = (id: string) => {
    toast.info(`${platform.name} 断开连接功能开发中`);
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease }}
      className="rounded-2xl bg-card border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.bgClass} border flex items-center justify-center text-2xl`}
              style={{ borderColor: platform.color + '33' }}
            >
              {platform.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{platform.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{platform.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                isConnected
                  ? 'bg-[rgba(34,197,94,0.1)] text-[#22C55E] border border-[rgba(34,197,94,0.2)]'
                  : 'bg-muted text-muted-foreground border border-border'
              }`}
            >
              {isConnected ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  已连接
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  未连接
                </>
              )}
            </div>

            {/* Connect/Disconnect Button */}
            {isConnected ? (
              <button
                onClick={() => handleDisconnect(platform.id)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive border border-border hover:border-destructive/30 transition-colors"
              >
                断开连接
              </button>
            ) : (
              <button
                onClick={() => handleConnect(platform.id)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-white transition-all"
                style={{
                  background: `linear-gradient(135deg, ${platform.color}, ${platform.color}cc)`,
                }}
              >
                连接
              </button>
            )}

            {/* Expand Toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              className={`p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all ${
                expanded ? 'rotate-180' : ''
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Config Area */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-t border-border bg-muted/30 px-6 py-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* App ID */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                <Key className="h-3 w-3" />
                App ID / Client ID
              </label>
              <input
                type="text"
                defaultValue={platform.appId || ''}
                placeholder="输入 App ID..."
                className="w-full rounded-lg bg-card border border-border px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-accent transition-colors"
              />
            </div>

            {/* App Secret */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                <Key className="h-3 w-3" />
                App Secret
              </label>
              <input
                type="password"
                defaultValue={isConnected ? '••••••••••••••••' : ''}
                placeholder="输入 App Secret..."
                className="w-full rounded-lg bg-card border border-border px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Agent Config */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-3">
              <Settings className="h-3 w-3" />
              智能体配置
            </h4>
            <div className="space-y-2">
              <label className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground">自动同步人员</span>
                <input type="checkbox" defaultChecked={isConnected} className="toggle" />
              </label>
              <label className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground">自动同步任务</span>
                <input type="checkbox" defaultChecked={isConnected} className="toggle" />
              </label>
              <label className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground">自动同步项目</span>
                <input type="checkbox" defaultChecked={isConnected} className="toggle" />
              </label>
              <label className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground">AI 每日报告</span>
                <input type="checkbox" className="toggle" />
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              onClick={() => setExpanded(false)}
              className="px-4 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => {
                toast.success(`${platform.name} 配置已保存`);
                setExpanded(false);
              }}
              className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-accent hover:bg-accent/90 transition-colors"
            >
              保存配置
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Main Page ───

export default function FeishuIntegration() {
  return (
    <Layout>
      <PageHeader
        title="工作软件集成"
        subtitle="配置飞书、钉钉、企业微信的智能体连接，实现数据自动同步与 AI 智能管理"
      />

      <div className="space-y-4">
        {platforms.map((p) => (
          <PlatformCard key={p.id} platform={p} />
        ))}

        {/* Coming Soon Hint */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3, ease }}
          className="rounded-2xl bg-muted/50 border border-dashed border-border p-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            更多平台集成即将上线——
            <span className="text-foreground/60">Slack</span>
            {' · '}
            <span className="text-foreground/60">Teams</span>
            {' · '}
            <span className="text-foreground/60">Notion</span>
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
