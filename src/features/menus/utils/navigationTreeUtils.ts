import type { MenuItem } from '../types/menu';

export const DEFAULT_SIDEBAR_NAV: MenuItem[] = [
  // ROOT DASHBOARD
  {
    id: 'web1_dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/dashboard',
    isVisible: true,
    order: 1,
    category: '',
  },

  // ORGANIZATION SECTION
  {
    id: 'web1_group_organization',
    label: 'ORGANIZATION',
    icon: 'Building2',
    isVisible: true,
    order: 2,
    category: 'ORGANIZATION',
    children: [
      {
        id: 'web1_org_profile',
        label: 'Organization Profile',
        icon: 'Building',
        path: '/organization/profile',
        parentId: 'web1_group_organization',
        isVisible: true,
        order: 1,
      },
      {
        id: 'web1_org_team',
        label: 'Team Management',
        icon: 'Users',
        path: '/settings/team',
        parentId: 'web1_group_organization',
        isVisible: true,
        order: 2,
      },
      {
        id: 'web1_org_teams',
        label: 'Internal Teams',
        icon: 'Users',
        path: '/organization/teams',
        parentId: 'web1_group_organization',
        isVisible: true,
        order: 3,
      },
      {
        id: 'web1_org_projects',
        label: 'Organization Projects',
        icon: 'Layers',
        path: '/projects',
        parentId: 'web1_group_organization',
        isVisible: true,
        order: 4,
      },
      {
        id: 'web1_org_roles',
        label: 'Roles & Permissions',
        icon: 'Shield',
        path: '/settings/roles',
        parentId: 'web1_group_organization',
        isVisible: true,
        order: 5,
      },
      {
        id: 'web1_org_analytics',
        label: 'Organization Analytics',
        icon: 'BarChart3',
        path: '/organization/analytics',
        parentId: 'web1_group_organization',
        isVisible: true,
        order: 6,
      },
    ],
  },

  // CONTRACT & BILLING SECTION [Platform-Based]
  {
    id: 'web1_group_contract_billing',
    label: 'CONTRACT & BILLING',
    icon: 'FileText',
    isVisible: true,
    order: 3,
    category: 'CONTRACT & BILLING',
    children: [
      {
        id: 'web1_service_contract_subscription',
        label: 'Enterprise Contracts',
        icon: 'FileText',
        path: '/contracts',
        parentId: 'web1_group_contract_billing',
        isVisible: true,
        order: 1,
      },
      {
        id: 'web1_invoices',
        label: 'Invoices & Payments',
        icon: 'Receipt',
        path: '/billing/invoices',
        parentId: 'web1_group_contract_billing',
        isVisible: true,
        order: 2,
      },
      {
        id: 'web1_service_usage',
        label: 'Service Usage & Quotas',
        icon: 'Activity',
        path: '/billing/usage',
        parentId: 'web1_group_contract_billing',
        isVisible: true,
        order: 3,
      },
    ],
  },

  // COLLABORATION SECTION
  {
    id: 'web1_group_collaboration',
    label: 'COLLABORATION',
    icon: 'Calendar',
    isVisible: true,
    order: 4,
    category: 'COLLABORATION',
    children: [
      {
        id: 'web1_meetings',
        label: 'Meeting Scheduler',
        icon: 'Calendar',
        path: '/workspace/contact',
        parentId: 'web1_group_collaboration',
        isVisible: true,
        order: 1,
      },
    ],
  },

  // ACCOUNT SECTION
  {
    id: 'web1_group_account',
    label: 'ACCOUNT',
    icon: 'User',
    isVisible: true,
    order: 5,
    category: 'ACCOUNT',
    children: [
      {
        id: 'web1_account_profile',
        label: 'Profile & Security',
        icon: 'User',
        path: '/account/profile',
        parentId: 'web1_group_account',
        isVisible: true,
        order: 1,
      },
      {
        id: 'web1_account_company',
        label: 'Company Legal Profile',
        icon: 'Building2',
        path: '/organization/profile',
        parentId: 'web1_group_account',
        isVisible: true,
        order: 2,
      },
      {
        id: 'web1_account_preferences',
        label: 'Preferences',
        icon: 'Sliders',
        path: '/account/preferences',
        parentId: 'web1_group_account',
        isVisible: true,
        order: 3,
      },
      {
        id: 'web1_security_password',
        label: 'Change Password',
        icon: 'KeyRound',
        path: '/account/security/password',
        parentId: 'web1_group_account',
        isVisible: true,
        order: 4,
      },
      {
        id: 'web1_security_2fa',
        label: 'Two-Factor Authentication',
        icon: 'ShieldAlert',
        path: '/account/security/2fa',
        parentId: 'web1_group_account',
        isVisible: true,
        order: 5,
      },
      {
        id: 'web1_security_sessions',
        label: 'Active Sessions',
        icon: 'Smartphone',
        path: '/account/security/sessions',
        parentId: 'web1_group_account',
        isVisible: true,
        order: 6,
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
