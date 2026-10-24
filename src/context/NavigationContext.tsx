import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { MenuItem, NavigationData } from '@/features/menus/types/menu';
import {
  DEFAULT_SIDEBAR_NAV,
  findMenuItemInTree,
  isDescendant,
  removeItemFromTree,
  insertItemInTree,
} from '@/features/menus/utils/navigationTreeUtils';
import { apiClient } from '@/services/api/apiClient';
import { tokenStore } from '@/services/api/tokenStore';
import { useNavigationQuery, type BackendNavItem } from '@/features/navigation/hooks/useNavigationQuery';

export type { BackendNavItem };

/**
 * Authoritative static Document navigation items (PoC / Web 1 baseline).
 * These must be permanently preserved and additive, never replaced or hidden.
 */
export const STATIC_RESOURCE_DOCS: MenuItem[] = [
  {
    id: 'docs',
    label: 'Documentation',
    icon: 'BookOpen',
    path: '/workspace/docs',
    isVisible: true,
    order: 60,
    category: 'RESOURCES',
  },
  {
    id: 'user-guide',
    label: 'User Guide',
    icon: 'FileText',
    path: '/workspace/docs#how-it-works',
    isVisible: true,
    order: 61,
    category: 'RESOURCES',
  },
  {
    id: 'modernization-guide',
    label: 'Modernization Guide',
    icon: 'HelpCircle',
    path: '/workspace/docs#bms-dspf',
    isVisible: true,
    order: 62,
    category: 'RESOURCES',
  },
  {
    id: 'contact',
    label: 'Contact & Support',
    icon: 'Headphones',
    path: '/workspace/contact',
    isVisible: true,
    order: 63,
    category: 'RESOURCES',
  },
];

/**
 * Authoritative static Service navigation items (Service Group).
 */
export const STATIC_SERVICE_ITEMS: MenuItem[] = [
  {
    id: 'service-usage',
    label: 'Service Usage & Quotas',
    icon: 'Activity',
    path: '/billing/usage',
    isVisible: true,
    order: 50,
    category: 'SERVICE',
  },
  {
    id: 'contract-subscription',
    label: 'Contract & Subscription',
    icon: 'FileText',
    path: '/contracts',
    isVisible: true,
    order: 51,
    category: 'SERVICE',
  },
  {
    id: 'invoices',
    label: 'Invoices',
    icon: 'Receipt',
    path: '/billing/invoices',
    isVisible: true,
    order: 52,
    category: 'SERVICE',
  },
];

/**
 * Authoritative static Account navigation items.
 */
export const STATIC_ACCOUNT_SETTINGS: MenuItem[] = [
  {
    id: 'settings',
    label: 'Account',
    icon: 'Settings',
    path: '/account/profile',
    isVisible: true,
    order: 70,
    category: 'ACCOUNT',
    children: [
      {
        id: 'account-profile',
        label: 'Profile Info',
        icon: 'User',
        path: '/account/profile',
        parentId: 'settings',
        isVisible: true,
        order: 1,
      },
      {
        id: 'account-preferences',
        label: 'Preferences',
        icon: 'Sliders',
        path: '/account/preferences',
        parentId: 'settings',
        isVisible: true,
        order: 2,
      },
      {
        id: 'security-password',
        label: 'Change Password',
        icon: 'KeyRound',
        path: '/account/security/password',
        parentId: 'settings',
        isVisible: true,
        order: 3,
      },
      {
        id: 'security-2fa',
        label: 'Two-Factor Auth',
        icon: 'ShieldAlert',
        path: '/account/security/2fa',
        parentId: 'settings',
        isVisible: true,
        order: 4,
      },
      {
        id: 'security-sessions',
        label: 'Active Sessions',
        icon: 'Smartphone',
        path: '/account/security/sessions',
        parentId: 'settings',
        isVisible: true,
        order: 5,
      },
    ],
  },
];

/**
 * Additive merge strategy: Preserves all static Documents and static Account entries,
 * merging dynamic backend items seamlessly without replacing or dropping static navigation.
 */
