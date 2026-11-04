import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { Settings, ChevronDown, User, CreditCard, LogOut, BarChart3, FileText, Search } from 'lucide-react';
import { Breadcrumb } from '@/shared/navigation/Breadcrumb';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { useAuth } from '@/app/providers';
import { Web1ThemeProvider, useWeb1Theme } from '@/context/Web1ThemeContext';
import { ROUTES } from '@/shared/constants/routes';
import { billingService } from '@/features/billing/services/billing.service';
import { NotificationsBell } from '@/features/notifications/components/NotificationsBell';

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
  useWeb1Theme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ─── Enterprise status detection ──────────────────────────
  const [isEnterprise, setIsEnterprise] = useState(false);
  const [isEnterpriseSuspended, setIsEnterpriseSuspended] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Check quote request status
        const quote = await billingService.getMyQuoteRequest();
        if (!cancelled && quote?.status === 'SUSPENDED') {
          setIsEnterprise(false);
          setIsEnterpriseSuspended(true);
          return;
        }
        if (!cancelled && (quote?.status === 'APPROVED' || quote?.status === 'CLOSED')) {
          setIsEnterprise(true);
          setIsEnterpriseSuspended(false);
          return;
        }
        // Also check current subscription tier
        const sub = await billingService.getCurrentSubscription();
        if (!cancelled && sub) {
          const tier = 'planTier' in sub && sub.planTier
            ? sub.planTier
            : 'tier' in sub
              ? sub.tier
              : 'plan' in sub
                ? sub.plan
                : '';
          if (typeof tier === 'string' && tier.toLowerCase().includes('enterprise')) {
            setIsEnterprise(true);
            setIsEnterpriseSuspended(false);
          }
        }
      } catch {
        // Silently ignore — default to showing Upgrade
      }
    })();
    return () => { cancelled = true; };
  }, [location.pathname]);

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
      className="min-h-screen flex font-sans transition-colors bg-[#F8FAFC]"
      style={{
        backgroundColor: '#F8FAFC',
        color: '#0F172A',
        '--sidebar-width': sidebarCollapsed ? '4rem' : '15rem',
        '--app-header-height': '64px',
      } as React.CSSProperties}
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
        <header
          className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] px-6 lg:px-8 flex items-center justify-between shadow-2xs gap-4 box-border h-[var(--app-header-height,64px)] min-h-[var(--app-header-height,64px)]"
          style={{
            height: 'var(--app-header-height, 64px)',
            minHeight: 'var(--app-header-height, 64px)',
            boxSizing: 'border-box',
          }}
        >
          {/* Left: Dynamic Breadcrumb */}
          <div className="flex items-center space-x-2 shrink-0 min-w-0">
            <Breadcrumb />
          </div>

          {/* Center: HorizonX-inspired Prominent Global Search */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-4">
            <div className="w-full relative flex items-center bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs text-[#64748B] focus-within:bg-white focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 transition-all">
              <Search className="w-4 h-4 text-[#64748B] mr-2 shrink-0" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search projects, screens, commands..."
                className="w-full bg-transparent border-none p-0 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none"
              />
              <kbd className="hidden lg:inline-flex items-center bg-white border border-[#E2E8F0] rounded px-1.5 py-0.5 text-[10px] font-mono text-[#64748B] shadow-2xs shrink-0 ml-2">
                Ctrl K
              </kbd>
            </div>
          </div>

          {/* Right: Notifications, Avatar, Upgrade Button */}
          <div className="flex items-center space-x-3 text-xs text-[#475569] shrink-0">
            {/* Notifications with badge count */}
            <NotificationsBell />

            {/* Account Settings button */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.ACCOUNT.PASSWORD)}
              className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
              title="Account Settings"
              aria-label="Cài đặt tài khoản"
            >
              <Settings className="w-4.5 h-4.5" aria-hidden="true" />
            </button>

            {/* User Profile Avatar & Dropdown */}
            <div className="relative border-l border-[#E2E8F0] pl-3">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-2 p-1 rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                aria-label="Menu tài khoản người dùng"
              >
                <div className="w-7 h-7 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-bold flex items-center justify-center text-xs shadow-2xs">
                  {getInitials(user?.fullName)}
                </div>
                <span className="hidden sm:inline font-semibold text-[#0F172A]">{user?.fullName || 'User'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" aria-hidden="true" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#D9E2EC] rounded-xl shadow-lg py-1.5 z-50 text-xs">
                  <div className="px-3.5 py-2 border-b border-[#E5EAF0]">
                    <p className="font-semibold text-[#091E42] truncate">{user?.fullName || 'User Account'}</p>
                    <p className="text-[10px] text-[#6B778C] truncate">{user?.email || 'poc@alsm.io'}</p>
                  </div>
                  {isEnterprise ? (
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate(ROUTES.BILLING.USAGE);
                      }}
                      className="w-full text-left px-3.5 py-2 text-[#42526E] hover:bg-[#F7F9FC] font-medium transition-colors flex items-center space-x-2"
                    >
                      <BarChart3 className="w-4 h-4 text-emerald-500" />
                      <span>Service Usage</span>
                    </button>
                  ) : isEnterpriseSuspended ? (
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate(ROUTES.BILLING.UPGRADE_ENTERPRISE);
                      }}
                      className="w-full text-left px-3.5 py-2 text-rose-700 hover:bg-rose-50 font-medium transition-colors flex items-center space-x-2"
                    >
                      <CreditCard className="w-4 h-4 text-rose-500" />
                      <span>Enterprise Access Suspended</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate(ROUTES.BILLING.UPGRADE_ENTERPRISE);
                      }}
                      className="w-full text-left px-3.5 py-2 text-[#42526E] hover:bg-[#F7F9FC] font-medium transition-colors flex items-center space-x-2"
                    >
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <span>Contact & Upgrade</span>
                    </button>
                  )}
                  <Link
                    to={ROUTES.ACCOUNT.PASSWORD}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center space-x-2 px-3.5 py-2 text-[#42526E] hover:bg-[#F7F9FC] font-medium transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </Link>
                  <Link
                    to={ROUTES.BILLING.SUBSCRIPTION}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center space-x-2 px-3.5 py-2 text-[#42526E] hover:bg-[#F7F9FC] font-medium transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span>Subscription</span>
                  </Link>
                  <Link
                    to={ROUTES.BILLING.INVOICES}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center space-x-2 px-3.5 py-2 text-[#42526E] hover:bg-[#F7F9FC] font-medium transition-colors"
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Invoices & Billing</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center space-x-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 font-medium transition-colors border-t border-[#E2E8F0]"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Upgrade Button — hidden when user is Enterprise */}
            {!isEnterprise && !isEnterpriseSuspended && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.BILLING.UPGRADE_ENTERPRISE)}
                className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Upgrade
              </button>
            )}
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
