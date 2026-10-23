import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigation } from '@/hooks/useNavigation';
import { SidebarItem } from './SidebarItem';
import { ChevronLeft, ChevronRight, LogOut, X } from 'lucide-react';
import { useAuth } from '@/app/providers';
import type { MenuItem } from '@/features/menus/types/menu';
import { ROUTES } from '@/shared/constants/routes';
import logo2 from '@/assets/logo2.png';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  onLogout?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggle,
  onLogout,
  isMobileOpen = false,
  onMobileClose,
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
      <div className="mb-4 last:mb-0">
        {!isCollapsed && (
          <div className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#6B778C] mb-1.5 select-none">
            {title}
          </div>
        )}
        <div className="space-y-0.5">
          {items.map((item) => (
            <SidebarItem key={item.id} item={item} isCollapsed={isCollapsed} />
          ))}
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-[#091E42]">
      {/* Sidebar Header: 56px standard height matching topbar */}
      <div
        className={`h-14 px-4 border-b border-[#E5EAF0] flex items-center shrink-0 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!isCollapsed && (
          <Link to={ROUTES.DASHBOARD} className="flex items-center space-x-2 cursor-pointer" title="Go to Dashboard">
            <img
              src={logo2}
              alt="ALSM"
              className="h-7 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>
        )}

        {/* Mobile close button or Desktop collapse toggle */}
        <div className="flex items-center">
          {onMobileClose ? (
            <button
              type="button"
              onClick={onMobileClose}
              className="lg:hidden p-1.5 rounded-md text-[#6B778C] hover:text-[#091E42] hover:bg-[#F1F5F9] transition-colors"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}

          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="hidden lg:flex w-7 h-7 items-center justify-center rounded-md text-[#6B778C] hover:text-[#0652CC] hover:bg-[#F1F5F9] transition-colors"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Content Area */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 text-xs font-sans">
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
      <div className="p-2.5 border-t border-[#E5EAF0] bg-[#F8FAFC] flex flex-col space-y-1.5 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center space-x-2.5 px-2 py-1">
            <div className="w-7 h-7 rounded-full bg-[#0652CC] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate min-w-0">
              <p className="text-xs font-semibold text-[#091E42] truncate leading-tight">{user?.fullName || 'User Account'}</p>
              <p className="text-[10px] text-[#6B778C] truncate leading-tight mt-0.5">{user?.email || 'poc@alsm.io'}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onLogout}
          className={`w-full h-8 flex items-center rounded-md text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : 'px-2 space-x-2'
          }`}
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 border-r border-[#E5EAF0] transition-all duration-200 z-30 shrink-0 ${
          isCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#091E42]/40 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-64 max-w-[80vw] bg-white border-r border-[#E5EAF0] shadow-xl z-50 flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
