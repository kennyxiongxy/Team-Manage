import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Bell, Shield, Palette, Globe, Smartphone,
  ChevronRight, Save, Camera, Mail, Phone, Building2,
  ToggleLeft, ToggleRight, Moon, Sun, Volume2
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import { useTheme } from '@/context/ThemeContext';
import { useUserRole } from '@/context/UserRoleContext';

function SettingSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden mb-4"
    >
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon size={16} className="text-primary" />
        </div>
        <h3 className="text-foreground font-semibold">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

function ToggleRow({ label, description, enabled, onToggle }: { label: string; description?: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div>
        <p className="text-sm text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button onClick={onToggle} className="transition-colors">
        {enabled ? (
          <ToggleRight size={36} className="text-[#22C55E]" />
        ) : (
          <ToggleLeft size={36} className="text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

export default function Settings() {
  const { user } = useUserRole();
  const { theme, toggleTheme } = useTheme();
  const [avatarHover, setAvatarHover] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    email: `${user.name}@company.com`,
    phone: '138****8888',
    department: user.department || '研发部',
  });

  const [notifications, setNotifications] = useState({
    taskReminder: true,
    aiSuggestion: true,
    weeklyReport: true,
    helpRequest: true,
    sound: false,
  });

  const [preferences, setPreferences] = useState({
    darkMode: theme === 'dark',
    compactView: false,
    language: 'zh-CN',
  });

  const handleSave = () => {
    toast.success('设置已保存', { description: '您的个人信息和偏好设置已更新' });
  };

  return (
    <Layout>
      <div className="mx-auto max-w-[800px] px-4 py-6 md:px-6 lg:px-8">
        <PageHeader title="个人设置" subtitle="管理您的个人信息和系统偏好" />

        {/* Profile Card */}
        <SettingSection title="个人信息" icon={User}>
          <div className="flex items-center gap-4 mb-4">
            <div
              className="relative w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-foreground cursor-pointer"
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
            >
              {user.name.charAt(0)}
              {avatarHover && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <Camera size={20} className="text-white" />
                </div>
              )}
            </div>
            <div>
              <p className="text-foreground font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.department || '研发部'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">ID: {user.id}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">姓名</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg bg-muted border border-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">邮箱</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg bg-muted border border-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">手机</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg bg-muted border border-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">部门</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full rounded-lg bg-muted border border-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="通知设置" icon={Bell}>
          <ToggleRow
            label="任务到期提醒"
            description="任务即将到期时推送通知"
            enabled={notifications.taskReminder}
            onToggle={() => setNotifications({ ...notifications, taskReminder: !notifications.taskReminder })}
          />
          <ToggleRow
            label="AI 建议推送"
            description="接收 AI 智能分析建议"
            enabled={notifications.aiSuggestion}
            onToggle={() => setNotifications({ ...notifications, aiSuggestion: !notifications.aiSuggestion })}
          />
          <ToggleRow
            label="周报日报提醒"
            description="定期提醒提交日报周报"
            enabled={notifications.weeklyReport}
            onToggle={() => setNotifications({ ...notifications, weeklyReport: !notifications.weeklyReport })}
          />
          <ToggleRow
            label="求助响应通知"
            description="当管理者回复您的求助时通知"
            enabled={notifications.helpRequest}
            onToggle={() => setNotifications({ ...notifications, helpRequest: !notifications.helpRequest })}
          />
          <ToggleRow
            label="声音提醒"
            description="启用通知声音"
            enabled={notifications.sound}
            onToggle={() => setNotifications({ ...notifications, sound: !notifications.sound })}
          />
        </SettingSection>

        {/* Preferences */}
        <SettingSection title="界面偏好" icon={Palette}>
          <ToggleRow
            label="深色模式"
            description="使用深色主题"
            enabled={theme === 'dark'}
            onToggle={() => {
              toggleTheme();
              toast.success(theme === 'dark' ? '已切换到浅色模式' : '已切换到深色模式');
            }}
          />
          <ToggleRow
            label="紧凑视图"
            description="减少页面间距，展示更多内容"
            enabled={preferences.compactView}
            onToggle={() => setPreferences({ ...preferences, compactView: !preferences.compactView })}
          />
        </SettingSection>

        {/* Security */}
        <SettingSection title="安全设置" icon={Shield}>
          <div className="flex items-center justify-between py-3 border-b border-border/50">
            <div>
              <p className="text-sm text-foreground">修改密码</p>
              <p className="text-xs text-muted-foreground mt-0.5">上次修改于 30 天前</p>
            </div>
            <button
              onClick={() => toast.info('密码修改功能开发中')}
              className="px-3 py-1.5 rounded-lg bg-muted border border-input text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              修改
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-foreground">两步验证</p>
              <p className="text-xs text-muted-foreground mt-0.5">提升账户安全性</p>
            </div>
            <button
              onClick={() => toast.info('两步验证功能开发中')}
              className="px-3 py-1.5 rounded-lg bg-muted border border-input text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              启用
            </button>
          </div>
        </SettingSection>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            保存设置
          </button>
        </div>
      </div>
    </Layout>
  );
}
