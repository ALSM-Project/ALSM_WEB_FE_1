import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useNavigation } from '@/hooks/useNavigation';
import { SidebarItem } from './SidebarItem';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
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

  // Dynamically group items into sections
  const sections = useMemo(() => {
    const result: NavSection[] = [];
    const seenPaths = new Set<string>();
    const mainItems: MenuItem[] = [];
    const sectionOrderMap = new Map<string, number>();
    sectionOrderMap.set('MAIN', 1);

    const normalizeSectionTitle = (raw: string): string => {
      const upper = raw.trim().toUpperCase();
      if (
        upper === 'SERVICE' ||
        upper === 'CONTRACT & BILLING' ||
        upper === 'SERVICE & CONTRACT' ||
        upper === 'BILLING'
      ) {
        return 'CONTRACT & BILLING';
      }
      return upper;
    };

    for (const item of sidebarNav) {
      if (item.isVisible === false) continue;

      // Top level standalone root item (e.g. Dashboard)
      const isRootStandalone =
        (!item.parentId || item.parentId === '') &&
        item.path &&
        item.path !== '#' &&
        (!item.children || item.children.length === 0) &&
        (item.id.includes('dashboard') || !item.category || item.category === '' || item.category === 'MAIN');

      if (isRootStandalone && item.path) {
        let existing = result.find((s) => s.title === '');
        if (!existing) {
          existing = { title: '', items: [] };
          result.push(existing);
        }
        const itemPath = item.path.toLowerCase();
        if (!seenPaths.has(itemPath)) {
          seenPaths.add(itemPath);
          existing.items.push(item);
        }
        continue;
      }

      // Service / Contract & Billing group: unpack children directly under CONTRACT & BILLING section header
      const isServiceGroup =
        item.category === 'SERVICE' ||
        item.category === 'CONTRACT & BILLING' ||
        item.id === 'service-group' ||
        item.id === 'web1_group_service' ||
        item.id === 'web1_group_contract_billing' ||
        item.label.toLowerCase() === 'service' ||
        item.label.toLowerCase() === 'contract & billing';

      if (isServiceGroup && item.children && item.children.length > 0) {
        sectionOrderMap.set('CONTRACT & BILLING', item.order ?? 3);
        let existing = result.find((s) => s.title === 'CONTRACT & BILLING');
        if (!existing) {
          existing = { title: 'CONTRACT & BILLING', items: [] };
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
      } else if (isServiceGroup) {
        if (item.path && item.path !== '#') {
          sectionOrderMap.set('CONTRACT & BILLING', item.order ?? 3);
          let existing = result.find((s) => s.title === 'CONTRACT & BILLING');
          if (!existing) {
            existing = { title: 'CONTRACT & BILLING', items: [] };
            result.push(existing);
          }
          if (!existing.items.some((i) => i.id === item.id || (i.path && item.path && i.path === item.path))) {
            existing.items.push(item);
          }
        }
      } else if (
        item.category === 'ACCOUNT' ||
        item.id === 'settings' ||
        item.id.includes('group_account') ||
        item.label.toLowerCase() === 'account'
      ) {
        sectionOrderMap.set('ACCOUNT', item.order ?? 5);
        if (item.children && item.children.length > 0) {
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
        } else if (item.path && item.path !== '#') {
          let existing = result.find((s) => s.title === 'ACCOUNT');
          if (!existing) {
            existing = { title: 'ACCOUNT', items: [] };
            result.push(existing);
          }
          if (!existing.items.some((i) => i.id === item.id || (i.path && item.path && i.path === item.path))) {
            existing.items.push(item);
          }
        }
      } else if ((!item.path || item.path === '#') && item.children && item.children.length > 0) {
        const groupTitle = normalizeSectionTitle(item.label);
        sectionOrderMap.set(groupTitle, item.order ?? 4);
        let existing = result.find((s) => s.title === groupTitle);
        if (!existing) {
          existing = { title: groupTitle, items: [] };
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
      } else if (item.category && item.category !== 'MAIN') {
        const groupTitle = normalizeSectionTitle(item.category);
        if (!sectionOrderMap.has(groupTitle)) {
          sectionOrderMap.set(groupTitle, item.order ?? 4);
        }
        let existing = result.find((s) => s.title === groupTitle);
        if (!existing) {
          existing = { title: groupTitle, items: [] };
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

    // Sort main items strictly by order
    mainItems.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (mainItems.length > 0) {
      result.unshift({
        title: '',
        items: mainItems,
      });
    }

    // Sort items inside EVERY section strictly by item.order
    for (const section of result) {
      section.items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    // Section ordering priority: '' (0) -> ORGANIZATION (1) -> CONTRACT & BILLING (2) -> COLLABORATION (3) -> ACCOUNT (4)
    const getSectionPriority = (title: string): number => {
      if (title === '' || title === 'TOP') return 0;
      if (title === 'ORGANIZATION') return 1;
      if (title === 'CONTRACT & BILLING') return 2;
      if (title === 'COLLABORATION') return 3;
      if (title === 'ACCOUNT') return 4;
      if (sectionOrderMap.has(title)) return sectionOrderMap.get(title)!;
      return 10;
    };

    result.sort((a, b) => getSectionPriority(a.title) - getSectionPriority(b.title));

    return result.filter((s) => s.items.length > 0);
  }, [sidebarNav]);

  const renderSection = (title: string, items: MenuItem[]) => {
    if (items.length === 0) return null;
    const showHeader = !isCollapsed && title.trim() !== '' && title !== 'MAIN' && title !== 'TOP';
    return (
      <div key={title || 'top'} className="mb-5 last:mb-0">
        {showHeader && (
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
          aria-label={isCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
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

      {/* Bottom Sidebar Footer: Sign Out */}
      <footer className="p-3 border-t border-[#E2E8F0] shrink-0">
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
