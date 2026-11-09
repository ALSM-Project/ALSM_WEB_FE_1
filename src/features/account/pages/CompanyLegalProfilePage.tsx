import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Loader2,
  Save,
  FileCheck,
  Building,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import {
  companyLegalProfileService,
  type TaxLookupResult,
} from '../services/companyLegalProfile.service';

const VIETNAM_TAX_REGEX = /^[0-9]{10}(-[0-9]{3})?$/;

export const CompanyLegalProfilePage: React.FC = () => {
  const { user } = useAuth();
  const orgId = user?.organizationId || 'current';

  // Form states
  const [taxId, setTaxId] = useState('');
  const [legalCompanyName, setLegalCompanyName] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('');
  const [legalRepresentative, setLegalRepresentative] = useState('');
  const [representativeTitle, setRepresentativeTitle] = useState('Authorized Signatory / Director');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState('');
  const [companyStatus, setCompanyStatus] = useState('ACTIVE');
  const [dataSource, setDataSource] = useState('MANUAL_ENTRY');
  const [verificationStatus, setVerificationStatus] = useState<'UNVERIFIED' | 'TAX_VERIFIED' | 'REPRESENTATIVE_VERIFIED' | 'REJECTED'>('UNVERIFIED');

  // Lookup & UI states
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<TaxLookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [taxFormatError, setTaxFormatError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    // 2. Fetch existing legal profile (falls back to 'current' which resolves authenticated user's organization)
    const targetOrgId = user?.organizationId || 'current';
    companyLegalProfileService.getLegalProfile(targetOrgId)
      .then((res) => {
        if (res?.legalProfile) {
          const p = res.legalProfile;
          if (p.taxId) setTaxId(p.taxId);
          if (p.legalCompanyName) setLegalCompanyName(p.legalCompanyName);
          if (p.registeredAddress) setRegisteredAddress(p.registeredAddress);
          if (p.businessRegistrationNumber) setBusinessRegistrationNumber(p.businessRegistrationNumber);
          if (p.legalRepresentative) setLegalRepresentative(p.legalRepresentative);
          if (p.representativeTitle) setRepresentativeTitle(p.representativeTitle);
          if (p.contactEmail) setContactEmail(p.contactEmail);
          if (p.contactPhone) setContactPhone(p.contactPhone);
          if (p.companyStatus) setCompanyStatus(p.companyStatus);
          if (p.dataSource) setDataSource(p.dataSource);
          if (p.verificationStatus) setVerificationStatus(p.verificationStatus);
        }
      })
      .catch((err) => console.warn('No saved legal profile found or failed to load:', err));
  }, [user?.organizationId]);

  const handleTaxIdChange = (val: string) => {
    const clean = val.replace(/\s+/g, '');
    setTaxId(clean);
    setLookupError(null);
    setLookupResult(null);

    if (clean.length > 0 && !clean.includes('-') && clean.length !== 10 && clean.length !== 13) {
      setTaxFormatError('Tax ID must consist of 10 digits (or 10 digits followed by 3-digit branch code, e.g. 0109876543).');
    } else if (clean.length > 0 && !VIETNAM_TAX_REGEX.test(clean)) {
      setTaxFormatError('Invalid format. Accepted: 10 digits or XXXXXXXXXX-XXX.');
    } else {
      setTaxFormatError(null);
    }
  };

  const handleLookup = async () => {
    const clean = taxId.trim().replace(/\s+/g, '');
    if (!clean) {
      setTaxFormatError('Please enter a valid Tax Identification Number.');
      return;
    }
    if (!VIETNAM_TAX_REGEX.test(clean)) {
      setTaxFormatError('Invalid format. Standard Vietnam enterprise Tax ID is 10 or 13 digits.');
      return;
    }

    setLookupError(null);
    setLookupResult(null);
    setIsLookingUp(true);

    try {
      const res = await companyLegalProfileService.lookupTaxId(clean);
      setLookupResult(res);

      // Auto-populate retrieved fields
      if (res.legalCompanyName) setLegalCompanyName(res.legalCompanyName);
      if (res.registeredAddress) setRegisteredAddress(res.registeredAddress);
      if (res.businessRegistrationNumber) setBusinessRegistrationNumber(res.businessRegistrationNumber);
      if (res.companyStatus) setCompanyStatus(res.companyStatus);
      setDataSource(res.dataSource || 'VERIFIED_BUSINESS_REGISTRY_API');
      setVerificationStatus('TAX_VERIFIED');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to query enterprise registry. Please complete company details manually.';
      setLookupError(msg);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!taxId.trim() || !legalCompanyName.trim() || !registeredAddress.trim()) {
      setGeneralError('Tax ID, Legal Company Name, and Registered Address are mandatory.');
      return;
    }

    if (!legalRepresentative.trim() || !representativeTitle.trim() || !contactEmail.trim()) {
      setGeneralError('Legal representative name, position title, and notice email are required.');
      return;
    }

    // Check username handle
    const rep = legalRepresentative.trim().toLowerCase();
    if (/^[a-z0-9_-]{3,24}$/.test(rep) && !rep.includes(' ')) {
      setGeneralError('Representative name cannot be an account handle or system username.');
      return;
    }

    const targetOrgId = user?.organizationId || 'current';

    try {
      setIsSaving(true);
      await companyLegalProfileService.updateLegalProfile(targetOrgId, {
        taxId: taxId.trim(),
        legalCompanyName: legalCompanyName.trim(),
        registeredAddress: registeredAddress.trim(),
        businessRegistrationNumber: businessRegistrationNumber.trim() || taxId.trim(),
        legalRepresentative: legalRepresentative.trim(),
        representativeTitle: representativeTitle.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim(),
        companyStatus: companyStatus.trim() || 'ACTIVE',
        dataSource,
        verificationStatus,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setGeneralError(err?.response?.data?.message || err?.message || 'Failed to update company legal profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div>
        
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Company Legal Profile & Registry Verification
        </h2>

      </div>
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Company legal profile successfully updated and linked to Organization ID: {orgId}.</span>
        </div>
      )}

      {generalError && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Legal Identification with Tax ID Lookup */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-6 shadow-xs">
          <form id="company-profile-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Tax ID & Verification */}
            <div className="space-y-3 pb-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>1. Enterprise Tax ID & Instant Lookup</span>
                </h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  verificationStatus === 'TAX_VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {verificationStatus === 'TAX_VERIFIED' ? 'Registry Verified' : 'Unverified Draft'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Tax Identification Number (TIN) *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => handleTaxIdChange(e.target.value)}
                      placeholder="Enterprise 10-digit Tax ID (e.g. 0109876543)"
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLookup}
                    disabled={isLookingUp || !taxId.trim()}
                    className="h-11 px-4 text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-50 shrink-0 flex items-center gap-1.5"
                  >
                    {isLookingUp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5 text-blue-600" />
                        <span>Lookup Registry</span>
                      </>
                    )}
                  </Button>
                </div>
                {taxFormatError && (
                  <p className="text-xs text-red-600 mt-1">{taxFormatError}</p>
                )}
              </div>

              {/* Lookup Feedback States */}
              {lookupResult && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Business Registry Match Found & Auto-Populated</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Source: {lookupResult.dataSource} • Timestamp: {new Date(lookupResult.lookupTimestamp).toLocaleString()}
                  </p>
                </div>
              )}

              {lookupError && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-red-800">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Lookup Unsuccessful / No Record Found</span>
                  </div>
                  <p className="text-[11px] text-red-700">{lookupError}</p>
                  <p className="text-[11px] text-slate-600 italic">
                    You may proceed by filling in company name and registered address manually below.
                  </p>
                </div>
              )}
            </div>

            {/* Step 2: Legal Entity Details */}
            <div className="space-y-4 pb-5 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-600" />
                <span>2. Registered Corporate Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Legal Company Name (as per Business License) *"
                    value={legalCompanyName}
                    onChange={(e) => setLegalCompanyName(e.target.value)}
                    placeholder="e.g. ABC TECHNOLOGY CORPORATION"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Registered Headquarters Address *"
                    value={registeredAddress}
                    onChange={(e) => setRegisteredAddress(e.target.value)}
                    placeholder="Full registered address matching business license"
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Business Registration Number"
                    value={businessRegistrationNumber}
                    onChange={(e) => setBusinessRegistrationNumber(e.target.value)}
                    placeholder="e.g. 0109876543"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Enterprise Operating Status
                  </label>
                  <select
                    value={companyStatus}
                    onChange={(e) => setCompanyStatus(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  >
                    <option value="ACTIVE">ACTIVE / Operating</option>
                    <option value="PENDING_VERIFICATION">PENDING_VERIFICATION / Pending Verification</option>
                    <option value="RESTRUCTURING">RESTRUCTURING / Restructuring</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Legal Representative & Notices */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>3. Authorized Legal Representative & Contract Notices</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Representative Full Name (Legal Representative) *"
                    value={legalRepresentative}
                    onChange={(e) => setLegalRepresentative(e.target.value)}
                    placeholder="Full personal legal name"
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Representative Title / Position *"
                    value={representativeTitle}
                    onChange={(e) => setRepresentativeTitle(e.target.value)}
                    placeholder="e.g. General Director"
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Contractual Notice Email *"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="representative@company.com"
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Representative Contact Phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+84 90 123 4567"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button
                type="submit"
                variant="primary"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-xs font-bold flex items-center gap-2 shadow-xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Company Legal Profile</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Statutory Legal Guidance & Disclaimer */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Legal Authority Notice & Disclaimer</span>
            </h4>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                <strong>Registry vs. Identity Verification:</strong> A successful Tax ID lookup confirms enterprise registration against national business records only. It does <em>not</em> authenticate the personal identity or legal signing authority of the individual submitting this form.
              </p>
              <p>
                <strong>E-Signing Assurance:</strong> Before contract execution, the designated legal representative must provide biometric or digital certificate verification (VNPT-CA/Viettel-CA).
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Profile Summary
            </h4>
            <div className="space-y-1.5 border-t border-slate-200 pt-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Data Source:</span>
                <span className="font-mono font-semibold">{dataSource}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold text-emerald-700">{verificationStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Organization:</span>
                <span className="font-semibold text-slate-800">{user?.organizationName || 'Current Workspace'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
