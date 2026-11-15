import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { ROUTES } from '@/shared/constants/routes';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { ApiError } from '@/services/api/apiError';
import { AuthLayout } from '../components/AuthLayout';
import { prospectInvitationService } from '../services/prospectInvitation.service';

export const VerifyEmailPage: React.FC = () => {
  const { verifyEmail, resendVerification, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';
  const invitationToken = new URLSearchParams(location.hash.replace(/^#/, '')).get('invite') || '';
  const stateEmail = (location.state as { email?: string } | null)?.email || '';

  const [email, setEmail] = useState(emailParam || stateEmail);
  const [code, setCode] = useState(tokenParam);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const invitationLoginLocation = invitationToken
    ? {
        pathname: ROUTES.PUBLIC.LOGIN,
        hash: `#invite=${encodeURIComponent(invitationToken)}`,
      }
    : ROUTES.PUBLIC.LOGIN;
  const invitationLoginState = invitationToken
    ? { returnTo: `/prospect-invitation#token=${encodeURIComponent(invitationToken)}` }
    : undefined;

  useEffect(() => {
    if (!invitationToken || emailParam || stateEmail) return;
    let active = true;
    prospectInvitationService.resolve(invitationToken)
      .then((invitation) => {
        if (active) setEmail(invitation.recipientEmail);
      })
      .catch(() => {
        if (active) setError('This invitation is no longer available. Ask the ALSM contact to send a new invitation.');
      });
    return () => { active = false; };
  }, [invitationToken, emailParam, stateEmail]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = useCallback(async (codeToVerify: string, emailToVerify: string) => {
    const finalCode = codeToVerify.trim();
    const finalEmail = emailToVerify.trim();
    setError('');
    setSuccess('');

    if (!finalEmail) return setError('Email address is required');
    if (!finalCode) return setError('Please enter your 6-digit verification code or token');

    setLoading(true);
    try {
      await verifyEmail(finalEmail, finalCode);
      if (invitationToken) {
        await prospectInvitationService.accept(invitationToken);
        setSuccess('Email verified and ALSM invitation accepted. Redirecting to your workspace...');
      } else {
        setSuccess('Email verified successfully! Redirecting to dashboard...');
      }
      setTimeout(() => {
        navigate(ROUTES.DASHBOARD, { replace: true });
      }, 1200);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [verifyEmail, invitationToken, navigate]);

  // Auto-verify if token is provided in URL
  useEffect(() => {
    if (!tokenParam || !emailParam) return;
    const timer = window.setTimeout(() => void handleVerify(tokenParam, emailParam), 0);
    return () => window.clearTimeout(timer);
  }, [tokenParam, emailParam, handleVerify]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleVerify(code, email);
  };

  const handleAcceptInvitation = async () => {
    if (!invitationToken || loading || success) return;
    setError('');
    setLoading(true);
    try {
      await prospectInvitationService.accept(invitationToken);
      setSuccess('ALSM invitation accepted. Redirecting to your workspace...');
      setTimeout(() => navigate(ROUTES.DASHBOARD, { replace: true }), 1200);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    const finalEmail = email.trim();
    if (!finalEmail) return setError('Please enter your email address to resend');

    setError('');
    setSuccess('');
    setResending(true);
    try {
      await resendVerification(finalEmail);
      setSuccess(invitationToken
        ? `If ${finalEmail} still needs verification, a new email was requested. Already verified accounts do not receive another code; sign in below to accept the invitation.`
        : `If ${finalEmail} still needs verification, a new verification email was requested.`);
      setCooldown(60);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      variant="register"
      eyebrow="ENTERPRISE MODERNIZATION PLATFORM"
      headline="Verify Your Email Address"
      description={invitationToken
        ? 'New accounts need email verification. If you already have an ALSM account, sign in and accept the invitation instead.'
        : 'Enter the verification code from your email to activate your account.'}
    >
      <div className="space-y-4 h-full flex flex-col justify-between">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3 text-[#0652CC]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#091E42] tracking-tight">Check Your Inbox</h2>
          <p className="text-slate-500 text-xs mt-1">
            {invitationToken
              ? <>A code is only sent for an unverified account. The invited email is <span className="font-semibold text-slate-700">{email || 'being checked'}</span>.</>
              : <>A verification code was requested for <span className="font-semibold text-slate-700">{email || 'your email'}</span>.</>}
          </p>
        </div>

        {error && (
          <div className="bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] px-3.5 py-2 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-2 rounded-xl text-xs font-medium">
            {success}
          </div>
        )}

        {isAuthenticated && invitationToken && (
          <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-900">Your ALSM account is signed in. Accept the invitation to finish linking it to the customer record.</p>
            <Button type="button" className="w-full" isLoading={loading} onClick={handleAcceptInvitation}>Accept ALSM invitation</Button>
          </div>
        )}

        {!isAuthenticated && invitationToken && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900">
            Already have an ALSM account?{' '}
            <Link
              to={invitationLoginLocation}
              state={invitationLoginState}
              className="font-semibold text-[#0652CC] hover:underline"
            >
              Sign in and accept this invitation
            </Link>
            . Verified accounts will not receive another verification code.
          </div>
        )}

        {!isAuthenticated && <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="WORK EMAIL"
            type="email"
            placeholder="alex.vance@acmecorp.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4 text-slate-400" />}
          />

          <Input
            label="VERIFICATION CODE / TOKEN"
            placeholder="e.g. 123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={64}
            icon={<ShieldCheck className="w-4 h-4 text-slate-400" />}
          />

          <Button
            type="submit"
            className="w-full py-2.5 bg-[#244A70] hover:bg-[#1B3856] text-white font-semibold rounded-xl text-sm transition-colors shadow-sm mt-2"
            isLoading={loading}
          >
            Verify Email & Continue
          </Button>
        </form>}

        <div className="pt-2 border-t border-[#D9E2EC] flex flex-col items-center space-y-2 text-xs text-slate-500">
          <div className="flex items-center space-x-1">
            <span>Didn't receive the email?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="text-[#0652CC] font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
            </button>
          </div>


          <Link to={invitationLoginLocation} state={invitationLoginState} className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium text-xs pt-1">
            <ArrowLeft className="w-3.5 h-3.5" />

            Back to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'INVALID_VERIFICATION_CODE') return 'Invalid or expired verification code';
    if (err.code === 'USER_NOT_FOUND') return 'No account found with this email address';
    return err.message;
  }
  return 'Failed to verify email. Please check your code and try again.';
}

export default VerifyEmailPage;
