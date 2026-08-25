import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Cpu, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { ROUTES } from '@/shared/constants/routes';
import { Input, PasswordInput } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { ApiError } from '@/services/api/apiError';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

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
    if (score === 3) return { label: 'Good', width: '75%', color: 'bg-blue-500' };
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
      await register({ fullName: fullName.trim(), email: email.trim(), password });
      navigate(ROUTES.PUBLIC.LANDING, { replace: true });
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
      await loginWithGoogle(idToken);
      navigate(ROUTES.PUBLIC.LANDING, { replace: true });
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col lg:flex-row font-sans">
      {/* Left Feature Showcase */}
      <div className="lg:w-1/2 bg-white p-8 lg:p-16 flex flex-col justify-between border-r border-slate-200">
        <div>
          <Link to="/" className="flex items-center space-x-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 leading-none">ALSM</span>
              <span className="text-xs font-medium text-slate-500 tracking-wide mt-0.5">Legacy Modernization</span>
            </div>
          </Link>

          <div className="space-y-6">
            <span className="inline-block bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full border border-brand-200">
              ENTERPRISE PLATFORM
            </span>

            <h1 className="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Modernize IBM Legacy Systems at Enterprise Speed
            </h1>

            <p className="text-slate-600 text-base leading-relaxed">
              Automated BMS screen mapping, COBOL logic refactoring, and React TS component synthesis in single unified pipelines.
            </p>

            {/* Technical code preview panel (Dark) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2 text-slate-300 shadow-md">
              <div className="text-rose-400 font-semibold">// Legacy BMS Input</div>
              <div className="text-slate-400">01 USER-ID-INPUT PIC X(20).</div>
              <div className="border-t border-slate-800 my-2"></div>
              <div className="text-emerald-400 font-semibold">// Modern React Component</div>
              <div className="text-cyan-300">&lt;TextField label="Username" maxLength={'{20}'} /&gt;</div>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-slate-200">
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-4 font-semibold">Security & Compliance Standards</p>
          <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-600">
            <span className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>SOC 2 Type II</span>
            </span>
            <span className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>ISO 27001</span>
            </span>
            <span className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>GDPR Compliant</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right Registration Form */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create Your Account</h2>
            <p className="text-slate-500 text-sm mt-1">Join thousands of enterprise teams modernizing legacy systems.</p>
          </div>

          {error && (
            <div className="bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Alex Vance"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={<User className="w-4 h-4 text-slate-400" />}
            />

            <Input
              label="Work Email"
              type="email"
              placeholder="alex.vance@acmecorp.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4 text-slate-400" />}
            />

            <div>
              <PasswordInput
                label="Password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4 text-slate-400" />}
              />
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Password strength:</span>
                  <span className="font-semibold text-slate-700">{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }}></div>
                </div>
              </div>
            </div>

            <PasswordInput
              label="Confirm Password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-4 h-4 text-slate-400" />}
            />

            <div className="flex items-start space-x-2.5 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
              />
              <label htmlFor="terms" className="text-xs text-slate-600 cursor-pointer select-none">
                I agree to the <a href="#" className="text-brand-600 font-semibold hover:underline">Terms of Service</a> and <a href="#" className="text-brand-600 font-semibold hover:underline">Privacy Policy</a>.
              </label>
            </div>

            <Button type="submit" className="w-full py-2.5 text-sm font-semibold" isLoading={loading}>
              Create Account
            </Button>
          </form>

          <div className="relative border-t border-slate-200 my-6">
            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-3 text-xs text-slate-400 font-medium">
              OR CONTINUE WITH
            </span>
          </div>

          <GoogleSignInButton onCredential={handleGoogleCredential} />

          <div className="text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to={ROUTES.PUBLIC.LOGIN} className="text-brand-600 font-semibold hover:underline">
              Sign In
            </Link>
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
