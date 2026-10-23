import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { MenuItem } from '@/features/menus/types/menu';
import { DynamicIcon } from './IconResolver';

export interface SidebarItemProps {
  item: MenuItem;
  isCollapsed?: boolean;
  depth?: number;
  onTrackUsage?: (id: string) => void;
  onPinToggle?: (id: string, isPinned: boolean) => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  isCollapsed = false,
  depth = 0,
  onTrackUsage,
  onPinToggle,
}) => {
  const location = useLocation();
  const hasChildren = Boolean(item.children && item.children.length > 0);

  // Check if current route matches item or any of its children
  const isChildActive = (node: MenuItem): boolean => {
    const currentPath = location.pathname;
    if (!node.path) return false;

    // Projects menu item only active on exact projects list page (/projects)
    if (node.id === 'projects') {
      return currentPath === '/projects' || currentPath === '/projects/';
    }

    // Screens menu item active when navigating inside screen workflows
    if (node.id === 'screens') {
      return (
        currentPath.includes('/screens') ||
        currentPath.includes('/upload') ||
        currentPath.includes('/conversions') ||
        currentPath.includes('/mapping') ||
        currentPath.includes('/preview') ||
        currentPath.includes('/review') ||
        currentPath.includes('/result')
      );
    }

    if (node.id === 'conversion') {
      return currentPath.includes('/bulk-convert');
    }

    if (currentPath === node.path) return true;
    if (node.path !== '/' && currentPath.startsWith(node.path)) return true;
    if (node.children) return node.children.some(isChildActive);
    return false;
  };

  const isActive = isChildActive(item);
  const [isExpanded, setIsExpanded] = useState<boolean>(isActive);

  useEffect(() => {
    if (isActive) {
      setIsExpanded(true);
    }
  }, [location.pathname, isActive]);

  if (item.isVisible === false) {
    return null;
  }

  // Consistent padding and border alignment across active & inactive states
  const paddingClass = isCollapsed
    ? 'px-0 justify-center'
    : depth === 0
    ? 'px-2.5 justify-between'
    : depth === 1
    ? 'pl-7 pr-2.5 justify-between'
    : 'pl-11 pr-2.5 justify-between';

  const getDynamicPath = (node: MenuItem): string => {
    if (node.id === 'screens') {
      const lastProjId = localStorage.getItem('last_active_project_id') || 'proj-acme';
      return `/projects/${lastProjId}/screens`;
    }
    if (node.id === 'diagnostics') {
      const lastProjId = localStorage.getItem('last_active_project_id') || 'proj-acme';
      return `/projects/${lastProjId}/diagnostics`;
    }
    return node.path || '#';
  };

  return (
    <div className="w-full">
      {hasChildren ? (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-full h-9 flex items-center text-xs font-semibold rounded-md transition-colors cursor-pointer border-l-2 ${paddingClass} ${
              isActive
                ? 'bg-[#E8F1FF] text-[#0652CC] border-[#0652CC] font-bold'
                : 'text-[#42526E] border-transparent hover:bg-[#F1F5F9] hover:text-[#091E42]'
            }`}
            title={isCollapsed ? item.label : undefined}
          >
            <div className="flex items-center space-x-2.5 truncate min-w-0">
              <DynamicIcon name={item.icon} className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0652CC]' : 'text-[#6B778C]'}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[#6B778C] shrink-0 ml-1">
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </span>
            )}
          </button>

          {!isCollapsed && isExpanded && item.children && (
            <div className="flex flex-col mt-0.5 space-y-0.5">
              {item.children.map((child) => (
                <SidebarItem
                  key={child.id}
                  item={child}
                  isCollapsed={isCollapsed}
                  depth={depth + 1}
                  onTrackUsage={onTrackUsage}
                  onPinToggle={onPinToggle}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <NavLink
          to={getDynamicPath(item)}
          onClick={() => onTrackUsage && onTrackUsage(item.id)}
          className={() =>
            `w-full h-9 flex items-center text-xs font-semibold rounded-md transition-all border-l-2 ${paddingClass} ${
              isActive
                ? 'bg-[#E8F1FF] text-[#0652CC] border-[#0652CC] font-bold'
                : 'text-[#42526E] border-transparent hover:bg-[#F1F5F9] hover:text-[#091E42]'
            }`
          }
          title={isCollapsed ? item.label : undefined}
        >
          <div className="flex items-center space-x-2.5 truncate min-w-0">
            <DynamicIcon name={item.icon} className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0652CC]' : 'text-[#6B778C]'}`} />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </div>
          {!isCollapsed && item.badge && (
            <span
              className="text-[9px] px-1.5 py-0.2 rounded text-white font-bold shrink-0 ml-1.5"
              style={{ backgroundColor: item.badgeColor || '#0652CC' }}
            >
              {item.badge}
            </span>
          )}
        </NavLink>
      )}
    </div>
  );
};

export default SidebarItem;
