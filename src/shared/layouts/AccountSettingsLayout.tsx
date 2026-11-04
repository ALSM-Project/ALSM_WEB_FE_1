import React, { useMemo } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useAuth } from '@/app/providers';
import { useNavigation } from '@/hooks/useNavigation';
import { DynamicIcon } from '@/components/Sidebar/IconResolver';
import { ROUTES } from '@/shared/constants/routes';

export const AccountSettingsLayout: React.FC = () => {
  const { user } = useAuth();
  const { sidebarNav } = useNavigation();
  const hasPassword = user?.hasPassword !== false;

  // Dynamically resolve Account navigation tabs directly from the dynamic sidebar navigation tree
  const navTabs = useMemo(() => {
    // 1. Look for Account group in dynamic sidebar navigation
    const accountGroup = sidebarNav.find(
      (item) =>
        item.category === 'ACCOUNT' ||
        item.id === 'settings' ||
        item.id.includes('group_account') ||
        item.label.toLowerCase() === 'account'
    );

    if (accountGroup?.children && accountGroup.children.length > 0) {
      return accountGroup.children
        .filter((child) => child.isVisible !== false)
        .map((child) => {
          let label = child.label;
          if (child.id.includes('password') && !hasPassword) {
            label = 'Set Password';
          }
          return {
            id: child.id,
            to: child.path || ROUTES.ACCOUNT.PASSWORD,
            label,
            iconName: child.icon || 'KeyRound',
          };
        });
    }

    // Also check if account items are listed flat in sidebarNav
    const flatAccount = sidebarNav.filter(
      (item) =>
        item.category === 'ACCOUNT' &&
        item.path &&
        item.path !== '#' &&
        item.id !== 'settings' &&
        !item.id.includes('group_account')
    );
    if (flatAccount.length > 0) {
      return flatAccount
        .filter((item) => item.isVisible !== false)
        .map((item) => {
          let label = item.label;
          if (item.id.includes('password') && !hasPassword) {
            label = 'Set Password';
          }
          return {
            id: item.id,
            to: item.path || ROUTES.ACCOUNT.PASSWORD,
            label,
            iconName: item.icon || 'KeyRound',
          };
        });
    }

    // 2. Default canonical tabs mirroring the sidebar's ACCOUNT items
    return [
      {
        id: 'account-profile',
        to: ROUTES.ACCOUNT.PROFILE,
        label: 'Profile Info',
        iconName: 'User',
      },
      {
        id: 'account-preferences',
        to: ROUTES.ACCOUNT.PREFERENCES,
        label: 'Preferences',
        iconName: 'Sliders',
      },
      {
        id: 'security-password',
        to: ROUTES.ACCOUNT.PASSWORD,
        label: hasPassword ? 'Change Password' : 'Set Password',
        iconName: 'KeyRound',
      },
      {
        id: 'security-2fa',
        to: ROUTES.ACCOUNT.TWO_FACTOR,
        label: 'Two-Factor Auth',
        iconName: 'ShieldAlert',
      },
      {
        id: 'security-sessions',
        to: ROUTES.ACCOUNT.SESSIONS,
        label: 'Active Sessions',
        iconName: 'Smartphone',
      },
    ];
  }, [sidebarNav, hasPassword]);

  return (
    <div className="w-full space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Account & Security"
      />

      {/* 2. Horizontal Navigation Tabs (Dynamically synced with Sidebar Account menu) */}
      <div className="border-b border-slate-200 bg-white rounded-xl px-4 pt-1 shadow-2xs">
        <nav
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar -mb-px"
          aria-label="Account and Security navigation tabs"
        >
          {navTabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`
              }
            >
              <DynamicIcon name={tab.iconName} className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* 3. Main Content - 100% available content area, no redundant sidebars */}
      <main className="w-full min-w-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AccountSettingsLayout;