export function mergeDynamicAndStaticNavigation(dynamicItems: MenuItem[]): MenuItem[] {
  if (!Array.isArray(dynamicItems) || dynamicItems.length === 0) {
    return [...DEFAULT_SIDEBAR_NAV];
  }

  const dynamicIds = new Set<string>();
  const dynamicPaths = new Set<string>();

  const collectIdentifiers = (items: MenuItem[]) => {
    for (const item of items) {
      if (item.id) dynamicIds.add(item.id.toLowerCase());
      if (item.path) dynamicPaths.add(item.path.toLowerCase());
      if (item.children) collectIdentifiers(item.children);
    }
  };
  collectIdentifiers(dynamicItems);

  // 1. Start with dynamic items
  const merged: MenuItem[] = [...dynamicItems];

  // 2. Add static Document entries if not explicitly overridden by dynamic items
  const hasDynamicResources = dynamicItems.some(
    (item) =>
      item.category === 'RESOURCES' ||
      item.id?.includes('resource') ||
      item.id?.includes('docs') ||
      item.id?.includes('guide') ||
      item.id === 'docs' ||
      item.id === 'user-guide' ||
      item.id === 'modernization-guide' ||
      item.id === 'contact' ||
      (item.children &&
        item.children.some(
          (c) =>
            c.category === 'RESOURCES' ||
            c.id?.includes('docs') ||
            c.id?.includes('guide') ||
            c.path?.includes('/workspace/docs'),
        )),
  );

  if (!hasDynamicResources) {
    for (const doc of STATIC_RESOURCE_DOCS) {
      const hasDuplicate =
        dynamicIds.has(doc.id.toLowerCase()) ||
        (doc.path && dynamicPaths.has(doc.path.toLowerCase()));
      if (!hasDuplicate) {
        merged.push({ ...doc });
      }
    }
  }

  // 3. Add static Account entries if not explicitly provided by dynamic backend items
  const hasDynamicAccount = dynamicItems.some(
    (item) =>
      item.category === 'ACCOUNT' ||
      item.id === 'settings' ||
      item.id.toLowerCase().includes('account') ||
      item.label.toLowerCase() === 'account'
  );

  if (!hasDynamicAccount) {
    for (const acc of STATIC_ACCOUNT_SETTINGS) {
      const hasDuplicate =
        dynamicIds.has(acc.id.toLowerCase()) ||
        (acc.path && dynamicPaths.has(acc.path.toLowerCase()));
      if (!hasDuplicate) {
        merged.push({ ...acc });
      }
    }
  }

  // 4. Add static Service entries if not explicitly provided by dynamic backend items
  const hasDynamicService = dynamicItems.some(
    (item) =>
      item.category === 'SERVICE' ||
      item.id?.includes('service') ||
      item.id?.includes('contract') ||
      item.path === '/contracts' ||
      item.path === '/billing/usage'
  );

  if (!hasDynamicService) {
    for (const s of STATIC_SERVICE_ITEMS) {
      const hasDuplicate =
        dynamicIds.has(s.id.toLowerCase()) ||
        (s.path && dynamicPaths.has(s.path.toLowerCase()));
      if (!hasDuplicate) {
        merged.push({ ...s });
      }
    }
  }

  return merged;
}

