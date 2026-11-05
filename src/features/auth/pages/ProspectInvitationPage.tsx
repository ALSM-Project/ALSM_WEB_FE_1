import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { Button } from '@/shared/ui/Button';
import { Input, PasswordInput } from '@/shared/ui/Input';
import { AuthLayout } from '../components/AuthLayout';
import { prospectInvitationService, type ResolvedProspectInvitation } from '../services/prospectInvitation.service';

const invitationTokenFromHash = (hash: string) => new URLSearchParams(hash.replace(/^#/, '')).get('token') || '';

export const ProspectInvitationPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const invitationToken = invitationTokenFromHash(location.hash);
  const [invitation, setInvitation] = useState<ResolvedProspectInvitation | null>(null);
  const [loading, setLoading] = useState(Boolean(invitationToken));
  const [fullName, setFullName] = useState('');
  const [emailForVerification, setEmailForVerification] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!invitationToken) return;
    let active = true;
    prospectInvitationService.resolve(invitationToken)
      .then((result) => { if (active) setInvitation(result); })
      .catch(() => { if (active) setError('This invitation is invalid, expired, revoked, or already used. Ask the ALSM contact to send a new invitation.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [invitationToken]);

  const acceptInvitation = async () => {
    if (!invitationToken || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await prospectInvitationService.accept(invitationToken);
      navigate('/contracts', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in with the invited, email-verified ALSM account before accepting.');
    } finally {
      setSubmitting(false);
    }
  };

  const register = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!fullName.trim() || fullName.trim().length < 2) return setError('Enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForVerification.trim())) return setError('Enter the email address that received this invitation.');
    if (password.length < 8) return setError('Password must contain at least 8 characters.');

    setSubmitting(true);
    try {
      await prospectInvitationService.register({ invitationToken, fullName: fullName.trim(), password });
      navigate(`/verify-email#invite=${encodeURIComponent(invitationToken)}`, { replace: true, state: { email: emailForVerification.trim() } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The account could not be created. Check the invitation and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goToSignIn = () => navigate(`/login#invite=${encodeURIComponent(invitationToken)}`, { state: { returnTo: `/prospect-invitation#token=${encodeURIComponent(invitationToken)}` } });

  return (
    <AuthLayout
      variant="register"
      eyebrow="ALSM CUSTOMER ACCESS"
      headline="Secure customer invitation"
      description="Create or sign in to your ALSM account, verify the invited email, and accept the invitation before viewing any contract."
    >
      <div className="space-y-4">
        <div>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700"><ShieldCheck className="h-5 w-5" /></div>
          <h2 className="text-xl font-bold text-[#091E42]">Accept ALSM invitation</h2>
          <p className="mt-1 text-sm text-slate-600">Invitation recipient: <span className="font-semibold">{invitation?.recipientEmail ?? 'checking invitation…'}</span></p>
        </div>

        {loading && <p role="status" className="text-sm text-slate-600">Checking invitation…</p>}
        {(error || (!invitationToken && !loading && 'This invitation link is incomplete. Open the original ALSM invitation email again.')) && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error || 'This invitation link is incomplete. Open the original ALSM invitation email again.'}</div>
        )}
        {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}

        {!loading && invitation && isAuthenticated && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-700">Signed in as <strong>{user?.email}</strong>. Accepting requires this account to match the invited email and have verified its email address.</p>
            <Button type="button" className="w-full" isLoading={submitting} onClick={acceptInvitation}>Accept invitation</Button>
          </div>
        )}

        {!loading && invitation && !isLoading && !isAuthenticated && (
          <>
            <form className="space-y-3" onSubmit={register}>
              <Input label="FULL NAME" value={fullName} onChange={(event) => setFullName(event.target.value)} icon={<User className="h-4 w-4 text-slate-400" />} required />
              <Input label="INVITED EMAIL (FOR VERIFICATION)" type="email" value={emailForVerification} onChange={(event) => setEmailForVerification(event.target.value)} icon={<Mail className="h-4 w-4 text-slate-400" />} required />
              <PasswordInput label="PASSWORD" value={password} onChange={(event) => setPassword(event.target.value)} icon={<Lock className="h-4 w-4 text-slate-400" />} />
              <p className="text-xs text-slate-500">The invitation token is sent only in API request bodies and kept in the URL fragment, not in query parameters. If you already have an account, sign in below instead.</p>
              <Button type="submit" className="w-full" isLoading={submitting}>Create ALSM account</Button>
            </form>
            <div className="border-t border-slate-200 pt-3 text-center text-sm text-slate-600">
              Already have an account? <button type="button" onClick={goToSignIn} className="font-semibold text-blue-700 hover:underline">Sign in and accept invitation</button>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default ProspectInvitationPage;
