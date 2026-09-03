import React from 'react';

interface SidebarGroupProps {
  title: string;
  isCollapsed?: boolean;
  children: React.ReactNode;
}

export const SidebarGroup: React.FC<SidebarGroupProps> = ({
  title,
  isCollapsed = false,
  children,
}) => {
  return (
    <div className="sidebar-group">
      {!isCollapsed && <div className="sidebar-group-title">{title}</div>}
      <div className="sidebar-group-items">{children}</div>
    </div>
  );
};
