import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Building2,
  Mail,
  User,
  Phone,
  MessageSquare,
  ShieldCheck,
  Zap,
  Layers,
  Headphones,
  ArrowRight,
  AlertCircle,
  Clock,
  RefreshCw,
  PhoneCall,
} from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';
import { useAuth } from '@/app/providers';
import { billingService } from '@/features/billing/services/billing.service';
import type { QuoteRequestResponse, QuoteRequestStatus } from '@/features/billing/types/billing';

export const RequestEnterprisePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    companyName: user?.companyName || user?.company || '',
    email: user?.email || '',
    phone: '',
    message: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [quoteResult, setQuoteResult] = useState<QuoteRequestResponse | null>(null);

  // ─── Existing request detection ──────────────────────────
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [existingRequest, setExistingRequest] = useState<QuoteRequestResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = await billingService.getMyQuoteRequest();
        if (!cancelled) setExistingRequest(existing);
      } catch {
        // Silently ignore — show form as fallback
      } finally {
        if (!cancelled) setCheckingExisting(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.companyName.trim()) {
      errors.companyName = 'Company / Organization name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.phone && formData.phone.trim()) {
      const trimmedPhone = formData.phone.trim();
      const phoneDigits = trimmedPhone.replace(/[^0-9]/g, '');
      if (phoneDigits.length < 8 || phoneDigits.length > 15) {
        errors.phone = 'Phone number must contain between 8 and 15 digits';
      } else if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,20}$/.test(trimmedPhone)) {
        errors.phone = 'Please enter a valid phone number (e.g. +84 90 123 4567)';
      }
    }

    if (formData.message && formData.message.length > 1000) {
      errors.message = 'Message must not exceed 1000 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (generalError) setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setGeneralError(null);

    try {
      const response = await billingService.requestEnterpriseQuote({
        fullName: formData.fullName.trim(),
        companyName: formData.companyName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        message: formData.message.trim() || undefined,
      });
      setQuoteResult(response);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { code?: string; message?: string | string[] } }; message?: string };
      const resData = errorObj?.response?.data;
      if (resData?.code === 'QUOTE_REQUEST_EXISTS') {
        setGeneralError('You already have a pending Enterprise quote request. Our sales team is processing it.');
      } else if (Array.isArray(resData?.message)) {
        setGeneralError(resData.message.join(', '));
      } else if (typeof resData?.message === 'string') {
        setGeneralError(resData.message);
      } else if (errorObj?.message) {
        setGeneralError(errorObj.message);
      } else {
        setGeneralError('Failed to submit quote request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const enterpriseFeatures = [
    {
      icon: <Layers className="w-5 h-5 text-indigo-600" />,
      title: 'Unlimited Scale & Modernization',
      desc: 'Full batch conversion for legacy BMS, DSPF, and COBOL screens with no monthly quotas.',
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-600" />,
      title: 'Custom AI Models & Adapters',
      desc: 'Fine-tuned model training for legacy business rules and customized target frameworks.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      title: 'Enterprise Security & Compliance',
      desc: 'Dedicated on-premise or private cloud deployment, SSO/SAML integration, and 99.9% SLA.',
    },
    {
      icon: <Headphones className="w-5 h-5 text-blue-600" />,
      title: 'Dedicated Solutions Engineer',
      desc: 'Assigned Customer Success Manager and 24/7 priority architecture support.',
    },
  ];

  // ─── Loading state ───────────────────────────────────────
  if (checkingExisting) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-xl w-1/3 mx-auto mb-4" />
        <div className="h-4 bg-slate-100 rounded-xl w-1/2 mx-auto mb-10" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 h-80 bg-slate-200 rounded-2xl" />
          <div className="lg:col-span-7 h-80 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ─── Existing request: PENDING ───────────────────────────
  if (existingRequest && existingRequest.status === 'PENDING') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
        <div className="bg-white border border-amber-200 rounded-2xl p-8 sm:p-10 shadow-xs space-y-5">
          <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center text-amber-600 mb-2">
            <RefreshCw className="w-7 h-7" />
          </div>
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-2">
              Under Review
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Your request is being processed</h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Your enterprise quote request has been received. Our engineering leadership will reach out to{' '}
              <strong>{existingRequest.email}</strong> within <strong>24 business hours</strong>.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Request ID:</span>
              <span className="font-mono font-semibold text-slate-900">{existingRequest.id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Company:</span>
              <span className="font-semibold text-slate-900">{existingRequest.companyName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Status:</span>
              <span className="font-semibold text-amber-700">PENDING REVIEW</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">Submitted At:</span>
              <span className="text-slate-900">{new Date(existingRequest.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="w-full sm:w-auto px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm"
            >
              Return to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.PROJECTS.LIST)}
              className="w-full sm:w-auto px-6 py-2.5 border border-slate-300 hover:bg-slate-50 font-semibold rounded-xl text-sm"
            >
              Go to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Existing request: CONTACTED ─────────────────────────
  if (existingRequest && existingRequest.status === 'CONTACTED') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
        <div className="bg-white border border-blue-200 rounded-2xl p-8 sm:p-10 shadow-xs space-y-5">
          <div className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center text-blue-600 mb-2">
            <PhoneCall className="w-7 h-7" />
          </div>
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-2">
              Sales Team Contacted You
            </span>
            <h1 className="text-2xl font-bold text-slate-900">We've reached out to you</h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Our dedicated modernization architect has contacted <strong>{existingRequest.email}</strong>. Please check
              your inbox for next steps and custom scoping details.
            </p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 leading-relaxed">
            <strong>Request ID:</strong> {existingRequest.id} &nbsp;|&nbsp;{' '}
            <strong>Company:</strong> {existingRequest.companyName}
          </div>
          <Button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span>Full Migration & Modernization</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Upgrade to Enterprise Full Migration
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Accelerate your mission-critical system modernization with high-capacity processing, custom AI adapters, and dedicated technical architects.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Plan Benefits & Features */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Custom Deployment</span>
            <h2 className="text-2xl font-bold mt-1 mb-3">Enterprise Plan</h2>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Designed for enterprise IT teams and systems integrators modernizing mission-critical legacy applications.
            </p>

            <div className="space-y-4 pt-2 border-t border-slate-700/60">
              {enterpriseFeatures.map((f, i) => (
                <div key={i} className="flex gap-3.5 items-start">
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-3 text-xs text-slate-600">
            <Clock className="w-4 h-4 text-brand-600 shrink-0" />
            <span>Quotes are reviewed by our engineering leadership within <strong>24 business hours</strong>.</span>
          </div>
        </div>

        {/* Right Column: Quote Form or Confirmation */}
        <div className="lg:col-span-7">
          {quoteResult ? (
            <div className="bg-white border border-emerald-200 rounded-2xl p-8 sm:p-10 shadow-xs space-y-6">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600 mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
                  Quote Request Received
                </span>
                <h2 className="text-2xl font-bold text-slate-900">Thank you, {quoteResult.fullName}!</h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Your request for full enterprise migration quote has been registered in our system. A dedicated modernization architect will reach out to <strong>{quoteResult.email}</strong> to discuss custom scopes and volume estimates.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2 text-xs text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Request ID:</span>
                  <span className="font-mono font-semibold text-slate-900">{quoteResult.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Company:</span>
                  <span className="font-semibold text-slate-900">{quoteResult.companyName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <span className="font-semibold text-emerald-700">PENDING REVIEW</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Submitted At:</span>
                  <span className="text-slate-900">{new Date(quoteResult.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => navigate(ROUTES.DASHBOARD)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm"
                >
                  Return to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(ROUTES.PROJECTS.LIST)}
                  className="w-full sm:w-auto px-6 py-2.5 border border-slate-300 hover:bg-slate-50 font-semibold rounded-xl text-sm"
                >
                  Go to Projects
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Request Custom Migration Quote</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Please provide your modernization requirements and our team will prepare a tailored proposal.
                </p>
              </div>

              {generalError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                  <span>{generalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Contact Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-colors ${
                          fieldErrors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {fieldErrors.fullName && <p className="text-xs text-rose-600 font-medium">{fieldErrors.fullName}</p>}
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="companyName" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Company / Organization <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        id="companyName"
                        name="companyName"
                        type="text"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="ACME Financial Corp"
                        className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-colors ${
                          fieldErrors.companyName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {fieldErrors.companyName && <p className="text-xs text-rose-600 font-medium">{fieldErrors.companyName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Work Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="johndoe@acme.com"
                        className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-colors ${
                          fieldErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {fieldErrors.email && <p className="text-xs text-rose-600 font-medium">{fieldErrors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Phone Number <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        id="phone"
                        name="phone"
                        type="text"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+84 90 123 4567"
                        className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-colors ${
                          fieldErrors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {fieldErrors.phone && <p className="text-xs text-rose-600 font-medium">{fieldErrors.phone}</p>}
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Project Scope & Requirements <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your legacy platform (e.g. BMS/DSPF/COBOL), number of screens, target stack, and timeline..."
                      className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-colors resize-none ${
                        fieldErrors.message ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {fieldErrors.message && <p className="text-xs text-rose-600 font-medium">{fieldErrors.message}</p>}
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    isLoading={submitting}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <span>Submit Enterprise Quote Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestEnterprisePage;