export interface NavigationContextType {
  sidebarNav: MenuItem[];
  navigation: NavigationData | null;
  loading: boolean;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  addItem: (itemData: Partial<MenuItem>, parentId?: string | null) => MenuItem;
  updateItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteItem: (id: string) => { success: boolean; error?: string };
  moveItem: (id: string, newParentId: string | null) => { success: boolean; error?: string };
  reorderSibling: (id: string, direction: 'up' | 'down') => void;
  duplicateItem: (id: string) => MenuItem | null;
  resetToDefault: () => void;
  saveChanges: () => Promise<void>;
  isDirty: boolean;
  trackMenuItemUsage: (itemId: string) => Promise<void>;
  pinMenuItem: (itemId: string) => Promise<void>;
  unpinMenuItem: (itemId: string) => Promise<void>;
  refreshNavigation: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

function mapBackendNodeToMenuItem(
  node: BackendNavItem,
  parentCategory?: 'MAIN' | 'SERVICE' | 'RESOURCES' | 'ACCOUNT'
): MenuItem {
  let category: 'MAIN' | 'SERVICE' | 'RESOURCES' | 'ACCOUNT' | undefined = parentCategory;
  const k = (node.key || '').toLowerCase();
  const id = (node.id || '').toLowerCase();
  const l = (node.label || '').toLowerCase();

  if (
    k.includes('resource') ||
    id.includes('resource') ||
    id.includes('docs') ||
    id.includes('guide') ||
    id.includes('contact') ||
    l.includes('resource') ||
    l.includes('documentation')
  ) {
    category = 'RESOURCES';
  } else if (
    k.includes('account') ||
    id.includes('account') ||
    id.includes('security') ||
    id.includes('settings') ||
    l.includes('account')
  ) {
    category = 'ACCOUNT';
  } else if (
    k.includes('service') ||
    id.includes('service') ||
    id.includes('usage') ||
    id.includes('contract') ||
    id.includes('upgrade') ||
    l.includes('service')
  ) {
    category = 'SERVICE';
  } else if (!category) {
    category = 'MAIN';
  }

  return {
    id: node.id,
    label: node.label,
    icon: node.icon || 'FileText',
    path: node.route || undefined,
    parentId: node.parentId || undefined,
    order: node.order,
    isVisible: node.visibility !== false && node.status !== 'INACTIVE',
    target: node.openInNewTab ? '_blank' : '_self',
    category,
    children:
      node.children && node.children.length > 0
        ? node.children.map((c) => mapBackendNodeToMenuItem(c, category))
        : undefined,
  };
}

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuth = !!tokenStore.getAccessToken();
  const { data: backendNavNodes, isLoading, refetch } = useNavigationQuery('WEB_1', isAuth);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [sidebarNav, setSidebarNav] = useState<MenuItem[]>(() =>
    mergeDynamicAndStaticNavigation(DEFAULT_SIDEBAR_NAV)
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>('dashboard');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Real-time synchronization: listen for events emitted when Menu Builder modifies items
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'alsm_nav_updated_at') {
        refetch();
      }
    };
    window.addEventListener('storage', handleStorage);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('alsm_navigation_channel');
      channel.onmessage = () => {
        refetch();
      };
    } catch {}

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
    };
  }, [refetch]);

  useEffect(() => {
    if (backendNavNodes && !isDirty) {
      if (Array.isArray(backendNavNodes) && backendNavNodes.length > 0) {
        const mapped = backendNavNodes.map((n) => mapBackendNodeToMenuItem(n));
        setSidebarNav(mergeDynamicAndStaticNavigation(mapped));
      } else {
        setSidebarNav(mergeDynamicAndStaticNavigation([]));
      }
    }
  }, [backendNavNodes, isDirty]);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const addItem = useCallback((itemData: Partial<MenuItem>, parentId?: string | null): MenuItem => {
    const newId = itemData.id || `menu-${Date.now()}`;
    const newItem: MenuItem = {
      id: newId,
      label: itemData.label || 'New Menu Item',
      icon: itemData.icon || 'FileText',
      path: itemData.path || '/new-page',
      parentId: parentId || undefined,
      isVisible: itemData.isVisible !== undefined ? itemData.isVisible : true,
      order: itemData.order || 99,
      badge: itemData.badge,
      badgeColor: itemData.badgeColor,
    };

    setSidebarNav((prev) => insertItemInTree(prev, newItem, parentId));
    setSelectedItemId(newId);
    setIsDirty(true);
    return newItem;
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<MenuItem>) => {
    setSidebarNav((prev) => {
      const updateRecursive = (items: MenuItem[]): MenuItem[] => {
        return items.map((item) => {
          if (item.id === id) {
            return { ...item, ...updates };
          }
          if (item.children && item.children.length > 0) {
            return { ...item, children: updateRecursive(item.children) };
          }
          return item;
        });
      };
      return updateRecursive(prev);
    });
    setIsDirty(true);
  }, []);

  const deleteItem = useCallback((id: string): { success: boolean; error?: string } => {
    let checkError: string | undefined = undefined;

    setSidebarNav((prev) => {
      const itemToDelete = findMenuItemInTree(prev, id);
      if (itemToDelete && itemToDelete.children && itemToDelete.children.length > 0) {
        checkError = 'Cannot delete a menu item with children.';
        return prev;
      }
      return removeItemFromTree(prev, id);
    });

    if (checkError) {
      return { success: false, error: checkError };
    }

    setSelectedItemId(null);
    setIsDirty(true);
    return { success: true };
  }, []);

  const moveItem = useCallback((id: string, newParentId: string | null): { success: boolean; error?: string } => {
    if (id === newParentId) {
      return { success: false, error: 'An item cannot be its own parent.' };
    }

    let validationError: string | undefined = undefined;

    setSidebarNav((prev) => {
      if (newParentId && isDescendant(prev, id, newParentId)) {
        validationError = 'An item cannot be moved under its own descendant.';
        return prev;
      }

      const itemToMove = findMenuItemInTree(prev, id);
      if (!itemToMove) {
        validationError = 'Item not found.';
        return prev;
      }

      const cleanedTree = removeItemFromTree(prev, id);
      return insertItemInTree(cleanedTree, itemToMove, newParentId);
    });

    if (validationError) {
      return { success: false, error: validationError };
    }

    setIsDirty(true);
    return { success: true };
  }, []);

  const reorderSibling = useCallback((id: string, direction: 'up' | 'down') => {
    setSidebarNav((prev) => {
      const reorderInList = (list: MenuItem[]): MenuItem[] => {
        const index = list.findIndex((item) => item.id === id);
        if (index === -1) {
          return list.map((item) => ({
            ...item,
            children: item.children ? reorderInList(item.children) : undefined,
          }));
        }

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= list.length) return list;

        const updated = [...list];
        const temp = updated[index];
        updated[index] = updated[newIndex];
        updated[newIndex] = temp;
        return updated;
      };

      return reorderInList(prev);
    });
    setIsDirty(true);
  }, []);

  const duplicateItem = useCallback((id: string): MenuItem | null => {
    let duplicated: MenuItem | null = null;

    setSidebarNav((prev) => {
      const target = findMenuItemInTree(prev, id);
      if (!target) return prev;

      const copy: MenuItem = {
        ...JSON.parse(JSON.stringify(target)),
        id: `${target.id}-copy-${Date.now()}`,
        label: `${target.label} (Copy)`,
      };
      duplicated = copy;

      return insertItemInTree(prev, copy, target.parentId || null);
    });

    if (duplicated) {
      setSelectedItemId((duplicated as MenuItem).id);
      setIsDirty(true);
    }
    return duplicated;
  }, []);

  const resetToDefault = useCallback(() => {
    setSidebarNav(mergeDynamicAndStaticNavigation(DEFAULT_SIDEBAR_NAV));
    setSelectedItemId('dashboard');
    setIsDirty(false);
  }, []);

  const saveChanges = useCallback(async () => {
    try {
      setIsSaving(true);
      await apiClient.post('/menus/save', { sidebarNav, application: 'WEB_1' });
      setIsDirty(false);
      await refetch();
    } catch (e) {
      console.warn('Backend menu save failed:', e);
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [sidebarNav, refetch]);

  const trackMenuItemUsage = useCallback(async (itemId: string) => {
    try {
      await apiClient.post(`/menus/track/${itemId}`, { action: 'click' });
    } catch {
      // ignore
    }
  }, []);

  const pinMenuItem = useCallback(async (itemId: string) => {
    updateItem(itemId, { isPinned: true });
  }, [updateItem]);

  const unpinMenuItem = useCallback(async (itemId: string) => {
    updateItem(itemId, { isPinned: false });
  }, [updateItem]);

  const navigationData: NavigationData = {
    topNav: [],
    sidebarNav,
    secondaryNav: {},
    contextualNav: [],
    personalization: {
      pinnedItems: sidebarNav.filter((i) => i.isPinned),
      recentItems: [],
      suggestedItems: [],
    },
    metadata: {
      totalItems: sidebarNav.length,
      isDefault: false,
      lastUpdated: new Date().toISOString(),
    },
  };

  const isNavLoading = isSaving || (isLoading && (!sidebarNav || sidebarNav.length === 0));

  return (
    <NavigationContext.Provider
      value={{
        sidebarNav,
        navigation: navigationData,
        loading: isNavLoading,
        selectedItemId,
        setSelectedItemId,
        addItem,
        updateItem,
        deleteItem,
        moveItem,
        reorderSibling,
        duplicateItem,
        resetToDefault,
        saveChanges,
        isDirty,
        trackMenuItemUsage,
        pinMenuItem,
        unpinMenuItem,
        refreshNavigation: handleRefresh,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within NavigationProvider');
  }
  return context;
};
