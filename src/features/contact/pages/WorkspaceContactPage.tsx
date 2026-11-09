import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  Headphones,
  Code2,
  MessageSquare,
  Layers,
  ShieldCheck,
  Zap,
  ArrowRight,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useUsageStats } from '@/features/billing/queries/useUsageStats';
import { billingService } from '@/features/billing/services/billing.service';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { ProgressBar } from '@/shared/ui/ProgressBar';

interface AppealContext {
  id: string;
  companyName: string;
  reason?: string;
  previousAppeal?: string;
}

export const WorkspaceContactPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appeal = (location.state as { appeal?: AppealContext } | null)?.appeal;

  // Real capacity usage query
  const { data: usage, isLoading: usageLoading, isError: usageError } = useUsageStats();

  // Appeal state (only used if navigated from suspension context)
  const [appealMessage, setAppealMessage] = useState(
    appeal?.reason ? `Appeal for request ${appeal.id}. Reason: ${appeal.reason}` : ''
  );
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [appealSubmitted, setAppealSubmitted] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('alsm:open-support-chat'));
  };

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealMessage.trim()) return;
    setSubmittingAppeal(true);
    setAppealError(null);
    try {
      await billingService.submitEnterpriseAppeal(appealMessage.trim());
      setAppealSubmitted(true);
    } catch (err: any) {
      setAppealError(
        err?.response?.data?.message ||
          'Unable to submit appeal at this time. Please contact enterprise@alsm.io directly.'
      );
    } finally {
      setSubmittingAppeal(false);
    }
  };

  // Capacity calculation
  const maxScreens = usage?.screens?.max ?? -1;
  const usedScreens = usage?.screens?.used ?? 0;
  const isUnlimited = maxScreens === -1;
  const remainingScreens = isUnlimited ? 'Unlimited' : Math.max(0, maxScreens - usedScreens);
  const usagePercentage =
    isUnlimited || maxScreens === 0 ? 0 : Math.min(100, Math.round((usedScreens / maxScreens) * 100));

  let statusBadgeVariant: 'success' | 'warning' | 'danger' | 'info' = 'success';
  let statusText = 'Optimal';
  let progressColor: 'emerald' | 'amber' | 'rose' | 'indigo' = 'emerald';

  if (isUnlimited) {
    statusBadgeVariant = 'info';
    statusText = 'Unlimited';
    progressColor = 'indigo';
  } else if (usagePercentage >= 100) {
    statusBadgeVariant = 'danger';
    statusText = 'Limit Reached';
    progressColor = 'rose';
  } else if (usagePercentage >= 80) {
    statusBadgeVariant = 'warning';
    statusText = 'Near Limit';
    progressColor = 'amber';
  }

  return (
    <div className="w-full space-y-8">
      {/* Section A: Header */}
      <PageHeader
        title="Contact & Support"
        subtitle="Get assistance with your workspace, screen conversion capacity, or enterprise modernization requirements."
      />

      {/* Conditional: Enterprise Suspension Appeal Banner & Form */}
      {appeal && (
        <Card className="border-amber-200 bg-amber-50/40 p-6 space-y-4 w-full">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-[#091E42] text-sm">Enterprise Suspension Appeal</h3>
                <Badge variant="warning">Request #{appeal.id}</Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {appeal.companyName} is currently flagged for review.{' '}
                {appeal.reason
                  ? `Reason: ${appeal.reason}`
                  : 'Please provide details below to request administrator reinstatement.'}
              </p>
            </div>
          </div>

          {appealSubmitted ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-3 text-emerald-800 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Your appeal has been forwarded to ALSM compliance administrators for formal review. You will receive an
                update at your registered email within 24 business hours.
              </span>
            </div>
          ) : (
            <form onSubmit={handleAppealSubmit} className="space-y-3 pt-2">
              <textarea
                value={appealMessage}
                onChange={(e) => setAppealMessage(e.target.value)}
                placeholder="State the circumstances of your usage or corrective steps taken..."
                rows={3}
                required
                minLength={10}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0652CC] focus:border-transparent text-[#091E42]"
              />
              {appealError && <p className="text-xs text-rose-600 font-medium">{appealError}</p>}
              <div className="flex items-center space-x-3">
                <Button type="submit" size="sm" variant="primary" isLoading={submittingAppeal}>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Submit Appeal to Admin
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => navigate('/billing/upgrade')}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* Section B: Workspace Capacity Summary */}
      <section aria-labelledby="capacity-summary-heading" className="space-y-3 w-full">
        <div className="flex items-center justify-between">
          <h2 id="capacity-summary-heading" className="text-base font-bold text-[#091E42]">
            Workspace Conversion Capacity
          </h2>
          <span className="text-xs text-slate-500 font-medium">Managed via ALSM Enterprise Licensing</span>
        </div>

        <Card className="border border-slate-200 shadow-xs bg-white p-6 sm:p-7 space-y-6 w-full">
          {usageLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2 p-3 bg-slate-50 rounded-lg">
                  <div className="h-3 w-24 bg-slate-200 rounded" />
                  <div className="h-8 w-20 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : usageError ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 w-full">
              <div className="flex items-center space-x-3">
                <Info className="w-5 h-5 text-slate-500 shrink-0" />
                <span className="text-xs text-slate-700">
                  Capacity statistics are currently being updated by the billing service.
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={handleOpenChat}>
                Discuss Additional Capacity
              </Button>
            </div>
          ) : (
            <>
              {/* 4 Stat Columns evenly distributed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 w-full">
                <div className="space-y-1.5 sm:pr-6">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Allocated Screen Capacity
                  </span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#091E42] tracking-tight">
                    {isUnlimited ? 'Unlimited' : maxScreens.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">Contracted screen conversion limit</p>
                </div>

                <div className="space-y-1.5 sm:px-6 pt-4 sm:pt-0">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Converted Screens
                  </span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#091E42] tracking-tight">
                    {usedScreens.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">Consumed across workspace</p>
                </div>

                <div className="space-y-1.5 sm:px-6 pt-4 sm:pt-0">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Remaining Capacity
                  </span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#091E42] tracking-tight">
                    {typeof remainingScreens === 'number' ? remainingScreens.toLocaleString() : remainingScreens}
                  </p>
                  <p className="text-xs text-slate-500">Available conversions remaining</p>
                </div>

                <div className="space-y-1.5 sm:pl-6 pt-4 sm:pt-0">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Capacity Health
                  </span>
                  <div className="pt-1">
                    <Badge variant={statusBadgeVariant} className="px-3 py-1 text-xs">
                      {statusText}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isUnlimited ? 'Enterprise unlimited tier' : `${usagePercentage}% consumed`}
                  </p>
                </div>
              </div>

              {/* Full-width Progress Bar */}
              {!isUnlimited && (
                <div className="space-y-2 pt-2 border-t border-slate-100 w-full">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>Quota Consumption</span>
                    <span className="font-semibold text-[#091E42]">{usagePercentage}%</span>
                  </div>
                  <ProgressBar progress={usagePercentage} color={progressColor} size="md" />
                </div>
              )}

              {/* Explanatory footer notice + CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 w-full">
                <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                  Screen conversion capacity is allocated directly by ALSM based on your enterprise service agreement.
                  Platform modernization quota adjustments require authorized enterprise sign-off; contact our team for assistance.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenChat}
                  className="shrink-0 text-[#0652CC] border-[#0652CC]/30 hover:border-[#0652CC] hover:bg-blue-50/50"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-[#0652CC]" />
                  Discuss Additional Capacity
                </Button>
              </div>
            </>
          )}
        </Card>
      </section>

      {/* Section C: Contact Options (4 responsive full-width cards) */}
      <section aria-labelledby="contact-options-heading" className="space-y-4 w-full">
        <div>
          <h2 id="contact-options-heading" className="text-base font-bold text-[#091E42]">
            Contact Channels
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
          {/* 1. Sales & Service */}
          <Card className="flex flex-col justify-between h-full p-6 border border-slate-200 shadow-xs hover:border-[#0652CC]/50 hover:shadow-sm transition-all bg-white">
            <div className="space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0652CC] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-sm text-[#091E42] tracking-tight">Sales & Service Consultation</h3>
                <p className="text-xs text-slate-600 leading-relaxed min-h-[40px]">
                  Discuss workspace capacity expansions, annual service contracts, and custom enterprise license agreements.
                </p>
              </div>
            </div>
            <div className="pt-6 space-y-3 border-t border-slate-100 mt-4">
              <span className="block text-[11px] font-mono text-slate-500">enterprise@alsm.io</span>
              <a
                href="mailto:enterprise@alsm.io?subject=ALSM%20Enterprise%20Capacity%20%26%20Service%20Inquiry"
                className="w-full inline-flex items-center justify-center h-9 px-3 text-xs font-semibold rounded-lg border border-slate-200 text-[#091E42] hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Contact Sales
              </a>
            </div>
          </Card>

          {/* 2. Technical Support */}
          <Card className="flex flex-col justify-between h-full p-6 border border-slate-200 shadow-xs hover:border-[#0652CC]/50 hover:shadow-sm transition-all bg-white">
            <div className="space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-sm text-[#091E42] tracking-tight">Technical Support</h3>
                <p className="text-xs text-slate-600 leading-relaxed min-h-[40px]">
                  Assistance with screen conversion errors, AST parsing anomalies, code generation, and export issues.
                </p>
              </div>
            </div>
            <div className="pt-6 space-y-3 border-t border-slate-100 mt-4">
              <span className="block text-[11px] font-mono text-slate-500">support@alsm.io</span>
              <a
                href="mailto:support@alsm.io?subject=ALSM%20Technical%20Support%20Request"
                className="w-full inline-flex items-center justify-center h-9 px-3 text-xs font-semibold rounded-lg border border-slate-200 text-[#091E42] hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Contact Support
              </a>
            </div>
          </Card>

          {/* 3. Custom Modernization */}
          <Card className="flex flex-col justify-between h-full p-6 border border-slate-200 shadow-xs hover:border-[#0652CC]/50 hover:shadow-sm transition-all bg-white">
            <div className="space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-sm text-[#091E42] tracking-tight">Custom Modernization</h3>
                <p className="text-xs text-slate-600 leading-relaxed min-h-[40px]">
                  Support for proprietary BMS macros, unique mainframe COBOL dialects, and custom Java/React outputs.
                </p>
              </div>
            </div>
            <div className="pt-6 space-y-3 border-t border-slate-100 mt-4">
              <span className="block text-[11px] font-mono text-slate-500">Architecture Team</span>
              <a
                href="mailto:enterprise@alsm.io?subject=Custom%20COBOL%2FBMS%20Parser%20%26%20Modernization%20Requirements"
                className="w-full inline-flex items-center justify-center h-9 px-3 text-xs font-semibold rounded-lg border border-slate-200 text-[#091E42] hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                Discuss Requirements
              </a>
            </div>
          </Card>

          {/* 4. Live Chat */}
          <Card className="flex flex-col justify-between h-full p-6 border border-slate-200 shadow-xs hover:border-[#0652CC]/50 hover:shadow-sm transition-all bg-white">
            <div className="space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-bold text-sm text-[#091E42] tracking-tight">Live Team Support</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed min-h-[40px]">
                  Connect directly with ALSM platform specialists in real time through our integrated chat service.
                </p>
              </div>
            </div>
            <div className="pt-6 space-y-3 border-t border-slate-100 mt-4">
              <span className="block text-[11px] font-mono text-slate-500">Mon–Fri · 8:00 AM – 6:00 PM EST</span>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenChat}
                className="w-full h-9 text-xs"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                Start Conversation
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Section D: Enterprise Service Capabilities */}
      <section aria-labelledby="capabilities-heading" className="space-y-4 w-full">
        <div>
          <h2 id="capabilities-heading" className="text-base font-bold text-[#091E42]">
            Enterprise Modernization Capabilities
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <Card className="p-6 border border-slate-200 bg-white space-y-3 h-full shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0652CC] flex items-center justify-center">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-sm text-[#091E42]">Capacity Limit Scaling</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Scale conversion throughput to support 500+ complex BMS/DSPF screens and high-volume batch COBOL program
              repositories with dedicated conversion runners.
            </p>
          </Card>

          <Card className="p-6 border border-slate-200 bg-white space-y-3 h-full shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-sm text-[#091E42]">Custom Parsers & Dialects</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Customized lexer/parser grammars for bespoke IBM mainframe dialects, specialized BMS macro libraries, and
              custom enterprise coding patterns.
            </p>
          </Card>

          <Card className="p-6 border border-slate-200 bg-white space-y-3 h-full shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-sm text-[#091E42]">On-Premises & SLA</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Private VPC deployment options, sovereign data handling, air-gapped on-premise conversions, and 24/7
              dedicated engineering support SLAs.
            </p>
          </Card>
        </div>
      </section>

      {/* Direct Hotline & Technical Docs Footer Card */}
      <section className="border-t border-slate-200 pt-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-xl shadow-xs w-full">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#091E42] flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-slate-600" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-[#091E42]">Enterprise Direct Hotline</p>
              <p className="text-xs text-slate-600">
                <span className="font-mono font-medium text-[#091E42]">+1 (800) 555-ALSM</span> · Mon – Fri: 8:00 AM –
                6:00 PM EST
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/workspace/docs')}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#0652CC] hover:text-[#0655FF] transition-colors cursor-pointer"
          >
            <span>View Architecture Documentation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default WorkspaceContactPage;
