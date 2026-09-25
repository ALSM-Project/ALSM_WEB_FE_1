import type { MenuItem } from '../types/menu';

export const DEFAULT_SIDEBAR_NAV: MenuItem[] = [
  // MAIN SECTION
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/dashboard',
    isVisible: true,
    order: 1,
    category: 'MAIN',
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: 'Layers',
    path: '/projects',
    isVisible: true,
    order: 2,
    category: 'MAIN',
  },
  {
    id: 'screens',
    label: 'Screens & Programs',
    icon: 'Monitor',
    path: '/projects/proj-acme/screens',
    isVisible: true,
    order: 3,
    category: 'MAIN',
  },
  {
    id: 'diagnostics',
    label: 'Diagnostics',
    icon: 'Activity',
    path: '/projects/proj-acme/diagnostics',
    isVisible: true,
    order: 4,
    category: 'MAIN',
  },

  // RESOURCES SECTION
  {
    id: 'docs',
    label: 'Documentation',
    icon: 'BookOpen',
    path: '/workspace/docs',
    isVisible: true,
    order: 6,
    category: 'RESOURCES',
  },
  {
    id: 'user-guide',
    label: 'User Guide',
    icon: 'FileText',
    path: '/workspace/docs#how-it-works',
    isVisible: true,
    order: 7,
    category: 'RESOURCES',
  },
  {
    id: 'modernization-guide',
    label: 'Modernization Guide',
    icon: 'HelpCircle',
    path: '/workspace/docs#bms-dspf',
    isVisible: true,
    order: 8,
    category: 'RESOURCES',
  },
  {
    id: 'contact',
    label: 'Contact & Upgrade',
    icon: 'Mail',
    path: '/workspace/contact',
    isVisible: true,
    order: 9,
    category: 'RESOURCES',
  },

  // ACCOUNT SECTION
  {
    id: 'settings',
    label: 'Account',
    icon: 'Settings',
    path: '/account/security/password',
    isVisible: true,
    order: 9,
    category: 'ACCOUNT',
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
