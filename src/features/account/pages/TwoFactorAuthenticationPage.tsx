import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, ShieldCheck } from 'lucide-react';
import { ApiError } from '@/services/api/apiError';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { useTwoFactorAuthentication } from '../queries/useTwoFactorAuthentication';

type TwoFactorFlow =
  | 'idle'
  | 'setting_up'
  | 'scan'
  | 'verifying'
  | 'recovery_codes'
  | 'completed';

type PageStatus = 'already_enabled' | null;

const setupSteps: Array<{ label: string; number: 1 | 2 | 3 }> = [
  { label: 'Scan QR', number: 1 },
  { label: 'Verify', number: 2 },
  { label: 'Backup', number: 3 },
];

const errorMessageFor = (error: unknown) => {
  const code = error instanceof ApiError ? error.code : undefined;

  switch (code) {
    case 'MFA_ALREADY_ENABLED':
      return 'Two-factor authentication is already enabled for this account.';
    case 'MFA_SETUP_NOT_STARTED':
      return 'This setup is no longer active. Start setup again to receive a new QR code.';
    case 'INVALID_MFA_CODE':
      return 'That verification code is invalid. Check your authenticator app and try again.';
    case 'MFA_SETUP_RESET':
      return 'Setup was reset after too many invalid codes. Start again to receive a new QR code.';
    case 'MFA_SETUP_STATE_CHANGED':
      return 'Your setup state changed. Start again to receive a new QR code.';
    case 'UNAUTHORIZED':
      return 'Your session has expired. Please sign in again.';
    default:
      return 'Unable to complete two-factor authentication setup. Please try again.';
  }
};

