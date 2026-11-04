import React, { useCallback, useEffect, useRef, useState } from 'react';
import { QrCode, Copy, Check, CheckCircle2, ShieldCheck, AlertCircle, ArrowRight, X, Smartphone, Shield } from 'lucide-react';
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

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secretKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await accountService.confirm2FA(otpCode);
      if (res.enabled) {
        if (res.backupCodes) setBackupCodes(res.backupCodes);
        await refreshUser();
        setStep(3);
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
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
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
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Enable Two-Factor Authentication</h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-[65ch] [text-wrap:pretty]">
          Enhance your account security by requiring a second verification step.
        </p>
      </div>

      {/* Balanced 2-Column Enterprise Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left Column (60%): Interactive Step Workflow & Verification Actions */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          {step === 1 && (
            <div className="space-y-6 w-full">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Step 1: Scan Authenticator QR Code</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-[65ch] [text-wrap:pretty]">
                  Open your authenticator app (Google Authenticator, 1Password, or Authy) and scan the QR code below:
                </p>
              </div>

              <div className="flex items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-xl w-52 h-52 mx-auto shadow-2xs">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-40 h-40 object-contain" />
                ) : (
                  <QrCode className="w-40 h-40 text-slate-900" />
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Secret Key (Manual Entry)
                </label>
                {/* Borderless background container without nested card look */}
                <div className="flex items-center space-x-3 bg-slate-100/80 p-3 rounded-lg font-mono text-xs sm:text-sm text-slate-900 justify-between">
                  <span className="font-semibold text-blue-700 tracking-wider break-all">{secretKey || 'Loading secret key...'}</span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="text-slate-700 hover:text-slate-900 flex items-center space-x-1.5 text-xs font-sans font-medium px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs cursor-pointer shrink-0 transition-colors"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button onClick={() => setStep(2)} className="h-9 px-4 text-xs sm:text-sm font-semibold space-x-2">
                  <span>Next: Verify Code</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-6 w-full">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Step 2: Enter 6-Digit Verification Code</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-[65ch] [text-wrap:pretty]">
                  Enter the 6-digit code currently displayed in your authenticator app to confirm configuration:
                </p>
              </div>

              {error && (
                <div className="bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] p-3 rounded-lg text-xs font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2 max-w-sm">
                <Input
                  label="Authenticator Code"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="font-mono text-2xl tracking-[0.4em] font-bold h-12 text-center"
                  maxLength={6}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <Button type="button" variant="secondary" onClick={() => setStep(1)} className="h-9 px-4 text-xs sm:text-sm font-medium">
                  Back
                </Button>
                <Button type="submit" isLoading={loading} className="h-9 px-4 text-xs sm:text-sm font-semibold">
                  Verify & Enable
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-6 w-full">
              <div className="bg-[#ECFDF3] border border-[#ABEFC6] p-4 rounded-xl text-[#079455] flex items-center space-x-3 text-sm">
                <ShieldCheck className="w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="font-bold">Two-Factor Authentication Enabled!</p>
                  <p className="text-xs opacity-90">Save your emergency backup codes in a safe, offline location.</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">Emergency Backup Codes</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-100/80 p-4 rounded-xl font-mono text-sm text-slate-900">
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="p-2 text-center font-bold text-slate-800 select-all">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <Button variant="secondary" className="h-9 px-4 text-xs sm:text-sm font-medium space-x-1.5" onClick={handleCopyBackupCodes}>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Copy Codes</span>
                </Button>
                <Button onClick={() => setStep(1)} className="h-9 px-4 text-xs sm:text-sm font-semibold">
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (40%): Setup Progress, Authenticator App Guidance & Security Intelligence */}
        <div className="lg:col-span-5 bg-slate-50/70 rounded-xl p-5 divide-y divide-slate-200/80 space-y-5 min-w-0">
          {/* Section 1: Setup Progress Tracker */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Setup Progress</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-xs">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
                </span>
                <span className={step === 1 ? 'font-bold text-blue-700' : 'text-slate-700'}>1. Scan Secret QR Code</span>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {step > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
                </span>
                <span className={step === 2 ? 'font-bold text-blue-700' : 'text-slate-700'}>2. Verify 6-Digit TOTP Code</span>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {step === 3 ? <Check className="w-3.5 h-3.5" /> : '3'}
                </span>
                <span className={step === 3 ? 'font-bold text-blue-700' : 'text-slate-700'}>3. Save Emergency Backup Codes</span>
              </div>
            </div>
          </div>

          {/* Section 2: Authenticator App Guidance (Clean typographic list, NO nested cards/shadows) */}
          <div className="pt-5 space-y-3">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Supported Authenticator Apps</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-[55ch] [text-wrap:pretty]">
              ALSM supports any RFC 6238 compliant TOTP app on iOS and Android:
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-1 text-xs text-slate-700 font-medium">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span>Google Authenticator</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span>1Password / Bitwarden</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span>Microsoft Authenticator</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span>Twilio Authy</span>
              </div>
            </div>
          </div>

          {/* Section 3: Security Benefits */}
          <div className="pt-5 space-y-2.5">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Enterprise Security Standard</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-[55ch] [text-wrap:pretty]">
              Enabling 2FA blocks 99.9% of automated credential stuffing and unauthorized project export attempts, ensuring total mainframe asset integrity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuthenticationPage;
