import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Copy, Check, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { mockQRDetails } from '@/mocks/billing.mock';
import { billingService } from '../services/billing.service';
import type { QRPaymentOrder, PaymentStatusResponse } from '../types/billing';
import { ROUTES } from '@/shared/constants/routes';

const formatVnd = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);

export const QRPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(872); // 14:32
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'COMPLETED' | 'EXPIRED'>('PENDING');
  const [paymentOrder, setPaymentOrder] = useState<QRPaymentOrder | null>(null);

  // Use mock data as fallback
  const qr = paymentOrder || {
    paymentId: '',
    subscriptionId: '',
    invoiceNumber: mockQRDetails.invoiceId,
    planName: mockQRDetails.planName,
    amountVnd: mockQRDetails.amount,
    currency: mockQRDetails.currency,
    referenceCode: mockQRDetails.referenceCode,
    qrDataUrl: `https://img.vietqr.io/image/MB-${mockQRDetails.accountNumber}-compact2.png?amount=${mockQRDetails.amount}&addInfo=${encodeURIComponent(mockQRDetails.referenceCode)}&accountName=${encodeURIComponent(mockQRDetails.accountName)}`,
    bankName: mockQRDetails.bankName,
    accountNumber: mockQRDetails.accountNumber,
    accountName: mockQRDetails.accountName,
    expiresAt: new Date(Date.now() + 872 * 1000).toISOString(),
  };

  // Countdown timer
  useEffect(() => {
    if (paymentStatus !== 'PENDING') return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 0) {
          setPaymentStatus('EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentStatus]);

  // Poll payment status every 5 seconds
  useEffect(() => {
    if (!paymentOrder?.paymentId || paymentStatus !== 'PENDING') return;

    const pollInterval = setInterval(async () => {
      try {
        const result: PaymentStatusResponse = await billingService.getPaymentStatus(paymentOrder.paymentId);
        if (result.status === 'COMPLETED') {
          setPaymentStatus('COMPLETED');
          clearInterval(pollInterval);
        } else if (result.status === 'EXPIRED') {
          setPaymentStatus('EXPIRED');
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Payment status poll error:', err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [paymentOrder?.paymentId, paymentStatus]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyText = useCallback((text: string, label: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // Payment completed view
  if (paymentStatus === 'COMPLETED') {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-16">
        <div className="w-20 h-20 mx-auto bg-[#ECFDF3] rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-[#079455]" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Payment Successful!</h1>
        <p className="text-slate-500 text-sm">Your subscription has been activated. You now have full access to all features.</p>
        <button
          onClick={() => navigate(ROUTES.BILLING.SUBSCRIPTION)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Complete Your Payment</h1>
        <p className="text-slate-500 text-sm">Scan the QR code with your banking app to activate your subscription</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* QR Code Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-6 shadow-sm">
          <div className="bg-[#FFFAEB] border border-[#FEDF89] py-2 px-4 rounded-full inline-flex items-center space-x-2 text-[#DC6803] text-xs font-semibold">
            <Clock className="w-4 h-4 animate-pulse text-[#DC6803]" />
            <span>Expires in {formatCountdown(secondsLeft)}</span>
          </div>

          {/* Real QR Code from VietQR */}
          <div className="bg-white p-4 rounded-2xl w-64 h-64 mx-auto flex items-center justify-center border border-slate-200 shadow-inner">
            <img
              src={qr.qrDataUrl}
              alt="VietQR Payment Code"
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                // Fallback if VietQR image fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-brand-600">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Waiting for payment confirmation...</span>
            </div>
            <p className="text-xs text-slate-500">Payment verified securely via bank webhook</p>
          </div>
        </div>

        {/* Payment Details Panel */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Order Summary</h3>
            <div className="space-y-2 text-xs font-medium text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="text-slate-900 font-mono font-bold">{qr.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="text-brand-600 font-bold">{qr.planName}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm">
                <span className="text-slate-900 font-bold">Amount Due:</span>
                <span className="text-brand-600 font-extrabold text-base">{formatVnd(qr.amountVnd)} {qr.currency}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bank Details</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Bank:</span>
                <span className="text-slate-900 font-bold">{qr.bankName}</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Account:</span>
                <div className="flex items-center space-x-2 font-mono">
                  <span className="text-brand-700 font-bold">{qr.accountNumber}</span>
                  <button onClick={() => copyText(qr.accountNumber, 'account number', setCopiedAccount)} className="text-slate-400 hover:text-slate-800">
                    {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Name:</span>
                <span className="text-slate-900 font-bold">{qr.accountName}</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Amount:</span>
                <div className="flex items-center space-x-2 font-mono">
                  <span className="text-brand-700 font-bold">{formatVnd(qr.amountVnd)}</span>
                  <button onClick={() => copyText(String(qr.amountVnd), 'amount', setCopiedAmount)} className="text-slate-400 hover:text-slate-800">
                    {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Reference:</span>
                <div className="flex items-center space-x-2 font-mono">
                  <span className="text-brand-700 font-bold">{qr.referenceCode}</span>
                  <button onClick={() => copyText(qr.referenceCode, 'reference code', setCopiedRef)} className="text-slate-400 hover:text-slate-800">
                    {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {toastMessage && (
            <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl text-xs font-semibold shadow-lg flex items-center space-x-2 z-50 animate-bounce">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          )}

          <div className="text-xs text-slate-500 space-y-1 font-medium">
            <p>Prefer bank transfer? View manual transfer instructions</p>
            <p className="flex items-center space-x-1.5 text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>We never store your banking details</span>
            </p>
            <p className="flex items-center space-x-1.5 text-slate-400">
              <span>Payment verified securely via bank webhook</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default QRPaymentPage;
