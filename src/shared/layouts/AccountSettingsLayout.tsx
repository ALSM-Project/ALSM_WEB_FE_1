import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { KeyRound, ShieldCheck, Laptop, User, Sliders } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useAuth } from '@/app/providers';

export const AccountSettingsLayout: React.FC = () => {
  const { user } = useAuth();
  const hasPassword = user?.hasPassword !== false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account & Security"
        subtitle="Manage your profile settings, security credentials, and active workspace sessions."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Account Secondary Nav Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 space-y-4 shadow-2xs">
            <div>
              <p className="text-[10px] font-extrabold text-[#6B778C] uppercase tracking-wider px-3 mb-2">Profile</p>
              <nav className="space-y-1">
                <span className="flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-[#091E42] bg-[#F7F9FC] border border-[#D9E2EC]">
                  <User className="w-4 h-4 text-[#0652CC]" />
                  <span>Profile Info</span>
                </span>
                <span className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-xl text-[#6B778C] hover:bg-[#F7F9FC] cursor-not-allowed">
                  <Sliders className="w-4 h-4" />
                  <span>Preferences</span>
                </span>
              </nav>
            </div>

            <div className="border-t border-[#E5EAF0] pt-3">
              <p className="text-[10px] font-extrabold text-[#6B778C] uppercase tracking-wider px-3 mb-2">Security</p>
              <nav className="space-y-1">
                <NavLink
                  to={ROUTES.ACCOUNT.PASSWORD}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                      isActive ? 'bg-[#E8F1FF] text-[#0652CC] border border-blue-200' : 'text-[#42526E] hover:bg-[#F7F9FC] hover:text-[#091E42]'
                    }`
                  }
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{hasPassword ? 'Change Password' : 'Set Password'}</span>
                </NavLink>


                <NavLink
                  to={ROUTES.ACCOUNT.TWO_FACTOR}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                      isActive ? 'bg-[#E8F1FF] text-[#0652CC] border border-blue-200' : 'text-[#42526E] hover:bg-[#F7F9FC] hover:text-[#091E42]'
                    }`
                  }
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Two-Factor Auth</span>
                </NavLink>

                <NavLink
                  to={ROUTES.ACCOUNT.SESSIONS}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                      isActive ? 'bg-[#E8F1FF] text-[#0652CC] border border-blue-200' : 'text-[#42526E] hover:bg-[#F7F9FC] hover:text-[#091E42]'
                    }`
                  }
                >
                  <Laptop className="w-4 h-4" />
                  <span>Active Sessions</span>
                </NavLink>
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
