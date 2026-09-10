import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Cpu, Layers, Folder, CreditCard, User, LogOut, ChevronDown, Activity, Settings, Stethoscope } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { ROUTES } from '@/shared/constants/routes';

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
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-8">
          <Link to={ROUTES.PROJECTS.SCREENS('proj-acme')} className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-slate-900 text-lg leading-none">ALSM</span>
              <span className="text-[10px] font-medium text-slate-500 tracking-wide mt-0.5">Legacy Modernization</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            <NavLink
              to={ROUTES.PROJECTS.SCREENS('proj-acme')}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <span className="flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>Dashboard</span>
              </span>
            </NavLink>
            <NavLink
              to={ROUTES.PROJECTS.LIST}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <span className="flex items-center space-x-2">
                <Folder className="w-4 h-4" />
                <span>Projects</span>
              </span>
            </NavLink>
            <NavLink
              to={ROUTES.PROJECTS.DIAGNOSTICS('proj-acme')}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <span className="flex items-center space-x-2">
                <Stethoscope className="w-4 h-4 text-rose-600" />
                <span>Diagnostics</span>
              </span>
            </NavLink>
            <NavLink
              to={ROUTES.BILLING.USAGE}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <span className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Usage</span>
              </span>
            </NavLink>
            <NavLink
              to={ROUTES.BILLING.PRICING}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <span className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Pricing</span>
              </span>
            </NavLink>
            <NavLink
              to={ROUTES.ACCOUNT.PASSWORD}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <span className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Account & Security</span>
              </span>
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Screens: <strong className="text-slate-900 font-semibold">45</strong> / 500</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-slate-300 object-cover"
              />
              <span className="hidden sm:inline text-sm font-medium text-slate-700">{user?.fullName || 'Alex Vance'}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
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
