import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useNavigation } from '@/hooks/useNavigation';
import { SidebarItem } from './SidebarItem';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '@/app/providers';
import type { MenuItem } from '@/features/menus/types/menu';
import { ROUTES } from '@/shared/constants/routes';

import logo2 from '@/assets/logo2.png';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  onLogout?: () => void;
}

interface NavSection {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggle,
  onLogout,
}) => {
  const { sidebarNav, loading } = useNavigation();
  const { user } = useAuth();

  // Dynamically group items into sections
  const sections = useMemo(() => {
    const result: NavSection[] = [];
    const mainItems: MenuItem[] = [];

    for (const item of sidebarNav) {
      if (item.isVisible === false) continue;

      // Account group or items: unpack children directly under ACCOUNT section header (no redundant "Account" item inside "ACCOUNT")
      const isAccountGroup =
        item.category === 'ACCOUNT' ||
        item.id === 'settings' ||
        item.id.includes('group_account') ||
        item.label.toLowerCase() === 'account';

      if (isAccountGroup && item.children && item.children.length > 0) {
        let existing = result.find((s) => s.title === 'ACCOUNT');
        if (!existing) {
          existing = { title: 'ACCOUNT', items: [] };
          result.push(existing);
        }
        for (const child of item.children) {
          if (
            child.isVisible !== false &&
            !existing.items.some((i) => i.id === child.id || (i.path && child.path && i.path === child.path))
          ) {
            existing.items.push(child);
          }
        }
      } else if (isAccountGroup) {
        // Only push if it has an actual navigable route (never push container group itself)
        if (item.path && item.path !== '#') {
          let existing = result.find((s) => s.title === 'ACCOUNT');
          if (!existing) {
            existing = { title: 'ACCOUNT', items: [] };
            result.push(existing);
          }
          if (!existing.items.some((i) => i.id === item.id || (i.path && i.path === item.path))) {
            existing.items.push(item);
          }
        }
      } else if ((!item.path || item.path === '#') && item.children && item.children.length > 0) {
        // Top-level custom group with children and without direct path
        result.push({
          title: item.label.toUpperCase(),
          items: item.children.filter((c) => c.isVisible !== false),
        });
      } else if (item.category && item.category !== 'MAIN') {
        let existing = result.find((s) => s.title === item.category);
        if (!existing) {
          existing = { title: item.category, items: [] };
          result.push(existing);
        }
        if (!existing.items.some((i) => i.id === item.id || (i.path && item.path && i.path === item.path))) {
          existing.items.push(item);
        }
      } else {
        if (!mainItems.some((i) => i.id === item.id || (i.path && item.path && i.path === item.path))) {
          mainItems.push(item);
        }
      }
    }

    if (mainItems.length > 0) {
      result.unshift({
        title: 'MAIN',
        items: mainItems,
      });
    }

    // Canonical ordering: MAIN -> Custom Groups (e.g. ENTERPRISE ORGANISATION) -> RESOURCES (Documents) -> ACCOUNT
    const customGroups = Array.from(
      new Set(
        result
          .map((s) => s.title)
          .filter((t) => t !== 'MAIN' && t !== 'RESOURCES' && t !== 'ACCOUNT')
      )
    );
    const fullOrder = ['MAIN', ...customGroups, 'RESOURCES', 'ACCOUNT'];

    return fullOrder
      .map((title) => result.find((s) => s.title === title))
      .filter((s): s is NavSection => Boolean(s && s.items.length > 0));
  }, [sidebarNav]);

  const renderSection = (title: string, items: MenuItem[]) => {
    if (items.length === 0) return null;
    return (
      <div key={title} className="mb-5 last:mb-0">
        {!isCollapsed && (
          <div className="px-2.5 text-xs font-bold uppercase tracking-wider text-[#475569] mb-2 select-none">
            {title}
          </div>
        )}
        <div className="space-y-1">
          {items.map((item) => (
            <SidebarItem key={item.id} item={item} isCollapsed={isCollapsed} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <aside
      className={`bg-white text-[#0F172A] flex flex-col h-screen sticky top-0 border-r border-[#E2E8F0] z-30 shrink-0 font-heading ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Sidebar Top Header Logo */}
      <div
        className={`border-b border-[#E2E8F0] flex items-center box-border h-[var(--app-header-height,64px)] min-h-[var(--app-header-height,64px)] ${
          isCollapsed ? 'justify-center px-0' : 'justify-between px-5'
        }`}
        style={{
          height: 'var(--app-header-height, 64px)',
          minHeight: 'var(--app-header-height, 64px)',
          boxSizing: 'border-box',
        }}
      >
        {!isCollapsed && (
          <Link to={ROUTES.DASHBOARD} className="flex items-center flex-1 overflow-visible cursor-pointer" title="Go to Dashboard">
            <img
              src={logo2}
              alt="ALSM"
              className="w-[82px] h-auto object-contain scale-[1.6] origin-left hover:opacity-90 transition-opacity"
            />
          </Link>
        )}

        <button
          type="button"
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg
               text-[#64748B]
               hover:text-[#2563EB]
               hover:bg-[#EFF6FF]
               transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Content Area */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 text-sm font-heading">
        {loading ? (
          <div className="p-4 text-xs text-[#64748B] text-center">Loading Menu...</div>
        ) : (
          sections.map((section) => renderSection(section.title, section.items))
        )}
      </nav>

      {/* Bottom Sidebar Footer: User Avatar & Sign Out */}
      <footer className="p-3 border-t border-[#E2E8F0] flex flex-col space-y-2 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center space-x-2.5 px-2 py-1.5 w-full min-w-0 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-bold text-xs flex items-center justify-center shrink-0">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
            </div>
            <div className="flex-1 w-0 min-w-0 overflow-hidden">
              <p className="text-sm font-bold text-[#0F172A] truncate leading-tight">{user?.fullName || user?.email?.split('@')[0] || 'User Account'}</p>
              <p className="text-xs font-normal text-[#64748B] truncate leading-tight mt-0.5 block overflow-hidden" title={user?.email || 'partner@alsm.io'}>
                {user?.email ? (user.email.length > 22 ? `${user.email.slice(0, 19)}...` : user.email) : 'partner@alsm.io'}
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onLogout}
          className={`w-full h-9 flex items-center rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : 'px-2.5 space-x-2.5'
          }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </footer>
    </aside>
  );
};

export default Sidebar;
