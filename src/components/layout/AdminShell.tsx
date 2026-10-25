import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Trophy,
  Swords,
  Receipt,
  Users,
  Headphones,
  Award,
  ShieldAlert,
  LogOut,
  Bell,
  Menu,
  X,
  LucideIcon,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { NotificationBadge } from '@/components/feedback/NotificationBadge';
import { NotificationInboxDrawer } from '@/components/feedback/NotificationInboxDrawer';
import { AdminRoleCode } from '@/types/auth.types';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: AdminRoleCode[];
}

const NAVIGATION_ITEMS: NavItem[] = [
  {
    name: 'Tournaments',
    href: '/tournaments',
    icon: Trophy,
    roles: ['game_master', 'platform_manager', 'moderator'],
  },
  {
    name: 'Adjudication',
    href: '/disputes',
    icon: Swords,
    roles: ['game_master', 'platform_manager', 'moderator'],
  },
  {
    name: 'Finance Desk',
    href: '/finance',
    icon: Receipt,
    roles: ['game_master', 'accountant', 'platform_manager'],
  },
  {
    name: 'Disciplinary',
    href: '/players',
    icon: Users,
    roles: ['game_master', 'platform_manager', 'moderator'],
  },
  {
    name: 'Support Triage',
    href: '/support',
    icon: Headphones,
    roles: ['game_master', 'support', 'platform_manager', 'moderator', 'accountant'],
  },
  {
    name: 'DCC Reviews',
    href: '/achievements/reviews',
    icon: Award,
    roles: ['game_master', 'platform_manager', 'moderator'],
  },
  {
    name: 'Governance',
    href: '/governance',
    icon: ShieldAlert,
    roles: ['game_master', 'platform_manager'],
  },
];

export const AdminShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, role } = useAdminAuth();
  const { notifications, unreadCount } = useAdminNotifications();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const hasUrgent = notifications.some(
    (n) => n.read_status === 'Unread' && (n.notification_priority === 'URGENT' || n.notification_priority === 'HIGH')
  );

  const visibleNavItems = NAVIGATION_ITEMS.filter(
    (item) => role && item.roles.includes(role)
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ktms-bg text-ktms-text">
      <NotificationInboxDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-ktms-border bg-ktms-panel">
        <div className="flex h-16 items-center justify-between px-5 border-b border-ktms-border">
          <BrandLogo size="md" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ktms-cyan px-2 py-0.5 rounded bg-ktms-cyan/10 border border-ktms-cyan/30">
            Console
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                    isActive
                      ? 'bg-ktms-cyan/15 text-ktms-cyan border border-ktms-cyan/40 shadow-sm'
                      : 'text-ktms-muted hover:text-ktms-text hover:bg-ktms-surface'
                  }`
                }
              >
                <Icon size={16} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-ktms-border bg-ktms-surface/40">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-bold text-xs text-ktms-text block truncate max-w-[130px]">
                {user?.display_name || 'Staff Member'}
              </span>
              <span className="font-mono text-[10px] text-ktms-cyan block">
                {role?.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2 rounded-lg bg-ktms-panel border border-ktms-border text-ktms-muted hover:text-ktms-text hover:border-ktms-cyan transition"
              title="Incident Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <div className="absolute -top-1.5 -right-1.5">
                  <NotificationBadge count={unreadCount} hasUrgent={hasUrgent} />
                </div>
              )}
            </button>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded bg-ktms-panel hover:bg-ktms-coral/15 hover:text-ktms-coral border border-ktms-border text-xs text-ktms-muted transition"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="flex h-14 items-center justify-between px-4 lg:px-6 border-b border-ktms-border bg-ktms-panel shrink-0">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <BrandLogo size="sm" />
            </div>
            <span className="text-xs font-mono text-ktms-muted hidden sm:inline">
              KTMS Automated Operations
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2 rounded-lg bg-ktms-surface border border-ktms-border text-ktms-muted hover:text-ktms-text hover:border-ktms-cyan transition"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <div className="absolute -top-1.5 -right-1.5">
                  <NotificationBadge count={unreadCount} hasUrgent={hasUrgent} />
                </div>
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-ktms-surface border border-ktms-border text-ktms-muted"
            >
              {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </header>

        {isMobileMenuOpen && (
          <div className="lg:hidden border-b border-ktms-border bg-ktms-panel p-3 space-y-1 shrink-0">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold uppercase tracking-wider ${
                      isActive ? 'bg-ktms-cyan/15 text-ktms-cyan' : 'text-ktms-muted'
                    }`
                  }
                >
                  <Icon size={15} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded text-xs text-ktms-coral mt-2 border-t border-ktms-border"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-ktms-bg">
          {children}
        </main>
      </div>
    </div>
  );
};
