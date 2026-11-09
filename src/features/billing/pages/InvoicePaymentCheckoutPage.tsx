import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Building,
  ArrowRight,
} from 'lucide-react';
import { Card, Button } from '@/shared/ui';
import { billingService } from '../services/billing.service';
import { generateCleanBankQrDataUrl } from '../../../shared/utils/bank-qr.helper';
import { tokenStore } from '@/services/api/tokenStore';

export const InvoicePaymentCheckoutPage: React.FC = () => {
  const { invoiceId, contractId } = useParams<{ invoiceId?: string; contractId?: string }>();
  const idOrNumber = invoiceId || contractId;
  const navigate = useNavigate();

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  // Remaining seconds calculation (based on invoice dueDate, default 72 hours, removing the 15-minute limit)
  const calculateSecondsLeft = (dueDateStr?: string) => {
    if (!dueDateStr) return 72 * 3600;
    const dueTime = new Date(dueDateStr).getTime();
    const diff = Math.floor((dueTime - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  };

  const [timeLeft, setTimeLeft] = useState<number>(72 * 3600);
  const [cleanQrUrl, setCleanQrUrl] = useState<string>('');

  useEffect(() => {
    if (data?.qrDataUrl && !data.qrDataUrl.includes('vietqr.io')) {
      setCleanQrUrl(data.qrDataUrl);
    } else if (data) {
      generateCleanBankQrDataUrl({
        bankBin: '970422',
        accountNumber: data.accountNumber || '0899886249',
        accountName: data.accountName || 'ALSM TECHNOLOGY SOLUTIONS',
        amount: data.amountVnd,
        message: data.referenceCode,
      }).then(setCleanQrUrl).catch(() => {});
    }
  }, [data]);

  useEffect(() => {
    if (data?.dueDate) {
      setTimeLeft(calculateSecondsLeft(data.dueDate));
    }
  }, [data?.dueDate]);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  const fetchInvoiceData = async (silent = false) => {
    if (!idOrNumber) return;
    try {
      if (!silent) setLoading(true);
      const res = await billingService.getContractInvoice(idOrNumber);

      // ─── DEBUG LOGGING: Payment Status Polling ───────────────
      console.log(
        `[PaymentCheckout] Poll response for "${idOrNumber}":`,
        JSON.stringify({
          status: res.status,
          invoiceNumber: res.invoiceNumber,
          contractNumber: res.contractNumber,
          paidAt: res.paidAt,
          web3PortalUrl: res.web3PortalUrl,
          amountVnd: res.amountVnd,
          referenceCode: res.referenceCode,
          timestamp: new Date().toISOString(),
        }, null, 2),
      );

      setData(res);

      // Normalize status check: backend may return 'PAID', 'Paid', or 'paid'
      const normalizedStatus = (res.status || '').toUpperCase();
      if (normalizedStatus === 'PAID') {
        console.log('[PaymentCheckout] ✅ Invoice status is PAID! Triggering redirect flow...');
        console.log('[PaymentCheckout] web3PortalUrl =', res.web3PortalUrl || 'http://localhost:3003');
        setIsPaid(true);
      } else {
        console.log(`[PaymentCheckout] ⏳ Invoice status is "${res.status}" (normalized: "${normalizedStatus}"), still polling...`);
      }
    } catch (err: any) {
      console.error('[PaymentCheckout] ❌ Failed to load invoice/payment info:', err);
      console.error('[PaymentCheckout] Error details:', {
        message: err.message,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      if (!silent) setError(err.message || 'Unable to load payment invoice.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, [idOrNumber]);

  // Polling every 3 seconds if not paid
  useEffect(() => {
    if (isPaid || !idOrNumber) return;
    const interval = setInterval(() => {
      fetchInvoiceData(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaid, idOrNumber]);

  // Countdown timer
  useEffect(() => {
    if (isPaid) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaid]);

  const getWeb3HandoffUrl = (baseUrl: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const accessToken = tokenStore.getAccessToken();
    const refreshToken = tokenStore.getRefreshToken();
    if (accessToken && refreshToken) {
      return `${cleanBase}/auth/callback#access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
    }
    return cleanBase;
  };

  const web3PortalUrl = data?.web3PortalUrl || 'http://localhost:3003';

  // Auto redirect countdown to Web 3
  useEffect(() => {
    if (isPaid && redirectCountdown === null) {
      setRedirectCountdown(3);
    }
  }, [isPaid, redirectCountdown]);

  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown <= 0) {
      window.location.href = getWeb3HandoffUrl(web3PortalUrl);
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, web3PortalUrl]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };


  const formatTimeLeft = (totalSeconds: number) => {
    if (totalSeconds <= 0) return 'Expired';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-600">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-medium text-slate-700">Preparing invoice and payment QR code...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center my-12">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Invoice Information Not Found</h2>
        <p className="text-slate-600 mb-6">{error || 'Invalid invoice or contract has not been signed.'}</p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => navigate('/account/contracts')}>Back to Contracts</Button>
          <Button variant="outline" onClick={() => navigate('/billing/invoices')}>Back to Invoices</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
          <span>ALSM Billing & Provisioning Gateway</span>
          <span>•</span>
          <span>Invoice Payment & Automatic Activation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Enterprise Contract Payment Gateway
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Invoice No: <strong className="font-mono text-slate-700">{data.invoiceNumber}</strong> • Contract:{' '}
          <strong className="font-mono text-slate-700">{data.contractNumber}</strong>
        </p>
      </div>

      {/* Success Banner if Paid */}
      {isPaid && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white text-emerald-600 flex items-center justify-center font-bold text-2xl shadow-inner">
              ✓
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-200">
                TRANSACTION CONFIRMED SUCCESSFULLY
              </span>
              <h2 className="text-2xl sm:text-3xl font-black">
                Web 3 Partner Portal Has Been Automatically Activated!
              </h2>
            </div>
          </div>

          <p className="text-sm text-emerald-100 max-w-3xl">
            ALSM system has received full payment for invoice <strong>{data.invoiceNumber}</strong>. Contract{' '}
            <strong>{data.contractNumber}</strong> has transitioned to <strong>ACTIVE</strong>. Your conversion quotas and enterprise account on Web 3 are now active and ready for immediate use.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">
              <div className="text-xs text-emerald-200">Service Model</div>
              <div className="text-base font-bold text-white mt-0.5">{data.serviceMode}</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">
              <div className="text-xs text-emerald-200">Screen Quota</div>
              <div className="text-base font-bold text-white mt-0.5">{data.screensQuota} screens</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">
              <div className="text-xs text-emerald-200">Web 3 Access</div>
              <div className="text-base font-bold text-white mt-0.5">ORGANIZATION_OWNER</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">
              <div className="text-xs text-emerald-200">Provisioning Status</div>
              <div className="text-base font-bold text-white mt-0.5">PROVISIONED</div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <a
              href={getWeb3HandoffUrl(web3PortalUrl)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-emerald-700 font-extrabold text-sm hover:bg-emerald-50 transition shadow-lg shadow-black/10"
            >
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Log In to ALSM Partner Portal (Web 3)
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
            <Button
              variant="outline"
              className="text-white border-white/40 hover:bg-white/10"
              onClick={() => navigate('/billing/invoices')}
            >
              View Invoice Receipt
            </Button>
          </div>

          {/* Automatic Redirection Countdown */}
          <div className="bg-emerald-950/40 border border-emerald-400/40 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300"></span>
              </span>
              <span>
                System is automatically redirecting to <strong>ALSM Partner Portal (Web 3)</strong> in{' '}
                <strong className="text-white text-sm font-mono underline">{redirectCountdown ?? 3} seconds</strong>...
              </span>
            </div>
            <a
              href={getWeb3HandoffUrl(web3PortalUrl)}
              className="px-3 py-1 bg-white text-emerald-800 rounded-lg font-bold hover:bg-emerald-100 transition whitespace-nowrap shadow-xs flex items-center gap-1"
            >
              <span>Access Web 3 Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Main Grid: Left = Invoice Info, Right = Bank Transfer / Payment Gateway */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Invoice Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 border border-slate-200 rounded-2xl shadow-sm bg-white space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Invoice Details</h3>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isPaid ? 'PAID' : 'PENDING'}
              </span>
            </div>

            <div className="text-xs space-y-2 text-slate-600">
              <p>
                <strong>Customer:</strong> {data.organizationName}
              </p>
              <p>
                <strong>Recipient:</strong> {data.customerName} ({data.customerEmail})
              </p>
              <p>
                <strong>Contract Number:</strong>{' '}
                <span className="font-mono text-slate-800 font-semibold">{data.contractNumber}</span>
              </p>
              <p>
                <strong>Payment Terms:</strong> Net 15 Days (Due Date: {new Date(data.dueDate).toLocaleDateString('vi-VN')})
              </p>
            </div>

            {/* Line items */}
            <div className="border-t border-slate-100 pt-3">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Service Line Items</div>
              {(data.items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50">
                  <span className="text-slate-700 pr-2">{item.description}</span>
                  <span className="font-semibold text-slate-900 whitespace-nowrap">
                    {(item.amount || item.unitPrice || 0).toLocaleString('vi-VN')} VND
                  </span>
                </div>
              ))}
            </div>

            {/* Subtotal & Tax */}
            <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{(data.subtotalVnd || 0).toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT ( {data.vatRate || 10}%):</span>
                <span>{(data.taxAmountVnd || 0).toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm sm:text-base font-extrabold text-slate-900">
                <span>Total Amount Due:</span>
                <span className="text-emerald-600">{(data.amountVnd || 0).toLocaleString('vi-VN')} VND</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-500">
              Electronic VAT invoice receipt will be automatically sent to your email upon successful transaction.
            </div>
          </Card>
        </div>

        {/* Right: Bank Transfer Payment Box */}
        <div className="lg:col-span-7">
          <Card className="p-6 sm:p-8 border border-slate-200 rounded-2xl shadow-sm bg-white space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Bank Transfer via QR (Auto-Reconciled)
                </h3>
              </div>
              {!isPaid && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    Time Remaining: <strong>{formatTimeLeft(timeLeft)}</strong>
                  </span>
                </div>
              )}
            </div>

            {isPaid ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Invoice Has Been Paid</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Transaction matched successfully. All quotas and Web 3 access have been automatically provisioned.
                </p>
                <div className="pt-2">
                  <a
                    href={getWeb3HandoffUrl(web3PortalUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
                  >
                    Open Web 3 Partner Portal
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                {/* QR Image */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <img
                    src={cleanQrUrl || data.qrDataUrl}
                    alt="Payment QR Code"
                    className="w-56 h-56 object-contain rounded-xl shadow-sm border border-slate-100 bg-white p-2"
                  />
                  <div className="mt-3 text-center">
                    <p className="text-xs font-semibold text-slate-700">Scan code with any banking app</p>
                    <p className="text-[11px] text-slate-500">QR code includes exact amount and payment reference</p>
                  </div>
                </div>

                {/* Transfer Info Fields */}
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium">Payment Invoice Code</span>
                      <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{data.invoiceNumber}</div>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {isPaid ? 'PAID' : 'PENDING'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium">Beneficiary Bank</span>
                    <div className="font-bold text-slate-800 text-xs sm:text-sm mt-0.5">{data.bankName}</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium">Beneficiary Account Name</span>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">{data.accountName || 'ALSM TECHNOLOGY SOLUTIONS'}</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium">Account Number</span>
                      <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{data.accountNumber}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(data.accountNumber, 'acc')}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedField === 'acc' ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium">Exact Amount</span>
                      <div className="font-mono font-bold text-emerald-700 text-sm sm:text-base mt-0.5">
                        {(data.amountVnd || 0).toLocaleString('vi-VN')} VND
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(String(data.amountVnd), 'amount')}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedField === 'amount' ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-emerald-800 font-semibold">Transfer Reference (Required)</span>
                      <div className="font-mono font-bold text-emerald-950 text-sm mt-0.5">{data.referenceCode}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(data.referenceCode, 'ref')}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedField === 'ref' ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* Polling live indicator */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                    <span>Waiting for bank transfer confirmation...</span>
                  </div>
                </div>
              </div>
            )}


          </Card>
        </div>
      </div>
    </div>
  );
};
