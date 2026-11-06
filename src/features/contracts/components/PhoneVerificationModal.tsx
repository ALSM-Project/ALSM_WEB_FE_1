import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { phoneVerificationService } from '@/features/auth/services/phoneVerification.service';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'SUCCESS'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStep('PHONE');
      setCode('');
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const normalizePhone = (input: string): string => {
    const trimmed = input.trim().replace(/\s+/g, '');
    if (trimmed.startsWith('0')) {
      return `+84${trimmed.slice(1)}`;
    }
    if (trimmed.startsWith('84') && !trimmed.startsWith('+')) {
      return `+${trimmed}`;
    }
    return trimmed;
  };

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    const normalized = normalizePhone(phone);
    if (!/^\+84\d{9,10}$/.test(normalized)) {
      setError('Vui lòng nhập số điện thoại hợp lệ (VD: 0912345678 hoặc +84912345678).');
      return;
    }

    setLoading(true);
    try {
      const res = await phoneVerificationService.requestOtp(normalized);
      if (res.sent) {
        setStep('OTP');
        setCooldown(res.retryAfterSeconds || 60);
      } else {
        setError(`Vui lòng chờ ${res.retryAfterSeconds} giây trước khi yêu cầu lại.`);
        setCooldown(res.retryAfterSeconds);
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Không thể gửi mã OTP. Vui lòng thử lại sau.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Mã OTP phải gồm đúng 6 chữ số.');
      return;
    }

    setLoading(true);
    try {
      const normalized = normalizePhone(phone);
      const res = await phoneVerificationService.verifyOtp(normalized, code.trim());
      if (res.verified) {
        setStep('SUCCESS');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Mã OTP không chính xác hoặc đã hết hạn.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác minh số điện thoại người ký" maxWidth="md">
      <div className="space-y-4 p-1">
        {step === 'PHONE' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <Smartphone className="h-5 w-5 shrink-0 text-blue-600" />
              <span>
                Theo quy định, người ký hợp đồng cần xác minh số điện thoại di động chính chủ qua mã OTP trước khi tiến hành ký điện tử.
              </span>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="phone-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Số điện thoại di động
              </label>
              <div className="mt-1">
                <Input
                  id="phone-input"
                  type="tel"
                  placeholder="0912 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Mã xác thực OTP gồm 6 chữ số sẽ được gửi qua tin nhắn SMS.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                Hủy
              </Button>
              <Button type="submit" disabled={loading || !phone.trim()}>
                {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              Mã xác thực gồm 6 chữ số đã được gửi tới số{' '}
              <strong className="text-slate-900">{normalizePhone(phone)}</strong>.{' '}
              <button
                type="button"
                onClick={() => { setStep('PHONE'); setError(''); }}
                className="text-blue-600 underline hover:text-blue-800"
              >
                Đổi số khác
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="otp-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Nhập mã OTP (6 số)
              </label>
              <div className="mt-1">
                <Input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  className="text-center font-mono text-lg tracking-widest"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => void handleRequestOtp()}
                disabled={cooldown > 0 || loading}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:text-slate-400"
              >
                {cooldown > 0 ? `Gửi lại sau (${cooldown}s)` : 'Gửi lại mã OTP'}
              </button>

              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                  Hủy
                </Button>
                <Button type="submit" disabled={loading || code.trim().length !== 6}>
                  {loading ? 'Đang xác thực...' : 'Xác minh'}
                </Button>
              </div>
            </div>
          </form>
        )}

        {step === 'SUCCESS' && (
          <div className="py-6 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500 animate-bounce" />
            <h3 className="mt-3 text-lg font-bold text-slate-900">Xác minh số điện thoại thành công!</h3>
            <p className="mt-1 text-sm text-slate-600">Quyền ký hợp đồng của bạn đã được kích hoạt.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

