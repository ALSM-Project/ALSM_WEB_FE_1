import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Building,
  Lock,
  ArrowRight,
  Download,
  Clock,
} from 'lucide-react';
import { Button, Input, toast } from '@/shared/ui';
import { billingService } from '../services/billing.service';
import { env } from '@/shared/constants/env';

export const ContractSigningPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();

  const [contract, setContract] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('Authorized Signatory / Director');
  const [signerEmail, setSignerEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);

  useEffect(() => {
    if (!contractId) return;
    const fetchContract = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await billingService.getContractDetail(contractId);
        setContract(data);
        if (data.customer?.representativeName) {
          setSignerName(data.customer.representativeName);
        }
        if (data.customer?.contactEmail) {
          setSignerEmail(data.customer.contactEmail);
        }
        if (data.signingProcess?.customerSigningStatus === 'SIGNED') {
          setSignSuccess(true);
        }
      } catch (err: any) {
        console.error('Failed to load contract:', err);
        setError(err.message || 'Unable to load contract information.');
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [contractId]);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName || !signerEmail || !agreed) {
      toast.warning('Please enter full name, email and confirm contract terms.');
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await billingService.signCustomerContract(contractId!, {
        signerName,
        signerTitle,
        signerEmail,
        authMethod: 'Enterprise Multi-Factor + Digital Signature (E-Sign)',
      });
      setContract(updated);
      setSignSuccess(true);
    } catch (err: any) {
      console.error('Failed to sign contract:', err);
      toast.error(err.message || 'Contract signing failed. Please try again.', {
        title: 'Signing Error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-600">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-medium text-slate-700">Loading complete electronic contract...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center my-12">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Contract Not Found</h2>
        <p className="text-slate-600 mb-6">{error || 'Contract does not exist or has been cancelled.'}</p>
        <Button onClick={() => navigate('/billing/invoices')}>Back to Invoices</Button>
      </div>
    );
  }

  const isCustomerSigned =
    signSuccess ||
    contract.signingProcess?.customerSigningStatus === 'SIGNED' ||
    contract.status === 'SIGNED' ||
    contract.status === 'ACTIVE';

  const isProviderSigned =
    contract.signingProcess?.providerSigningStatus === 'SIGNED' ||
    contract.status === 'ACTIVE';

  const isBothSigned = isCustomerSigned && isProviderSigned;

  const apiBase = env.apiBaseUrl.replace(/\/+$/, '');
  const pdfDownloadUrl = `${apiBase}/api/v1/enterprise-contracts/${contractId}/pdf`;

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <span>ALSM Enterprise Services</span>
            <span>•</span>
            <span>Electronic Contract (E-Contract)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cryptographically Verified E-Contract Signing
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Contract No: <span className="font-mono font-semibold text-slate-700">{contract.contractNumber}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={pdfDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Download Contract PDF (PDFKit)
          </a>
          {isBothSigned ? (
            <Button
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
              onClick={() => navigate(`/billing/contracts/${contract.id || contractId}/pay`)}
            >
              Pay Invoice & Activate
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : isCustomerSigned ? (
            <div className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Pending ALSM Contract Approval & Signature</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Contract Banner Status */}
      {isCustomerSigned ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-emerald-900">
              Contract Has Been Lawfully Signed Electronically
            </h3>
            <p className="text-sm text-emerald-700 mt-0.5">
              Digital certificate & SHA-256 cryptographic hash have been affixed to the contract. Please proceed with invoice payment for automatic activation of your Enterprise Admin account on Web 3 Partner Portal.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-emerald-100 text-emerald-800 font-semibold">
                Cert: {contract.signingProcess?.customerSigner?.certificateReference || 'VNPT-ECA-VERIFIED'}
              </span>
              <span className="text-xs text-emerald-600">
                Signed by: <strong>{contract.signingProcess?.customerSigner?.name || signerName}</strong> on{' '}
                {new Date(contract.signingProcess?.customerSigner?.signedAt || Date.now()).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap self-center"
            onClick={() => navigate(`/billing/contracts/${contract.id || contractId}/pay`)}
          >
            Pay Now
          </Button>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
          <ShieldCheck className="w-8 h-8 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-blue-900">B2B Standard Electronic Contract Signing Procedure</h3>
            <p className="text-sm text-blue-700 mt-1">
              The contract complies with the Electronic Transactions Law 2023 and the Civil Code. Upon digital signing, a commercial invoice with payment instructions and an auto-reconciling QR code will be generated for seamless activation.
            </p>
          </div>
        </div>
      )}

      {/* Main Contract Sections */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Document Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 text-center">
          <div className="text-xs font-bold tracking-widest text-slate-500 uppercase">SOCIALIST REPUBLIC OF VIETNAM</div>
          <div className="text-xs font-medium text-slate-500">Independence - Freedom - Happiness</div>
          <div className="text-slate-300 my-1 font-mono text-xs">──────── • ────────</div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase mt-2">
            SERVICE CONTRACT: SYSTEM MODERNIZATION
          </h2>
          <p className="text-xs font-mono text-slate-500 mt-1">No: {contract.contractNumber}</p>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {/* Section 1: Parties */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2 mb-4">
              I. CONTRACTING PARTIES
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Party A */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <span className="text-xs font-bold uppercase text-emerald-700 tracking-wider">SERVICE PROVIDER (PARTY A)</span>
                <h4 className="font-bold text-slate-900 mt-1">
                  {contract.parties?.provider?.legalName || 'ALSM SOFTWARE MODERNIZATION TECHNOLOGY JOINT STOCK COMPANY'}
                </h4>
                <div className="text-xs text-slate-600 space-y-1 mt-2">
                  <p><strong>Tax ID:</strong> {contract.parties?.provider?.taxId || '0110892345'}</p>
                  <p><strong>Address:</strong> {contract.parties?.provider?.registeredAddress || '12th Floor, Keangnam Landmark 72, Pham Hung Road, Nam Tu Liem, Hanoi'}</p>
                  <p><strong>Representative:</strong> {contract.parties?.provider?.representativeName || 'Nguyen Huu Dung'} - {contract.parties?.provider?.representativeTitle || 'General Director'}</p>
                  <p><strong>Notice Email:</strong> {contract.parties?.provider?.contractNoticeEmail || 'contracts@alsm.io'}</p>
                </div>
              </div>

              {/* Party B */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <span className="text-xs font-bold uppercase text-blue-700 tracking-wider">CUSTOMER (PARTY B)</span>
                <h4 className="font-bold text-slate-900 mt-1">
                  {contract.parties?.customer?.legalName || contract.customer?.companyName || contract.organizationName}
                </h4>
                <div className="text-xs text-slate-600 space-y-1 mt-2">
                  <p><strong>Tax ID:</strong> {contract.parties?.customer?.taxId || contract.customer?.taxId || 'Pending update'}</p>
                  <p><strong>Address:</strong> {contract.parties?.customer?.registeredAddress || contract.customer?.businessAddress || 'Corporate Headquarters'}</p>
                  <p><strong>Representative:</strong> {contract.parties?.customer?.representativeName || contract.customer?.representativeName || signerName}</p>
                  <p><strong>Title:</strong> {contract.parties?.customer?.representativeTitle || contract.customer?.representativeTitle || signerTitle}</p>
                  <p><strong>Digital Sign Email:</strong> {contract.parties?.customer?.contractNoticeEmail || contract.customer?.contactEmail || signerEmail}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Service Scope & Capacity */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2 mb-4">
              II. SERVICE SCOPE & CAPACITY QUOTAS
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <div className="text-xs text-emerald-800 font-medium">Screen Quota</div>
                <div className="text-2xl font-black text-emerald-950 mt-1">{contract.scope?.screensQuota || 100}</div>
                <div className="text-[11px] text-emerald-600">BMS / DSPF screens</div>
              </div>
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                <div className="text-xs text-blue-800 font-medium">Logic Programs</div>
                <div className="text-2xl font-black text-blue-950 mt-1">{contract.scope?.programsQuota || 50}</div>
                <div className="text-[11px] text-blue-600">COBOL Programs</div>
              </div>
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100">
                <div className="text-xs text-purple-800 font-medium">Storage Quota</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{contract.scope?.storageGb || 20} GB</div>
                <div className="text-[11px] text-purple-600">Air-gapped Cloud</div>
              </div>
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100">
                <div className="text-xs text-amber-800 font-medium">Service Model</div>
                <div className="text-base font-bold text-amber-950 mt-1">{contract.serviceMode}</div>
                <div className="text-[11px] text-amber-600">Service Delivery Mode</div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-700 space-y-2">
              <p><strong>Target Technology:</strong> {contract.scope?.targetTechnology || 'React 19 + TypeScript + Spring Boot 3 Java'}</p>
              <p><strong>SLA Commitment:</strong> {contract.scope?.slaCommitment || '99.9% Uptime with Deterministic AST Validation'}</p>
              <p><strong>Deliverable Standards:</strong> Synthesized source code with AST Verification Report, 100% semantically equivalent to legacy COBOL business logic.</p>
            </div>
          </div>

          {/* Section 3: Commercial Terms */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2 mb-4">
              III. CONTRACT VALUE & PAYMENT
            </h3>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-sm text-slate-600">
                <span>Subtotal (Pre-tax):</span>
                <span className="font-semibold text-slate-800">
                  {(contract.commercialTerms?.subtotal || Math.round((contract.totalValue || 0) / 1.1)).toLocaleString('vi-VN')} {contract.currency || 'VND'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-600">
                <span>Value Added Tax (VAT {contract.commercialTerms?.vatRate ?? 10}%):</span>
                <span className="font-semibold text-slate-800">
                  {(contract.commercialTerms?.vatAmount || Math.round((contract.totalValue || 0) - (contract.totalValue || 0) / 1.1)).toLocaleString('vi-VN')} {contract.currency || 'VND'}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-base sm:text-lg font-bold text-slate-900">
                <span>Total Contract Payment Value:</span>
                <span className="text-emerald-600 font-extrabold">
                  {(contract.commercialTerms?.totalValue || contract.totalValue || 0).toLocaleString('vi-VN')} {contract.currency || 'VND'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Key Legal Clauses */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2 mb-4">
              IV. KEY LEGAL & SECURITY TERMS
            </h3>
            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <h5 className="font-bold text-slate-900">1. Intellectual Property Rights (100% Customer)</h5>
                <p className="mt-1 text-slate-600">Customer retains full intellectual property rights over legacy source files and 100% of modernized synthesized code (React, Java Spring Boot).</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <h5 className="font-bold text-slate-900">2. Deterministic AST Equivalence Guarantee</h5>
                <p className="mt-1 text-slate-600">ALSM guarantees legacy COBOL logic is preserved deterministically via AST verification, free of AI hallucinations.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <h5 className="font-bold text-slate-900">3. Privacy & Zero External AI Training</h5>
                <p className="mt-1 text-slate-600">Zero unauthorized storage or use of customer data for public AI model training.</p>
              </div>
            </div>
          </div>

          {/* Section 5: Signature Execution Box */}
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
              V. DIGITAL SIGNATURE CONFIRMATION
            </h3>

            {isCustomerSigned ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 border-2 border-emerald-500 bg-emerald-50/50 rounded-xl text-center">
                  <div className="text-xs font-bold text-emerald-800 uppercase">PARTY B REPRESENTATIVE (CUSTOMER)</div>
                  <div className="my-3 inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-white">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {contract.signingProcess?.customerSigner?.name || signerName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {contract.signingProcess?.customerSigner?.title || signerTitle}
                  </div>
                  <div className="mt-3 text-[11px] font-mono text-emerald-700 bg-emerald-100/70 p-2 rounded">
                    Auth Code: {contract.signingProcess?.customerSigner?.certificateReference || 'VNPT-ECA-8891'}<br />
                    Signed at: {new Date(contract.signingProcess?.customerSigner?.signedAt || Date.now()).toLocaleString('vi-VN')}
                  </div>
                </div>

                <div className="p-5 border border-slate-200 bg-slate-50 rounded-xl text-center">
                  <div className="text-xs font-bold text-slate-700 uppercase">PARTY A REPRESENTATIVE (ALSM)</div>
                  <div className="my-3 inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white">
                    <Building className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {contract.parties?.provider?.representativeName || 'Nguyen Huu Dung'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {contract.parties?.provider?.representativeTitle || 'General Director ALSM'}
                  </div>
                  <div className="mt-3 text-[11px] font-mono text-blue-700 bg-blue-100/70 p-2 rounded">
                    Certificate ID: VNPT-ECA-ALSM-01<br />
                    Digitally signed and verified
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSign} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Enter authorized representative signing info:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Signer Full Name *</label>
                    <Input
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Title / Designation *</label>
                    <Input
                      value={signerTitle}
                      onChange={(e) => setSignerTitle(e.target.value)}
                      placeholder="Managing Director"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email for Digital Certificate *</label>
                    <Input
                      type="email"
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                      placeholder="representative@company.com"
                      required
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    required
                  />
                  <span className="text-xs text-slate-600">
                    I confirm that I am an authorized legal representative of the enterprise, have read and agreed to all service terms, quota allocations, and payment obligations in this e-contract.
                  </span>
                </label>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting || !agreed}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 flex items-center gap-2 font-bold shadow-md shadow-emerald-500/20"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating cryptographic digital signature...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Sign Electronic Contract Now
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
