import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Trophy,
  Swords,
  Receipt,
  Users,
  Headphones,
  Award,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  User,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { AdminRoleCode } from '@/types/auth.types';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
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
    roles: ['game_master', 'accountant'],
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
    name: 'DCC Curation',
    href: '/achievements',
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
  const { user, role, logout } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Filter navigation links based on logged-in administrator role
  const visibleNavItems = NAVIGATION_ITEMS.filter(
    (item) => role && item.roles.includes(role)
  );

  // Take the first 4 visible navigation items for mobile bottom bar; 5th is the "More" toggle
  const primaryMobileNav = visibleNavItems.slice(0, 4);

  return (
    <div className="flex min-h-screen bg-ktms-bg text-ktms-text">
      {/* ----------------- DESKTOP SIDEBAR (>= 1024px) ----------------- */}
      <aside className="hidden lg:flex w-60 flex-col justify-between border-r border-ktms-border bg-ktms-panel p-4 shrink-0 fixed inset-y-0 left-0 z-30">
        <div className="flex flex-col gap-6">
          <div className="px-2 pt-2 cursor-pointer" onClick={() => navigate('/')}>
            <BrandLogo size="md" />
          </div>

          <nav className="flex flex-col gap-1">
            <span className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-ktms-muted/70 mb-1">
              Desks
            </span>
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.href);

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition select-none ${
                    isActive
                      ? 'bg-ktms-cyan/10 text-ktms-cyan border border-ktms-cyan/30'
                      : 'text-ktms-muted hover:text-ktms-text hover:bg-ktms-surface'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-ktms-cyan' : 'text-ktms-muted'}`} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Staff Profile Footer */}
        <div className="border-t border-ktms-border pt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded bg-ktms-surface/40 border border-ktms-border/50">
            <div className="h-7 w-7 rounded bg-ktms-surface flex items-center justify-center text-ktms-cyan shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-ktms-text truncate">
                {user?.display_name || user?.full_name}
              </span>
              <span className="text-[10px] font-mono text-ktms-muted truncate uppercase">
                {role?.replace('_', ' ')}
              </span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-semibold text-ktms-muted hover:text-ktms-coral hover:bg-ktms-coral/10 border border-transparent hover:border-ktms-coral/30 transition select-none"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ----------------- MOBILE TOP BAR (< 1024px) ----------------- */}
      <div className="flex-1 flex flex-col lg:pl-60 min-w-0">
        <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-ktms-border bg-ktms-panel/95 backdrop-blur px-4 py-2.5 pt-safe">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <BrandLogo size="sm" />
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded text-ktms-muted hover:text-white hover:bg-ktms-surface transition min-h-touch min-w-touch flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Mobile Fullscreen Drawer for Additional Desks */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-30 bg-black/80 backdrop-blur-sm pt-16 p-4">
            <div className="flex flex-col gap-2 rounded-xl border border-ktms-border bg-ktms-panel p-4 shadow-2xl">
              <span className="text-[11px] font-mono uppercase tracking-widest text-ktms-muted px-2 py-1">
                Operational Desks
              </span>
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.href);

                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition ${
                      isActive
                        ? 'bg-ktms-cyan/10 text-ktms-cyan border border-ktms-cyan/30'
                        : 'text-ktms-muted hover:text-ktms-text hover:bg-ktms-surface'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}

              <div className="border-t border-ktms-border mt-3 pt-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center justify-center gap-2 px-3 py-2.5 rounded bg-ktms-coral/10 text-ktms-coral border border-ktms-coral/30 text-xs font-bold"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out ({user?.display_name})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- PRIMARY WORKSPACE CANVAS ----------------- */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-y-auto">
          {children}
        </main>

        {/* ----------------- MOBILE BOTTOM NAV BAR (< 1024px) ----------------- */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-ktms-border bg-ktms-panel/95 backdrop-blur px-2 py-1 pb-safe">
          {primaryMobileNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.href);

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded min-h-touch min-w-touch text-[10px] font-semibold transition ${
                  isActive ? 'text-ktms-cyan' : 'text-ktms-muted hover:text-ktms-text'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-ktms-cyan' : 'text-ktms-muted'}`} />
                <span className="truncate max-w-[64px]">{item.name}</span>
              </NavLink>
            );
          })}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded min-h-touch min-w-touch text-[10px] font-semibold text-ktms-muted hover:text-ktms-text"
          >
            <Menu className="h-5 w-5 text-ktms-muted" />
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