export const TwoFactorAuthenticationPage: React.FC = () => {
  const { setupMutation, confirmMutation } = useTwoFactorAuthentication();
  const resetSetupMutation = setupMutation.reset;
  const resetConfirmMutation = confirmMutation.reset;
  const [flow, setFlow] = useState<TwoFactorFlow>('idle');
  const [pageStatus, setPageStatus] = useState<PageStatus>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const setupRequestInFlight = useRef(false);
  const confirmationRequestInFlight = useRef(false);

  useEffect(() => {
    return () => {
      resetSetupMutation();
      resetConfirmMutation();
    };
  }, [resetConfirmMutation, resetSetupMutation]);

  const clearSensitiveState = () => {
    setQrCodeDataUrl(null);
    setOtpCode('');
    setBackupCodes([]);
    resetSetupMutation();
    resetConfirmMutation();
  };

  const showAlreadyEnabled = () => {
    clearSensitiveState();
    setError('');
    setPageStatus('already_enabled');
    setFlow('completed');
  };

  const returnToStart = (message: string) => {
    clearSensitiveState();
    setError(message);
    setPageStatus(null);
    setFlow('idle');
  };

  const handleStartSetup = () => {
    if (setupRequestInFlight.current || setupMutation.isPending) return;

    setupRequestInFlight.current = true;
    setError('');
    setPageStatus(null);
    setCopyStatus('idle');
    setFlow('setting_up');

    setupMutation.mutate(undefined, {
      onSuccess: ({ qrCodeDataUrl: returnedQrCodeDataUrl }) => {
        setupRequestInFlight.current = false;
        // The provisioning URI is deliberately never retained by the UI.
        setQrCodeDataUrl(returnedQrCodeDataUrl);
        resetSetupMutation();
        setFlow('scan');
      },
      onError: (requestError) => {
        setupRequestInFlight.current = false;
        resetSetupMutation();
        if (requestError instanceof ApiError && requestError.code === 'MFA_ALREADY_ENABLED') {
          showAlreadyEnabled();
          return;
        }

        returnToStart(errorMessageFor(requestError));
      },
    });
  };

  const handleVerify = (event: React.FormEvent) => {
    event.preventDefault();
    if (confirmationRequestInFlight.current || confirmMutation.isPending) return;

    if (!/^\d{6}$/.test(otpCode)) {
      setError('Enter exactly six numeric digits.');
      return;
    }

    setError('');
    confirmationRequestInFlight.current = true;
    confirmMutation.mutate(
      { code: otpCode },
      {
        onSuccess: ({ backupCodes: returnedBackupCodes }) => {
          confirmationRequestInFlight.current = false;
          setOtpCode('');
          setQrCodeDataUrl(null);
          setBackupCodes(returnedBackupCodes);
          resetConfirmMutation();
          setFlow('recovery_codes');
        },
        onError: (requestError) => {
          confirmationRequestInFlight.current = false;
          resetConfirmMutation();
          const code = requestError instanceof ApiError ? requestError.code : undefined;

          if (code === 'MFA_ALREADY_ENABLED') {
            showAlreadyEnabled();
            return;
          }

          if (code === 'MFA_SETUP_NOT_STARTED' || code === 'MFA_SETUP_RESET' || code === 'MFA_SETUP_STATE_CHANGED') {
            returnToStart(errorMessageFor(requestError));
            return;
          }

          setError(errorMessageFor(requestError));
        },
      },
    );
  };

  const handleCopyCodes = async () => {
    if (!backupCodes.length || !navigator.clipboard) {
      setCopyStatus('failed');
      return;
    }

    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  const handleDone = () => {
    clearSensitiveState();
    setError('');
    setCopyStatus('idle');
    setFlow('completed');
  };

  const step = flow === 'idle' || flow === 'setting_up' || flow === 'scan' ? 1 : flow === 'verifying' ? 2 : 3;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Enable Two-Factor Authentication</h2>
        <p className="text-sm text-slate-500 mt-1">Protect your account with an authenticator app and recovery codes.</p>
      </div>

      <div className="flex items-center justify-between border-b border-slate-100 pb-4 max-w-xl" aria-label="Two-factor authentication setup progress">
        {setupSteps.map(({ label, number }, index) => (
          <React.Fragment key={label}>
            {index > 0 && <div className={`h-0.5 flex-1 mx-4 ${step >= number ? 'bg-brand-600' : 'bg-slate-200'}`} />}
            <div className={`flex items-center space-x-2 text-xs font-semibold ${step >= number ? 'text-brand-600' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-sans ${step >= number ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{number}</span>
              <span>{label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {error && <p className="text-sm text-rose-700 font-medium" role="alert">{error}</p>}

      {pageStatus === 'already_enabled' && (
        <div className="max-w-md bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 flex items-center space-x-3 text-sm" role="status">
          <ShieldCheck className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">Two-Factor Authentication is enabled</p>
            <p className="text-xs mt-0.5">Your account already has authenticator protection enabled.</p>
          </div>
        </div>
      )}

      {flow === 'idle' && !pageStatus && (
        <div className="space-y-6 max-w-md">
          <p className="text-sm text-slate-600">Use Google Authenticator or another compatible authenticator app to set up two-factor authentication.</p>
          <Button onClick={handleStartSetup} isLoading={setupMutation.isPending}>Enable 2FA</Button>
        </div>
      )}

      {flow === 'setting_up' && <p className="text-sm text-slate-600" role="status">Preparing your secure QR code…</p>}

      {flow === 'scan' && qrCodeDataUrl && (
        <div className="space-y-6 max-w-md">
          <p className="text-sm text-slate-600 font-medium">Scan this QR code with your authenticator app, then continue to verify the six-digit code it generates.</p>
          <div className="flex items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl w-52 h-52 mx-auto shadow-xs">
            <img src={qrCodeDataUrl} alt="Two-factor authentication setup QR code" className="w-44 h-44" />
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button onClick={() => { setError(''); setFlow('verifying'); }}>Next: Verify Code</Button>
          </div>
        </div>
      )}

      {flow === 'verifying' && (
        <form onSubmit={handleVerify} className="space-y-6 max-w-md">
          <p className="text-sm text-slate-600 font-medium">Enter the six-digit code generated by your authenticator app.</p>
          <Input
            label="Authenticator code"
            placeholder="123456"
            value={otpCode}
            onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            error={error || undefined}
            className="font-mono text-lg text-center tracking-widest"
          />
          <div className="pt-4 border-t border-slate-100 flex justify-between">
            <Button type="button" variant="secondary" onClick={() => { setError(''); setFlow('scan'); }} disabled={confirmMutation.isPending}>Back</Button>
            <Button type="submit" isLoading={confirmMutation.isPending}>Verify & Enable</Button>
          </div>
        </form>
      )}

      {flow === 'recovery_codes' && (
        <div className="space-y-6 max-w-md">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 flex items-center space-x-3 text-sm" role="status">
            <ShieldCheck className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold">Two-Factor Authentication Enabled</p>
              <p className="text-xs mt-0.5">Save these recovery codes now. They will not be shown again.</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Recovery codes</p>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-sm text-slate-900">
              {backupCodes.map((code, index) => (
                <div key={`${code}-${index}`} className="p-2 bg-white rounded border border-slate-200 text-center font-bold text-slate-800 shadow-xs">{code}</div>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500" aria-live="polite">
            {copyStatus === 'copied' && 'Recovery codes copied to your clipboard.'}
            {copyStatus === 'failed' && 'Could not copy codes. Please copy them manually.'}
          </p>
          <div className="pt-4 border-t border-slate-100 flex justify-between">
            <Button variant="secondary" className="space-x-1.5 text-xs" onClick={handleCopyCodes}>
              {copyStatus === 'copied' ? <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />}
              <span>{copyStatus === 'copied' ? 'Copied' : 'Copy all codes'}</span>
            </Button>
            <Button onClick={handleDone}>Done</Button>
          </div>
        </div>
      )}

      {flow === 'completed' && !pageStatus && (
        <div className="max-w-md bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 flex items-center space-x-3 text-sm" role="status">
          <ShieldCheck className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">Two-Factor Authentication is enabled</p>
            <p className="text-xs mt-0.5">Your recovery codes have been cleared from this page.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorAuthenticationPage;
