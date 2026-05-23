import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Menu, X, User, LogOut, Settings, Briefcase, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useUserRole } from '@/context/UserRoleContext';
import { useHelpRequests } from '@/context/HelpRequestContext';

const managerNavLinks = [
  { to: '/', label: '仪表盘' },
  { to: '/tasks', label: '任务' },
  { to: '/employees', label: '员工' },
  { to: '/help-requests', label: '求助' },
  { to: '/reports', label: '报告' },
  { to: '/team-analysis', label: '分析' },
  { to: '/ai-assistant', label: 'AI 助手' },
  { to: '/feishu', label: '工作软件集成' },
];

const employeeNavLinks = [
  { to: '/', label: '工作台' },
  { to: '/tasks', label: '我的任务' },
  { to: '/my-reports', label: '日报' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, switchRole, isManager, isEmployee, logout, isAuthenticated } = useUserRole();
  const { pendingCount } = useHelpRequests();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = isManager ? managerNavLinks : employeeNavLinks;

  const notifications: { id: number; text: string; type: string; time: string }[] = [];

  const handleSwitchRole = (role: 'manager' | 'employee') => {
    if (isAuthenticated) {
      toast.info('已登录状态下无法切换角色');
      setUserMenuOpen(false);
      return;
    }
    switchRole(role);
    setUserMenuOpen(false);
    toast.success(
      role === 'manager' ? '已切换至管理者视角' : '已切换至员工视角',
      { description: `当前角色：${role === 'manager' ? '管理者' : '员工'}` }
    );
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    toast.success('已退出登录');
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-xl border-b border-border z-50">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Logo + AI Status */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="统御" className="w-8 h-8" />
            <span className="text-h3 font-bold text-foreground hidden sm:block">统御</span>
          </Link>

          {/* Role Badge */}
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-caption font-medium ${
              isManager
                ? 'bg-[rgba(168,85,247,0.15)] text-[#A855F7]'
                : 'bg-accent/15 text-accent'
            }`}
          >
            {isManager ? <ShieldCheck size={12} /> : <Briefcase size={12} />}
            {isManager ? '管理者' : '员工'}
          </div>

          {/* AI Status Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[rgba(34,197,94,0.1)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
            </span>
            <span className="text-caption text-[#22C55E] font-medium hidden sm:block">AI 在线</span>
          </div>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 rounded-lg text-body font-medium transition-colors ${
                location.pathname === link.to
                  ? 'bg-muted text-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: Notifications + Avatar */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Bell size={18} className="text-muted-foreground" />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 bg-popover rounded-xl border border-border shadow-modal z-50 overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <h3 className="text-body font-semibold text-foreground">通知</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setNotifOpen(false);
                          toast.info(n.text);
                        }}
                        className="px-3 py-2.5 hover:bg-muted transition-colors cursor-pointer border-b border-border/50"
                      >
                        <p className="text-body text-foreground">{n.text}</p>
                        <p className="text-caption text-muted-foreground mt-0.5">{n.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-border">
                    <button
                      onClick={() => {
                        setNotifOpen(false);
                        toast.info('通知中心功能开发中');
                      }}
                      className="w-full text-center text-body text-primary hover:text-accent transition-colors py-1"
                    >
                      查看全部通知
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Avatar + Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 hover:bg-muted rounded-lg px-2 py-1 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-body font-semibold text-foreground">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-body text-foreground font-medium leading-none">{user.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{user.department}</p>
              </div>
              <ChevronDown
                size={14}
                className={`text-muted-foreground transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-60 bg-popover rounded-xl border border-border shadow-modal z-50 overflow-hidden">
                  {/* User Info */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-h3 font-semibold text-foreground">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-body font-semibold text-foreground">{user.name}</p>
                        <p className="text-caption text-muted-foreground">{user.department}</p>
                      </div>
                    </div>
                  </div>

                  {/* Role Switch */}
                  <div className="p-2 border-b border-border">
                    <p className="px-2 py-1 text-caption text-muted-foreground font-medium">切换角色</p>
                    <button
                      onClick={() => handleSwitchRole('manager')}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-body transition-colors ${
                        isManager
                          ? 'bg-[rgba(168,85,247,0.15)] text-[#A855F7]'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <ShieldCheck size={16} />
                      管理者视角
                      {isManager && <span className="ml-auto text-caption">当前</span>}
                    </button>
                    <button
                      onClick={() => handleSwitchRole('employee')}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-body transition-colors ${
                        isEmployee
                          ? 'bg-accent/15 text-accent'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <Briefcase size={16} />
                      员工视角
                      {isEmployee && <span className="ml-auto text-caption">当前</span>}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="p-2">
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-body text-foreground hover:bg-muted transition-colors"
                    >
                      <Settings size={16} className="text-muted-foreground" />
                      个人设置
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-body text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut size={16} />
                      退出登录
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {mobileMenuOpen ? <X size={20} className="text-foreground" /> : <Menu size={20} className="text-foreground" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-card border-b border-border px-4 py-3">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-body font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-muted text-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
