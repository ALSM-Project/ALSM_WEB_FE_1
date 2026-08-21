import React, { useState, useEffect } from 'react';
import { QrCode, Clock, Copy, Check, ShieldCheck, RefreshCw } from 'lucide-react';
import { mockQRDetails } from '@/mocks/billing.mock';

export const QRPaymentPage: React.FC = () => {
  const [secondsLeft, setSecondsLeft] = useState(872); // 14:32
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const copyText = (text: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Complete Your Payment</h1>
        <p className="text-slate-500 text-sm">Scan the QR code with your banking app to activate your subscription</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-6 shadow-sm">
          <div className="bg-[#FFFAEB] border border-[#FEDF89] py-2 px-4 rounded-full inline-flex items-center space-x-2 text-[#DC6803] text-xs font-semibold">
            <Clock className="w-4 h-4 animate-pulse text-[#DC6803]" />
            <span>Expires in {formatCountdown(secondsLeft)}</span>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl w-56 h-56 mx-auto flex items-center justify-center border border-slate-200 shadow-inner">
            <QrCode className="w-48 h-48 text-slate-900" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-brand-600">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Waiting for payment confirmation...</span>
            </div>
            <p className="text-xs text-slate-500">Payment verified securely via bank webhook</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Order Summary</h3>
            <div className="space-y-2 text-xs font-medium text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="text-slate-900 font-mono font-bold">{mockQRDetails.invoiceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="text-brand-600 font-bold">{mockQRDetails.planName}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm">
                <span className="text-slate-900 font-bold">Amount Due:</span>
                <span className="text-brand-600 font-extrabold text-base">{mockQRDetails.amount.toLocaleString()} {mockQRDetails.currency}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bank Details</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Bank:</span>
                <span className="text-slate-900 font-bold">{mockQRDetails.bankName}</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Account:</span>
                <div className="flex items-center space-x-2 font-mono">
                  <span className="text-brand-700 font-bold">{mockQRDetails.accountNumber}</span>
                  <button onClick={() => copyText(mockQRDetails.accountNumber, setCopiedAccount)} className="text-slate-400 hover:text-slate-800">
                    {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Name:</span>
                <span className="text-slate-900 font-bold">{mockQRDetails.accountName}</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Reference:</span>
                <div className="flex items-center space-x-2 font-mono">
                  <span className="text-brand-700 font-bold">{mockQRDetails.referenceCode}</span>
                  <button onClick={() => copyText(mockQRDetails.referenceCode, setCopiedRef)} className="text-slate-400 hover:text-slate-800">
                    {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 space-y-1 font-medium">
            <p>Prefer bank transfer? View manual transfer instructions</p>
            <p className="flex items-center space-x-1.5 text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>We never store your banking details</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default QRPaymentPage;
