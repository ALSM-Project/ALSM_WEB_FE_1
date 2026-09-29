import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Check, X } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { ROUTES } from '@/shared/constants/routes';
import { Input, PasswordInput } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { ApiError } from '@/services/api/apiError';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { AuthLayout } from '../components/AuthLayout';

// Backend requires a minimum of 8 characters (RegisterDto @MinLength(8)).
const MIN_PASSWORD_LENGTH = 8;

export const RegisterPage: React.FC = () => {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password rules validation (mirrors ChangePasswordPage strength meter)
  const rule8Chars = password.length >= MIN_PASSWORD_LENGTH;
  const ruleUpperLower = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const ruleNumber = /[0-9]/.test(password);
  const ruleSpecial = /[^A-Za-z0-9]/.test(password);

  const rulesPassedCount = [rule8Chars, ruleUpperLower, ruleNumber, ruleSpecial].filter(Boolean).length;

  let strengthLabel = '';
  let strengthColor = 'bg-slate-200';
  let strengthTextColor = 'text-slate-500';

  if (password.length > 0) {
    if (rulesPassedCount <= 1) {
      strengthLabel = 'Weak';
      strengthColor = 'bg-rose-500';
      strengthTextColor = 'text-rose-600';
    } else if (rulesPassedCount === 2) {
      strengthLabel = 'Fair';
      strengthColor = 'bg-amber-500';
      strengthTextColor = 'text-amber-600';
    } else if (rulesPassedCount === 3) {
      strengthLabel = 'Good';
      strengthColor = 'bg-blue-500';
      strengthTextColor = 'text-blue-600';
    } else {
      strengthLabel = 'Strong';
      strengthColor = 'bg-emerald-500';
      strengthTextColor = 'text-emerald-600';
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) return setError('Full Name is required');
    if (!email.includes('@')) return setError('A valid email is required');
    if (password.length < MIN_PASSWORD_LENGTH)
      return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (!agreeTerms) return setError('You must agree to the Terms of Service');

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
    <AuthLayout
      variant="register"
      eyebrow="ENTERPRISE MODERNIZATION PLATFORM"
      headline="Modernize IBM Legacy Systems at Scale"
      description="Automated BMS screen mapping, COBOL logic refactoring, and React TS component synthesis in single unified pipelines."
    >
      <div className="space-y-3 sm:space-y-4 h-full flex flex-col justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#091E42] tracking-tight">Create Your Account</h2>
          <p className="text-slate-500 text-xs mt-0.5">Start modernizing your legacy applications with ALSM.</p>
        </div>

        {error && (
          <div className="bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] px-3.5 py-2 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <Input
            label="FULL NAME"
            placeholder="Alex Vance"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            icon={<User className="w-4 h-4 text-slate-400" />}
          />

          <Input
            label="WORK EMAIL"
            type="email"
            placeholder="alex.vance@acmecorp.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4 text-slate-400" />}
          />

          <div>
            <PasswordInput
              label="PASSWORD"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4 text-slate-400" />}
            />
            {/* Password Strength Meter (mirrors ChangePasswordPage) */}
            <div className="mt-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Password strength</span>
                <span className={`font-bold ${strengthTextColor}`}>{strengthLabel || 'None'}</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className={`h-2 rounded-full transition-all ${rulesPassedCount >= 1 ? strengthColor : 'bg-slate-200'}`} />
                <div className={`h-2 rounded-full transition-all ${rulesPassedCount >= 2 ? strengthColor : 'bg-slate-200'}`} />
                <div className={`h-2 rounded-full transition-all ${rulesPassedCount >= 3 ? strengthColor : 'bg-slate-200'}`} />
                <div className={`h-2 rounded-full transition-all ${rulesPassedCount >= 4 ? strengthColor : 'bg-slate-200'}`} />
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs pt-0.5">
                <li className={`flex items-center space-x-2 ${rule8Chars ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {rule8Chars ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                  <span>8+ characters</span>
                </li>
                <li className={`flex items-center space-x-2 ${ruleUpperLower ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {ruleUpperLower ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                  <span>Uppercase & lowercase</span>
                </li>
                <li className={`flex items-center space-x-2 ${ruleNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {ruleNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                  <span>At least one number</span>
                </li>
                <li className={`flex items-center space-x-2 ${ruleSpecial ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {ruleSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                  <span>At least one special character</span>
                </li>
              </ul>
            </div>
          </div>

          <PasswordInput
            label="CONFIRM PASSWORD"
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="w-4 h-4 text-slate-400" />}
          />

          <div className="flex items-start space-x-2 pt-0.5">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 rounded border-[#D9E2EC] text-[#0652CC] focus:ring-[#0652CC] cursor-pointer"
            />
            <label htmlFor="terms" className="text-[11px] text-slate-600 cursor-pointer select-none leading-tight">
              I agree to the <a href="#" className="text-[#0652CC] font-semibold hover:underline">Terms of Service</a> and <a href="#" className="text-[#0652CC] font-semibold hover:underline">Privacy Policy</a>.
            </label>
          </div>

          <Button 
            type="submit" 
            className="w-full py-2.5 bg-[#0652CC] hover:bg-[#0655FF] text-white font-semibold rounded-xl text-sm transition-colors shadow-sm mt-1" 
            isLoading={loading}
          >
            Create Account
          </Button>
        </form>

        <div className="relative border-t border-[#D9E2EC] my-2">
          <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-white px-2.5 text-[10px] font-semibold text-slate-400 tracking-wider">
            OR CONTINUE WITH
          </span>
        </div>

        <GoogleSignInButton onCredential={handleGoogleCredential} />

        <div className="text-center text-xs text-slate-500 pt-0.5">
          Already have an account?{' '}
          <Link to={ROUTES.PUBLIC.LOGIN} className="text-[#0652CC] font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
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
