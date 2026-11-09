import React from 'react';
import { FileSignature } from 'lucide-react';

export interface ContractDocumentProps {
  contract: any;
  showWatermark?: boolean;
  onCustomerSign?: () => void;
}

/** Converts integer VND amount to English prose words */
export function numberToEnglishWords(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) return 'Zero Dong';
  const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const g = ['', 'thousand', 'million', 'billion', 'trillion'];

  const numToWords = (num: number): string => {
    if (num === 0) return '';
    if (num < 20) return a[num];
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 !== 0 ? '-' + a[num % 10] : '');
    return a[Math.floor(num / 100)] + ' hundred' + (num % 100 !== 0 ? ' and ' + numToWords(num % 100) : '');
  };

  let num = Math.floor(Math.abs(amount));
  let i = 0;
  const words: string[] = [];
  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      words.unshift(numToWords(chunk) + (g[i] ? ' ' + g[i] : ''));
    }
    num = Math.floor(num / 1000);
    i++;
  }
  const result = words.join(', ');
  return (result.charAt(0).toUpperCase() + result.slice(1) + ' Dong').trim();
}

export const numberToVietnameseWords = numberToEnglishWords;

export const ContractDocument: React.FC<ContractDocumentProps> = ({ contract, onCustomerSign }) => {
  if (!contract) return null;

  const contractNumber = contract.contractNumber || 'ALSM-CTR-2026-DRAFT';
  const version = contract.version || 'v1.0';

  const isCustomerSigned =
    contract.signingStatus?.customer ||
    contract.signingProcess?.customerSigningStatus === 'SIGNED' ||
    ['Signed', 'Pending Payment', 'Payment Verification', 'Active', 'Completed'].includes(
      contract.contractStatus || contract.status,
    );

  const isAlsmSigned =
    contract.signingStatus?.alsm ||
    contract.signingProcess?.providerSigningStatus === 'SIGNED' ||
    Boolean(contract.signingProcess?.alsmSigner);

  const provider = contract.parties?.provider || {
    legalName: 'ALSM SOFTWARE MODERNIZATION TECHNOLOGY JOINT STOCK COMPANY',
    taxId: '0110892345',
    headquarters: 'Hoa Xuan, Cam Le, Da Nang City, Vietnam',
    signatoryName: 'Nguyen Gia Khanh',
    signatoryTitle: 'General Director',
    contactEmail: 'contracts@alsm.io',
    contactPhone: '0819734122',
    bankAccountInfo: '0899886249 at Military Commercial Joint Stock Bank (MB Bank)',
  };

  const customer = contract.customer || contract.parties?.customer || {
    companyName: contract.organizationName || 'PARTNER ENTERPRISE',
    taxId: 'Not updated',
    businessAddress: 'Corporate Headquarters',
    representativeName: 'Authorized Representative',
    representativeTitle: 'Legal Representative',
    contactEmail: 'contact@customer.com',
    contactPhone: 'Not updated',
  };

  const subtotal = contract.commercialTerms?.subtotal || Math.round((contract.totalValue || 0) / 1.1);
  const discountAmount = contract.commercialTerms?.discountAmount || 0;
  const discountPercent = contract.commercialTerms?.discountPercent || 0;
  const taxableAmount = subtotal - discountAmount;
  const vatRate = contract.commercialTerms?.vatRate !== undefined ? contract.commercialTerms.vatRate : 10;
  const vatAmount =
    contract.commercialTerms?.vatAmount !== undefined
      ? contract.commercialTerms.vatAmount
      : Math.round(taxableAmount * (vatRate / 100));
  const totalValue =
    contract.commercialTerms?.totalValue || taxableAmount + vatAmount || contract.totalValue || 0;
  const currency = contract.commercialTerms?.currency || contract.currency || 'VND';
  const wordsVnd =
    currency === 'VND'
      ? numberToEnglishWords(totalValue)
      : `${totalValue.toLocaleString('en-US')} ${currency}`;

  const screensQuota = contract.scope?.screensQuota ?? contract.screensQuota ?? 100;
  const programsQuota = contract.scope?.programsQuota ?? contract.programsQuota ?? 50;
  const storageGb = contract.scope?.storageGb ?? contract.storageGb ?? 20;

  const rawServiceMode = (contract.serviceMode || 'HYBRID').toUpperCase();
  let serviceModeVi = 'Full-Package System Architecture Modernization';
  if (rawServiceMode.includes('SELF')) {
    serviceModeVi = 'Platform-Based Automated Architecture Modernization';
  } else if (rawServiceMode.includes('CONVERT') || rawServiceMode.includes('MANAGED')) {
    serviceModeVi = 'Managed Modernization and Architecture Transformation Services';
  }

  const rawSla = contract.scope?.supportTier || contract.plan || 'Dedicated Enterprise SLA';
  let slaTierVi = 'Dedicated enterprise technical support with 99.9% availability commitment';
  if (rawSla.toLowerCase().includes('standard')) {
    slaTierVi = 'Standard enterprise technical support';
  }

  const sourceTechVi = contract.scope?.sourceCodeType || 'IBM 3270 BMS / AS400 DSPF screens and COBOL business programs';
  const targetTechVi = contract.scope?.targetTechnology || 'React 19, TypeScript UI and Spring Boot 3 Java 21 business services';

  const effectiveDate = contract.effectiveDate ? new Date(contract.effectiveDate) : new Date();
  const year = effectiveDate.getFullYear();
  const endDateStr = contract.endDate
    ? new Date(contract.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : `${effectiveDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, ${year + 1}`;

  const alsmSigner = contract.signingProcess?.alsmSigner;
  const customerSigner = contract.signingProcess?.customerSigner;
  const partyASignatureImage =
    alsmSigner?.signatureImageUrl ||
    provider?.signatureImageUrl ||
    provider?.signatureImage ||
    contract.signingProcess?.alsmSignatureImage;
  const partyACompanySeal =
    alsmSigner?.companySealUrl ||
    provider?.companySealUrl ||
    provider?.officialSealImage ||
    contract.signingProcess?.alsmOfficialSealImage;
  const partyAStampPosition = alsmSigner?.stampPosition || provider?.stampPosition || 'side_by_side';
  const partyACertProvider = alsmSigner?.certificateProvider || provider?.digitalCertificateProvider || 'VNPT-CA';
  const partyACertSerial = alsmSigner?.certificateReference || provider?.certificateSerialNumber || 'VNPT-ECA-ALSM-01';

  const partyBSignatureImage =
    customerSigner?.signatureImageUrl ||
    contract.customer?.signatureImage ||
    contract.signingProcess?.customerSignatureImage;

  return (
    <div className="w-full flex justify-center py-4 print:p-0">
      <div
        className="relative bg-white text-black w-full max-w-[850px] p-12 sm:p-16 shadow-2xl border border-neutral-300 font-serif text-[13pt] leading-relaxed select-text print:shadow-none print:border-none print:p-8 print:m-0"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        {/* 1. National Emblem & Motto */}
        <div className="text-center mb-6">
          <p className="font-bold text-[13pt] uppercase tracking-wide">
            SOCIALIST REPUBLIC OF VIETNAM
          </p>
          <p className="font-bold text-[12.5pt] mt-0.5">
            Independence - Freedom - Happiness
          </p>
          <div className="w-40 h-[1px] bg-black mx-auto mt-2 mb-4" />
        </div>

        {/* 2. Contract Title and Number */}
        <div className="text-center mb-6">
          <h1 className="font-bold text-[15.5pt] uppercase leading-snug">
            {contract.title && !contract.title.includes('Draft')
              ? contract.title
              : 'SERVICE CONTRACT: SOFTWARE SYSTEM MODERNIZATION'}
          </h1>
          <p className="text-[11pt] text-neutral-800 mt-1">
            No: <strong>{contractNumber}</strong> &nbsp;|&nbsp; Version: <strong>{version}</strong>
          </p>
          <p className="italic text-[11pt] text-neutral-700 mt-0.5">
            Today, on {effectiveDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}, at the office of {provider.legalName}, the Parties entering into this contract include:
          </p>
        </div>

        {/* 3. Legal Basis */}
        <div className="text-justify italic text-[11pt] text-neutral-800 mb-6 space-y-1">
          <p>- Pursuant to the Civil Code No. 91/2015/QH13 passed by the National Assembly of the Socialist Republic of Vietnam on November 24, 2015;</p>
          <p>- Pursuant to the Commercial Law No. 36/2005/QH11 passed by the National Assembly of the Socialist Republic of Vietnam on June 14, 2005;</p>
          <p>- Pursuant to the Law on Electronic Transactions No. 20/2023/QH15 passed by the National Assembly of the Socialist Republic of Vietnam on June 22, 2023;</p>
          <p>- Pursuant to the Law on Cyberinformation Security No. 86/2015/QH13 and Decree No. 13/2023/ND-CP on Personal Data Protection;</p>
          <p>- Based on Party B's demand for software system modernization and Party A's technological solution capacity.</p>
        </div>

        {/* 4. Party A Info */}
        <div className="mb-4">
          <p className="font-bold text-[12.5pt] uppercase mb-1">
            PARTY A: SERVICE PROVIDER
          </p>
          <div className="pl-5 text-[12pt] space-y-0.5 text-neutral-900">
            <p>Company Name: <strong>{provider.legalName}</strong></p>
            <p>Business Code / Tax ID: <strong>{provider.taxId}</strong></p>
            <p>Headquarters Address: {provider.headquarters}</p>
            <p>Legal Representative: <strong>{provider.signatoryName}</strong></p>
            <p>Title: {provider.signatoryTitle}</p>
            <p>Phone: {provider.contactPhone || '0819734122'}</p>
            <p>Email: {provider.contactEmail}</p>
            <p>Bank Account: <strong>{provider.bankAccountInfo || '0899886249 at Military Commercial Joint Stock Bank (MB Bank)'}</strong></p>
          </div>
        </div>

        {/* 5. Party B Info */}
        <div className="mb-6">
          <p className="font-bold text-[12.5pt] uppercase mb-1">
            PARTY B: CUSTOMER
          </p>
          <div className="pl-5 text-[12pt] space-y-0.5 text-neutral-900">
            <p>Company Name: <strong>{customer.companyName || contract.organizationName}</strong></p>
            <p>Business Code / Tax ID: <strong>{customer.taxId || 'Not updated'}</strong></p>
            <p>Headquarters Address: {customer.businessAddress || 'Corporate Headquarters'}</p>
            <p>Legal Representative: <strong>{customer.representativeName || 'Authorized Legal Representative'}</strong></p>
            <p>Title: {customer.representativeTitle || 'Authorized Signatory'}</p>
            <p>Phone: {customer.contactPhone || 'Not updated'}</p>
            <p>Email: {customer.contactEmail || 'contact@customer.com'}</p>
          </div>
        </div>

        <p className="text-justify text-[12pt] mb-6">
          Both Parties mutually agree to enter into this Service Contract with the following specific terms:
        </p>

        {/* ARTICLE 1 */}
        <div className="space-y-1.5 text-justify mb-5">
          <h2 className="font-bold text-[12.5pt] uppercase">
            ARTICLE 1. SCOPE OF SERVICES AND TECHNICAL SPECIFICATIONS
          </h2>
          <p>
            1.1. Party A agrees to provide and Party B agrees to receive software modernization services via {serviceModeVi}, utilizing Party A's AST parsing and system restructuring technology.
          </p>
          <p>
            1.2. The service scope and resource allocations are established as follows:
          </p>
          <div className="pl-6 space-y-1">
            <p>a) Licensed screen conversion quota: <strong>{screensQuota.toLocaleString('en-US')}</strong> screens.</p>
            <p>b) Licensed business program processing quota: <strong>{programsQuota.toLocaleString('en-US')}</strong> programs.</p>
            <p>c) Dedicated cloud storage quota: <strong>{storageGb} GB</strong>.</p>
            <p>d) Service tier and technical support commitment: {slaTierVi}.</p>
            <p>e) Source technology received: {sourceTechVi}.</p>
            <p>f) Target technology delivered: {targetTechVi}.</p>
          </div>
          <p>
            1.3. The above specifications constitute the sole legal and technical basis for determining Party A's service obligations. Any additional volume outside this scope shall be mutually agreed upon in an addendum.
          </p>
        </div>

        {/* ARTICLE 2 */}
        <div className="space-y-1.5 text-justify mb-5">
          <h2 className="font-bold text-[12.5pt] uppercase">
            ARTICLE 2. TECHNICAL STANDARDS AND DELIVERABLES
          </h2>
          <p>
            2.1. Deliverables of the modernization service include all user interface source code, backend business service source code, technical architecture documentation, and logic reconciliation reports.
          </p>
          <p>
            2.2. Technical standards for deliverables include:
          </p>
          <div className="pl-6 space-y-1">
            <p>a) UI source code: Restructured into independent components (React 19, TypeScript), preserving 100% of display properties, data fields, and input validation constraints from source screens.</p>
            <p>b) Backend business processing code: Converted to standard service architecture (Spring Boot 3 Java 21), preserving business semantics, arithmetic computations, and inherited business rules.</p>
            <p>c) AST audit dossier: Grammar and syntax reconciliation reports for each module, confirming logical equivalence between source and target systems.</p>
            <p>d) Technical documentation and operating manual: Architecture diagrams, API specifications, and complete deployment packaging instructions.</p>
          </div>
          <p>
            2.3. Both Parties conduct handover and acceptance of deliverables online through Party A's portal system or in phases mutually agreed upon.
          </p>
        </div>

        {/* ARTICLE 3 */}
        <div className="space-y-1.5 text-justify mb-5">
          <h2 className="font-bold text-[12.5pt] uppercase">
            ARTICLE 3. CONTRACT VALUE AND PAYMENT TERMS
          </h2>
          <p>
            3.1. Pre-tax service value: <strong>{subtotal.toLocaleString('en-US')} {currency}</strong>.
          </p>
          {discountAmount > 0 && (
            <>
              <p>
                3.2. Commercial discount ({discountPercent > 0 ? discountPercent + '%' : 'promotion'}): <strong>-{discountAmount.toLocaleString('en-US')} {currency}</strong>.
              </p>
              <p>
                3.3. Taxable value for Value Added Tax (VAT): <strong>{taxableAmount.toLocaleString('en-US')} {currency}</strong>.
              </p>
            </>
          )}
          <p>
            {discountAmount > 0 ? '3.4' : '3.2'}. Value Added Tax (VAT {vatRate}%): <strong>{vatAmount.toLocaleString('en-US')} {currency}</strong>.
          </p>
          <p>
            {discountAmount > 0 ? '3.5' : '3.3'}. Total payment amount including tax: <strong>{totalValue.toLocaleString('en-US')} {currency}</strong> (In words: <em>{wordsVnd}</em>).
          </p>
          <p>
            {discountAmount > 0 ? '3.6' : '3.4'}. Payment currency: Vietnamese Dong (VND).
          </p>
          <p>
            {discountAmount > 0 ? '3.7' : '3.5'}. Payment method: Party B shall pay Party A by bank transfer via QR code or direct wire transfer to Party A's bank account No. {provider.bankAccountInfo || '0899886249 at Military Commercial Joint Stock Bank (MB Bank)'}.
          </p>
          <p>
            {discountAmount > 0 ? '3.8' : '3.6'}. Payment term: Within seventy-two (72) business hours from full execution of this Contract by both Parties, Party B shall pay 100% of the contract value for Party A to activate service access and provision quotas. Party A is responsible for issuing a lawful electronic invoice to Party B upon receiving full payment.
          </p>
        </div>

        {/* ARTICLE 4 */}
        <div className="space-y-1.5 text-justify mb-5">
          <h2 className="font-bold text-[12.5pt] uppercase">
            ARTICLE 4. TERM AND IMPLEMENTATION TIMELINE
          </h2>
          <p>
            4.1. This Contract takes effect from the date authorized representatives of both Parties complete electronic signing and remains effective for a period of twelve (12) months, terminating on {endDateStr}.
          </p>
          <p>
            4.2. The duration of account access and project data storage on the ALSM platform aligns synchronously with the contract term.
          </p>
          <p>
            4.3. At least thirty (30) days prior to expiration, if Party B wishes to extend usage or expand quotas, both Parties shall negotiate and execute an Addendum under current commercial terms.
          </p>
        </div>

        {/* ARTICLE 5 */}
        <div className="space-y-1.5 text-justify mb-5">
          <h2 className="font-bold text-[12.5pt] uppercase">
            ARTICLE 5. SERVICE LEVEL AGREEMENT (SLA) AND TECHNICAL SUPPORT
          </h2>
          <p>
            5.1. Party A commits to maintaining at least 99.9% platform availability throughout the term, excluding scheduled maintenance announced at least 48 hours in advance.
          </p>
          <p>
            5.2. Party A provides online technical support to handle and resolve technical queries from Party B related to parsing, screen mapping, and code compilation.
          </p>
          <p>
            5.3. Maximum response time is within 02 business hours for critical incidents disrupting the modernization process, and within 08 business hours for standard requests.
          </p>
        </div>

        {/* ARTICLE 6 */}
        <div className="space-y-1.5 text-justify mb-5">
          <h2 className="font-bold text-[12.5pt] uppercase">
            ARTICLE 6. RIGHTS AND OBLIGATIONS OF PARTY A
          </h2>
          <p>
            6.1. Provide services matching the agreed technology parameters and quality commitments specified in Articles 1 and 2.
          </p>
          <p>
            6.2. Ensure technical stability, information safety, and cyber security for Party B's data on ALSM cloud infrastructure.
          </p>
          <p>
            6.3. Promptly guide Party B's engineers in operating the platform and resolving compilation/mapping errors.
          </p>
          <p>
            6.4. Entitled to receive full payment on time as stipulated in Article 3.
          </p>
          <p>
            6.5. Entitled to suspend service access if Party B delays payment beyond the deadline or violates information safety and intellectual property terms.
          </p>
        </div>

        {/* ARTICLE 7 */}
        <div className="space-y-1.5 text-justify mb-5">
          <h2 className="font-bold text-[12.5pt] uppercase">
            ARTICLE 7. RIGHTS AND OBLIGATIONS OF PARTY B
          </h2>
          <p>
            7.1. Entitled to full use of the conversion quota and platform features corresponding to the subscribed tier.
          </p>
          <p>
            7.2. Provide complete, timely, and accurate source code, data definitions (copybooks), and business rules necessary for service execution.
          </p>
          <p>
            7.3. Warrant that input source code is owned or lawfully licensed by Party B without infringing third-party intellectual property.
          </p>
          <p>
            7.4. Make full and timely payments to Party A according to Article 3.
          </p>
          <p>
            7.5. Shall not copy, reverse engineer, decompile, interfere with, or transfer ALSM platform rights to third parties without prior written consent from Party A.
          </p>
        </div>

        {/* ARTICLE 8 */}
        <div className="space-y-1.5 text-justify mb-5">
          <h2 className="font-bold text-[12.5pt] uppercase">
            ARTICLE 8. INFORMATION CONFIDENTIALITY AND DATA PROTECTION
          </h2>
          <p>
            8.1. Both Parties commit to strictly maintaining confidentiality of all technical information, source code, algorithms, financial records, and trade secrets received during contract negotiation and performance.
          </p>
          <p>
            8.2. Party A commits to the highest data protection standards (TLS 1.3 in-transit, AES-256 at-rest) and will not retain, replicate, or commercialize any of Party B's sensitive data outside service delivery scope.
          </p>
          <p>
            8.3. Both Parties strictly comply with regulations on personal data protection under Decree No. 13/2023/ND-CP.
          </p>
          <p>
            8.4. Confidentiality obligations remain valid throughout the term and indefinitely following contract termination or liquidation.
          </p>
        </div>

        {/* ARTICLE 9 */}
        <div className="space-y-1.5 text-justify mb-5">
          <h2 className="font-bold text-[12.5pt] uppercase">
            ARTICLE 9. INTELLECTUAL PROPERTY RIGHTS
          </h2>
          <p>
            9.1. Party B owns all intellectual property rights in legacy input source code and all modernized code generated from Party B's system upon full payment.
          </p>
          <p>
            9.2. Party A exclusively owns all copyrights, patents, and trade secrets in the ALSM Studio platform, AST parsers, code generation engines, and auxiliary tools.
          </p>
        </div>

        {/* ARTICLE 10 */}
        <div className="space-y-1.5 text-justify mb-8">
          <h2 className="font-bold text-[12.5pt] uppercase">
            ARTICLE 10. TERMINATION AND GENERAL PROVISIONS
          </h2>
          <p>
            10.1. This Contract terminates upon: (a) Both Parties completing all obligations and mutually agreeing on liquidation; (b) Expiration of the term under Article 4 without extension; (c) Material breach of obligations not remedied within thirty (30) days from written notice by the non-breaching Party.
          </p>
          <p>
            10.2. This Contract is interpreted, governed, and construed under the laws of the Socialist Republic of Vietnam. Any disputes shall first be resolved through good-faith negotiation; failing agreement, disputes shall be submitted to the competent People's Court in Vietnam.
          </p>
          <p>
            10.3. This Contract is established in the form of electronic data messages with full legal validity pursuant to the Law on Electronic Transactions No. 20/2023/QH15. Digital signatures and electronic seals created by both Parties carry the same evidentiary weight and legal binding effect as traditional wet signatures and physical seals.
          </p>
        </div>

        <p className="text-justify italic text-[11pt] text-neutral-800 mb-8">
          This Contract is executed in two (02) electronic counterparts of equal legal validity, with each Party retaining one (01) counterpart. The Parties confirm having read, understood, and agreed to all terms and conditions, and proceed to sign below.
        </p>

        {/* TRADITIONAL 2-COLUMN SIGNATURE SECTION */}
        <div className="pt-2">
          <div className="grid grid-cols-2 gap-8 text-center text-[12pt]">
            {/* PARTY A COLUMN */}
            <div className="flex flex-col justify-between min-h-[220px]">
              <div>
                <p className="font-bold uppercase text-[12pt]">REPRESENTATIVE OF PARTY A</p>
                <p className="font-bold text-[11pt] text-neutral-800">SERVICE PROVIDER</p>
                <p className="text-[10.5pt] text-neutral-600 mt-0.5">
                  Title: {alsmSigner?.title || provider.signatoryTitle || 'General Director'}
                </p>
              </div>

              <div className="my-2 min-h-[90px] flex flex-col justify-center items-center">
                {isAlsmSigned || partyASignatureImage || partyACompanySeal ? (
                  <div className="w-full flex flex-col items-center text-center">
                    {/* Seal and Signature Area */}
                    <div className="h-24 relative flex items-center justify-center my-1 w-full">
                      {partyAStampPosition === 'overlap' ? (
                        <>
                          {partyACompanySeal && (
                            <div className="absolute left-1/2 -translate-x-[65%] top-1/2 -translate-y-1/2 w-20 h-20 opacity-85 pointer-events-none">
                              <img
                                src={partyACompanySeal}
                                alt="ALSM Seal"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          {partyASignatureImage ? (
                            <div className="relative z-10 max-h-20 max-w-[180px] flex items-center justify-center">
                              <img
                                src={partyASignatureImage}
                                alt="ALSM Signature"
                                className="max-h-16 max-w-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="font-bold text-emerald-700 uppercase text-[10pt]">[DIGITALLY SIGNED BY PARTY A]</div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center gap-3 w-full">
                          {partyACompanySeal && (
                            <div className="w-16 h-16 shrink-0">
                              <img
                                src={partyACompanySeal}
                                alt="ALSM Seal"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          {partyASignatureImage ? (
                            <div className="max-h-16 max-w-[140px] flex items-center justify-center">
                              <img
                                src={partyASignatureImage}
                                alt="ALSM Signature"
                                className="max-h-14 max-w-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="font-bold text-emerald-700 uppercase text-[9.5pt]">[DIGITALLY SIGNED BY PARTY A]</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-1 pt-1 border-t border-dashed border-emerald-300 text-[8pt] font-mono text-emerald-700 bg-emerald-50/70 px-2.5 py-1 rounded flex flex-col items-center leading-tight">
                      <span>✓ Digital Signature Verified: {partyACertProvider}</span>
                      <span className="text-neutral-500 text-[7.5pt]">Certificate Serial: {partyACertSerial}</span>
                      <span className="text-neutral-500 text-[7.5pt]">
                        Timestamp: {alsmSigner?.signedAt ? new Date(alsmSigner.signedAt).toLocaleString('en-US') : new Date().toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="italic text-neutral-500 text-[10.5pt]">
                    (Sign, write full name and seal)
                  </p>
                )}
              </div>

              <div>
                <p className="font-bold text-[12pt]">{alsmSigner?.name || provider.signatoryName || 'Nguyen Gia Khanh'}</p>
              </div>
            </div>

            {/* PARTY B COLUMN */}
            <div className="flex flex-col justify-between min-h-[220px]">
              <div>
                <p className="font-bold uppercase text-[12pt]">REPRESENTATIVE OF PARTY B</p>
                <p className="font-bold text-[11pt] text-neutral-800">CUSTOMER</p>
                <p className="text-[10.5pt] text-neutral-600 mt-0.5">
                  Title: {customer.representativeTitle || 'Authorized Representative'}
                </p>
              </div>

              <div className="my-2 min-h-[90px] flex flex-col justify-center items-center">
                {isCustomerSigned ? (
                  <div className="w-full flex flex-col items-center text-center">
                    {partyBSignatureImage ? (
                      <div className="h-20 flex items-center justify-center my-1">
                        <img
                          src={partyBSignatureImage}
                          alt="Customer Signature"
                          className="max-h-16 max-w-[180px] object-contain"
                        />
                      </div>
                    ) : null}
                    <div className="mt-1 pt-1.5 border-t border-dashed border-emerald-300 text-[8.5pt] font-mono text-emerald-700 bg-emerald-50/70 px-2.5 py-1 rounded flex flex-col items-center leading-tight">
                      <span className="font-bold uppercase">[DIGITALLY SIGNED BY PARTY B]</span>
                      <span className="text-neutral-500 text-[7.5pt]">
                        Certificate: {customerSigner?.certificateReference || 'VNPT-ECA-CLIENT-VERIFIED'}
                      </span>
                      <span className="text-neutral-500 text-[7.5pt]">
                        Timestamp: {customerSigner?.signedAt ? new Date(customerSigner.signedAt).toLocaleString('en-US') : new Date().toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={onCustomerSign}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onCustomerSign?.();
                    }}
                    className="w-full py-3.5 px-3 bg-blue-50/90 hover:bg-blue-100 border-2 border-dashed border-blue-500 rounded-xl text-center cursor-pointer transition shadow-xs group"
                    title="Click to open Party B electronic signature panel"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                      <FileSignature className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-blue-900 text-[10.5pt] uppercase tracking-wide">
                      PARTY B DIGITAL SIGNATURE AREA
                    </div>
                    <div className="text-[8.5pt] text-blue-700 mt-0.5">
                      (Click here to sign & verify)
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="font-bold text-[12pt]">{customerSigner?.name || customer.representativeName || 'Customer Representative'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Running Footer Note */}
        <div className="text-center text-[9pt] text-neutral-400 border-t border-neutral-200 pt-3 mt-12 print:hidden">
          B2B E-Commerce Service Contract • Internal circulation among signing Parties
        </div>
      </div>
    </div>
  );
};

export default ContractDocument;
