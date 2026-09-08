import type { MenuItem } from '../types/menu';

export const DEFAULT_SIDEBAR_NAV: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/',
    isVisible: true,
    order: 1,
  },
  {
    id: 'projects',
    label: 'Projects & Workspaces',
    icon: 'Layers',
    path: '/projects/proj-acme/screens',
    isVisible: true,
    order: 2,
    badge: 'Active',
    badgeColor: '#0652CC',
  },
  {
    id: 'usage',
    label: 'Resource Usage',
    icon: 'Activity',
    path: '/usage',
    isVisible: true,
    order: 3,
  },
  {
    id: 'billing',
    label: 'Billing & Plans',
    icon: 'CreditCard',
    path: '/billing/pricing',
    isVisible: true,
    order: 4,
    children: [
      {
        id: 'pricing',
        label: 'Pricing & Plans',
        icon: 'Sparkles',
        path: '/billing/pricing',
        parentId: 'billing',
        isVisible: true,
        order: 1,
      },
      {
        id: 'billing-history',
        label: 'Invoices & History',
        icon: 'Receipt',
        path: '/billing/history',
        parentId: 'billing',
        isVisible: true,
        order: 2,
      },
      {
        id: 'subscription',
        label: 'Manage Subscription',
        icon: 'CreditCard',
        path: '/billing/subscription',
        parentId: 'billing',
        isVisible: true,
        order: 3,
      },
    ],
  },
  {
    id: 'settings',
    label: 'Account & Security',
    icon: 'Settings',
    path: '/account/security/password',
    isVisible: true,
    order: 5,
    children: [
      {
        id: 'security-password',
        label: 'Change Password',
        icon: 'KeyRound',
        path: '/account/security/password',
        parentId: 'settings',
        isVisible: true,
        order: 1,
      },
      {
        id: 'security-2fa',
        label: 'Two-Factor Auth',
        icon: 'Shield',
        path: '/account/security/2fa',
        parentId: 'settings',
        isVisible: true,
        order: 2,
      },
      {
        id: 'security-sessions',
        label: 'Active Sessions',
        icon: 'Laptop',
        path: '/account/security/sessions',
        parentId: 'settings',
        isVisible: true,
        order: 3,
      },
    ],
  },
  {
    id: 'support',
    label: 'Help & Support',
    icon: 'HelpCircle',
    path: '/contact',
    isVisible: true,
    order: 6,
  },
];

/**
 * Finds an item recursively by ID in tree
 */
export function findMenuItemInTree(items: MenuItem[], id: string): MenuItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children && item.children.length > 0) {
      const found = findMenuItemInTree(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Checks if targetId is an ancestor of candidateId
 */
export function isDescendant(items: MenuItem[], targetId: string, candidateId: string): boolean {
  if (targetId === candidateId) return true;
  const targetItem = findMenuItemInTree(items, targetId);
  if (!targetItem || !targetItem.children) return false;

  for (const child of targetItem.children) {
    if (child.id === candidateId || isDescendant([child], child.id, candidateId)) {
      return true;
    }
  }
  return false;
}

/**
 * Flattens all menu items for parent selector dropdown
 */
export function flattenMenuItems(items: MenuItem[], depth = 0, prefix = ''): Array<{ item: MenuItem; depth: number; label: string }> {
  let result: Array<{ item: MenuItem; depth: number; label: string }> = [];

  for (const item of items) {
    const displayLabel = prefix ? `${prefix} > ${item.label}` : item.label;
    result.push({ item, depth, label: displayLabel });
    if (item.children && item.children.length > 0) {
      result = result.concat(flattenMenuItems(item.children, depth + 1, displayLabel));
    }
  }

  return result;
}

/**
 * Removes item from tree by ID
 */
export function removeItemFromTree(items: MenuItem[], id: string): MenuItem[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) => ({
      ...item,
      children: item.children ? removeItemFromTree(item.children, id) : undefined,
    }));
}

/**
 * Inserts item as child of parentId or at root level if parentId is null
 */
export function insertItemInTree(items: MenuItem[], itemToInsert: MenuItem, parentId?: string | null): MenuItem[] {
  if (!parentId) {
    return [...items, { ...itemToInsert, parentId: undefined }];
  }

  return items.map((item) => {
    if (item.id === parentId) {
      const updatedChildren = item.children ? [...item.children, { ...itemToInsert, parentId }] : [{ ...itemToInsert, parentId }];
      return { ...item, children: updatedChildren };
    }

    if (item.children && item.children.length > 0) {
      return { ...item, children: insertItemInTree(item.children, itemToInsert, parentId) };
    }

    return item;
  });
}
