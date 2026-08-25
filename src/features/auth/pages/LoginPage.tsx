import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cpu, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { ROUTES } from '@/shared/constants/routes';
import { Input, PasswordInput } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { ApiError } from '@/services/api/apiError';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

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
              MODERNIZER AI ENGINE
            </span>

            <h1 className="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Convert IBM Legacy Systems to Modern Web Apps
            </h1>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                <p className="text-2xl lg:text-3xl font-extrabold text-brand-600 font-sans">99.8%</p>
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-1">Code Accuracy</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                <p className="text-2xl lg:text-3xl font-extrabold text-brand-600 font-sans">10x</p>
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-1">Faster Deployment</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                <p className="text-2xl lg:text-3xl font-extrabold text-emerald-600 font-sans">0%</p>
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-1">Runtime Dependency</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 text-xs text-slate-400">
          ALSM Modernization Platform • Enterprise Portal
        </div>
      </div>

      {/* Right Login Form */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to your ALSM Platform account</p>
          </div>

          {error && (
            <div className="bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="alex.vance@acmecorp.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4 text-slate-400" />}
            />

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <Link to={ROUTES.PUBLIC.FORGOT_PASSWORD} className="text-xs text-brand-600 hover:underline font-semibold">
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
                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
              />
              <label htmlFor="remember" className="text-xs text-slate-600 cursor-pointer select-none">
                Remember me on this device
              </label>
            </div>

            <Button type="submit" className="w-full py-2.5 text-sm font-semibold" isLoading={loading}>
              Sign In
            </Button>
          </form>

          <div className="relative border-t border-slate-200 my-6">
            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-3 text-xs text-slate-400 font-medium">
              OR CONTINUE WITH
            </span>
          </div>

          <GoogleSignInButton onCredential={handleGoogleCredential} />

          <div className="flex justify-between text-xs text-slate-500 pt-2">
            <span>Don't have an account? <Link to={ROUTES.PUBLIC.REGISTER} className="text-brand-600 font-semibold hover:underline">Sign Up</Link></span>
            <a href="#" className="text-slate-500 hover:text-slate-900">Need help?</a>
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
  return 'Unable to sign in. Please try again.';
}

export default LoginPage;
