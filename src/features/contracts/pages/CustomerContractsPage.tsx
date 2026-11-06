import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Download, FileText, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react';
import { customerContractsService, type CustomerContractDetail, type CustomerContractListItem } from '../services/customerContracts.service';
import { PhoneVerificationModal } from '../components/PhoneVerificationModal';

const formatVnd = (value: number) => new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0,
}).format(value);

export const CustomerContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<CustomerContractListItem[]>([]);
  const [selected, setSelected] = useState<CustomerContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [demoSigningLoading, setDemoSigningLoading] = useState(false);
  const [demoAcknowledged, setDemoAcknowledged] = useState(false);
  const [decisionReason, setDecisionReason] = useState('');
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [error, setError] = useState('');

  const loadContracts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await customerContractsService.list();
      setContracts(rows);
      if (rows.length === 0) setSelected(null);
      else if (!rows.some((row) => row.contract.id === selected?.contract.id)) {
        const detail = await customerContractsService.get(rows[0].contract.id);
        setSelected(detail);
        try {
          const viewed = await customerContractsService.markViewed(detail.contract.id);
          setSelected(viewed);
          setContracts((current) => current.map((row) => row.contract.id === viewed.contract.id
            ? { ...row, contract: { ...row.contract, lifecycleStatus: viewed.contract.lifecycleStatus } }
            : row));
        } catch {
          setError('The contract opened, but ALSM could not record the view event. Refresh and try again.');
        }
      }
    } catch (cause) {
      const status = (cause as { status?: number }).status;
      setError(status === 403
        ? 'Verify the email address on your ALSM account before opening invited contracts.'
        : 'Could not load contracts for this account. Refresh the page or contact ALSM support.');
    } finally {
      setLoading(false);
    }
  }, [selected?.contract.id]);

  useEffect(() => { void loadContracts(); }, [loadContracts]);

  const openContract = async (contractId: string) => {
    if (detailLoading || selected?.contract.id === contractId) return;
    setDetailLoading(true);
    setError('');
    try {
      const detail = await customerContractsService.get(contractId);
      setSelected(detail);
      try {
        const viewed = await customerContractsService.markViewed(contractId);
        setSelected(viewed);
        setContracts((current) => current.map((row) => row.contract.id === viewed.contract.id
          ? { ...row, contract: { ...row.contract, lifecycleStatus: viewed.contract.lifecycleStatus } }
          : row));
      } catch {
        setError('The contract opened, but ALSM could not record the view event. Refresh and try again.');
      }
    } catch {
      setError('This contract is no longer available to your account. Contact ALSM if you believe this is an error.');
    } finally {
      setDetailLoading(false);
    }
  };

  const downloadReviewPdf = async () => {
    if (!selected || !selected.reviewPdfAvailable || downloadLoading) return;
    setDownloadLoading(true);
    setError('');
    try {
      const blob = await customerContractsService.downloadReviewPdf(selected.contract.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contract-${selected.contract.contractNumber}-review-copy.pdf`;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError('Could not download the review copy. Refresh the contract and try again.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const downloadCanonicalPdf = async () => {
    if (!selected || !selected.canonicalPdfAvailable || downloadLoading) return;
    setDownloadLoading(true);
    setError('');
    try {
      const blob = await customerContractsService.downloadCanonicalPdf(selected.contract.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contract-${selected.contract.contractNumber}-unsigned.pdf`;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError('Could not download the unsigned contract PDF. Refresh the contract and try again.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const downloadSignedPdf = async () => {
    if (!selected || !selected.signedPdfAvailable || downloadLoading) return;
    setDownloadLoading(true);
    setError('');
    try {
      const blob = await customerContractsService.downloadSignedPdf(selected.contract.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contract-${selected.contract.contractNumber}-${selected.demoNotice ? 'demo-' : ''}signed.pdf`;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError('The verified signed PDF could not be downloaded. Refresh the contract or contact ALSM support.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const startDemoSigning = async () => {
    if (!selected || demoSigningLoading) return;
    setDemoSigningLoading(true);
    setError('');
    try {
      const updated = await customerContractsService.startDemoSigning(selected.contract.id);
      setSelected(updated);
      setDemoAcknowledged(false);
    } catch {
      setError('Could not start the demo signing session. Refresh the contract and try again.');
    } finally {
      setDemoSigningLoading(false);
    }
  };

  const completeDemoSigning = async () => {
    if (!selected || !demoAcknowledged || demoSigningLoading) return;
    setDemoSigningLoading(true);
    setError('');
    try {
      const updated = await customerContractsService.completeDemoSigning(selected.contract.id, true);
      setSelected(updated);
      setContracts(await customerContractsService.list());
      setDemoAcknowledged(false);
    } catch {
      setError('The demo confirmation could not be completed. Refresh the contract to check its current status.');
    } finally {
      setDemoSigningLoading(false);
    }
  };

  const respondToContract = async (action: 'REQUEST_CHANGES' | 'DECLINE') => {
    if (!selected || decisionLoading || decisionReason.trim().length < 5 || decisionReason.trim().length > 1000) return;
    setDecisionLoading(true);
    setError('');
    try {
      const updated = await customerContractsService.respond(selected.contract.id, action, decisionReason.trim());
      setSelected(updated);
      setDecisionReason('');
      setContracts(await customerContractsService.list());
    } catch {
      try {
        setSelected(await customerContractsService.get(selected.contract.id));
        setContracts(await customerContractsService.list());
        setError('The response could not be confirmed. The latest contract status has been loaded.');
      } catch {
        setError('Your response could not be confirmed. Refresh the contract and check its current status.');
      }
    } finally {
      setDecisionLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">ALSM customer portal</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">My contracts</h1>
          <p className="mt-1 text-sm text-slate-600">Contracts are visible only after you sign in with the verified account that accepted the ALSM invitation.</p>
        </div>
        <button type="button" onClick={() => void loadContracts()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </header>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
      {loading ? <p role="status" className="rounded-xl border bg-white p-8 text-sm text-slate-600">Loading your contracts…</p> : contracts.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <FileText className="mx-auto h-9 w-9 text-slate-400" />
          <h2 className="mt-3 font-semibold text-slate-900">No contracts are ready to review</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm text-slate-600">After ALSM prepares and internally approves a contract for your Lead, it will appear here. You will use this same ALSM account to review it.</p>
        </section>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(17rem,0.7fr)_minmax(0,1.4fr)]">
          <nav aria-label="Your contracts" className="space-y-2">
            {contracts.map((item) => (
              <button key={item.contract.id} type="button" onClick={() => void openContract(item.contract.id)} aria-current={selected?.contract.id === item.contract.id ? 'true' : undefined} className={`w-full rounded-xl border p-4 text-left transition ${selected?.contract.id === item.contract.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                <span className="flex items-start justify-between gap-3">
                  <span><span className="block font-semibold text-slate-900">{item.version.title}</span><span className="mt-1 block font-mono text-xs text-slate-500">{item.contract.contractNumber}</span></span>
                  <FileText className="h-5 w-5 shrink-0 text-blue-700" />
                </span>
                <span className="mt-3 block text-xs text-slate-600">{item.contract.lifecycleStatus.replace(/_/g, ' ')}</span>
              </button>
            ))}
          </nav>

          {detailLoading ? <p role="status" className="rounded-xl border bg-white p-8 text-sm text-slate-600">Opening contract…</p> : selected ? (
            <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5 sm:p-7">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><ShieldCheck className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Contract {selected.contract.contractNumber} · version {selected.version.versionNumber}</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">{selected.version.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{selected.version.plan} · {formatVnd(selected.version.annualValue)} / year</p>
                  </div>
                </div>
                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">Customer organization</dt><dd className="mt-1 text-sm font-medium text-slate-900">{selected.version.customerName}</dd></div>
                  <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">Effective date in draft</dt><dd className="mt-1 text-sm font-medium text-slate-900">{selected.version.effectiveDate}</dd></div>
                </dl>
              </div>

              <div className="max-h-[55vh] space-y-5 overflow-y-auto p-5 sm:p-7">
                {selected.version.approvedTemplateSnapshot ? (
                  <>
                    <div>
                      <h3 className="font-semibold text-slate-900">{selected.version.approvedTemplateSnapshot.title}</h3>
                      <p className="mt-1 break-all text-xs text-slate-500">Approved template v{selected.version.approvedTemplateSnapshot.templateVersionNumber} · SHA-256 {selected.version.approvedTemplateSnapshot.contentDigest}</p>
                    </div>
                    {selected.version.approvedTemplateSnapshot.sections.map((section, index) => (
                      <section key={`${index}-${section.heading}`} className="border-t border-slate-100 pt-4">
                        <h4 className="font-semibold text-slate-900">{index + 1}. {section.heading}</h4>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{section.body}</p>
                      </section>
                    ))}
                  </>
                ) : <p className="text-sm text-slate-600">The approved contract text is unavailable. Contact ALSM before taking action.</p>}
              </div>

              <footer className="border-t border-amber-200 bg-amber-50 p-5 sm:p-6">
                <div className="flex items-start gap-2 text-sm text-amber-950">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Contract documents and signing status</p>
                    {selected.demoNotice && <p className="mt-2 rounded-md border border-rose-300 bg-rose-100 p-3 text-sm font-semibold text-rose-900">{selected.demoNotice}</p>}
                    <p className="mt-1">{selected.signedPdfAvailable
                      ? selected.demoNotice ? 'The simulated PDF and demo evidence are available from the private archive.' : 'A provider-confirmed signed PDF is available from the verified evidence archive.'
                      : `${selected.canonicalPdfAvailable ? 'The unsigned canonical PDF is the immutable version prepared for the signing flow.' : 'The canonical PDF is not ready yet.'} ${selected.signingBlockedReason || 'Online signing has not been enabled for this contract.'}`}</p>
                    {selected.signingReadiness && !selected.signedPdfAvailable && (
                      <>
                        {!selected.demoNotice && selected.signingReadiness.checks.some((c) => c.code === 'SIGNER_IDENTITY_VERIFICATION' && c.status === 'BLOCKED') && (
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4 shrink-0 text-blue-600" />
                              <span>Bạn chưa xác minh số điện thoại người ký. Cần xác minh số điện thoại để đủ điều kiện ký trực tuyến.</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPhoneModalOpen(true)}
                              className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                            >
                              Xác minh ngay
                            </button>
                          </div>
                        )}
                        <ul className="mt-3 grid gap-1 text-xs sm:grid-cols-2" aria-label="Online signing readiness">
                          {selected.signingReadiness.checks.map((check) => (
                            <li key={check.code} className="flex items-center gap-2">
                              <span aria-hidden="true" className={check.status === 'READY' ? 'text-emerald-700' : check.status === 'PENDING' ? 'text-amber-700' : 'text-rose-700'}>
                                {check.status === 'READY' ? '✓' : check.status === 'PENDING' ? '○' : '×'}
                              </span>
                              <span>{({
                                INTERNAL_APPROVAL: 'Internal approval',
                                APPROVED_TEMPLATE_VERSION: 'Approved contract template version',
                                CANONICAL_PDF: 'Immutable unsigned PDF',
                                SIGNER_IDENTITY_VERIFICATION: selected.demoNotice ? 'Demo account confirmation' : 'Verified signer identity method',
                                SIGNING_PROVIDER: selected.demoNotice ? 'Local demo signing adapter' : 'Approved signing provider',
                                SIGNING_ORCHESTRATION: selected.demoNotice ? 'Demo signing session and completion record' : 'Signing session and provider callback workflow',
                                FINAL_EVIDENCE_ARCHIVE: selected.demoNotice ? 'Encrypted demo evidence archive' : 'Final signed evidence archive',
                              } as Record<string, string>)[check.code] || check.code.replace(/_/g, ' ')}</span>
                              <span className="text-amber-900">{check.status === 'READY' ? 'Ready' : check.status === 'PENDING' ? 'Pending' : 'Blocked'}</span>
                              {check.code === 'SIGNER_IDENTITY_VERIFICATION' && check.status === 'BLOCKED' && !selected.demoNotice && (
                                <button
                                  type="button"
                                  onClick={() => setPhoneModalOpen(true)}
                                  className="ml-1 font-semibold text-blue-600 underline hover:text-blue-800"
                                >
                                  (xác minh)
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    {!selected.signedPdfAvailable && (
                      <button type="button" onClick={() => void downloadCanonicalPdf()} disabled={!selected.canonicalPdfAvailable || downloadLoading} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-400 bg-white px-4 py-2 text-sm font-semibold text-amber-950 disabled:cursor-not-allowed disabled:opacity-50">
                        <Download className="h-4 w-4" /> {downloadLoading ? 'Preparing PDF…' : 'Download unsigned contract PDF'}
                      </button>
                    )}
                    {selected.signedPdfAvailable && (
                      <button type="button" onClick={() => void downloadSignedPdf()} disabled={downloadLoading} className="ml-2 mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-500 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50">
                        <Download className="h-4 w-4" /> {downloadLoading ? 'Preparing PDF…' : selected.demoNotice ? 'Download demo signed PDF' : 'Download signed PDF'}
                      </button>
                    )}
                    {!selected.signedPdfAvailable && (
                      <>
                        <p className="mt-3 text-xs">{selected.reviewPdfAvailable ? 'A separately watermarked review-only PDF is also available.' : 'A separate review-only copy is unavailable.'}</p>
                        <button type="button" onClick={() => void downloadReviewPdf()} disabled={!selected.reviewPdfAvailable || downloadLoading} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-400 bg-white px-4 py-2 text-sm font-semibold text-amber-950 disabled:cursor-not-allowed disabled:opacity-50">
                          <Download className="h-4 w-4" /> {downloadLoading ? 'Preparing PDF…' : 'Download review copy PDF'}
                        </button>
                        {selected.demoSigningAvailable && (
                          <button type="button" onClick={() => void startDemoSigning()} disabled={demoSigningLoading} className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                            {demoSigningLoading ? 'Starting demo…' : 'Start demo signing'}
                          </button>
                        )}
                        {selected.demoSigningStatus === 'SENT' && !selected.demoSigningExpired && (
                          <div className="mt-4 rounded-lg border border-amber-400 bg-white p-4">
                            <p className="font-semibold text-amber-950">Demo signing session is ready</p>
                            <p className="mt-1 text-xs text-amber-900">Review the contract, then confirm to record a simulated customer signature.</p>
                            <label className="mt-3 flex items-start gap-2 text-sm text-slate-800">
                              <input type="checkbox" checked={demoAcknowledged} onChange={(event) => setDemoAcknowledged(event.target.checked)} className="mt-1" />
                              <span>I understand this is a demo simulation. It does not verify my real-world identity or create a legally valid electronic signature.</span>
                            </label>
                            <button type="button" onClick={() => void completeDemoSigning()} disabled={!demoAcknowledged || demoSigningLoading} className="mt-3 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                              {demoSigningLoading ? 'Recording demo…' : 'Confirm demo signature'}
                            </button>
                          </div>
                        )}
                        {!selected.demoSigningAvailable && selected.demoSigningStatus !== 'SENT' && (
                          <button type="button" disabled className="mt-3 cursor-not-allowed rounded-lg bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-600" title={selected.signingBlockedReason || 'Signing is not enabled'}>
                            {selected.demoNotice ? 'Demo signing not ready' : 'Online signing unavailable'}
                          </button>
                        )}
                      </>
                    )}
                    {['READY_FOR_SIGNATURE', 'SENT_TO_CUSTOMER', 'CUSTOMER_VIEWED'].includes(selected.contract.lifecycleStatus) && selected.contract.reviewStatus === 'APPROVED' && (
                      <div className="mt-5 max-w-2xl border-t border-amber-200 pt-4">
                        <label htmlFor="customer-contract-response" className="block font-semibold">Request a change or decline this version</label>
                        <textarea id="customer-contract-response" value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} minLength={5} maxLength={1000} rows={3} className="mt-2 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900" placeholder="Explain what needs to change or why you are declining." aria-describedby="customer-contract-response-help" />
                        <p id="customer-contract-response-help" className="mt-1 text-xs text-amber-900">Your reason is shared with the Sales owner and recorded in the contract audit. A request for changes returns this version to Sales; a decline closes it. This is not an electronic signature.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => void respondToContract('REQUEST_CHANGES')} disabled={decisionLoading || decisionReason.trim().length < 5} className="rounded-lg border border-amber-700 bg-white px-4 py-2 text-sm font-semibold text-amber-950 disabled:cursor-not-allowed disabled:opacity-50">
                            {decisionLoading ? 'Saving…' : 'Request changes'}
                          </button>
                          <button type="button" onClick={() => void respondToContract('DECLINE')} disabled={decisionLoading || decisionReason.trim().length < 5} className="rounded-lg border border-rose-400 bg-white px-4 py-2 text-sm font-semibold text-rose-800 disabled:cursor-not-allowed disabled:opacity-50">
                            Decline contract
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </footer>
            </article>
          ) : <section className="rounded-xl border bg-white p-8 text-sm text-slate-600">Select a contract to review.</section>}
        </div>
      )}

      <PhoneVerificationModal
        isOpen={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        onSuccess={() => {
          if (selected) void openContract(selected.contract.id);
          else void loadContracts();
        }}
      />
    </main>
  );
};

export default CustomerContractsPage;
