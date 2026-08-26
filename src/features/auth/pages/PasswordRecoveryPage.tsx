import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, CheckCircle2, Cpu } from 'lucide-react';
import { authService } from '../services/auth.service';
import { ROUTES } from '@/shared/constants/routes';
import { Input, PasswordInput } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

export const PasswordRecoveryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const resetToken = searchParams.get('token') ?? '';

  // Form states
  const [email, setEmail] = useState('alex.vance@acmecorp.com');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Timers for Step 2
  const [expireSeconds, setExpireSeconds] = useState(1425); // 23m 45s
  const [resendCooldown, setResendCooldown] = useState(30);

  useEffect(() => {
    if (step !== 2) return;

    const timer = setInterval(() => {
      setExpireSeconds((prev) => Math.max(prev - 1, 0));
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) return setError('Valid email address is required');
    setLoading(true);
    try {
      await authService.sendPasswordRecoveryLink(email);
      setStep(2);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setError(
        code
          ? `Request failed (${code}). Please try again.`
          : 'Unable to send the recovery link. Make sure the backend is running and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!resetToken) return setError('This reset link is missing its token. Please request a new one.');
    if (newPassword.length < 8) return setError('Password must be at least 8 characters');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      await authService.resetPassword(resetToken, newPassword);
      setStep(4);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setError(code === 'INVALID_RESET_TOKEN'
        ? 'This reset link is invalid or has expired. Please request a new one.'
        : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-slate-900 text-lg leading-none">ALSM</span>
            <span className="text-[10px] font-medium text-slate-500 tracking-wide mt-0.5 font-sans">Password Recovery</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <Link to={ROUTES.PUBLIC.LOGIN} className="inline-flex items-center space-x-2 text-xs font-medium text-slate-500 hover:text-slate-900">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reset your password</h2>
              <p className="text-slate-500 text-sm mt-1">Enter your work email to receive reset instructions.</p>
            </div>

            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <Input
                label="Email Address"
                placeholder="alex.vance@acmecorp.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4 text-slate-400" />}
              />
              <Button type="submit" className="w-full py-2.5 text-sm font-semibold" isLoading={loading}>
                Send Recovery Link
              </Button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto border border-brand-200">
              <Mail className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Check Your Email</h2>
              <p className="text-slate-500 text-xs mt-1">
                We've sent password reset instructions to <strong className="text-slate-800">{email}</strong>
              </p>
            </div>

            <div className="bg-[#FFFAEB] p-3.5 rounded-xl border border-[#FEDF89] text-xs font-semibold text-[#DC6803]">
              Expires in {formatTimer(expireSeconds)}
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="secondary"
                className="w-full py-2 text-xs font-semibold"
                onClick={() => window.location.assign(`${ROUTES.PUBLIC.RESET_PASSWORD}?token=demo-token`)}
              >
                Open Reset Link
              </Button>

              <button
                disabled={resendCooldown > 0}
                onClick={() => {
                  setResendCooldown(30);
                  setExpireSeconds(1425);
                }}
                className="text-xs text-brand-600 hover:underline disabled:opacity-50 font-medium"
              >
                {resendCooldown > 0 ? `Resend Email (${resendCooldown}s)` : "Didn't receive the email? Resend Email"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create a New Password</h2>
              <p className="text-slate-500 text-sm mt-1">Set a strong password for your account.</p>
            </div>

            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

            <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
              <PasswordInput
                label="New Password"
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                icon={<Lock className="w-4 h-4 text-slate-400" />}
              />

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Requirements</p>
                <div className="flex items-center space-x-2 text-slate-700">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${newPassword.length >= 8 ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>8+ characters</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>Uppercase & Lowercase</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${/[0-9]/.test(newPassword) ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>Number (0-9)</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>Special character (!@#$%^&*)</span>
                </div>
              </div>

              <PasswordInput
                label="Confirm Password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock className="w-4 h-4 text-slate-400" />}
              />
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-xs text-emerald-600 font-medium flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Passwords match</span>
                </p>
              )}

              <Button type="submit" className="w-full py-2.5 text-sm font-semibold" isLoading={loading}>
                Update Password & Log In
              </Button>
            </form>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#ECFDF3] text-[#079455] flex items-center justify-center mx-auto border border-[#ABEFC6]">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Password Updated</h2>
              <p className="text-slate-500 text-xs mt-1">
                Your password has been successfully changed. You can now log in with your new credentials.
              </p>
            </div>

            <Link to={ROUTES.PUBLIC.LOGIN}>
              <Button className="w-full py-2.5 text-sm font-semibold">
                Sign In Now
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
export default PasswordRecoveryPage;
