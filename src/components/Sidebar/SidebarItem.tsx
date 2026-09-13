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
    if (node.path && (location.pathname === node.path || (node.path !== '/' && location.pathname.startsWith(node.path)))) {
      return true;
    }
    if (node.children) {
      return node.children.some(isChildActive);
    }
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

  return (
    <div className="w-full">
      {hasChildren ? (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-full h-9 flex items-center text-xs font-semibold rounded-lg transition-colors cursor-pointer border-l-4 ${paddingClass} ${
              isActive
                ? 'bg-[#E8F1FF] text-[#0652CC] border-[#0652CC] font-bold shadow-2xs'
                : 'text-[#42526E] border-transparent hover:bg-[#F7F9FC] hover:text-[#091E42]'
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
            <div className="flex flex-col mt-1 space-y-1">
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
          to={item.path || '#'}
          onClick={() => onTrackUsage && onTrackUsage(item.id)}
          className={({ isActive: linkActive }) =>
            `w-full h-9 flex items-center text-xs font-medium rounded-lg transition-all border-l-4 ${paddingClass} ${
              linkActive
                ? 'bg-[#E8F1FF] text-[#0652CC] border-[#0652CC] font-bold shadow-2xs'
                : 'text-[#42526E] border-transparent hover:bg-[#F7F9FC] hover:text-[#091E42]'
            }`
          }
          title={isCollapsed ? item.label : undefined}
        >
          <div className="flex items-center space-x-2.5 truncate min-w-0">
            <DynamicIcon name={item.icon} className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </div>
          {!isCollapsed && item.badge && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold shrink-0 ml-1.5"
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
