import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { SidebarItem } from './SidebarItem';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '@/app/providers';
import type { MenuItem } from '@/features/menus/types/menu';

import logo2 from '@/assets/logo2.png';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggle,
  onLogout,
}) => {
  const { sidebarNav, loading } = useNavigation();
  const { user } = useAuth();

  // Group items by category
  const mainItems = sidebarNav.filter((i) => !i.category || i.category === 'MAIN');
  const resourceItems = sidebarNav.filter((i) => i.category === 'RESOURCES');
  const accountItems = sidebarNav.filter((i) => i.category === 'ACCOUNT');

  const renderSection = (title: string, items: MenuItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-5 last:mb-0">
        {!isCollapsed && (
          <div className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#6B778C] mb-2 select-none">
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
      className={`bg-white text-[#091E42] flex flex-col h-screen sticky top-0 border-r border-[#E5EAF0] transition-all duration-300 z-30 shrink-0 shadow-2xs ${isCollapsed ? 'w-16' : 'w-60'
        }`}
    >
      {/* Sidebar Top Header Logo */}
      <div
        className={`h-[76px] px-5 border-b border-[#E5EAF0] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'
          }`}
      >
        {!isCollapsed && (
          <div className="flex items-center flex-1 overflow-visible">
            <img
              src={logo2}
              alt="ALSM"
              className="w-[82px] h-auto object-contain scale-[1.6] origin-left"
            />
          </div>
        )}

        <button
          type="button"
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg
               text-[#6B778C]
               hover:text-[#0652CC]
               hover:bg-[#E8F1FF]
               transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
      {/* Navigation Content Area */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 text-xs font-sans">
        {loading ? (
          <div className="p-4 text-xs text-[#6B778C] text-center">Loading Menu...</div>
        ) : (
          <>
            {renderSection('MAIN', mainItems)}
            {renderSection('RESOURCES', resourceItems)}
            {renderSection('ACCOUNT', accountItems)}
          </>
        )}
      </nav>

      {/* Bottom Sidebar Footer: User Avatar & Sign Out */}
      <div className="p-3 border-t border-[#E5EAF0] bg-[#F8FAFC] flex flex-col space-y-2 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center space-x-2.5 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-[#0652CC] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate min-w-0">
              <p className="text-xs font-bold text-[#091E42] truncate leading-tight">{user?.fullName || 'User Account'}</p>
              <p className="text-[10px] font-normal text-[#6B778C] truncate leading-tight mt-0.5">{user?.email || 'poc@alsm.io'}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onLogout}
          className={`w-full h-9 flex items-center rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ${isCollapsed ? 'justify-center px-0' : 'px-2.5 space-x-2.5'
            }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
