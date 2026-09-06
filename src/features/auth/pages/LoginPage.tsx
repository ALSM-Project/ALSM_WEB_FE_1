import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { ROUTES } from '@/shared/constants/routes';
import { Input, PasswordInput } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { ApiError } from '@/services/api/apiError';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { AuthLayout } from '../components/AuthLayout';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('Please enter your email');
    if (!password) return setError('Please enter your password');

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
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
    <AuthLayout
      variant="login"
      eyebrow="LEGACY MODERNIZATION PLATFORM"
      headline="Convert IBM Legacy Systems to Modern Web Apps"
      description="Modernize legacy BMS/DSPF screens and COBOL business logic into modern web technologies with structured analysis, generation and validation."
    >
      <div className="space-y-4 h-full flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#091E42] tracking-tight">Welcome Back</h2>
          <p className="text-slate-500 text-sm mt-1">Sign in to your ALSM Platform account</p>
        </div>

        {error && (
          <div className="bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="EMAIL OR USERNAME"
            type="email"
            placeholder="alex.vance@acmecorp.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4 text-slate-400" />}
          />

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">PASSWORD</span>
              <Link to={ROUTES.PUBLIC.FORGOT_PASSWORD} className="text-xs text-[#0652CC] hover:underline font-semibold">
                Forgot?
              </Link>
            </div>
            <PasswordInput
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-[#D9E2EC] text-[#0652CC] focus:ring-[#0652CC] cursor-pointer"
            />
            <label htmlFor="remember" className="text-xs text-slate-600 cursor-pointer select-none">
              Remember me on this device
            </label>
          </div>

          <Button 
            type="submit" 
            className="w-full py-3 bg-[#0652CC] hover:bg-[#0655FF] text-white font-semibold rounded-xl text-sm transition-colors shadow-sm" 
            isLoading={loading}
          >
            Sign In
          </Button>
        </form>

        <div className="relative border-t border-[#D9E2EC] my-6">
          <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-3 text-[11px] font-semibold text-slate-400 tracking-wider">
            OR CONTINUE WITH
          </span>
        </div>

        <GoogleSignInButton onCredential={handleGoogleCredential} />

        <div className="flex justify-between items-center text-xs text-slate-500 pt-2">
          <span>
            Don't have an account?{' '}
            <Link to={ROUTES.PUBLIC.REGISTER} className="text-[#0652CC] font-semibold hover:underline">
              Sign Up
            </Link>
          </span>
          <a href="#" className="text-slate-400 hover:text-slate-700 transition-colors">
            Need help?
          </a>
        </div>
      </div>
    </AuthLayout>
  );
};

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'INVALID_CREDENTIALS') return 'Invalid email or password';
    return err.message;
  }
  return 'Unable to sign in. Please try again.';
}

export default LoginPage;
