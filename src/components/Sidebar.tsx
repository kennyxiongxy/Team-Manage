import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardList,
  Bot,
  FileText,
  BarChart3,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Award,
} from 'lucide-react';

import { useUserRole } from '@/context/UserRoleContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const managerNavGroups: NavGroup[] = [
  {
    title: '核心',
    items: [
      { to: '/', label: '仪表盘', icon: LayoutDashboard },
      { to: '/tasks', label: '任务中心', icon: ClipboardList },
      { to: '/employees', label: '员工管理', icon: Users },
      { to: '/ai-assistant', label: 'AI 助手', icon: Bot },
    ],
  },
  {
    title: '数据',
    items: [
      { to: '/reports', label: '日报周报', icon: FileText },
      { to: '/team-analysis', label: '团队分析', icon: BarChart3 },
      { to: '/help-requests', label: '求助管理', icon: AlertTriangle },
    ],
  },
  {
    title: '设置',
    items: [
      { to: '/settings', label: '个人设置', icon: Settings },
    ],
  },
];

const employeeNavGroups: NavGroup[] = [
  {
    title: '个人',
    items: [
      { to: '/', label: '工作台', icon: LayoutDashboard },
      { to: '/tasks', label: '我的任务', icon: ClipboardList },
      { to: '/my-reports', label: '日报', icon: FileText },
    ],
  },
  {
    title: '成长',
    items: [
      { to: '/performance', label: '绩效', icon: Award },
      { to: '/settings', label: '设置', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { isEmployee } = useUserRole();

  const navGroups = isEmployee ? employeeNavGroups : managerNavGroups;

  return (
    <aside
      className={`fixed left-0 top-16 bottom-0 bg-sidebar border-r border-sidebar-border z-40 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Navigation Groups */}
      <div className="py-4 px-3 space-y-6 overflow-y-auto h-[calc(100%-48px)]">
        {navGroups.map((group) => (
          <div key={group.title}>
            {/* Group Title */}
            {!collapsed && (
              <h3 className="text-caption text-sidebar-foreground/70 uppercase tracking-wider px-3 mb-2 font-semibold">
                {group.title}
              </h3>
            )}
            {collapsed && (
              <div className="w-full h-px bg-sidebar-border mb-2" />
            )}

            {/* Group Items */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.to;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative
                      ${isActive
                        ? 'bg-sidebar-accent text-accent'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                      }
                      ${collapsed ? 'justify-center' : ''}
                    `}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-accent rounded-r-full"
                      />
                    )}

                    <Icon size={18} className="flex-shrink-0" />

                    {!collapsed && (
                      <span className="text-body font-medium whitespace-nowrap overflow-hidden">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Collapse Toggle */}
      <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          title={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="text-caption ml-1">收起</span>}
        </button>
      </div>
    </aside>
  );
}
