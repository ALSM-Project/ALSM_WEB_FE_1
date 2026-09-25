import type { MenuItem } from '@/features/menus/types/menu';
import { getProjectName } from '@/shared/utils/projectCache';

export interface BreadcrumbNode {
  label: string;
  path?: string;
  href?: string;
}

/**
 * Derives a clean list of breadcrumb nodes for any URL pathname
 */
export function getBreadcrumbsFromRoute(
  pathname: string,
  _menuItems: MenuItem[] = []
): BreadcrumbNode[] {
  const cleanPath = pathname.split('?')[0].replace(/\/+$/, '') || '/';

  if (cleanPath === '/' || cleanPath === '/dashboard') {
    return [{ label: 'Dashboard' }];
  }

  if (cleanPath === '/projects') {
    return [{ label: 'Projects' }];
  }

  // Handle /projects/:projectId/... pattern
  const projectMatch = cleanPath.match(/^\/projects\/([^/]+)(?:\/(.*))?$/);
  if (projectMatch) {
    const [, projectId, rest] = projectMatch;
    const projectLabel = projectId === 'create'
      ? 'Create Project'
      : getProjectName(projectId);

    if (projectId === 'create') {
      return [{ label: 'Projects', path: '/projects' }, { label: 'Create Project' }];
    }

    const baseBreadcrumb: BreadcrumbNode[] = [
      { label: 'Projects', path: '/projects' },
      { label: projectLabel, path: `/projects/${projectId}/screens` },
    ];

    if (!rest || rest === 'overview' || rest === 'screens') {
      return [{ label: 'Projects', path: '/projects' }, { label: projectLabel }];
    }

    if (rest === 'delete') {
      return [{ label: 'Projects', path: '/projects' }, { label: projectLabel }];
    }

    if (rest === 'upload') {
      return [...baseBreadcrumb, { label: 'Upload Source File' }];
    }

    if (rest === 'bulk-convert') {
      return [...baseBreadcrumb, { label: 'Bulk Convert' }];
    }

    if (rest === 'export') {
      return [...baseBreadcrumb, { label: 'Export Code Package' }];
    }

    if (rest === 'diagnostics') {
      return [...baseBreadcrumb, { label: 'Diagnostics & Error Logs' }];
    }

    // Handle /projects/:projectId/screens/:screenId/... pattern
    const screenMatch = rest.match(/^screens\/([^/]+)(?:\/(.*))?$/);
    if (screenMatch) {
      const [, screenId, screenAction] = screenMatch;
      const screenLabel = screenId.includes('.') ? screenId : screenId.toUpperCase();
      const screenBase: BreadcrumbNode[] = [
        ...baseBreadcrumb,
        { label: screenLabel },
      ];

      if (!screenAction || screenAction === 'convert') {
        return [...screenBase, { label: 'Convert' }];
      }
      if (screenAction === 'mapping') {
        return [...screenBase, { label: 'Field Mapping' }];
      }
      if (screenAction === 'review') {
        return [...screenBase, { label: 'Review Findings' }];
      }
      if (screenAction === 'result') {
        return [...screenBase, { label: 'Result Inspection' }];
      }
      if (screenAction === 'preview') {
        return [...screenBase, { label: 'Preview Studio' }];
      }
    }

    return baseBreadcrumb;
  }

  // Handle standalone routes
  if (cleanPath === '/diagnostics') {
    return [{ label: 'Diagnostics & System Logs' }];
  }

  if (cleanPath === '/documentation' || cleanPath === '/docs') {
    return [{ label: 'Resources' }, { label: 'Documentation' }];
  }

  if (cleanPath === '/user-guide') {
    return [{ label: 'Resources' }, { label: 'User Guide' }];
  }

  if (cleanPath === '/modernization-guide') {
    return [{ label: 'Resources' }, { label: 'Modernization Guide' }];
  }

  if (cleanPath.includes('/contact')) {
    return [{ label: 'Resources' }, { label: 'Contact & Upgrade' }];
  }

  if (cleanPath.startsWith('/account')) {
    const base: BreadcrumbNode[] = [{ label: 'Account' }];
    if (cleanPath.includes('password')) return [...base, { label: 'Password & Security' }];
    if (cleanPath.includes('profile')) return [...base, { label: 'Profile Settings' }];
    return [...base, { label: 'Account Settings' }];
  }

  if (cleanPath.startsWith('/billing')) {
    return [{ label: 'Account' }, { label: 'Subscription & Billing' }];
  }

  // Fallback segment parser
  const segments = cleanPath.split('/').filter(Boolean);
  const result: BreadcrumbNode[] = [];
  let accumulatedPath = '';

  segments.forEach((seg, index) => {
    accumulatedPath += `/${seg}`;
    const isLast = index === segments.length - 1;
    const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');

    result.push({
      label,
      path: isLast ? undefined : accumulatedPath,
    });
  });

  return result;
}
