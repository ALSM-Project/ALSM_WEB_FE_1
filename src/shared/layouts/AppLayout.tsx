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
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shadow-sm transition-all duration-200">
        <div className="flex items-center space-x-8">
          <Link to={ROUTES.PROJECTS.SCREENS('proj-acme')} className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-all duration-300 transform group-hover:-translate-y-0.5">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-slate-900 text-[17px] leading-none group-hover:text-brand-700 transition-colors">ALSM</span>
              <span className="text-[10px] font-semibold text-slate-500 tracking-wider mt-0.5 uppercase">Legacy Modernization</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            <NavLink
              to={ROUTES.PROJECTS.SCREENS('proj-acme')}
              className={({ isActive }) =>
                `px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-50/80 text-brand-700 font-bold shadow-xs ring-1 ring-brand-100' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
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
              end
              className={({ isActive }) =>
                `px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-50/80 text-brand-700 font-bold shadow-xs ring-1 ring-brand-100' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
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
                `px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-50/80 text-brand-700 font-bold shadow-xs ring-1 ring-brand-100' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
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
                `px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-50/80 text-brand-700 font-bold shadow-xs ring-1 ring-brand-100' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
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
                `px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-50/80 text-brand-700 font-bold shadow-xs ring-1 ring-brand-100' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
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
                `px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-50/80 text-brand-700 font-bold shadow-xs ring-1 ring-brand-100' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
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

        <div className="flex items-center space-x-5">
          <div className="hidden sm:flex items-center space-x-2.5 bg-white/50 px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-xs text-xs text-slate-500 font-medium backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Screens: <strong className="text-slate-900 font-bold ml-0.5">45</strong> / 500</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-2.5 p-1 rounded-full hover:bg-slate-100/80 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'}
                alt="Avatar"
                className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover ring-1 ring-slate-200/50"
              />
              <div className="hidden sm:flex flex-col items-start px-1">
                <span className="text-[13px] font-bold text-slate-800 leading-tight">{user?.fullName || 'Alex Vance'}</span>
                <span className="text-[10px] font-medium text-slate-400 leading-tight">Admin</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 mr-1" />
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
