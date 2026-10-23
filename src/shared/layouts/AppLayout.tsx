import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { Bell, Settings, ChevronDown, User, CreditCard, LogOut, BarChart3, Menu } from 'lucide-react';
import { Breadcrumb } from '@/shared/navigation/Breadcrumb';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { useAuth } from '@/app/providers';
import { Web1ThemeProvider, useWeb1Theme } from '@/context/Web1ThemeContext';
import { ROUTES } from '@/shared/constants/routes';
import { billingService } from '@/features/billing/services/billing.service';

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Global Ctrl+K / Cmd+K shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${ROUTES.PROJECTS.LIST}?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // ─── Enterprise status detection ──────────────────────────
  const [isEnterprise, setIsEnterprise] = useState(false);
  const [isEnterpriseSuspended, setIsEnterpriseSuspended] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
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
      className="min-h-screen flex font-sans transition-colors"
      style={{ backgroundColor: theme.colors.background.main, color: theme.colors.text.primary }}
    >
      {/* Dynamic Sidebar with Desktop Collapse and Mobile Drawer */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header: 56px Enterprise Navigation Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-[#E5EAF0] px-4 sm:px-6 h-14 flex items-center justify-between shadow-2xs gap-4 shrink-0">
          {/* Left: Mobile Toggle + Breadcrumb */}
          <div className="flex items-center space-x-2 shrink-0 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 -ml-1 text-[#42526E] hover:text-[#0652CC] hover:bg-[#F1F5F9] rounded-md transition-colors"
              title="Open Navigation"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Breadcrumb />
          </div>

          {/* Center: Global Search with Ctrl+K shortcut */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center justify-center flex-1 max-w-md mx-4"
          >
            <div className="w-full relative flex items-center bg-[#F8FAFC] border border-[#D9E2EC] rounded-md px-3 py-1.5 text-xs text-[#6B778C] focus-within:bg-white focus-within:border-[#0652CC] focus-within:ring-2 focus-within:ring-[#0652CC]/15 transition-all">
              <svg className="w-3.5 h-3.5 text-[#6B778C] mr-2 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search projects, screens, commands... (Enter to go)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none p-0 text-xs text-[#091E42] placeholder-[#6B778C] focus:outline-none"
              />
              <kbd className="hidden lg:inline-flex items-center bg-white border border-[#D9E2EC] rounded px-1.5 py-0.5 text-[9px] font-mono text-[#42526E] shadow-2xs shrink-0 ml-2">
                Ctrl K
              </kbd>
            </div>
          </form>

          {/* Right: Notifications, Settings, Avatar, Upgrade */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 text-xs text-[#42526E] shrink-0">
            {/* Notifications */}
            <button
              type="button"
              className="p-1.5 text-[#6B778C] hover:text-[#0652CC] hover:bg-[#F1F5F9] rounded-md transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#0652CC]"></span>
            </button>

            {/* Account Settings button */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.ACCOUNT.PASSWORD)}
              className="p-1.5 text-[#6B778C] hover:text-[#0652CC] hover:bg-[#F1F5F9] rounded-md transition-colors"
              title="Account Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Profile Avatar & Dropdown */}
            <div className="relative border-l border-[#E5EAF0] pl-2 sm:pl-2.5">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-2 p-1 rounded-md hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#0652CC] text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                  {getInitials(user?.fullName)}
                </div>
                <span className="hidden sm:inline font-semibold text-xs text-[#091E42]">{user?.fullName || 'User'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B778C]" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#D9E2EC] rounded-lg shadow-lg py-1 z-50 text-xs">
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
                      className="w-full text-left px-3.5 py-2 text-[#42526E] hover:bg-[#F1F5F9] font-medium transition-colors flex items-center space-x-2 cursor-pointer"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Service Usage</span>
                    </button>
                  ) : isEnterpriseSuspended ? (
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate(ROUTES.BILLING.UPGRADE_ENTERPRISE);
                      }}
                      className="w-full text-left px-3.5 py-2 text-rose-700 hover:bg-rose-50 font-medium transition-colors flex items-center space-x-2 cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-rose-500" />
                      <span>Enterprise Access Suspended</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate(ROUTES.BILLING.UPGRADE_ENTERPRISE);
                      }}
                      className="w-full text-left px-3.5 py-2 text-[#42526E] hover:bg-[#F1F5F9] font-medium transition-colors flex items-center space-x-2 cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>Contact & Upgrade</span>
                    </button>
                  )}
                  <Link
                    to={ROUTES.ACCOUNT.PASSWORD}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center space-x-2 px-3.5 py-2 text-[#42526E] hover:bg-[#F1F5F9] font-medium transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Account Settings</span>
                  </Link>
                  <Link
                    to={ROUTES.BILLING.SUBSCRIPTION}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center space-x-2 px-3.5 py-2 text-[#42526E] hover:bg-[#F1F5F9] font-medium transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>Subscription</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center space-x-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 font-medium transition-colors border-t border-[#E5EAF0] cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
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
                className="px-3 py-1.5 bg-[#0652CC] hover:bg-[#0655FF] text-white rounded-md text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                Upgrade
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8 w-full min-w-0 bg-[#F8FAFC]">
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
