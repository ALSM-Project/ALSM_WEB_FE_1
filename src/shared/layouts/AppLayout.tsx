import React, { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { Bell, Settings, ChevronDown, User, CreditCard, LogOut } from 'lucide-react';
import { Breadcrumb } from '@/shared/navigation/Breadcrumb';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { useAuth } from '@/app/providers';
import { Web1ThemeProvider, useWeb1Theme } from '@/context/Web1ThemeContext';
import { ROUTES } from '@/shared/constants/routes';

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const AppLayoutContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme } = useWeb1Theme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  React.useEffect(() => {
    const match = location.pathname.match(/^\/projects\/([^/]+)/);
    if (match && match[1] && match[1] !== 'create' && match[1] !== 'new') {
      localStorage.setItem('last_active_project_id', match[1]);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.PUBLIC.LOGIN);
  };

  return (
    <div
      className="min-h-screen flex font-sans transition-colors"
      style={{ backgroundColor: theme.colors.background.main, color: theme.colors.text.primary }}
    >
      {/* Dynamic Dark Navy Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
      />

      {/* Main Container (Header + Content Area, NO FOOTER) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header matching PoC design */}
        <header className="sticky top-0 z-40 bg-white border-b border-[#E5EAF0] px-6 lg:px-8 py-3 flex items-center justify-between shadow-2xs gap-4">
          {/* Left: Dynamic Breadcrumb */}
          <div className="flex items-center space-x-2 shrink-0 min-w-0">
            <Breadcrumb />
          </div>

          {/* Center: HorizonX-inspired Prominent Global Search */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-4">
            <div className="w-full relative flex items-center bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl px-3.5 py-1.5 text-xs text-[#6B778C] focus-within:bg-white focus-within:border-[#0652CC] focus-within:ring-2 focus-within:ring-[#0652CC]/20 transition-all">
              <svg className="w-4 h-4 text-[#6B778C] mr-2 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search projects, screens, commands..."
                className="w-full bg-transparent border-none p-0 text-xs text-[#091E42] placeholder-[#6B778C] focus:outline-none"
              />
              <kbd className="hidden lg:inline-flex items-center bg-white border border-[#D9E2EC] rounded px-1.5 py-0.5 text-[10px] font-mono text-[#091E42] shadow-2xs shrink-0 ml-2">
                Ctrl K
              </kbd>
            </div>
          </div>

          {/* Right: Notifications, Avatar, Upgrade Button */}
          <div className="flex items-center space-x-3 text-xs text-[#42526E] shrink-0">
            {/* Notifications with badge count */}
            <button
              type="button"
              className="p-2 text-[#42526E] hover:text-[#0652CC] hover:bg-[#F7F9FC] rounded-xl transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#0652CC] text-white text-[9px] font-extrabold flex items-center justify-center">
                2
              </span>
            </button>

            {/* Account Settings button */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.ACCOUNT.PASSWORD)}
              className="p-2 text-[#42526E] hover:text-[#0652CC] hover:bg-[#F7F9FC] rounded-xl transition-colors"
              title="Account Settings"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>

            {/* User Profile Avatar & Dropdown */}
            <div className="relative border-l border-[#E5EAF0] pl-3">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-2 p-1 rounded-xl hover:bg-[#F7F9FC] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#0652CC] text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                  {getInitials(user?.fullName)}
                </div>
                <span className="hidden sm:inline font-semibold text-[#091E42]">{user?.fullName || 'User'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B778C]" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#D9E2EC] rounded-xl shadow-lg py-1.5 z-50 text-xs">
                  <div className="px-3.5 py-2 border-b border-[#E5EAF0]">
                    <p className="font-semibold text-[#091E42] truncate">{user?.fullName || 'User Account'}</p>
                    <p className="text-[10px] text-[#6B778C] truncate">{user?.email || 'poc@alsm.io'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate(ROUTES.BILLING.UPGRADE_ENTERPRISE);
                    }}
                    className="w-full text-left px-3.5 py-2 text-[#42526E] hover:bg-[#F7F9FC] font-medium transition-colors flex items-center space-x-2"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contact & Upgrade</span>
                  </button>
                  <Link
                    to={ROUTES.ACCOUNT.PASSWORD}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center space-x-2 px-3.5 py-2 text-[#42526E] hover:bg-[#F7F9FC] font-medium transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Account Settings</span>
                  </Link>
                  <Link
                    to={ROUTES.BILLING.SUBSCRIPTION}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center space-x-2 px-3.5 py-2 text-[#42526E] hover:bg-[#F7F9FC] font-medium transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>Subscription</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center space-x-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 font-medium transition-colors border-t border-[#E5EAF0]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Simple text Upgrade Button */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.BILLING.UPGRADE_ENTERPRISE)}
              className="px-3 py-1.5 bg-[#0652CC] hover:bg-[#0655FF] text-white rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              Upgrade
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-grow p-6 lg:p-8 w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const AppLayout: React.FC = () => (
  <Web1ThemeProvider>
    <AppLayoutContent />
  </Web1ThemeProvider>
);

export default AppLayout;
