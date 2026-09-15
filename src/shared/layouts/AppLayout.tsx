import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, LogOut, User, CreditCard, Sparkles, ChevronDown } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { ROUTES } from '@/shared/constants/routes';
import LogoImg from '@/assets/logo.png';

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.PUBLIC.LOGIN);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-900 flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between relative">
        {/* Left: Logo */}
        <div className="flex items-center h-full">
          <Link to={ROUTES.DASHBOARD} className="flex items-center h-full">
            <img src={LogoImg} alt="ALSM Logo" className="h-10 object-contain" />
          </Link>
        </div>

        {/* Center: Nav Links */}
        <nav className="hidden md:flex items-center h-full space-x-8 absolute left-1/2 transform -translate-x-1/2">
          <NavLink
            to={ROUTES.DASHBOARD}
            className={({ isActive }) =>
              `relative h-full flex items-center text-[14px] transition-colors ${
                isActive ? 'text-[#0652CC] font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                Dashboard
                {isActive && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#0652CC]" />}
              </>
            )}
          </NavLink>
          <NavLink
            to={ROUTES.PROJECTS.LIST}
            end
            className={({ isActive }) =>
              `relative h-full flex items-center text-[14px] transition-colors ${
                isActive ? 'text-[#0652CC] font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                Projects
                {isActive && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#0652CC]" />}
              </>
            )}
          </NavLink>
          <NavLink
            to={ROUTES.BILLING.USAGE}
            className={({ isActive }) =>
              `relative h-full flex items-center text-[14px] transition-colors ${
                isActive ? 'text-[#0652CC] font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                Usage
                {isActive && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#0652CC]" />}
              </>
            )}
          </NavLink>
          <NavLink
            to={ROUTES.BILLING.PRICING}
            className={({ isActive }) =>
              `relative h-full flex items-center text-[14px] transition-colors ${
                isActive ? 'text-[#0652CC] font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                Pricing
                {isActive && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#0652CC]" />}
              </>
            )}
          </NavLink>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3">
          <button
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            className="relative w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(ROUTES.ACCOUNT.PASSWORD)}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            title="Account Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
            >
              <div className="w-9 h-9 rounded-full bg-[#0652CC] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {getInitials(user?.fullName)}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{user?.fullName || 'User'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setProfileOpen(false); navigate('/workspace/contact'); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Contact & Upgrade</span>
                </button>
                <Link
                  to={ROUTES.ACCOUNT.PASSWORD}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Account Settings</span>
                </Link>
                <Link
                  to={ROUTES.BILLING.SUBSCRIPTION}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>Subscription</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow p-6 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
