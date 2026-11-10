import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useAuth, isUserStaffOrAdmin, getTargetHandoffUrl } from '@/app/providers';

import { ROUTES } from '@/shared/constants/routes';
import { ApiError } from '@/services/api/apiError';
import logo from '@/assets/logo.png';
import alsm3dBg from '@/assets/alsm-3d-bg.jpg';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

const REMEMBER_EMAIL_KEY = 'alsm_remembered_email';
const REMEMBER_PASSWORD_KEY = 'alsm_remembered_password';
const REMEMBER_ME_FLAG_KEY = 'alsm_remember_me_flag';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form states
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_EMAIL_KEY) || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_PASSWORD_KEY) || '';
    } catch {
      return '';
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      const savedFlag = localStorage.getItem(REMEMBER_ME_FLAG_KEY);
      if (savedFlag !== null) {
        return savedFlag === 'true';
      }
      return true;
    } catch {
      return true;
    }
  });

  // Status & Feedback states
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('auto_google') === '1') {
        const interval = setInterval(() => {
          if (window.google?.accounts?.id?.prompt) {
            window.google.accounts.id.prompt();
            clearInterval(interval);
          }
        }, 200);
        const timeout = setTimeout(() => clearInterval(interval), 4000);
        return () => {
          clearInterval(interval);
          clearTimeout(timeout);
        };
      }
    } catch {
      // ignore
    }
  }, []);
  const [redirectLabel, setRedirectLabel] = useState('Redirecting to ALSM Partner Portal...');

  const getRedirectTarget = () => {
    if (typeof window !== 'undefined' && window.location) {
      try {
        const params = new URLSearchParams(window.location.search);
        const searchReturnTo = params.get('returnTo');
        if (searchReturnTo) {
          if (!searchReturnTo.startsWith('http') && !searchReturnTo.includes('300')) {
            return searchReturnTo;
          }
          return ROUTES.DASHBOARD;
        }
      } catch {
        // ignore
      }
    }
    const returnTo = (location.state as { returnTo?: string })?.returnTo;
    return returnTo || ROUTES.DASHBOARD;
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (rememberMe) {
      try {
        if (val.trim()) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, val.trim());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (rememberMe) {
      try {
        if (val) {
          localStorage.setItem(REMEMBER_PASSWORD_KEY, val);
        } else {
          localStorage.removeItem(REMEMBER_PASSWORD_KEY);
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  };

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    try {
      localStorage.setItem(REMEMBER_ME_FLAG_KEY, String(checked));
      if (!checked) {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
        localStorage.removeItem(REMEMBER_PASSWORD_KEY);
      } else {
        if (email.trim()) localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
        if (password) localStorage.setItem(REMEMBER_PASSWORD_KEY, password);
      }
    } catch {
      // Ignore localStorage exceptions in private browsing mode
    }
  };

  const persistRememberMeCredentials = (savedEmail: string, savedPassword?: string) => {
    try {
      localStorage.setItem(REMEMBER_ME_FLAG_KEY, String(rememberMe));
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, savedEmail.trim());
        if (savedPassword) {
          localStorage.setItem(REMEMBER_PASSWORD_KEY, savedPassword);
        }
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
        localStorage.removeItem(REMEMBER_PASSWORD_KEY);
      }
    } catch {
      // Ignore localStorage exceptions
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail('');

    if (!email.trim()) return setError('Please enter your work email');
    if (!password) return setError('Please enter your password');

    // Persist immediately before API call in case of fast redirects or unloads
    persistRememberMeCredentials(email, password);

    setLoading(true);
    try {
      const user = await login({ email: email.trim(), password });

      if (user) {
        const handoff = getTargetHandoffUrl(user);
        if (handoff) {
          setRedirectLabel(
            handoff.includes('3002') || isUserStaffOrAdmin(user)
              ? 'Redirecting to Staff Portal...'
              : 'Redirecting to ALSM Partner Portal...'
          );
          setIsRedirecting(true);
          return;
        }

        navigate(getRedirectTarget(), { replace: true });
      } else if (!user) {
        setError('Unable to retrieve account information. Please try again.');
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(email.trim());
      } else if (err?.code === 'EMAIL_NOT_VERIFIED' || err?.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(email.trim());
      } else {
        setError(toErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle(idToken);

      if (user) {
        if (user.email) {
          persistRememberMeCredentials(user.email);
        }
        const handoff = getTargetHandoffUrl(user);
        if (handoff) {
          setRedirectLabel(
            handoff.includes('3002') || isUserStaffOrAdmin(user)
              ? 'Redirecting to Staff Portal...'
              : 'Redirecting to ALSM Partner Portal...'
          );
          setIsRedirecting(true);
          return;
        }

        navigate(getRedirectTarget(), { replace: true });
      } else if (!user) {
        setError('Google sign-in failed. Please try again.');
      }
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5 shadow-sm border border-blue-100">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{redirectLabel}</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">
          Account authenticated successfully. Synchronizing session to dedicated portal...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      {/* 2-Column Symmetrical Floating Cards Container (1080px max-width) */}
      <div className="w-full max-w-[1080px] grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch my-auto">
        
        {/* =========================================================================
            LEFT PANEL: LOGIN FORM (Exact 400px width alignment with Register page)
            ========================================================================= */}
        <div className="w-full bg-white rounded-[28px] p-7 sm:p-8 md:p-9 shadow-xl border border-slate-200/80 flex flex-col justify-between">
          <div className="w-full max-w-[400px] mx-auto flex flex-col justify-between h-full">
            <div>
              {/* SECTION 1 — LOGIN HEADER */}
              <div className="mb-7">
                {/* Header Brand for Mobile Viewports */}
                <Link
                  to={ROUTES.PUBLIC.LANDING}
                  className="lg:hidden flex items-center space-x-2.5 pb-3 mb-4 border-b border-slate-100 hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                >
                  <img src={logo} alt="ALSM Logo" className="h-7 w-auto object-contain" />
                  <div className="flex flex-col">
                    <span className="text-base font-bold tracking-tight text-slate-900 leading-tight">
                      ALSM
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Legacy Modernization
                    </span>
                  </div>
                </Link>

                <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-snug">
                  Welcome Back
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Sign in to continue modernizing your legacy systems with ALSM.
                </p>
              </div>

              {/* Unverified Email Warning Box */}
              {unverifiedEmail && (
                <div
                  role="alert"
                  className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-xs space-y-1.5 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900">Email not verified!</p>
                    <p className="text-amber-800 mt-0.5 leading-relaxed">
                      Please check your email inbox or enter the verification code to complete account activation.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`${ROUTES.PUBLIC.VERIFY_EMAIL}?email=${encodeURIComponent(unverifiedEmail)}`)
                      }
                      className="mt-2 text-blue-600 hover:text-blue-700 font-semibold hover:underline inline-flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                    >
                      <span>Verify Now</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {/* Standard Error Notification */}
              {error && (
                <div
                  role="alert"
                  className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="flex-1">{error}</span>
                </div>
              )}

              {/* SECTION 2 — LOGIN FORM */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Field 1: Work Email */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      required
                      disabled={loading}
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="Enter your work email"
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-500 hover:border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors disabled:opacity-60 shadow-xs"
                    />
                  </div>
                </div>

                {/* Field 2: Password */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      disabled={loading}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-500 hover:border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors disabled:opacity-60 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* SECTION 3 — REMEMBER ME AND FORGOT PASSWORD */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => handleRememberMeChange(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600/20 cursor-pointer transition-colors"
                    />
                    <label
                      htmlFor="remember"
                      className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer select-none font-medium"
                    >
                      Remember me
                    </label>
                  </div>

                  <Link
                    to={ROUTES.PUBLIC.FORGOT_PASSWORD}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* SECTION 4 — PRIMARY LOGIN ACTION */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-2 bg-[#244A70] hover:bg-[#1B3856] active:bg-[#13283E] text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#244A70] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white" aria-hidden="true" />
                      <span>Signing in...</span>
                    </span>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>

              {/* SECTION 5 — SOCIAL AUTHENTICATION */}
              <div className="relative flex py-2 items-center my-4">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-xs text-slate-500 font-medium">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div className="w-full flex justify-center">
                <GoogleSignInButton onCredential={handleGoogleCredential} />
              </div>
            </div>

            {/* SECTION 6 — REGISTRATION FOOTER */}
            <p className="text-center text-xs text-slate-500 mt-5 pt-3 border-t border-slate-100">
              Don't have an account?{' '}
              <Link to={ROUTES.PUBLIC.REGISTER} className="text-blue-600 font-semibold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* =========================================================================
            RIGHT PANEL: ALSM BRANDING & 3D TECHNOLOGY EXPERIENCE
            (Identical visual system with Register: Deep navy, 3D asset, non-nested pipeline)
            ========================================================================= */}
        <div className="hidden lg:flex w-full relative rounded-[28px] overflow-hidden bg-[#0F172A] text-white p-7 sm:p-8 md:p-9 flex-col justify-between shadow-xl border border-slate-800 min-h-[580px]">
          
          {/* Authentic 3D Technology Background Image */}
          <img
            src={alsm3dBg}
            alt="ALSM 3D Architecture"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40 pointer-events-none"
          />

          {/* Controlled Atmospheric Linear Contrast Layer (No radial spotlight glow) */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/90 via-[#0F172A]/70 to-[#0F172A]/95 pointer-events-none" />

          {/* SECTION A & B: Brand Identity & Welcome Headline */}
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              {/* Official ALSM Logo */}
              <Link
                to={ROUTES.PUBLIC.LANDING}
                className="inline-flex items-center gap-3 hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1 -m-1"
              >
                <img src={logo} alt="ALSM Logo" className="h-8 w-auto object-contain" />
                <div className="flex flex-col">
                  <span className="font-bold text-lg tracking-wide text-white leading-tight">
                    ALSM
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    Legacy Modernization
                  </span>
                </div>
              </Link>

              {/* Functional Platform Category Tag */}
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-950/80 text-blue-200 border border-blue-800/60">
                Enterprise Platform
              </span>
            </div>

            {/* Login Headline & Supporting Description */}
            <div className="mt-8 max-w-md">
              <h2 className="text-2xl sm:text-[28px] font-bold leading-tight tracking-tight text-white [text-wrap:balance]">
                Welcome Back to ALSM
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed font-normal [text-wrap:pretty]">
                Continue your enterprise modernization journey with intelligent legacy system transformation.
              </p>
            </div>
          </div>

          {/* SECTION D & E: Unified Modernization Pipeline (Non-nested, Consistent Single-tone Nodes) */}
          <div className="relative z-10 mt-auto pt-6">
            <div className="border-t border-slate-800 pt-5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-3.5">
                <span>Modernization Pipeline</span>
                <span className="flex items-center gap-2 text-xs font-mono text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  Active Engine
                </span>
              </div>

              {/* Flow Nodes: Equal Tone, High-contrast >= 12px Typography */}
              <div className="grid grid-cols-11 items-center gap-2.5">
                {/* Legacy Source Node */}
                <div className="col-span-5 p-2.5 space-y-0.5">
                  <div className="text-xs font-semibold text-slate-300">
                    Legacy System
                  </div>
                  <div className="text-sm font-semibold text-white">
                    BMS / DSPF 3270
                  </div>
                  <div className="text-xs text-slate-300 font-mono">
                    COBOL Programs (.cbl)
                  </div>
                </div>

                {/* Arrow Connector */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300">
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </div>
                </div>

                {/* Modern Output Node */}
                <div className="col-span-5 p-2.5 space-y-0.5">
                  <div className="text-xs font-semibold text-slate-300">
                    Modern Output
                  </div>
                  <div className="text-sm font-semibold text-white">
                    React + TypeScript
                  </div>
                  <div className="text-xs text-slate-300 font-mono">
                    Java / Spring Boot
                  </div>
                </div>
              </div>
            </div>

            {/* Restrained Brand Footer (Text >= 12px) */}
            <div className="flex items-center justify-between text-xs text-slate-400 mt-4 px-1">
              <span>ALSM Platform | Enterprise Grade Security</span>
              <div className="flex gap-4">
                <a href="#terms" className="hover:text-white transition-colors">Terms</a>
                <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'INVALID_CREDENTIALS') return 'Invalid email or password';
    return err.message;
  }
  if (err && typeof err === 'object') {
    const errorObj = err as any;
    if (errorObj.code === 'INVALID_CREDENTIALS' || errorObj.response?.data?.code === 'INVALID_CREDENTIALS') {
      return 'Invalid email or password';
    }
    if (errorObj.response?.data?.message) {
      return errorObj.response.data.message;
    }
    if (errorObj.message) {
      if (errorObj.message.includes('Network Error') || errorObj.message.includes('ERR_FAILED')) {
        return 'Cannot connect to Backend server (http://localhost:3000). Please check backend service.';
      }
      return errorObj.message;
    }
  }
  if (typeof err === 'string') return err;
  return 'Invalid email or password. Please try again.';
}

export default LoginPage;
