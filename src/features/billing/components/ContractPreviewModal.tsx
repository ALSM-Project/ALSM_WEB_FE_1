import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  ShieldCheck,
  ExternalLink,
  FileSignature,
  Eraser,
  CheckCircle2,
} from 'lucide-react';
import { Button, toast } from '@/shared/ui';
import { env } from '@/shared/constants/env';
import { ContractDocument } from './ContractDocument';
import { billingService } from '../services/billing.service';

interface ContractPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
  onSignClick?: () => void;
  onDownloadPdf?: () => void;
  onContractUpdated?: (updated: any) => void;
}

export const ContractPreviewModal: React.FC<ContractPreviewModalProps> = ({
  isOpen,
  onClose,
  contract,
  onDownloadPdf,
  onContractUpdated,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<'a4' | 'html'>('a4');
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loadingHtml, setLoadingHtml] = useState<boolean>(false);

  // Local copy of contract so signed state renders immediately in viewer
  const [currentContract, setCurrentContract] = useState<any>(contract);

  // Signing Dialog State
  const [showSignDialog, setShowSignDialog] = useState<boolean>(false);
  const [signerName, setSignerName] = useState<string>('');
  const [signerTitle, setSignerTitle] = useState<string>('General Director');
  const [signerEmail, setSignerEmail] = useState<string>('');
  const [termsAgreed, setTermsAgreed] = useState<boolean>(false);
  const [signingLoading, setSigningLoading] = useState<boolean>(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setCurrentContract(contract);
    if (contract?.customer) {
      const rep = contract.customer.representativeName;
      // Default legal name if rep looks like username
      if (rep && !/^[a-z0-9_]{3,20}$/i.test(rep.trim())) {
        setSignerName(rep);
      } else {
        setSignerName('Truong Minh Khoi');
      }
      if (contract.customer.representativeTitle) {
        setSignerTitle(contract.customer.representativeTitle);
      }
      if (contract.customer.contactEmail) {
        setSignerEmail(contract.customer.contactEmail);
      }
    }
  }, [contract]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSignDialog) {
          setShowSignDialog(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, showSignDialog]);

  useEffect(() => {
    if (activeTab === 'html' && !htmlContent && (currentContract?.id || currentContract?._id)) {
      setLoadingHtml(true);
      const contractId = currentContract.id || currentContract._id;
      const apiBase = env.apiBaseUrl.replace(/\/+$/, '');
      const url = `${apiBase}/api/v1/enterprise-contracts/${contractId}/pdf?format=html`;
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

      fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => res.text())
        .then((html) => setHtmlContent(html))
        .catch((err) => console.error('[ContractPreviewModal] Failed to load HTML:', err))
        .finally(() => setLoadingHtml(false));
    }
  }, [activeTab, htmlContent, currentContract?.id, currentContract?._id]);

  // Canvas coordinate mapping with resolution scaling
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
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  };

  // Canvas drawing handlers for signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureDataUrl('');
  };

  const handleExecuteSigning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim() || !signerEmail.trim() || !termsAgreed) {
      toast.warning('Please enter full name, title, email and confirm contract signing terms.');
      return;
    }

    if (!signerName.trim().includes(' ') && /^[a-z0-9_]{3,25}$/i.test(signerName.trim())) {
      toast.warning('Please enter the full legal name of the representative (e.g. Truong Minh Khoi), do not use a username.');
      return;
    }

    const contractId = currentContract?.id || currentContract?._id;
    if (!contractId) return;

    try {
      setSigningLoading(true);
      await billingService.signCustomerContract(contractId, {
        signerName: signerName.trim(),
        signerTitle: signerTitle.trim() || 'General Director',
        signerEmail: signerEmail.trim(),
        authMethod: 'Enterprise OTP + SHA-256',
        ...(signatureDataUrl ? { signatureImageUrl: signatureDataUrl } : {}),
      } as any);

      // Re-fetch updated contract details
      const updated = await billingService.getContractDetail(contractId);
      setCurrentContract(updated);
      setShowSignDialog(false);
      onContractUpdated?.(updated);
      toast.success('Digital signature successful! The contract is now legally binding and bank transfer information is ready.', {
        title: 'Signing Successful',
        duration: 6000,
      });
    } catch (err: any) {
      console.error('[ContractPreviewModal] Signing failed:', err);
      toast.error(err.message || 'Contract digital signing failed. Please verify your information.', {
        title: 'Signing Failed',
      });
    } finally {
      setSigningLoading(false);
    }
  };

  if (!isOpen || !currentContract) return null;

  const contractNumber = currentContract.contractNumber || 'ALSM-CTR-2026-DRAFT';
  const isCustomerSigned =
    currentContract.signingStatus?.customer ||
    currentContract.signingProcess?.customerSigningStatus === 'SIGNED' ||
    ['Signed', 'Pending Payment', 'Payment Verification', 'Active', 'Completed'].includes(
      currentContract.contractStatus || currentContract.status,
    );

  const handlePrint = () => {
    window.print();
  };

  const setFitWidth = () => {
    const containerWidth = window.innerWidth - 64;
    const targetScale = Math.min(130, Math.max(60, Math.round((containerWidth / 820) * 100)));
    setZoomLevel(targetScale);
  };

  const modalContent = (
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen m-0 p-0 z-[999999] flex flex-col bg-slate-950 overflow-hidden"
      style={{ margin: 0, padding: 0 }}
    >
      {/* ───────────────────────────────────────────────────────────── */}
      {/* APPLICATION TOOLBAR — 100% COVERAGE AT TOP */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xl select-none z-10">
        {/* Left: Contract Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-white tracking-wide">
                {contractNumber}
              </span>
              {isCustomerSigned ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Fully Signed (Both Parties)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Pending Party B Signature
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-sm sm:max-w-md">
              {currentContract.title || 'SERVICE CONTRACT: SOFTWARE SYSTEM MODERNIZATION'}
            </p>
          </div>
        </div>

        {/* Center: View Switcher */}
        <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('a4')}
            className={`px-3 py-1 rounded-md transition ${
              activeTab === 'a4'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            A4 Contract Document
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('html')}
            className={`px-3 py-1 rounded-md transition ${
              activeTab === 'html'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Server HTML Version
          </button>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2">
          {activeTab === 'a4' && (
            <div className="hidden md:flex items-center gap-1 bg-slate-800 rounded-lg px-2 py-1 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                className="p-1 text-slate-400 hover:text-white transition rounded"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="w-11 text-center font-mono text-slate-200">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="p-1 text-slate-400 hover:text-white transition rounded"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white border-l border-slate-700 ml-1"
                title="100% Size"
              >
                100%
              </button>
              <button
                type="button"
                onClick={setFitWidth}
                className="p-1 text-slate-400 hover:text-white transition rounded"
                title="Fit Screen Width"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white h-8"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            In
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadPdf}
            className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white h-8"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download PDF
          </Button>

          {!isCustomerSigned && (
            <Button
              size="sm"
              onClick={() => setShowSignDialog(true)}
              className="bg-[#244A70] hover:bg-[#1B3856] text-white font-semibold text-xs h-8 shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              Sign Contract Now
            </Button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1 cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DOCUMENT VIEW AREA */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-slate-900/90 p-4 sm:p-8 flex justify-center">
        {activeTab === 'a4' && (
          <div
            className="flex flex-col items-center w-full transition-transform duration-150 origin-top pb-16"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            <ContractDocument
              contract={currentContract}
              showWatermark={false}
              onCustomerSign={() => setShowSignDialog(true)}
            />
          </div>
        )}

        {/* Tab Xem Server HTML Version */}
        {activeTab === 'html' && (
          <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden min-h-[900px] flex flex-col my-4 pb-12">
            <div className="p-3 bg-neutral-100 border-b border-neutral-300 flex items-center justify-between text-xs text-neutral-600">
              <span>Synchronized from Backend: Enterprise Contract Formal HTML Template</span>
              <a
                href={`${env.apiBaseUrl.replace(/\/+$/, '')}/api/v1/enterprise-contracts/${currentContract.id || currentContract._id}/pdf?format=html`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
              >
                Open in new tab <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            {loadingHtml ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                <span>Loading full HTML document from backend...</span>
              </div>
            ) : htmlContent ? (
              <iframe
                srcDoc={htmlContent}
                title="Contract Server Preview"
                className="w-full flex-1 min-h-[900px] border-none"
              />
            ) : (
              <div className="p-12 text-center text-red-500">Failed to load HTML content from server.</div>
            )}
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DIRECT IN-MODAL ELECTRONIC SIGNING DIALOG FOR PARTY B */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showSignDialog && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl lg:max-w-3xl w-full p-6 sm:p-8 space-y-5 text-slate-800 my-auto max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <FileSignature className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 tracking-tight">
                    Electronic Contract Signing (Party B)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Digital signature verification & legal commitment under Electronic Transactions Law
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSignDialog(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteSigning} className="space-y-4 sm:space-y-5 text-sm">
              {/* Signer Name & Signer Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5 text-xs sm:text-sm">
                    Authorized Representative Full Name *
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    required
                    placeholder="e.g. Truong Minh Khoi"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Full legal name, do not use username
                  </p>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5 text-xs sm:text-sm">
                    Signer Title / Position *
                  </label>
                  <input
                    type="text"
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    required
                    placeholder="e.g. General Director"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 text-xs sm:text-sm">
                  Work Email for Signed Copy & Invoices *
                </label>
                <input
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                />
              </div>

              {/* Generous Signature Canvas Drawing Area */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <label className="font-semibold text-slate-800 text-xs sm:text-sm">
                      Draw Digital Signature (Expanded Canvas)
                    </label>
                    {signatureDataUrl && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Signature recorded
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
                  >
                    <Eraser className="w-3.5 h-3.5" /> Clear & Redraw
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors rounded-2xl bg-slate-50/70 p-2 relative touch-none shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={960}
                    height={320}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-52 sm:h-60 bg-white rounded-xl cursor-crosshair block shadow-xs"
                  />

                  {/* Guide line inside canvas (Signing Baseline) */}
                  <div className="absolute left-6 right-6 bottom-8 pointer-events-none flex items-center justify-between border-b border-dashed border-slate-300 pb-1">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      ✍️ Sign along this line
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Party B Representative / Signatory
                    </span>
                  </div>

                  {!signatureDataUrl && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs sm:text-sm gap-1 pb-6">
                      <FileSignature className="w-8 h-8 text-slate-300 mb-1" />
                      <span className="font-medium text-slate-500">Use mouse, stylus, or touch to draw signature</span>
                      <span className="text-xs text-slate-400">Expanded canvas for easy signing</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirmation check */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="modal-terms-check"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  required
                  className="mt-1 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                />
                <label htmlFor="modal-terms-check" className="text-xs sm:text-sm text-slate-700 leading-relaxed cursor-pointer select-none">
                  I confirm that I am an authorized representative of Party B, have reviewed the full contract, and agree to officially sign electronically with SHA-256 cryptographic proof.
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSignDialog(false)}
                  disabled={signingLoading}
                  className="h-10 sm:h-11 px-5 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={signingLoading || !termsAgreed}
                  className="h-10 sm:h-11 bg-[#244A70] hover:bg-[#1B3856] text-white font-bold text-sm px-6 rounded-xl shadow-md cursor-pointer"
                >
                  {signingLoading ? (
                    'Signing Digitally...'
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Confirm & Sign Digitally Now
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default ContractPreviewModal;

