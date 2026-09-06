import React from 'react';
import type { MenuItem } from '../../features/menus/types/menu';

interface SidebarItemProps {
  item: MenuItem;
  isCollapsed?: boolean;
  isHovered?: boolean;
  onHover?: () => void;
  onLeave?: () => void;
  onClick?: () => void;
  onPinToggle?: (itemId: string, isPinned: boolean) => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  isCollapsed = false,
  isHovered = false,
  onHover,
  onLeave,
  onClick,
  onPinToggle,
}) => {
  const handleClick = () => {
    if (onClick) onClick();
  };

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onPinToggle) {
      onPinToggle(item.id, !item.isPinned);
    }
  };

  return (
    <div
      className={`sidebar-item ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={handleClick}
    >
      <a href={item.path || '#'} className="sidebar-link" title={isCollapsed ? item.label : undefined}>
        {item.icon && <span className={`sidebar-icon icon-${item.icon}`} />}
        {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
        {!isCollapsed && item.badge && (
          <span
            className="sidebar-badge"
            style={{ backgroundColor: item.badgeColor || '#3b82f6' }}
          >
            {item.badge}
          </span>
        )}
      </a>
      {!isCollapsed && onPinToggle && (
        <button
          className={`pin-btn ${item.isPinned ? 'pinned' : ''}`}
          onClick={handlePinClick}
          title={item.isPinned ? 'Bỏ ghim' : 'Ghim vào danh mục'}
        >
          📌
        </button>
      )}
    </div>
  );
};
