import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building,
  CreditCard,
  QrCode,
  Copy,
  ExternalLink,
  Download,
  Check,
  Lock,
  Layers,
  RefreshCw,
  AlertTriangle,
  Eye,
  Sparkles,
  ArrowRight,
  Eraser,
  PenTool,
} from 'lucide-react';
import { Button, toast } from '@/shared/ui';
import { billingService } from '../services/billing.service';
import { generateCleanBankQrDataUrl } from '../../../shared/utils/bank-qr.helper';
import { env } from '@/shared/constants/env';
import { ContractPreviewModal } from '../components/ContractPreviewModal';
import { tokenStore } from '@/services/api/tokenStore';

interface ContractDetailPageProps {
  initialShowPreview?: boolean;
}

export const ContractDetailPage: React.FC<ContractDetailPageProps> = ({ initialShowPreview = false }) => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();

  const [contract, setContract] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(initialShowPreview);

  // Signing form state
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('Authorized Representative / Director');
  const [signerEmail, setSignerEmail] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [signingLoading, setSigningLoading] = useState(false);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Auto-reconciliation & redirect state
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const prevVerifiedRef = React.useRef<boolean | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [cleanQrDataUrl, setCleanQrDataUrl] = useState<string>('');

  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const fetchContract = async (silent = false) => {
    if (!contractId) return;
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      const data = await billingService.getContractDetail(contractId);
      setContract(data);
      if (data.customer?.representativeName && !signerName) {
        const rep = data.customer.representativeName;
        if (rep && !/^[a-z0-9_]{3,20}$/i.test(rep.trim())) {
          setSignerName(rep);
        } else {
          setSignerName('Truong Minh Khoi');
        }
      }
      if (data.customer?.contactEmail && !signerEmail) {
        setSignerEmail(data.customer.contactEmail);
      }
    } catch (err: any) {
      console.error('[ContractDetailPage] Failed to load contract:', err);
      if (!silent) setError(err.message || 'Unable to load contract details.');
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  // Derived contract statuses (available for effects and rendering)
  const rawContractStatus = String(contract?.contractStatus || contract?.status || 'Draft').toUpperCase();
  const rawPaymentStatus = String(contract?.paymentStatus || 'Not Required').toUpperCase();
  const rawLifecycleStatus = String(contract?.lifecycleStatus || '').toUpperCase();
  const rawActivationStatus = String(contract?.activationStatus || '').toUpperCase();
  const invoiceStatus = String(contract?.invoice?.status || '').toUpperCase();

  const contractStatus = contract?.contractStatus || contract?.status || 'Draft';
  const paymentStatus = contract?.paymentStatus || 'Not Required';

  const isCustomerSigned = Boolean(
    contract?.signingStatus?.customer ||
    contract?.signingProcess?.customerSigningStatus === 'SIGNED' ||
    ['SIGNED', 'PENDING PAYMENT', 'PAYMENT VERIFICATION', 'ACTIVE', 'COMPLETED'].includes(rawContractStatus)
  );
  const isBothSigned = Boolean(
    (contract?.signingStatus?.alsm || contract?.signingProcess?.providerSigningStatus === 'SIGNED') &&
    isCustomerSigned
  );
  const isPaymentVerified = Boolean(
    rawPaymentStatus === 'PAYMENT VERIFIED' ||
    rawPaymentStatus === 'PAID' ||
    rawContractStatus === 'ACTIVE' ||
    rawContractStatus === 'COMPLETED' ||
    (rawLifecycleStatus === 'COMPLETED' && rawContractStatus === 'ACTIVE') ||
    rawActivationStatus === 'COMPLETED' ||
    invoiceStatus === 'PAID'
  );
  const isPaymentSubmitted = Boolean(
    rawPaymentStatus === 'PAYMENT SUBMITTED' || rawContractStatus === 'PAYMENT VERIFICATION'
  );

  const getWeb3HandoffUrl = (baseUrl: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const accessToken = tokenStore.getAccessToken();
    const refreshToken = tokenStore.getRefreshToken();
    if (accessToken && refreshToken) {
      return `${cleanBase}/auth/callback#access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
    }
    return cleanBase;
  };

  const web3PortalUrl = contract?.web3Activation?.web3PortalUrl || 'http://localhost:3003';

  // Auto redirect countdown to Web 3
  useEffect(() => {
    if (isPaymentVerified && redirectCountdown === null) {
      setRedirectCountdown(3);
    }
  }, [isPaymentVerified, redirectCountdown]);

  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown <= 0) {
      console.log('[ContractDetailPage] 🚀 Auto-redirecting to Web 3 Portal:', web3PortalUrl);
      window.location.href = getWeb3HandoffUrl(web3PortalUrl);
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, web3PortalUrl]);

  useEffect(() => {
    if (!contract || !isCustomerSigned) {
      setCleanQrDataUrl('');
      return;
    }
    const inv = contract.invoice;
    const ctrNum = contract.contractNumber || '';
    const defRef = inv?.invoiceNumber || (ctrNum ? `INV-${ctrNum.replace('ALSM-CTR-', '')}` : 'ALSM-PAY');
    const defAmt = inv?.amountVnd || contract.totalValue || 12100;
    const qp = contract.qrPayment;

    if (qp?.qrDataUrl && !qp.qrDataUrl.includes('vietqr.io')) {
      setCleanQrDataUrl(qp.qrDataUrl);
      return;
    }

    generateCleanBankQrDataUrl({
      bankBin: '970422',
      accountNumber: qp?.accountNumber || '0899886249',
      accountName: qp?.accountName || 'ALSM TECHNOLOGY SOLUTIONS',
      amount: qp?.amountVnd || defAmt,
      message: qp?.referenceCode || defRef,
    })
      .then(setCleanQrDataUrl)
      .catch((err) => console.error('[ContractDetailPage] Failed to generate clean QR:', err));
  }, [contract, isCustomerSigned]);

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  // Polling: Auto-refresh when contract is awaiting payment, signature, or undergoing bank reconciliation
  useEffect(() => {
    if (!contract) return;
    // Stop polling if already verified and active
    if (isPaymentVerified) return;

    const interval = setInterval(() => {
      fetchContract(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [contractId, isPaymentVerified, contract?.status, contract?.paymentStatus]);

  // Notify when payment gets verified dynamically
  useEffect(() => {
    if (prevVerifiedRef.current === false && isPaymentVerified) {
      toast.success('Payment verified successfully! Web 3 workspace is now active.', {
        title: 'Payment Succeeded',
        duration: 7000,
      });
    }
    if (contract) {
      prevVerifiedRef.current = isPaymentVerified;
    }
  }, [isPaymentVerified, contract]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSignContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim() || !signerEmail.trim() || !termsAgreed) {
      toast.warning('Please provide your full name, position, email, and accept contract terms.');
      return;
    }
    if (!hasDrawn) {
      toast.warning('Please draw your official signature in the signature pad using your mouse or touch screen.');
      return;
    }

    if (!signerName.trim().includes(' ') && /^[a-z0-9_]{3,25}$/i.test(signerName.trim())) {
      toast.warning('Please enter the full legal name of the representative (e.g. Truong Minh Khoi or Nguyen Van A), not an account username.');
      return;
    }

    const canvas = canvasRef.current;
    const signatureDataUrl = canvas ? canvas.toDataURL('image/png') : undefined;

    try {
      setSigningLoading(true);
      await billingService.signCustomerContract(contractId!, {
        signerName: signerName.trim(),
        signerTitle: signerTitle.trim(),
        signerEmail: signerEmail.trim(),
        authMethod: 'Enterprise Digital Signature (Cryptographic SHA-256 Assurance)',
        signatureImageUrl: signatureDataUrl,
      });
      await fetchContract(true);
      toast.success('Contract electronically signed successfully! Payment QR code is now generated.', {
        title: 'Signed Successfully',
        duration: 6000,
      });
    } catch (err: any) {
      console.error('[ContractDetailPage] Failed to sign:', err);
      const resData = err?.response?.data;
      let msg = '';
      if (Array.isArray(resData?.errors) && resData.errors.length > 0) {
        const errorList = resData.errors.map((item: any) => item.messageEn || item.messageVi || item.message).join('\n• ');
        msg = `${resData.message || 'Contract is not ready for signature:'}\n• ${errorList}`;
      } else if (resData?.message) {
        msg = resData.message;
      } else if (err.message) {
        msg = err.message;
      } else {
        msg = 'Electronic signing failed. Please check your information.';
      }
      toast.error(msg, { title: 'Signing Error' });
    } finally {
      setSigningLoading(false);
    }
  };


  const handleDownloadPdf = async () => {
    if (!contract) return;
    try {
      setDownloadingPdf(true);
      await billingService.downloadContractPdf(contract.id || contractId!, contract.contractNumber);
    } catch (err) {
      console.error('[ContractDetailPage] Download PDF failed:', err);
      const apiBase = env.apiBaseUrl.replace(/\/+$/, '');
      window.open(`${apiBase}/api/v1/enterprise-contracts/${contract.id || contractId}/pdf?download=true`, '_blank');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-slate-600">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold text-slate-700">Loading Contract & Payment Details...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center my-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Contract Not Found</h2>
        <p className="text-sm text-slate-600 mb-6">{error || 'This contract does not exist or you do not have permission to view it.'}</p>
        <Button onClick={() => navigate('/contracts')} className="bg-[#244A70] hover:bg-[#1B3856] text-white">
          Back to Contracts
        </Button>
      </div>
    );
  }

  const isDemoMode = Boolean(contract.isDemoMode);
  const invoice = contract.invoice;
  const contractNumber = contract.contractNumber || '';
  const defaultRefCode = invoice?.invoiceNumber || (contractNumber ? `INV-${contractNumber.replace('ALSM-CTR-', '')}` : 'ALSM-PAY');
  const defaultAmount = invoice?.amountVnd || contract.totalValue || 12100;

  const qrPayment = contract.qrPayment || {
    qrDataUrl: '',
    bankName: 'MB Bank (Military Commercial Joint Stock Bank)',
    accountNumber: '0899886249',
    accountName: 'ALSM TECHNOLOGY SOLUTIONS',
    referenceCode: defaultRefCode,
    amountVnd: defaultAmount,
    currency: contract.currency || 'VND',
  };



  // Status badge styling helper
  const getContractStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> {status}
          </span>
        );
      case 'Payment Verification':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Clock className="w-3.5 h-3.5 animate-spin" /> Payment Verification
          </span>
        );
      case 'Pending Payment':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <CreditCard className="w-3.5 h-3.5" /> Pending Payment
          </span>
        );
      case 'Signed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Check className="w-3.5 h-3.5" /> Signed
          </span>
        );
      case 'Pending Signature':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending Signature
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case 'Draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <FileText className="w-3.5 h-3.5" /> Draft
          </span>
        );
    }
  };

  const getSignatureStatusBadge = () => {
    if (isBothSigned) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" /> Both Parties Signed
        </span>
      );
    }
    if (isCustomerSigned) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Customer Signed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5" /> Awaiting Signature
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'Payment Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Payment Verified
          </span>
        );
      case 'Payment Submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Clock className="w-3.5 h-3.5 animate-pulse" /> Payment Submitted
          </span>
        );
      case 'Pending Payment':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <CreditCard className="w-3.5 h-3.5" /> Pending Payment
          </span>
        );
      case 'Payment Failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" /> Payment Failed
          </span>
        );
      case 'Not Required':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Not Required
          </span>
        );
    }
  };

  const getActivationStatusBadge = () => {
    if (isPaymentVerified) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Service Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
        <Lock className="w-3.5 h-3.5" /> Provisioning Locked
      </span>
    );
  };

  const getPdfButtonLabel = () => {
    if (isBothSigned) return 'Download Signed PDF';
    if (contractStatus === 'Draft') return 'Download Draft PDF';
    return 'Download Contract PDF';
  };

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{contract.contractNumber}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(contract.contractNumber, 'contractNo')}
                className="p-1 text-slate-400 hover:text-slate-700 transition rounded"
                title="Copy contract number"
              >
                {copiedKey === 'contractNo' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </h1>

            {getContractStatusBadge(contractStatus)}
            {getSignatureStatusBadge()}
            {getPaymentStatusBadge(paymentStatus)}
            {getActivationStatusBadge()}
          </div>
          <p className="text-sm text-slate-600 mt-1 font-medium">{contract.title}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setShowPreviewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#244A70] hover:bg-[#1B3856] rounded-xl shadow-xs transition"
          >
            <Eye className="w-4 h-4" />
            Preview Contract
          </Button>

          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            {downloadingPdf ? 'Downloading...' : getPdfButtonLabel()}
          </Button>

          <Button
            variant="outline"
            onClick={() => fetchContract(true)}
            disabled={refreshing}
            className="text-xs px-3 py-2 border-slate-300 text-slate-700 hover:bg-slate-50"
            title="Refresh status"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Top Banner: Stage-based Guidance */}
      {isPaymentVerified ? (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 sm:p-7 text-white shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 font-bold text-2xl shadow-inner">
                ✓
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Service Activated & Resources Allocated Successfully!
                  </h3>
                  <span className="px-2.5 py-0.5 rounded text-xs font-extrabold uppercase bg-emerald-200 text-emerald-950">
                    ACTIVE
                  </span>
                </div>
                <p className="text-sm text-emerald-100 mt-1 max-w-2xl">
                  Payment transaction has been confirmed. Contract <strong className="font-mono text-white">{contract?.contractNumber}</strong> is legally active. Your Web 3 Partner Workspace is ready.
                </p>
              </div>
            </div>
            <a
              href={getWeb3HandoffUrl(web3PortalUrl)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-emerald-700 font-extrabold text-sm hover:bg-emerald-50 transition shadow-lg whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Access ALSM Partner Portal (Web 3)
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Automatic Redirection Countdown Banner */}
          <div className="bg-emerald-950/40 border border-emerald-400/40 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300"></span>
              </span>
              <span>
                Redirecting automatically to <strong>ALSM Partner Portal (Web 3)</strong> in{' '}
                <strong className="text-white text-sm font-mono underline">{redirectCountdown ?? 3} seconds</strong>...
              </span>
            </div>
            <a
              href={getWeb3HandoffUrl(web3PortalUrl)}
              className="px-3.5 py-1.5 bg-white text-emerald-800 rounded-lg font-bold hover:bg-emerald-100 transition whitespace-nowrap shadow-xs flex items-center gap-1.5 text-xs"
            >
              <span>Go to Web 3 now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : isPaymentSubmitted ? (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Verifying & Reconciling Payment Automatically</h3>
              <p className="text-sm text-purple-800 mt-0.5">
                Bank transfer transaction is being auto-reconciled with MB Bank. Your workspace will activate immediately upon completion.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-bold text-xs shrink-0">
            <Clock className="w-3.5 h-3.5 animate-spin" /> Auto-detecting...
          </span>
        </div>
      ) : isCustomerSigned ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-950">Contract Signed — Awaiting Invoice Payment</h3>
              <p className="text-sm text-amber-800 mt-0.5">
                Contract has been electronically signed. Please settle the invoice using the bank transfer or QR code on the right panel within 72 hours to activate service.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreviewModal(true)}
              className="border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              Review Contract
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-blue-950">Contract Awaiting Electronic Signature (E-Sign)</h3>
              <p className="text-sm text-blue-800 mt-0.5">
                Please review the full contract terms, service quota, and legal clauses before countersigning.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowPreviewModal(true)}
            className="bg-[#244A70] hover:bg-[#1B3856] text-white font-bold text-xs whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Preview Full Contract Agreement
          </Button>
        </div>
      )}

      {/* Grid: 2 Columns on Large Screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scope, Parties, Values, Signing, Audit (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Selected Service & Modernization Scope */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Selected Service & Modernization Package
              </h3>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                {contract.serviceMode || 'HYBRID'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium block">Screens Quota</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">
                  {contract.scope?.screensQuota || contract.screensQuota || 100}
                </span>
                <span className="text-[11px] text-slate-500">screens included</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium block">Programs Quota</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">
                  {contract.scope?.programsQuota || 50}
                </span>
                <span className="text-[11px] text-slate-500">programs</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium block">Dedicated Storage</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">
                  {contract.scope?.storageGb || 20} GB
                </span>
                <span className="text-[11px] text-slate-500">cloud repository</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium block">Service Tier</span>
                <span className="text-xs font-bold text-blue-700 mt-1 block truncate">
                  {contract.plan || 'Enterprise Core Modernization'}
                </span>
                <span className="text-[11px] text-slate-500">Dedicated SLA</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Target Tech Stack:</span>
                <span className="font-semibold text-slate-800">{contract.scope?.targetTechnology || 'React 19 + TypeScript + Spring Boot 3 Java'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Source Legacy Stack:</span>
                <span className="font-semibold text-slate-800">{contract.scope?.sourceCodeType || 'IBM 3270 BMS / AS400 DSPF & COBOL Logic'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">SLA Commitment:</span>
                <span className="font-semibold text-slate-800">{contract.scope?.slaCommitment || '99.9% Platform Availability with Deterministic AST Validation'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Effective Period:</span>
                <span className="font-semibold text-slate-800">
                  {contract.effectiveDate || 'Upon Signature'} to {contract.endDate || '12 Months'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Contracting Parties */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-slate-600" />
              Contracting Parties
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Provider */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Service Provider (Party A)
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  {contract.parties?.provider?.legalName || 'ALSM SOFTWARE MODERNIZATION TECHNOLOGY JOINT STOCK COMPANY'}
                </p>
                <p className="text-slate-600">Tax ID: {contract.parties?.provider?.taxId || '0110892345'}</p>
                <p className="text-slate-600 truncate" title={contract.parties?.provider?.headquarters}>
                  {contract.parties?.provider?.headquarters || 'Hoa Xuan, Cam Le, Da Nang'}
                </p>
                <p className="text-slate-600">
                  Rep: {contract.parties?.provider?.signatoryName || 'Nguyen Gia Khanh'} ({contract.parties?.provider?.signatoryTitle || 'General Director'})
                </p>
              </div>

              {/* Customer */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                  Customer (Party B)
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  {contract.customer?.companyName || contract.organizationName || 'Client Workspace'}
                </p>
                <p className="text-slate-600">Tax ID: {contract.customer?.taxId || '0108849201'}</p>
                <p className="text-slate-600 truncate" title={contract.customer?.businessAddress}>
                  {contract.customer?.businessAddress || 'Hanoi, Vietnam'}
                </p>
                <p className="text-slate-600">
                  Rep: {contract.customer?.representativeName || signerName || 'Hoang Nguyen Duc Huy'} ({contract.customer?.representativeTitle || signerTitle})
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Financial Terms & Value Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Contract Financial Value
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Subtotal (Net Service Fee):</span>
                <span className="font-mono font-semibold text-slate-800">
                  {new Intl.NumberFormat('en-US').format(contract.commercialTerms?.subtotal || Math.round((contract.totalValue || 0) / 1.1))} VND
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Value Added Tax (VAT 10%):</span>
                <span className="font-mono font-semibold text-slate-800">
                  {new Intl.NumberFormat('en-US').format(contract.commercialTerms?.vatAmount || Math.round((contract.totalValue || 0) - (contract.totalValue || 0) / 1.1))} VND
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-slate-200 text-base font-bold text-slate-900">
                <span>Total Contract Value:</span>
                <span className="font-mono text-emerald-700 text-lg">
                  {new Intl.NumberFormat('en-US').format(contract.totalValue || 0)} VND
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Signature Status & Electronic Signing Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Digital Signature Status
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreviewModal(true)}
                className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                Preview Contract Full
              </Button>
            </div>

            {isCustomerSigned ? (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Customer Electronic Signature Validated
                </div>

                {/* Render the saved drawn signature image */}
                {(contract.signingProcess?.customerSigner?.signatureImageUrl || contract.signingProcess?.customerSignatureImage) && (
                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold mb-1 block">
                      Recorded Electronic Signature
                    </span>
                    <img
                      src={contract.signingProcess?.customerSigner?.signatureImageUrl || contract.signingProcess?.customerSignatureImage}
                      alt="Customer Signature"
                      className="max-h-20 max-w-[220px] object-contain"
                    />
                  </div>
                )}

                <div className="text-xs text-emerald-700 space-y-1">
                  <p>
                    <strong>Signed by:</strong>{' '}
                    {contract.signingProcess?.customerSigner?.name || contract.customer?.representativeName || signerName}
                  </p>
                  <p>
                    <strong>Signatory Title:</strong>{' '}
                    {contract.signingProcess?.customerSigner?.title || contract.customer?.representativeTitle || signerTitle}
                  </p>
                  <p>
                    <strong>Signer Email:</strong>{' '}
                    {contract.signingProcess?.customerSigner?.email || contract.customer?.contactEmail || signerEmail}
                  </p>
                  <p>
                    <strong>Signed At:</strong>{' '}
                    {new Date(contract.signingProcess?.customerSigner?.signedAt || contract.signedDate || Date.now()).toLocaleString('en-US')}
                  </p>
                  <p className="font-mono text-[11px] text-emerald-900 pt-1">
                    Certificate Reference: {contract.signingProcess?.customerSigner?.certificateReference || 'VNPT-ECA-VERIFIED'}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSignContract} className="space-y-4">
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                  <PenTool className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">
                      Draw your official signature in the signature box below using your mouse or touch screen.
                    </p>
                    <p className="text-blue-700">
                      Before signing, you can{' '}
                      <button
                        type="button"
                        onClick={() => setShowPreviewModal(true)}
                        className="font-bold underline text-blue-800 hover:text-blue-950 cursor-pointer"
                      >
                        click here to preview the full legal contract agreement
                      </button>
                      .
                    </p>
                  </div>
                </div>

                {/* Canvas Signature Pad */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <label className="flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-blue-600" />
                      <span>Draw Your Signature *</span>
                    </label>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[11px] font-medium text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer transition"
                    >
                      <Eraser className="w-3 h-3" />
                      Clear / Redraw
                    </button>
                  </div>

                  <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl bg-slate-50 overflow-hidden transition">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={160}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-36 block cursor-crosshair bg-white"
                    />
                    {!hasDrawn && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs gap-1">
                        <PenTool className="w-5 h-5 text-slate-300" />
                        <span>Sign here using your mouse or finger</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Signer Full Name *</label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      required
                      placeholder="e.g. Truong Minh Khoi"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Enter the full legal name of the authorized representative (e.g. Truong Minh Khoi), not a username.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Signer Title *</label>
                    <input
                      type="text"
                      value={signerTitle}
                      onChange={(e) => setSignerTitle(e.target.value)}
                      required
                      placeholder="e.g. Director / Chief Executive"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Signer Business Email *</label>
                  <input
                    type="email"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    required
                    placeholder="partner@company.com"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="terms-check"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    required
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="terms-check" className="text-xs text-slate-600 cursor-pointer">
                    I confirm that I am the authorized legal representative of the client enterprise, have reviewed the full contract preview, and agree to execute this digital agreement with cryptographic assurance.
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={signingLoading || !termsAgreed || !hasDrawn}
                  className="w-full bg-[#244A70] hover:bg-[#1B3856] text-white font-bold py-2.5 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {signingLoading ? 'Executing SHA-256 Digital Signature...' : 'Sign Contract & Generate Payment QR Code'}
                </Button>
              </form>
            )}
          </div>

          {/* Card 5: Payment & Lifecycle Audit Trail */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-4 h-4 text-slate-600" />
              Contract & Payment Audit Trail
            </h3>

            <div className="space-y-3">
              {(contract.paymentAuditTrail || contract.auditTrail || []).slice(0, 6).map((trail: any, index: number) => (
                <div key={trail.id || index} className="flex items-start gap-3 text-xs border-b border-slate-100 pb-2.5 last:border-none">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{trail.action}</span>
                      <span className="text-[11px] text-slate-400">
                        {trail.timestamp ? new Date(trail.timestamp).toLocaleString('en-US') : ''}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{trail.details}</p>
                    {trail.actorName && (
                      <span className="text-[11px] text-slate-400 block mt-0.5">By: {trail.actorName}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Invoice Details & QR Payment Section (5 Cols) - ALWAYS ACTIVE */}
        <div className="lg:col-span-5 space-y-6">
              {/* Card 1: Invoice Details */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Invoice Details
                  </h3>
                  {isPaymentVerified ? (
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> PAID
                    </span>
                  ) : isPaymentSubmitted ? (
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-pulse" /> PROCESSING
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                      PENDING PAYMENT
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Invoice Number:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {invoice?.invoiceNumber || (isDemoMode ? 'DEMO-INV-' + contract.contractNumber.replace('ALSM-CTR-', '') : 'INV-' + contract.contractNumber.replace('ALSM-CTR-', ''))}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Contract Number:</span>
                    <span className="font-mono text-slate-800 font-semibold">{contract.contractNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Invoice Date:</span>
                    <span className="font-medium text-slate-800">
                      {invoice?.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-US') : new Date().toLocaleDateString('en-US')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Payment Due Date:</span>
                    <span className="font-medium text-amber-700">
                      {invoice?.dueDate ? new Date(invoice.dueDate).toLocaleString('en-US') : 'Within 72 hours of signing'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Invoice Status:</span>
                    <span className="font-semibold text-slate-900">
                      {isPaymentVerified ? 'PAID' : isPaymentSubmitted ? 'PROCESSING' : 'PENDING'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Payable Amount:</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      {new Intl.NumberFormat('en-US').format(invoice?.amountVnd || contract.totalValue || 0)} VND
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Payment Method:</span>
                    <span className="font-semibold text-slate-900">Direct Bank Transfer / QR Code</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Payment Reference:</span>
                    <span className="font-mono font-bold text-blue-700">
                      {qrPayment?.referenceCode || invoice?.invoiceNumber || contract.contractNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Bank Transfer QR & Banking Section */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    Direct Bank Transfer (QR Code)
                  </h3>
                  <span className="text-xs font-semibold text-emerald-600">Auto-Reconciled</span>
                </div>

                {!isCustomerSigned ? (
                  /* LOCKED STATE: Contract has not been signed yet */
                  <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">Payment QR Code Locked</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Please draw your authorized electronic signature on the left panel to execute this contract. Upon signing, the instant payment QR code and bank transfer instructions will be generated automatically.
                    </p>
                  </div>
                ) : isPaymentVerified ? (
                  <div className="p-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-center space-y-3">
                    <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-bold text-emerald-950">
                      Payment Confirmed & Fully Reconciled
                    </h4>
                    <p className="text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
                      Bank transfer transaction has been verified and settled. The payment QR code for this invoice is now archived.
                    </p>
                    <div className="pt-2 text-[11px] text-emerald-900 font-mono space-y-0.5">
                      <div>Confirmed At: {new Date(invoice?.paidAt || Date.now()).toLocaleString('en-US')}</div>
                      <div>Reconciliation Ref: {qrPayment?.referenceCode || invoice?.invoiceNumber}</div>
                    </div>
                    <div className="pt-3">
                      <a
                        href={getWeb3HandoffUrl(web3PortalUrl)}
                        className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Open ALSM Partner Portal (Web 3)
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Active QR Code Presentation */}
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      {cleanQrDataUrl || qrPayment?.qrDataUrl ? (
                        <img
                          src={cleanQrDataUrl || qrPayment.qrDataUrl}
                          alt="Bank Transfer QR Code"
                          className="w-56 h-auto object-contain rounded-xl border border-slate-200 shadow-sm bg-white p-2"
                        />
                      ) : (
                        <div className="w-56 h-56 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                          <QrCode className="w-16 h-16" />
                        </div>
                      )}
                      <span className="text-[11px] text-slate-500 mt-2 font-medium text-center">
                        Scan QR code using any banking mobile app for automatic transfer
                      </span>
                    </div>

                    {/* Bank Account Transfer Details with Copy Buttons */}
                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-500 block">Bank Name</span>
                          <span className="font-semibold text-slate-800">MB Bank (Military Commercial Joint Stock Bank)</span>
                        </div>
                        <Button
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => copyToClipboard('MB Bank', 'bank')}
                        >
                          {copiedKey === 'bank' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-500 block">Account Number</span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {qrPayment?.accountNumber || '0899886249'}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => copyToClipboard(qrPayment?.accountNumber || '0899886249', 'accNum')}
                        >
                          {copiedKey === 'accNum' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-500 block">Account Holder</span>
                          <span className="font-semibold text-slate-800">
                            {qrPayment?.accountName || 'ALSM TECHNOLOGY SOLUTIONS'}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => copyToClipboard(qrPayment?.accountName || 'ALSM TECHNOLOGY SOLUTIONS', 'accName')}
                        >
                          {copiedKey === 'accName' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-500 block">Mandatory Transfer Reference</span>
                          <span className="font-mono font-bold text-blue-700 text-sm">
                            {qrPayment?.referenceCode || invoice?.invoiceNumber || contract.contractNumber}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => copyToClipboard(qrPayment?.referenceCode || invoice?.invoiceNumber || contract.contractNumber, 'ref')}
                        >
                          {copiedKey === 'ref' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>

                    {/* Fully Automated 24/7 Reconciliation Notice */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        Fully Automated 24/7 Reconciliation
                      </span>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        No manual payment proof submission required. Once your transfer completes, the system automatically detects the transaction and redirects you to the Web 3 Partner Portal.
                      </p>
                    </div>
                  </>
                )}
              </div>

            
        </div>
      </div>

      {/* Contract Preview Modal Component */}
      <ContractPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        contract={contract}
        onDownloadPdf={handleDownloadPdf}
        onContractUpdated={fetchContract}
      />
    </div>
  );
};

export default ContractDetailPage;
