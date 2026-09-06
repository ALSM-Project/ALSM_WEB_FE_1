export type NavigationLevel = 'global' | 'primary' | 'secondary' | 'contextual';

export type MenuPosition = 'top' | 'left' | 'right' | 'bottom';

export interface MegaMenuGroup {
  id: string;
  title: string;
  icon?: string;
  items: MenuItem[];
  order: number;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  level?: NavigationLevel;
  position?: MenuPosition;
  children?: MenuItem[];
  parentId?: string;

  permissions?: string[];
  isPinnable?: boolean;
  isHidden?: boolean;
  isPinned?: boolean;
  usageCount?: number;
  lastUsedAt?: string;

  order?: number;
  isVisible: boolean;
  badge?: string;
  badgeColor?: string;

  groupName?: string;
  description?: string;
  target?: '_blank' | '_self';
  queryParams?: Record<string, any>;
  fragment?: string;

  hideOnMobile?: boolean;
  hideOnTablet?: boolean;

  isMegaMenu?: boolean;
  megaMenuColumns?: number;
  megaMenuGroups?: MegaMenuGroup[];
}

export interface NavigationData {
  topNav: MenuItem[];
  sidebarNav: MenuItem[];
  secondaryNav: Record<string, MenuItem[]>;
  contextualNav: MenuItem[];
  personalization: {
    pinnedItems: MenuItem[];
    recentItems: MenuItem[];
    suggestedItems: MenuItem[];
  };
  metadata: {
    totalItems: number;
    isDefault: boolean;
    lastUpdated: string;
  };
}

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  category: string;
  keywords: string[];
  action: 'navigate' | 'action' | 'quick_action';
  data: Record<string, any>;
  shortcut?: string[];
}
