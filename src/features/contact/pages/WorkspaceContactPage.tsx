import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  Send,
  CheckCircle2,
  Mail,
  Phone,
  MessageSquare,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import { Button } from '@/shared/ui/Button';

export const WorkspaceContactPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    company: 'Acme Corp',
    requestType: 'LIMIT_UPGRADE',
    targetLimit: '100+ Screens / Programs',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#091E42] via-[#0A2540] to-[#0652CC] text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-amber-300 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ALSM Platform Capacity & Upgrade</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Contact Team & Request Upgrade
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Need to expand project limits, unlock additional screen conversions, or request custom COBOL/BMS parsers? Get in touch with our modernization architects.
          </p>
        </div>
      </div>

      {/* Upgrade Options Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-[#E5EAF0] rounded-xl p-5 shadow-2xs hover:shadow-md transition-shadow space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F1FF] text-[#0652CC] flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-[#091E42] text-sm">Capacity Limit Expansion</h3>
          <p className="text-xs text-[#6B778C] leading-relaxed">
            Increase your workspace capacity to convert 100+ BMS/DSPF screens and complex COBOL program suites.
          </p>
        </div>

        <div className="bg-white border border-[#E5EAF0] rounded-xl p-5 shadow-2xs hover:shadow-md transition-shadow space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-[#091E42] text-sm">Custom Parsers & Rules</h3>
          <p className="text-xs text-[#6B778C] leading-relaxed">
            Support proprietary IBM mainframe dialects, custom BMS macro expansions, and organization-specific Java code styles.
          </p>
        </div>

        <div className="bg-white border border-[#E5EAF0] rounded-xl p-5 shadow-2xs hover:shadow-md transition-shadow space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-[#091E42] text-sm">Enterprise On-Premises & SLA</h3>
          <p className="text-xs text-[#6B778C] leading-relaxed">
            Deploy ALSM inside your private cloud / air-gapped infrastructure with 24/7 dedicated engineering SLA.
          </p>
        </div>
      </div>

      {/* Main Grid: Form + Info Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form / Confirmation */}
        <div className="lg:col-span-2 bg-white border border-[#E5EAF0] rounded-2xl p-6 sm:p-8 shadow-2xs">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-[#091E42]">Upgrade Request Submitted!</h2>
              <p className="text-xs text-[#6B778C] max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-[#091E42]">{formData.name}</strong>. Our modernization engineering team has received your request and will reach out to <strong className="text-[#0652CC]">{formData.email}</strong> within 24 business hours.
              </p>
              <div className="pt-4">
                <Button
                  onClick={() => setSubmitted(false)}
                  className="bg-[#0652CC] hover:bg-[#0655FF] text-white text-xs px-6 py-2.5 rounded-xl font-semibold shadow-xs"
                >
                  Submit Another Request
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[#091E42]">Send Upgrade & Technical Request</h2>
                <p className="text-xs text-[#6B778C] mt-1">
                  Fill out the form below to contact our team or request additional system capacity.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#091E42] mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Alex Vance"
                    className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs text-[#091E42] focus:bg-white focus:border-[#0652CC] focus:ring-2 focus:ring-[#0652CC]/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#091E42] mb-1.5">
                    Work Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="alex.vance@company.com"
                    className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs text-[#091E42] focus:bg-white focus:border-[#0652CC] focus:ring-2 focus:ring-[#0652CC]/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#091E42] mb-1.5">
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Acme Financial Services"
                    className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs text-[#091E42] focus:bg-white focus:border-[#0652CC] focus:ring-2 focus:ring-[#0652CC]/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#091E42] mb-1.5">
                    Request Type
                  </label>
                  <select
                    name="requestType"
                    value={formData.requestType}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs text-[#091E42] focus:bg-white focus:border-[#0652CC] focus:ring-2 focus:ring-[#0652CC]/20 outline-none transition-all cursor-pointer"
                  >
                    <option value="LIMIT_UPGRADE">Capacity & Screen Limit Upgrade</option>
                    <option value="CUSTOM_PARSER">Custom BMS / COBOL Parser</option>
                    <option value="ENTERPRISE_DEPLOY">Enterprise Air-Gapped Deployment</option>
                    <option value="TECHNICAL_SUPPORT">Technical & Architectural Support</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#091E42] mb-1.5">
                  Target Capacity Needed
                </label>
                <select
                  name="targetLimit"
                  value={formData.targetLimit}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs text-[#091E42] focus:bg-white focus:border-[#0652CC] focus:ring-2 focus:ring-[#0652CC]/20 outline-none transition-all cursor-pointer"
                >
                  <option value="50_SCREENS">50 Screens / Programs</option>
                  <option value="100_SCREENS">100+ Screens / Programs</option>
                  <option value="500_SCREENS">500+ Enterprise Mainframe Suite</option>
                  <option value="UNLIMITED">Unlimited Enterprise License</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#091E42] mb-1.5">
                  Message / Details
                </label>
                <textarea
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Describe your legacy codebase (BMS mapsets, COBOL programs, target React/Java requirements)..."
                  className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs text-[#091E42] focus:bg-white focus:border-[#0652CC] focus:ring-2 focus:ring-[#0652CC]/20 outline-none transition-all"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 bg-[#0652CC] hover:bg-[#0655FF] text-white font-semibold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Upgrade Request</span>
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Right 1 Col: Direct Contact Information */}
        <div className="space-y-6">
          <div className="bg-[#F8FAFC] border border-[#E5EAF0] rounded-2xl p-6 space-y-5">
            <h3 className="font-bold text-[#091E42] text-sm">Direct Contact Channels</h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white border border-[#D9E2EC] rounded-xl text-[#0652CC] shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#091E42]">Email Support</p>
                  <p className="text-[#6B778C]">support@alsm.io</p>
                  <p className="text-[#6B778C]">enterprise@alsm.io</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white border border-[#D9E2EC] rounded-xl text-[#0652CC] shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#091E42]">Enterprise Hotline</p>
                  <p className="text-[#6B778C]">+1 (800) 555-ALSM</p>
                  <p className="text-[10px] text-[#6B778C]">Mon - Fri: 8:00 AM - 6:00 PM EST</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white border border-[#D9E2EC] rounded-xl text-[#0652CC] shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#091E42]">Live Consultation</p>
                  <p className="text-[#6B778C]">Schedule 1-on-1 technical review with an architect.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Docs Link Card */}
          <div className="bg-[#E8F1FF] border border-[#B3D4FF] rounded-2xl p-6 space-y-3">
            <h4 className="font-bold text-[#0652CC] text-xs uppercase tracking-wider">Need Technical Docs?</h4>
            <p className="text-xs text-[#091E42] leading-relaxed">
              Explore how BMS/DSPF screen maps and COBOL business logic are parsed and converted into modern React and Java.
            </p>
            <button
              type="button"
              onClick={() => navigate('/workspace/docs')}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#0652CC] hover:underline"
            >
              <span>View Workspace Documentation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceContactPage;
