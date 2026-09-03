import React from 'react';
import { MegaMenuGroup } from '../../features/menus/types/menu';
import './MegaMenu.css';

interface MegaMenuProps {
  groups: MegaMenuGroup[];
  totalColumns?: number;
  isOpen: boolean;
  onClose?: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({
  groups,
  totalColumns = 3,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !groups || groups.length === 0) return null;

  const columnWidth = `${100 / Math.min(totalColumns, 4)}%`;

  return (
    <div className="mega-menu-overlay" onClick={onClose}>
      <div className="mega-menu-container" onClick={e => e.stopPropagation()}>
        <div className="mega-menu-content">
          {groups.map(group => (
            <div
              key={group.id}
              className="mega-menu-column"
              style={{ flex: `0 0 ${columnWidth}`, maxWidth: columnWidth }}
            >
              <h4 className="mega-menu-group-title">
                {group.icon && <span className={`icon-${group.icon}`} />}
                {group.title}
              </h4>
              <ul className="mega-menu-group-items">
                {(group.items || []).map(item => (
                  <li key={item.id} className="mega-menu-item">
                    <a href={item.path || '#'} className="mega-menu-link">
                      {item.icon && <span className={`icon-${item.icon}`} />}
                      <span className="mega-menu-label">{item.label}</span>
                      {item.badge && (
                        <span
                          className="mega-menu-badge"
                          style={{ backgroundColor: item.badgeColor || '#3b82f6' }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </a>
                    {item.description && (
                      <small className="mega-menu-desc">{item.description}</small>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
