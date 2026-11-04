import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import { ROUTES } from '@/shared/constants/routes';
import { ApiError } from '@/services/api/apiError';
import logo from '@/assets/logo.png';
import alsm3dBg from '@/assets/alsm-3d-bg.jpg';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

const MIN_PASSWORD_LENGTH = 8;

export const RegisterPage: React.FC = () => {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UX states: Independent password visibility & focus-driven compact checklist
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Status & Feedback states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Real-time password criteria (All labels sized at minimum text-xs 12px per antislop-human)
  const rules = [
    { label: '8+ characters', valid: password.length >= MIN_PASSWORD_LENGTH },
    { label: 'Uppercase & lowercase', valid: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: 'At least one number', valid: /[0-9]/.test(password) },
    { label: 'Special character', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const strengthScore = rules.filter((r) => r.valid).length;
  const showChecklist = isPasswordFocused || password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) return setError('Full Name is required');
    if (!email.includes('@')) return setError('A valid work email is required');
    if (strengthScore < 4)
      return setError('Please ensure all password strength requirements are satisfied');
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (!agreeTerms) return setError('You must agree to the Terms of Service and Privacy Policy');

    setLoading(true);
    try {
      const res = await register({ fullName: fullName.trim(), email: email.trim(), password });
      if (res.requiresEmailVerification) {
        navigate(`${ROUTES.PUBLIC.VERIFY_EMAIL}?email=${encodeURIComponent(res.email)}`, { replace: true });
      } else {
        navigate(ROUTES.DASHBOARD, { replace: true });
      }
    } catch (err) {
      setError(toErrorMessage(err));
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
        navigate(ROUTES.DASHBOARD, { replace: true });
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      {/* 2-Column Symmetrical Floating Cards Container (1080px max-width) */}
      <div className="w-full max-w-[1080px] grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch my-auto">
        
        {/* =========================================================================
            LEFT PANEL: FORM REGISTRATION (Matching 400px width for pixel-perfect buttons)
            ========================================================================= */}
        <div className="w-full bg-white rounded-[28px] p-7 sm:p-8 md:p-9 shadow-xl border border-slate-200/80 flex flex-col justify-between">
          <div className="w-full max-w-[400px] mx-auto flex flex-col justify-between h-full">
            <div>
              {/* SECTION 1 — FORM HEADER */}
              <div className="mb-6">
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
                  Create Your Account
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Start modernizing your legacy IBM BMS &amp; COBOL systems with ALSM.
                </p>
              </div>

              {/* Error Notification */}
              {error && (
                <div
                  role="alert"
                  className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="flex-1">{error}</span>
                </div>
              )}

              {/* SECTION 2 — EMAIL REGISTRATION FORM (Full Name -> Work Email -> Password -> Confirm Password) */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Field 1: Full Name */}
                <div>
                  <label
                    htmlFor="register-fullname"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Full name
                  </label>
                  <div className="relative">
                    <User
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="register-fullname"
                      type="text"
                      autoComplete="name"
                      required
                      disabled={loading}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Vance"
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-500 hover:border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors disabled:opacity-60 shadow-xs"
                    />
                  </div>
                </div>

                {/* Field 2: Work Email */}
                <div>
                  <label
                    htmlFor="register-email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Work email
                  </label>
                  <div className="relative">
                    <Mail
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      required
                      disabled={loading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-500 hover:border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors disabled:opacity-60 shadow-xs"
                    />
                  </div>
                </div>

                {/* Field 3: Password + SECTION 3: Integrated Password Validation (No Nested Card, No Layout Animation) */}
                <div>
                  <label
                    htmlFor="register-password"
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
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      disabled={loading}
                      value={password}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
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

                  {/* Clean Non-Nested Password Validation: No background card, no max-height transition */}
                  {showChecklist && (
                    <div className="mt-2.5 pt-1 space-y-2">
                      {/* 4-Segment Progress Bar */}
                      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1 rounded-full transition-colors ${
                              strengthScore >= level
                                ? strengthScore === 4
                                  ? 'bg-emerald-600'
                                  : strengthScore >= 2
                                  ? 'bg-blue-600'
                                  : 'bg-amber-500'
                                : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Criteria Checklist (All text >= 12px for accessibility) */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-0.5">
                        {rules.map((rule, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-1.5 text-xs transition-colors ${
                              rule.valid ? 'text-emerald-700 font-medium' : 'text-slate-500'
                            }`}
                          >
                            {rule.valid ? (
                              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mx-1" />
                            )}
                            <span>{rule.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Field 4: Confirm Password */}
                <div>
                  <label
                    htmlFor="register-confirm-password"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="register-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      disabled={loading}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-500 hover:border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors disabled:opacity-60 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* SECTION 4 — TERMS AND CONDITIONS */}
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600/20 cursor-pointer transition-colors"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-600 select-none leading-relaxed">
                    I agree to the{' '}
                    <a href="#terms" className="text-blue-600 font-medium hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#privacy" className="text-blue-600 font-medium hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </label>
                </div>

                {/* SECTION 5 — PRIMARY REGISTRATION ACTION (Create Account - Exactly 400px full width) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white" aria-hidden="true" />
                      <span>Creating account...</span>
                    </span>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </form>

              {/* SECTION 6 — SOCIAL AUTHENTICATION (Exactly 400px full width to match Create Account) */}
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

            {/* SECTION 7 — EXISTING ACCOUNT FOOTER */}
            <p className="text-center text-xs text-slate-500 mt-5 pt-3 border-t border-slate-100">
              Already have an account?{' '}
              <Link to={ROUTES.PUBLIC.LOGIN} className="text-blue-600 font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* =========================================================================
            RIGHT PANEL: VISUAL BRAND & 3D TECHNOLOGY BACKGROUND
            (Restrained, No AI-slop spotlight glow, Unified non-nested pipeline, WCAG AAA text)
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

          {/* SECTION A & B: Brand Identity & Main Headline */}
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

              {/* Functional Platform Category Tag (Consistent with DESIGN.md tokens) */}
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-950/80 text-blue-200 border border-blue-800/60">
                Enterprise Platform
              </span>
            </div>

            {/* Main Headline & Supporting Description */}
            <div className="mt-8 max-w-md">
              <h2 className="text-2xl sm:text-[28px] font-bold leading-tight tracking-tight text-white [text-wrap:balance]">
                Modernize Legacy Systems. Build What's Next.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed font-normal [text-wrap:pretty]">
                Automated BMS/DSPF screen mapping, COBOL business logic extraction, and modern cloud architecture synthesis with enterprise-grade precision.
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
    if (err.code === 'EMAIL_ALREADY_REGISTERED') return 'This email is already registered';
    return err.message;
  }
  return 'Failed to create account. Please try again.';
}

export default RegisterPage;
