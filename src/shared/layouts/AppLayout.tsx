import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, User, CreditCard } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { ROUTES } from '@/shared/constants/routes';
import LogoImg from '@/assets/logo.png';


export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.PUBLIC.LOGIN);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-900 flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between relative">
        <div className="flex items-center h-full">
          <Link to={ROUTES.PROJECTS.SCREENS('proj-acme')} className="flex items-center h-full">
            <img src={LogoImg} alt="ALSM Logo" className="h-10 object-contain" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center h-full space-x-8 absolute left-1/2 transform -translate-x-1/2">
            <NavLink
              to={ROUTES.PROJECTS.SCREENS('proj-acme')}
              className={({ isActive }) =>
                `relative h-full flex items-center text-[14px] transition-colors ${
                  isActive 
                    ? 'text-[#0652CC] font-semibold' 
                    : 'text-slate-500 hover:text-slate-900'
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
                  isActive 
                    ? 'text-[#0652CC] font-semibold' 
                    : 'text-slate-500 hover:text-slate-900'
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
                  isActive 
                    ? 'text-[#0652CC] font-semibold' 
                    : 'text-slate-500 hover:text-slate-900'
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
                  isActive 
                    ? 'text-[#0652CC] font-semibold' 
                    : 'text-slate-500 hover:text-slate-900'
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

        <div className="flex items-center space-x-4">
          <button className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-10 h-10 rounded-full bg-[#0652CC] flex items-center justify-center text-white font-semibold text-[15px] hover:bg-blue-700 transition-colors focus:outline-none"
            >
              JS
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{user?.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <Link
                  to={ROUTES.ACCOUNT.PASSWORD}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Security & Account</span>
                </Link>
                <Link
                  to={ROUTES.BILLING.SUBSCRIPTION}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>Manage Subscription</span>
                </Link>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-medium"
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

      <footer className="bg-[#181A1D] border-t border-slate-800 py-6 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <span>ALSM – Automating Legacy System Modernization Platform</span>
          <div className="flex space-x-6 text-slate-300">
            <Link to={ROUTES.PUBLIC.LANDING} className="hover:text-white transition-colors">Landing Page</Link>
            <Link to={ROUTES.BILLING.PRICING} className="hover:text-white transition-colors">Pricing</Link>
            <Link to={ROUTES.ACCOUNT.PASSWORD} className="hover:text-white transition-colors">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default AppLayout;
