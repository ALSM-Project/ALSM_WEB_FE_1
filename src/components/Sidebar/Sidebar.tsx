import React, { useState } from 'react';
import { useNavigation } from '../../hooks/useNavigation';
import { SidebarItem } from './SidebarItem';
import { SidebarGroup } from './SidebarGroup';
import './Sidebar.css';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggle,
  onOpenCommandPalette,
}) => {
  const { navigation, loading, trackMenuItemUsage, pinMenuItem, unpinMenuItem } = useNavigation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  if (loading && !navigation) {
    return (
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-loading">Đang tải Menu...</div>
      </aside>
    );
  }

  const { sidebarNav, personalization } = navigation || {
    sidebarNav: [
      { id: 'dashboard', label: 'Dashboard', path: '/', isVisible: true },
      { id: 'projects', label: 'Dự án', path: '/projects', isVisible: true },
      { id: 'billing', label: 'Billing', path: '/billing/pricing', isVisible: true },
    ],
    personalization: { pinnedItems: [], recentItems: [], suggestedItems: [] },
  };

  const handlePinToggle = (itemId: string, isPinned: boolean) => {
    if (isPinned) {
      pinMenuItem(itemId);
    } else {
      unpinMenuItem(itemId);
    }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">⚡</span>
          {!isCollapsed && <span className="logo-text">ALSM Modernize</span>}
        </div>
        <button className="toggle-btn" onClick={onToggle} title="Thu gọn / Mở rộng">
          {isCollapsed ? '➔' : '⬅'}
        </button>
      </div>

      {/* Command Palette Trigger */}
      {!isCollapsed && onOpenCommandPalette && (
        <div className="command-palette-trigger" onClick={onOpenCommandPalette}>
          <span>🔍 Tìm kiếm lệnh...</span>
          <kbd>Ctrl K</kbd>
        </div>
      )}

      <nav className="sidebar-nav">
        {/* Pinned Items */}
        {!isCollapsed && personalization.pinnedItems && personalization.pinnedItems.length > 0 && (
          <SidebarGroup title="📌 Đã ghim" isCollapsed={isCollapsed}>
            {personalization.pinnedItems.map(item => (
              <SidebarItem
                key={`pinned-${item.id}`}
                item={item}
                isCollapsed={isCollapsed}
                isHovered={hoveredItem === `pinned-${item.id}`}
                onHover={() => setHoveredItem(`pinned-${item.id}`)}
                onLeave={() => setHoveredItem(null)}
                onClick={() => trackMenuItemUsage(item.id)}
                onPinToggle={handlePinToggle}
              />
            ))}
          </SidebarGroup>
        )}

        {/* Main Navigation */}
        <SidebarGroup title="Menu chính" isCollapsed={isCollapsed}>
          {sidebarNav.map(item => (
            <SidebarItem
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
              isHovered={hoveredItem === item.id}
              onHover={() => setHoveredItem(item.id)}
              onLeave={() => setHoveredItem(null)}
              onClick={() => trackMenuItemUsage(item.id)}
              onPinToggle={handlePinToggle}
            />
          ))}
        </SidebarGroup>

        {/* Recent Items */}
        {!isCollapsed && personalization.recentItems && personalization.recentItems.length > 0 && (
          <SidebarGroup title="🕐 Truy cập gần đây" isCollapsed={isCollapsed}>
            {personalization.recentItems.map(item => (
              <SidebarItem
                key={`recent-${item.id}`}
                item={item}
                isCollapsed={isCollapsed}
                isHovered={hoveredItem === `recent-${item.id}`}
                onHover={() => setHoveredItem(`recent-${item.id}`)}
                onLeave={() => setHoveredItem(null)}
                onClick={() => trackMenuItemUsage(item.id)}
              />
            ))}
          </SidebarGroup>
        )}
      </nav>
    </aside>
  );
};
