import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Briefcase, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUserRole } from '@/context/UserRoleContext';
import { login } from '@/api/client';

export default function Login() {
  const navigate = useNavigate();
  const { login: doLogin } = useUserRole();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleTab, setRoleTab] = useState<'manager' | 'employee'>('manager');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('请填写邮箱和密码');
      return;
    }
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success && res.data) {
        const { token, user } = res.data;
        doLogin(token, {
          id: user.id,
          name: user.name,
          role: user.role as 'manager' | 'employee',
          avatar: user.avatarUrl || '',
          department: user.department || '',
          email: user.email,
        });
        toast.success(`欢迎回来，${user.name}`);
        navigate('/');
      } else {
        toast.error(res.data?.message || '登录失败');
      }
    } catch (err: any) {
      toast.error(err.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'manager' | 'employee') => {
    setRoleTab(role);
    if (role === 'manager') {
      setEmail('manager@example.com');
      setPassword('admin123');
    } else {
      setEmail('wangfang@example.com');
      setPassword('123456');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card rounded-2xl border border-border p-8 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
            <img src="/logo.svg" alt="统御" className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">统御</h1>
          <p className="text-sm text-muted-foreground mt-1">团队智能管理平台</p>
        </div>

        {/* Role Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => fillDemo('manager')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              roleTab === 'manager'
                ? 'bg-[rgba(168,85,247,0.15)] text-[#A855F7] border border-[rgba(168,85,247,0.3)]'
                : 'bg-muted text-muted-foreground border border-border hover:text-foreground'
            }`}
          >
            <ShieldCheck size={16} />
            管理者
          </button>
          <button
            type="button"
            onClick={() => fillDemo('employee')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              roleTab === 'employee'
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'bg-muted text-muted-foreground border border-border hover:text-foreground'
            }`}
          >
            <Briefcase size={16} />
            员工
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">密码</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-4 py-2.5 pr-10 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          默认账号：manager@example.com / admin123（管理者）<br />
          wangfang@example.com / 123456（员工）
        </p>
      </motion.div>
    </div>
  );
}
