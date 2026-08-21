import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { KeyRound, ShieldCheck, Laptop, Link as LinkIcon, User, CreditCard, Sliders } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';

export const AccountSettingsLayout: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500">Manage your profile, security preferences, and active devices.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Account Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Account</p>
              <nav className="space-y-1">
                <span className="flex items-center space-x-2.5 px-3 py-2 text-sm rounded-lg text-slate-400 cursor-not-allowed">
                  <User className="w-4 h-4" />
                  <span>Profile Info</span>
                </span>
                <NavLink
                  to={ROUTES.BILLING.SUBSCRIPTION}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                      isActive ? 'bg-brand-50 text-brand-600 border border-brand-200 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Billing & Plan</span>
                </NavLink>
                <span className="flex items-center space-x-2.5 px-3 py-2 text-sm rounded-lg text-slate-400 cursor-not-allowed">
                  <Sliders className="w-4 h-4" />
                  <span>Preferences</span>
                </span>
              </nav>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Security</p>
              <nav className="space-y-1">
                <NavLink
                  to={ROUTES.ACCOUNT.PASSWORD}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive ? 'bg-brand-50 text-brand-600 border border-brand-200 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Change Password</span>
                </NavLink>

                <NavLink
                  to={ROUTES.ACCOUNT.TWO_FACTOR}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive ? 'bg-brand-50 text-brand-600 border border-brand-200 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Two-Factor Auth</span>
                </NavLink>

                <NavLink
                  to={ROUTES.ACCOUNT.SESSIONS}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive ? 'bg-brand-50 text-brand-600 border border-brand-200 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Laptop className="w-4 h-4" />
                  <span>Active Sessions</span>
                </NavLink>

                <span className="flex items-center space-x-2.5 px-3 py-2 text-sm rounded-lg text-slate-400 cursor-not-allowed opacity-60">
                  <LinkIcon className="w-4 h-4" />
                  <span>Connected Apps</span>
                </span>
              </nav>
            </div>
          </div>
        </aside>

        {/* Security Subpage Content */}
        <main className="lg:col-span-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default AccountSettingsLayout;
