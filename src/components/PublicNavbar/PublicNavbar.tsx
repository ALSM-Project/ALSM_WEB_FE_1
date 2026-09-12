import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import {
  Cpu,
  ChevronDown,
  Menu,
  X,
  Monitor,
  Code2,
  Sparkles,
  Activity,
  FolderKanban,
  Workflow,
  ArrowRight,
  FileSearch,
  Layers,
  Code,
  Terminal,
  Coffee,
  LogOut,
  Shield,
  PieChart,
} from 'lucide-react';
import logo2 from '@/assets/logo2.png';
import { ROUTES } from '@/shared/constants/routes';
import './PublicNavbar.css';

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
interface DropdownLink {
  label: string;
  description: string;
  to: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface DropdownSection {
  title: string;
  links: DropdownLink[];
}

/* ─────────────────────────────────────────────
   Dropdown Data
   ───────────────────────────────────────────── */
const PLATFORM_SECTIONS: DropdownSection[] = [
  {
    title: 'MODERNIZATION',
    links: [
      {
        label: 'BMS / DSPF Modernization',
        description: 'Modernize legacy screen definitions into React interfaces.',
        to: ROUTES.PROJECTS.NEW,
        icon: Monitor,
      },
      {
        label: 'COBOL Modernization',
        description: 'Modernize legacy COBOL business logic into Java.',
        to: ROUTES.PROJECTS.NEW,
        icon: Code2,
      },
    ],
  },
  {
    title: 'VALIDATION & QUALITY',
    links: [
      {
        label: 'AI Validation',
        description: 'AI-assisted validation of generated modernization output.',
        to: ROUTES.PROJECTS.NEW,
        icon: Sparkles,
      },
      {
        label: 'Diagnostics',
        description: 'Review diagnostics and conversion issues.',
        to: ROUTES.PROJECTS.NEW,
        icon: Activity,
      },
    ],
  },
  {
    title: 'WORKFLOW',
    links: [
      {
        label: 'Projects',
        description: 'Manage modernization projects.',
        to: ROUTES.PROJECTS.NEW,
        icon: FolderKanban,
      },
      {
        label: 'Conversion Pipeline',
        description: 'Analyze → Map → Generate → Validate → Export',
        to: ROUTES.PROJECTS.NEW,
        icon: Workflow,
      },
    ],
  },
];

const TOOLS_SECTIONS: DropdownSection[] = [
  {
    title: 'BMS / DSPF',
    links: [
      {
        label: 'BMS / DSPF Analysis',
        description: 'Analyze legacy screen definitions.',
        to: ROUTES.PROJECTS.NEW,
        icon: FileSearch,
      },
      {
        label: 'Field Mapping',
        description: 'Review and map legacy screen fields.',
        to: ROUTES.PROJECTS.NEW,
        icon: Layers,
      },
      {
        label: 'React Output',
        description: 'Review generated React components.',
        to: ROUTES.PROJECTS.NEW,
        icon: Code,
      },
    ],
  },
  {
    title: 'COBOL',
    links: [
      {
        label: 'COBOL Analysis',
        description: 'Analyze COBOL programs.',
        to: ROUTES.PROJECTS.NEW,
        icon: Terminal,
      },
      {
        label: 'Business Logic',
        description: 'Review generated business logic.',
        to: ROUTES.PROJECTS.NEW,
        icon: Cpu,
      },
      {
        label: 'Java Output',
        description: 'Review generated Java output.',
        to: ROUTES.PROJECTS.NEW,
        icon: Coffee,
      },
    ],
  },
  {
    title: 'QUALITY',
    links: [
      {
        label: 'AI Validation',
        description: 'Review AI-assisted validation.',
        to: ROUTES.PROJECTS.NEW,
        icon: Sparkles,
      },
      {
        label: 'Diagnostics',
        description: 'Inspect conversion diagnostics.',
        to: ROUTES.PROJECTS.NEW,
        icon: Activity,
      },
    ],
  },
];

/* ─────────────────────────────────────────────
   Text Rollover Component
   ───────────────────────────────────────────── */
const TextRollover: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => (
  <span className={`alsm-nav-rollover ${className}`}>
    <span>{text}</span>
    <span>{text}</span>
  </span>
);

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/* ─────────────────────────────────────────────
   PublicNavbar Component
   ───────────────────────────────────────────── */
export const PublicNavbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'platform' | 'tools' | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobilePlatformOpen, setMobilePlatformOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/');
  };

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close mobile on route change
  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const toggleDropdown = useCallback((which: 'platform' | 'tools') => {
    setOpenDropdown(prev => (prev === which ? null : which));
  }, []);

  const closeAll = useCallback(() => {
    setOpenDropdown(null);
  }, []);

  /* ─── Render Dropdown Panel ─── */
  const renderDropdownPanel = (
    sections: DropdownSection[],
    id: string,
    isOpen: boolean,
    isWide?: boolean,
    footer?: { text: string; href: string },
  ) => (
    <div
      id={`dropdown-${id}`}
      role="region"
      className={`alsm-dropdown-panel ${isOpen ? 'open' : ''} ${isWide ? 'wide' : ''} ${id === 'platform' ? 'mega' : ''
        }`}
    >
      <div className={`alsm-dropdown-grid ${sections.length === 3 ? 'cols-3' : 'cols-2'}`}>
        {sections.map((section) => (
          <div key={section.title} className="alsm-dropdown-column">
            <div className="alsm-dropdown-section-title">{section.title}</div>
            <div className="alsm-dropdown-section-items">
              {section.links.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="alsm-dropdown-link"
                  onClick={closeAll}
                >
                  {link.icon && (
                    <div className="alsm-dropdown-link-icon">
                      <link.icon className="w-5 h-5" />
                    </div>
                  )}
                  <div className="alsm-dropdown-link-content">
                    <span className="alsm-dropdown-link-title">{link.label}</span>
                    <span className="alsm-dropdown-link-desc">{link.description}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {footer && (
        <div className="alsm-dropdown-footer">
          <a href={footer.href} className="alsm-dropdown-footer-link" onClick={closeAll}>
            <span>{footer.text}</span>
            <ArrowRight className="w-4 h-4 alsm-dropdown-footer-arrow" />
          </a>
        </div>
      )}
    </div>
  );

  return (
    <>
      <header className={`alsm-header ${scrolled ? 'scrolled' : ''}`} role="banner">
        <div className="alsm-header-inner" ref={dropdownRef}>
          {/* ─── Logo ─── */}
          <Link to="/" className="alsm-logo" aria-label="ALSM Home">
            <img
              src={logo2}
              alt="ALSM"
              className="alsm-logo-image"
            />
          </Link>

          {/* ─── Center Navigation ─── */}
          <nav className="alsm-nav-center" aria-label="Primary navigation">
            {/* Platform Dropdown */}
            <div className="alsm-dropdown-anchor">
              <button
                type="button"
                className="alsm-nav-item"
                aria-expanded={openDropdown === 'platform'}
                aria-controls="dropdown-platform"
                onClick={() => toggleDropdown('platform')}
              >
                <TextRollover text="Platform" />
                <ChevronDown className="alsm-nav-caret" />
              </button>
              {renderDropdownPanel(
                PLATFORM_SECTIONS,
                'platform',
                openDropdown === 'platform',
                true,
                { text: 'Explore the ALSM platform', href: '#platform' },
              )}
            </div>

            {/* Tools Dropdown */}
            <div className="alsm-dropdown-anchor">
              <button
                type="button"
                className="alsm-nav-item"
                aria-expanded={openDropdown === 'tools'}
                aria-controls="dropdown-tools"
                onClick={() => toggleDropdown('tools')}
              >
                <TextRollover text="Tools" />
                <ChevronDown className="alsm-nav-caret" />
              </button>
              {renderDropdownPanel(TOOLS_SECTIONS, 'tools', openDropdown === 'tools', true)}
            </div>

            {/* Simple Links */}
            <Link to={ROUTES.BILLING.PRICING} className="alsm-nav-item">
              <TextRollover text="Pricing" />
            </Link>
            <Link to={ROUTES.PUBLIC.FAQ} className="alsm-nav-item">
              <TextRollover text="FAQ" />
            </Link>
            <Link to={ROUTES.PUBLIC.DOCS} className="alsm-nav-item">
              <TextRollover text="Docs" />
            </Link>
            <Link to={ROUTES.PUBLIC.CONTACT} className="alsm-nav-item">
              <TextRollover text="Contact" />
            </Link>
          </nav>

          {/* ─── Right Auth Section ─── */}
          <div className="alsm-nav-right flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <Link
                  to={ROUTES.PROJECTS.SCREENS('proj-acme')}
                  className="alsm-cta-btn active"
                >
                  <span className="alsm-cta-rollover">
                    <span>Go to Workspace</span>
                    <span>Go to Workspace</span>
                  </span>
                </Link>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#0652CC] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                      {getInitials(user?.fullName)}
                    </div>
                    <span className="hidden sm:inline font-semibold text-xs text-[#091E42] max-w-[120px] truncate">
                      {user?.fullName || 'Account'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="font-bold text-slate-900 text-sm">{user?.fullName || 'User'}</p>
                        <p className="text-slate-500 text-[11px] truncate mt-0.5">{user?.email || ''}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to={ROUTES.PROJECTS.SCREENS('proj-acme')}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <FolderKanban className="w-4 h-4 text-slate-400" />
                          <span>Projects Workspace</span>
                        </Link>

                        <Link
                          to={ROUTES.BILLING.USAGE}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <PieChart className="w-4 h-4 text-slate-400" />
                          <span>Resource Usage</span>
                        </Link>

                        <Link
                          to={ROUTES.ACCOUNT.PASSWORD}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <Shield className="w-4 h-4 text-slate-400" />
                          <span>Account & Security</span>
                        </Link>
                      </div>

                      <div className="border-t border-slate-100 pt-1 mt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 font-semibold"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to={ROUTES.PUBLIC.LOGIN}
                  className={`alsm-login-link ${location.pathname === ROUTES.PUBLIC.LOGIN ? 'active' : ''}`}
                >
                  <span className="alsm-login-rollover">
                    <span>Log in</span>
                    <span>Log in</span>
                  </span>
                </Link>
                <Link
                  to={ROUTES.PUBLIC.REGISTER}
                  className={`alsm-cta-btn ${location.pathname === ROUTES.PUBLIC.REGISTER ? 'active' : ''}`}
                >
                  <span className="alsm-cta-rollover">
                    <span>Get Started</span>
                    <span>Get Started</span>
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* ─── Mobile Controls ─── */}
          <div className="alsm-mobile-controls">
            <Link
              to={isAuthenticated ? ROUTES.PROJECTS.SCREENS('proj-acme') : ROUTES.PUBLIC.REGISTER}
              className="alsm-mobile-cta"
            >
              {isAuthenticated ? 'Workspace' : 'Get Started'}
            </Link>
            <button
              type="button"
              className="alsm-hamburger"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Overlay ─── */}
      <div
        className={`alsm-mobile-overlay ${mobileOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <ul className="alsm-mobile-nav-list">
          {/* Platform accordion */}
          <li>
            <button
              type="button"
              className="alsm-mobile-nav-link"
              onClick={() => setMobilePlatformOpen(!mobilePlatformOpen)}
              aria-expanded={mobilePlatformOpen}
            >
              Platform
              <ChevronDown
                className="alsm-nav-caret"
                style={{ transform: mobilePlatformOpen ? 'rotate(180deg)' : 'none' }}
              />
            </button>
            <ul className={`alsm-mobile-sub-list ${mobilePlatformOpen ? 'expanded' : ''}`}>
              {PLATFORM_SECTIONS.map((section) => (
                <React.Fragment key={section.title}>
                  <li className="alsm-mobile-sub-section-title">{section.title}</li>
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="alsm-mobile-sub-link"
                        onClick={() => setMobileOpen(false)}
                      >
                        {link.icon && <link.icon className="w-4 h-4 alsm-mobile-sub-icon" />}
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </React.Fragment>
              ))}
            </ul>
          </li>

          {/* Tools accordion */}
          <li>
            <button
              type="button"
              className="alsm-mobile-nav-link"
              onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
              aria-expanded={mobileToolsOpen}
            >
              Tools
              <ChevronDown
                className="alsm-nav-caret"
                style={{ transform: mobileToolsOpen ? 'rotate(180deg)' : 'none' }}
              />
            </button>
            <ul className={`alsm-mobile-sub-list ${mobileToolsOpen ? 'expanded' : ''}`}>
              {TOOLS_SECTIONS.map((section) => (
                <React.Fragment key={section.title}>
                  <li className="alsm-mobile-sub-section-title">{section.title}</li>
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="alsm-mobile-sub-link"
                        onClick={() => setMobileOpen(false)}
                      >
                        {link.icon && <link.icon className="w-4 h-4 alsm-mobile-sub-icon" />}
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </React.Fragment>
              ))}
            </ul>
          </li>

          {/* Simple links */}
          <li>
            <Link
              to={ROUTES.BILLING.PRICING}
              className="alsm-mobile-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
          </li>
          <li>
            <Link
              to={ROUTES.PUBLIC.FAQ}
              className="alsm-mobile-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              FAQ
            </Link>
          </li>
          <li>
            <Link
              to={ROUTES.PUBLIC.DOCS}
              className="alsm-mobile-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              Docs
            </Link>
          </li>
          <li>
            <Link
              to={ROUTES.PUBLIC.CONTACT}
              className="alsm-mobile-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              Contact
            </Link>
          </li>
        </ul>

        <div className="alsm-mobile-divider" />

        <div className="alsm-mobile-auth">
          <Link
            to={ROUTES.PUBLIC.LOGIN}
            className="alsm-mobile-login"
            onClick={() => setMobileOpen(false)}
          >
            Log in
          </Link>
          <Link
            to={ROUTES.PUBLIC.REGISTER}
            className="alsm-mobile-get-started"
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* ─── Header Height Spacer ─── */}
      <div className="alsm-header-spacer" />
    </>
  );
};

export default PublicNavbar;
