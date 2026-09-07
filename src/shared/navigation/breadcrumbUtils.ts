import { MenuItem } from '@/features/menus/types/menu';

export interface BreadcrumbNode {
  label: string;
  path?: string;
}

/**
 * Searches the menu tree to find the active path of menu items leading to currentPath
 */
function findMenuBreadcrumbPath(
  items: MenuItem[],
  currentPath: string,
  ancestors: MenuItem[] = []
): MenuItem[] | null {
  for (const item of items) {
    const currentAncestors = [...ancestors, item];
    
    if (item.path && (item.path === currentPath || (item.path !== '/' && currentPath.startsWith(item.path)))) {
      return currentAncestors;
    }

    if (item.children && item.children.length > 0) {
      const found = findMenuBreadcrumbPath(item.children, currentPath, currentAncestors);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Derives a clean list of breadcrumb nodes for any URL pathname
 */
export function getBreadcrumbsFromRoute(
  pathname: string,
  menuItems: MenuItem[] = []
): BreadcrumbNode[] {
  // 1. Attempt match against navigation model first
  const menuMatch = findMenuBreadcrumbPath(menuItems, pathname);
  if (menuMatch && menuMatch.length > 0) {
    return menuMatch.map((item, index) => ({
      label: item.label,
      // Only set link path if not the last item and path exists
      path: index < menuMatch.length - 1 ? item.path : undefined,
    }));
  }

  // 2. Fallback: Parse URL path segments dynamically
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return [{ label: 'Dashboard' }];
  }

  const result: BreadcrumbNode[] = [];
  let accumulatedPath = '';

  const segmentLabels: Record<string, string> = {
    projects: 'Projects',
    screens: 'Screens',
    billing: 'Billing',
    account: 'Account & Security',
    security: 'Security',
    usage: 'Usage',
    convert: 'Convert',
    bulk: 'Bulk Convert',
    result: 'Result Inspection',
    preview: 'Preview Studio',
    mapping: 'Field Mapping',
    export: 'Export Code',
    diagnostics: 'Diagnostics',
    trial: 'Trial Activation',
    payment: 'QR Payment',
    upgrade: 'Upgrade Subscription',
    history: 'Billing History',
    subscription: 'Manage Subscription',
    menus: 'Menu Builder',
    password: 'Password',
    '2fa': 'Two-Factor Authentication',
    sessions: 'Active Sessions',
  };

  segments.forEach((seg, index) => {
    accumulatedPath += `/${seg}`;
    const isLast = index === segments.length - 1;

    let label = segmentLabels[seg.toLowerCase()];
    if (!label) {
      // If it looks like an ID (e.g. proj-acme, screen-123), format nicely
      if (seg.startsWith('proj-')) {
        label = `Project (${seg.replace('proj-', '').toUpperCase()})`;
      } else if (seg.startsWith('screen-')) {
        label = `Screen (${seg.replace('screen-', '')})`;
      } else {
        label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
      }
    }

    result.push({
      label,
      path: isLast ? undefined : accumulatedPath,
    });
  });

  return result;
}
