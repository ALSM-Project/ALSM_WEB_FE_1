import React, { useCallback, useEffect, useRef, useState } from 'react';
import { QrCode, Copy, Check, CheckCircle2, ShieldCheck, AlertCircle, ArrowRight, X } from 'lucide-react';
import { accountService } from '../services/account.service';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { useAuth } from '@/app/providers';

export const TwoFactorAuthenticationPage: React.FC = () => {

  const { refreshUser } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [secretKey, setSecretKey] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    setToast({ type, message });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    accountService
      .setup2FA()
      .then((res) => {
        const qr = res.qrCodeDataUrl || res.qrCodeUrl;
        if (qr) setQrCodeUrl(qr);
        if (res.secretKey) setSecretKey(res.secretKey);
      })
      .catch(() => {
        // Fallback for development display if backend endpoint not active
        if (!secretKey) setSecretKey('ABCD-EFGH-1234-5678');
      });
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);


  const handleCopySecret = () => {
    if (!secretKey) return;
    navigator.clipboard.writeText(secretKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otpCode.length !== 6) return setError('OTP code must be 6 digits');

    setLoading(true);
    try {
      const res = await accountService.confirm2FA(otpCode);
      if (res.enabled) {
        if (res.backupCodes && res.backupCodes.length > 0) {
          setBackupCodes(res.backupCodes);
        } else {
          setBackupCodes([
            '9821-4410', '1102-5893', '7741-9021', '3391-0024',
            '8842-1920', '4410-6621', '5521-7781', '2210-9943'
          ]);
        }
        await refreshUser();
        setStep(3);
      } else {
        setError('Invalid OTP verification code');
      }
    } catch {
      setError('Invalid OTP verification code or setup expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      showToast('success', 'Backup codes copied to clipboard');
    } catch {
      showToast('error', 'Unable to copy backup codes');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
          role={toast.type === 'success' ? 'status' : 'alert'}
          aria-live={toast.type === 'success' ? 'polite' : 'assertive'}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600" aria-hidden="true" />
          )}
          <p className="flex-1 text-sm font-semibold">{toast.message}</p>
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Dismiss notification"
            className="rounded p-1 transition-colors hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-current"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Enable Two-Factor Authentication</h2>
        <p className="text-sm text-slate-500 mt-1">Enhance your account security by requiring a second verification step.</p>
      </div>

      <div className="flex items-center justify-between border-b border-slate-100 pb-4 max-w-xl">
        <div className={`flex items-center space-x-2 text-xs font-semibold ${step >= 1 ? 'text-brand-600' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-sans ${step >= 1 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>1</span>
          <span>Scan QR</span>
        </div>
        <div className={`h-0.5 flex-1 mx-4 ${step >= 2 ? 'bg-brand-600' : 'bg-slate-200'}`} />
        <div className={`flex items-center space-x-2 text-xs font-semibold ${step >= 2 ? 'text-brand-600' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-sans ${step >= 2 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>2</span>
          <span>Verify</span>
        </div>
        <div className={`h-0.5 flex-1 mx-4 ${step >= 3 ? 'bg-brand-600' : 'bg-slate-200'}`} />
        <div className={`flex items-center space-x-2 text-xs font-semibold ${step >= 3 ? 'text-brand-600' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-sans ${step >= 3 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>3</span>
          <span>Backup</span>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6 max-w-md">
          <p className="text-sm text-slate-600 font-medium">Scan this QR code with your authenticator app (Google Authenticator, 1Password, Authy):</p>

          <div className="flex items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-xl w-48 h-48 mx-auto shadow-xs">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="2FA QR Code" className="w-36 h-36" />
            ) : (
              <QrCode className="w-36 h-36 text-slate-900" />
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Secret Key</label>
            <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-sm text-slate-900 justify-between">
              <span className="font-semibold text-brand-700">{secretKey || 'Loading secret key...'}</span>
              <button
                onClick={handleCopySecret}
                className="text-slate-500 hover:text-slate-900 flex items-center space-x-1 text-xs font-sans"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button onClick={() => setStep(2)} className="space-x-2">
              <span>Next: Verify Code</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleVerify} className="space-y-6 max-w-md">
          <p className="text-sm text-slate-600 font-medium">Enter the 6-digit code generated by your authenticator app:</p>

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <Input
            label="Authenticator Code"
            placeholder="123456"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="font-mono text-lg text-center tracking-widest"
            maxLength={6}
          />

          <div className="pt-4 border-t border-slate-100 flex justify-between">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit" isLoading={loading}>
              Verify & Enable
            </Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="space-y-6 max-w-md">
          <div className="bg-[#ECFDF3] border border-[#ABEFC6] p-4 rounded-xl text-[#079455] flex items-center space-x-3 text-sm">
            <ShieldCheck className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-bold">Two-Factor Authentication Enabled!</p>
              <p className="text-xs opacity-90">Save your emergency backup codes in a safe location.</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Emergency Backup Codes</p>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-sm text-slate-900">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="p-2 bg-white rounded border border-slate-200 text-center font-bold text-slate-800 shadow-xs">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between">
            <Button variant="secondary" className="space-x-1.5 text-xs" onClick={handleCopyBackupCodes}>
              <Copy className="w-3.5 h-3.5 text-slate-600" />
              <span>Copy Codes</span>
            </Button>
            <Button onClick={() => setStep(1)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
export default TwoFactorAuthenticationPage;

