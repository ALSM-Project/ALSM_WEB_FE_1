import { describe, it, expect } from 'vitest';
import {
  mergeDynamicAndStaticNavigation,
  STATIC_RESOURCE_DOCS,
} from '@/context/NavigationContext';
import type { MenuItem } from '@/features/menus/types/menu';

describe('Additive Menu Integration — Static Documents & Navigation Preservation (WEB_1)', () => {
  it('preserves all static Document entries exactly when dynamic menu is empty', () => {
    const merged = mergeDynamicAndStaticNavigation([]);
    const resourceItems = merged.filter((item) => item.category === 'RESOURCES');

    expect(resourceItems).toHaveLength(STATIC_RESOURCE_DOCS.length);
    expect(resourceItems.map((i) => i.id)).toEqual([
      'docs',
      'user-guide',
      'modernization-guide',
      'contact',
    ]);
    expect(resourceItems.map((i) => i.path)).toEqual([
      '/workspace/docs',
      '/workspace/docs#how-it-works',
      '/workspace/docs#bms-dspf',
      '/workspace/contact',
    ]);
  });

  it('preserves all static Account entries when dynamic menu is empty', () => {
    const merged = mergeDynamicAndStaticNavigation([]);
    const accountItem = merged.find((item) => item.id === 'settings');

    expect(accountItem).toBeDefined();
    expect(accountItem?.category).toBe('ACCOUNT');
    expect(accountItem?.children?.map((c) => c.id)).toEqual([
      'account-profile',
      'account-preferences',
      'security-password',
      'security-2fa',
      'security-sessions',
    ]);
  });

  it('additively merges dynamic items without deleting static documents', () => {
    const dynamicBackendItems: MenuItem[] = [
      {
        id: 'web1_dashboard',
        label: 'Dashboard',
        icon: 'LayoutDashboard',
        path: '/dashboard',
        isVisible: true,
        order: 1,
        category: 'MAIN',
      },
    ];

    const merged = mergeDynamicAndStaticNavigation(dynamicBackendItems);

    expect(merged.find((i) => i.id === 'web1_dashboard')).toBeDefined();

    const docsItem = merged.find((i) => i.id === 'docs');
    const userGuideItem = merged.find((i) => i.id === 'user-guide');
    const modGuideItem = merged.find((i) => i.id === 'modernization-guide');
    const contactItem = merged.find((i) => i.id === 'contact');

    expect(docsItem).toBeDefined();
    expect(docsItem?.path).toBe('/workspace/docs');
    expect(userGuideItem).toBeDefined();
    expect(modGuideItem).toBeDefined();
    expect(contactItem).toBeDefined();
  });
});
