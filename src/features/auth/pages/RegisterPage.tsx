import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User } from 'lucide-react';
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

  const getPasswordStrength = () => {
    if (!password) return { label: 'None', width: '0%', color: 'bg-slate-200' };
    let score = 0;
    if (password.length >= MIN_PASSWORD_LENGTH) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: 'Weak', width: '25%', color: 'bg-rose-500' };
    if (score === 2) return { label: 'Fair', width: '50%', color: 'bg-amber-500' };
    if (score === 3) return { label: 'Good', width: '75%', color: 'bg-[#0652CC]' };
    return { label: 'Strong', width: '100%', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength();

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
      const user = await register({ fullName: fullName.trim(), email: email.trim(), password });
      if (user) {
        navigate(ROUTES.PROJECTS.SCREENS('proj-acme'), { replace: true });
      } else {
        setError('Account created but sign-in failed. Please sign in manually.');
        navigate(ROUTES.PUBLIC.LOGIN, { replace: true });
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
        navigate(ROUTES.PROJECTS.SCREENS('proj-acme'), { replace: true });
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
            <div className="mt-1 space-y-0.5">
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Strength:</span>
                <span className="font-semibold text-slate-700">{strength.label}</span>
              </div>
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }}></div>
              </div>
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
