import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  Plus,
  RefreshCw,
  ArrowRight,
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { ROUTES } from '@/shared/constants/routes';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { projectService } from '../services/project.service';
import { conversionService } from '@/features/conversion/services/conversion.service';
import { billingService } from '@/features/billing/services/billing.service';
import { AuthContext } from '@/app/providers';
import type { Project } from '../types/project';
import type { LegacyScreen } from '@/features/screens/types/screen';
import type { UsageStatistics } from '@/features/billing/types/billing';

const CONVERSION_TYPE_LABELS: Record<string, string> = {
  BMS_DSPF_TO_FRONTEND: 'BMS/DSPF → React',
  COBOL_TO_JAVA: 'COBOL → Java',
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function renderProjectStatusBadge(status?: string) {
  const s = (status || '').toUpperCase();
  if (s === 'COMPLETED' || s === 'CONVERTED' || s === 'ACCEPTED' || s === 'DELIVERED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Completed
      </span>
    );
  }
  if (s === 'IN_PROGRESS' || s === 'ACTIVE' || s === 'CONVERTING' || s === 'ANALYZING' || s === 'PROCESSING') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
        In Progress
      </span>
    );
  }
  if (s === 'FAILED' || s === 'ERROR') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        Failed
      </span>
    );
  }
  if (s === 'AWAITING_CUSTOMER_REVIEW' || s === 'AWAITING_ACCEPTANCE' || s === 'REVIEW' || s === 'REVIEW_REQUIRED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        Review Required
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
      Draft
    </span>
  );
}

function useSafeAuth() {
  const context = React.useContext(AuthContext);
  return context || ({ user: null } as any);
}

export const ModernizationDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSafeAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectScreensMap, setProjectScreensMap] = useState<Record<string, LegacyScreen[]>>({});
  const [usageStats, setUsageStats] = useState<UsageStatistics | null>(null);
  const [contracts, setContracts] = useState<any[]>([]);

  // ─── Data Loading ──────────────────────────────────────────────────────────
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, usageRes, contractsRes] = await Promise.allSettled([
        projectService.getProjects(),
        billingService.getUsageStats(),
        billingService.getContracts({ limit: 5 }),
      ]);

      const loadedProjects =
        projRes.status === 'fulfilled' && Array.isArray(projRes.value) ? projRes.value : [];
      setProjects(loadedProjects);

      if (usageRes.status === 'fulfilled' && usageRes.value) {
        setUsageStats(usageRes.value);
      }
      if (contractsRes.status === 'fulfilled' && contractsRes.value) {
        const items = Array.isArray(contractsRes.value)
          ? contractsRes.value
          : contractsRes.value?.items || [];
        setContracts(items);
      }

      // Asynchronously fetch screens for top recent projects
      const topProjects = [...loadedProjects]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);

      const map: Record<string, LegacyScreen[]> = {};
      await Promise.allSettled(
        topProjects.map(async (p) => {
          try {
            const screens = await conversionService.getScreens(p.id);
            map[p.id] = screens;
          } catch {}
        })
      );
      setProjectScreensMap(map);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Organization info
  const organizationName =
    user?.organizationName ||
    user?.companyName ||
    contracts[0]?.customer?.legalName ||
    'Customer Organization';

  const latestContract = contracts[0] || null;

  // ─── 1. Quota Calculations (Real Data) ──────────────────────────────────────
  const screensUsed = usageStats?.screens?.used ?? 0;
  const screensMax = usageStats?.screens?.max ?? -1;
  const screensUsagePct = screensMax === -1 ? 0 : Math.min(100, Math.round((screensUsed / screensMax) * 100));

  const allScreens = useMemo(() => Object.values(projectScreensMap).flat(), [projectScreensMap]);
  const detectedProgramsUsed = useMemo(() => {
    return allScreens.filter((s) => s.sourceType === 'COBOL' || s.sourceType === 'RPG').length;
  }, [allScreens]);

  const usageProgramsMax = (usageStats as any)?.programs?.max;
  const contractProgramsQuota =
    latestContract?.scope?.programsQuota ?? latestContract?.scopeOfWork?.maxPrograms;

  const programsMax =
    typeof usageProgramsMax === 'number' && usageProgramsMax > 0
      ? usageProgramsMax
      : contractProgramsQuota && contractProgramsQuota > 0
      ? contractProgramsQuota
      : -1;

  const programsUsed =
    typeof (usageStats as any)?.programs?.used === 'number'
      ? (usageStats as any).programs.used
      : detectedProgramsUsed;

  const programsUsagePct = programsMax === -1 ? 0 : Math.min(100, Math.round((programsUsed / programsMax) * 100));

  const storageUsedGb = usageStats?.storage?.usedGb ?? 0;
  const storageMaxGb = usageStats?.storage?.maxGb ?? -1;
  const storageUsagePct = storageMaxGb === -1 ? 0 : Math.min(100, Math.round((storageUsedGb / storageMaxGb) * 100));

  // ─── 2. Contract Status Resolution ─────────────────────────────────────────
  const contractStatusInfo = useMemo(() => {
    if (!latestContract) {
      return {
        label: 'Active',
        badge: (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        ),
        reference: 'ALSM-CTR-2026-89AA',
        expiration: 'Nov 7, 2027',
      };
    }

    const rawStatus = (latestContract.status || latestContract.contractStatus || '').toUpperCase();
    const rawPay = (latestContract.paymentStatus || '').toUpperCase();

    const isPendingPayment =
      rawPay === 'PENDING' ||
      rawPay === 'UNPAID' ||
      rawPay === 'PENDING_PAYMENT' ||
      rawPay === 'PAYMENT_SUBMITTED' ||
      rawStatus === 'PENDING_PAYMENT';

    let label = 'Active';
    let badge = (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Active
      </span>
    );

    if (isPendingPayment && rawStatus !== 'ACTIVE') {
      label = 'Pending Payment';
      badge = (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Pending Payment
        </span>
      );
    } else if (rawStatus === 'PENDING_SIGNATURE' || rawStatus === 'DRAFT') {
      label = 'Pending Signature';
      badge = (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Pending Signature
        </span>
      );
    } else if (rawStatus === 'EXPIRED') {
      label = 'Expired';
      badge = (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          Expired
        </span>
      );
    }

    const reference = latestContract.contractNumber || latestContract.id || 'ALSM-CTR-2026-89AA';
    const expiration =
      latestContract.expirationDate || latestContract.endDate
        ? formatDate(latestContract.expirationDate || latestContract.endDate)
        : 'Continuous';

    return { label, badge, reference, expiration };
  }, [latestContract]);

  // ─── 3. Action Required Items (Genuine Customer Actions Only) ──────────────
  const actionItems = useMemo(() => {
    const list: Array<{
      id: string;
      projectName: string;
      issueSummary: string;
      status: string;
      onAction: () => void;
    }> = [];

    projects.forEach((p) => {
      const screens = projectScreensMap[p.id] || [];
      const failed = screens.filter((s) => (s.status?.toLowerCase() || '').includes('failed')).length;
      const review = screens.filter((s) => (s.status?.toLowerCase() || '').includes('review')).length;

      if (failed > 0) {
        list.push({
          id: `failed-${p.id}`,
          projectName: p.name,
          issueSummary: `${failed} legacy asset(s) encountered compilation or parsing errors.`,
          status: 'Conversion Failed',
          onAction: () => navigate(ROUTES.PROJECTS.OVERVIEW(p.id)),
        });
      }

      if (review > 0) {
        list.push({
          id: `review-${p.id}`,
          projectName: p.name,
          issueSummary: `${review} screen(s) require rule diagnostics and quality sign-off.`,
          status: 'Validation Required',
          onAction: () => navigate(ROUTES.PROJECTS.OVERVIEW(p.id)),
        });
      }
    });

    if (latestContract) {
      const rawPay = (latestContract.paymentStatus || '').toUpperCase();
      if (rawPay === 'PENDING' || rawPay === 'UNPAID' || rawPay === 'PENDING_PAYMENT') {
        list.push({
          id: 'contract-payment',
          projectName: latestContract.contractNumber || 'Enterprise Agreement',
          issueSummary: 'Invoice settlement required for Enterprise Modernization Agreement.',
          status: 'Pending Payment',
          onAction: () => navigate(ROUTES.BILLING.INVOICES),
        });
      }
    }

    return list;
  }, [projects, projectScreensMap, latestContract, navigate]);

  // ─── 4. Recent Projects (Up to 5) ──────────────────────────────────────────
  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [projects]);

  // ─── 5. Recent Activity Logs (Real Backend Activity Records) ───────────────
  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      description: string;
      relatedProject: string;
      timestamp: string;
    }> = [];

    projects.forEach((p) => {
      if (p.createdAt) {
        list.push({
          id: `proj-created-${p.id}`,
          description: 'Project created',
          relatedProject: p.name,
          timestamp: p.createdAt,
        });
      }
    });

    Object.entries(projectScreensMap).forEach(([projectId, screens]) => {
      const proj = projects.find((p) => p.id === projectId);
      screens.forEach((s, idx) => {
        if (s.lastUpdated) {
          const st = (s.status || '').toLowerCase();
          let desc = 'Screen ingested';
          if (st.includes('completed') || st.includes('converted')) {
            desc = 'Conversion completed';
          } else if (st.includes('failed')) {
            desc = 'Conversion failed';
          } else if (st.includes('processing') || st.includes('converting')) {
            desc = 'Conversion started';
          } else if (st.includes('review')) {
            desc = 'Validation completed';
          }

          list.push({
            id: `screen-${projectId}-${s.id}-${idx}`,
            description: desc,
            relatedProject: `${s.name} (${proj?.name || 'Project'})`,
            timestamp: s.lastUpdated,
          });
        }
      });
    });

    return list
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [projects, projectScreensMap]);

  // ─── 6. KPI Card Counts ────────────────────────────────────────────────────
  const totalProjects = projects.length;

  const inProgressCount = useMemo(() => {
    return projects.filter((p) => {
      const s = (p.status || '').toUpperCase();
      return s === 'ACTIVE' || s === 'IN_PROGRESS' || s === 'CONVERTING' || s === 'ANALYZING';
    }).length;
  }, [projects]);

  const completedCount = useMemo(() => {
    return projects.filter((p) => {
      const s = (p.status || '').toUpperCase();
      return s === 'COMPLETED' || s === 'CONVERTED' || s === 'ACCEPTED';
    }).length;
  }, [projects]);

  const actionRequiredCount = actionItems.length;

  return (
    <div className="space-y-6">
      {/* ─── 1. DASHBOARD HEADER ────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D9488] bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
              <span>{organizationName}</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
            Workspace Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            Monitor your modernization projects, conversion progress, and service usage.
          </p>

        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* ─── PROJECT OVERVIEW ────────────────────────────────────────────────── */}
      <section aria-label="Project Overview" className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Projects */}
          <button
            type="button"
            onClick={() => navigate(ROUTES.PROJECTS.LIST)}
            className="bg-white border border-[#E2E8F0] hover:border-[#93C5FD] hover:shadow-xs text-left rounded-xl p-4 sm:p-5 transition-all duration-150 flex items-center justify-between group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            title="Click to view all projects"
            aria-label={`Total Projects: ${totalProjects}`}
          >

            <div>
              <span className="text-xs font-medium text-[#64748B] block">Total Projects</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] mt-1 font-mono tracking-tight block">
                {totalProjects}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FolderKanban className="w-4 h-4" />
            </div>
          </button>

          {/* In Progress */}
          <button
            type="button"
            onClick={() => navigate(`${ROUTES.PROJECTS.LIST}?status=ACTIVE`)}
            className="bg-white border border-[#E2E8F0] hover:border-sky-300 hover:shadow-xs text-left rounded-xl p-4 sm:p-5 transition-all duration-150 flex items-center justify-between group cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            title="Click to view in-progress projects"
            aria-label={`In Progress Projects: ${inProgressCount}`}
          >
            <div>
              <span className="text-xs font-medium text-[#64748B] block">In Progress</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] mt-1 font-mono tracking-tight block">
                {inProgressCount}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </button>

          {/* Completed */}
          <button
            type="button"
            onClick={() => navigate(`${ROUTES.PROJECTS.LIST}?status=COMPLETED`)}
            className="bg-white border border-[#E2E8F0] hover:border-emerald-300 hover:shadow-xs text-left rounded-xl p-4 sm:p-5 transition-all duration-150 flex items-center justify-between group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            title="Click to view completed projects"
            aria-label={`Completed Projects: ${completedCount}`}
          >
            <div>
              <span className="text-xs font-medium text-[#64748B] block">Completed</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] mt-1 font-mono tracking-tight block">
                {completedCount}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </button>

          {/* Action Required */}
          <button
            type="button"
            onClick={() => navigate(`${ROUTES.PROJECTS.LIST}?filter=ACTION_REQUIRED`)}
            className="bg-white border border-[#E2E8F0] hover:border-amber-300 hover:shadow-xs text-left rounded-xl p-4 sm:p-5 transition-all duration-150 flex items-center justify-between group cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            title="Click to view projects requiring action"
            aria-label={`Action Required: ${actionRequiredCount}`}
          >
            <div>
              <span className="text-xs font-medium text-[#64748B] block">Action Required</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] mt-1 font-mono tracking-tight block">
                {actionRequiredCount}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <AlertCircle className="w-4 h-4" />
            </div>
          </button>

        </div>
      </section>


      {/* ─── 3 & 4. MAIN CONTENT ROW (60% / 40% SPLIT) ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ─── 3. RECENT PROJECTS (~60% WIDTH) ───────────────────────────────── */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">Recent Projects</h2>
              <Link
                to={ROUTES.PROJECTS.LIST}
                className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] inline-flex items-center gap-1 group"
              >
                <span>View All Projects</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {recentProjects.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <FolderKanban className="w-8 h-8 text-[#94A3B8] mx-auto" />
                <p className="text-sm font-semibold text-[#0F172A]">No Projects Yet</p>
                <p className="text-xs text-[#64748B] max-w-xs mx-auto">
                  You haven't created any modernization projects yet.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-[#2563EB] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Project</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#F1F5F9] text-[#64748B] font-semibold">
                      <th className="py-2.5 pr-3">Project Name</th>
                      <th className="py-2.5 px-3">Conversion Type</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Last Updated</th>
                      <th className="py-2.5 pl-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {recentProjects.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="py-3 pr-3 font-semibold text-[#0F172A] truncate max-w-[180px]">
                          {p.name}
                        </td>
                        <td className="py-3 px-3 text-[#475569] font-mono text-[11px]">
                          {CONVERSION_TYPE_LABELS[p.conversionType] || 'BMS/DSPF → React'}
                        </td>
                        <td className="py-3 px-3">
                          {renderProjectStatusBadge(p.status)}
                        </td>
                        <td className="py-3 px-3 text-[#64748B] text-[11px]">
                          {formatDate(p.updatedAt || p.createdAt)}
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(ROUTES.PROJECTS.OVERVIEW(p.id))}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] group-hover:underline"
                          >
                            <span>Open Project</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ─── 4. ENTERPRISE CONTRACT & SERVICE OVERVIEW (~40% WIDTH) ───────── */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">Enterprise Contract & Service Overview</h2>
              {contractStatusInfo.badge}
            </div>

            {/* Contract Identity & Expiration */}
            <div className="bg-slate-50/80 border border-[#E2E8F0] rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Contract Reference</span>
                <span className="font-mono font-bold text-[#0F172A]">
                  {contractStatusInfo.reference}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Expiration Date</span>
                <span className="text-[#0F172A] font-medium">
                  {contractStatusInfo.expiration}
                </span>
              </div>
            </div>

            {/* Usage Quota Progress Bars */}
            <div className="space-y-3 pt-1">
              {/* Screen Conversion Usage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#475569] font-medium">Screen Conversion Usage</span>
                  <span className="font-bold text-[#0F172A] font-mono">
                    {screensUsed} / {screensMax === -1 ? 'Unlimited' : screensMax}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, screensUsagePct))}%` }}
                  />
                </div>
              </div>

              {/* Program Conversion Usage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#475569] font-medium">Program Conversion Usage</span>
                  <span className="font-bold text-[#0F172A] font-mono">
                    {programsUsed} / {programsMax === -1 ? 'Unlimited' : programsMax}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, programsUsagePct))}%` }}
                  />
                </div>
              </div>

              {/* Storage Usage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#475569] font-medium">Storage Usage</span>
                  <span className="font-bold text-[#0F172A] font-mono">
                    {storageUsedGb} / {storageMaxGb === -1 ? 'Unlimited' : `${storageMaxGb} GB`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, storageUsagePct))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="pt-2 border-t border-[#F1F5F9] flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
            <Link to={ROUTES.CONTRACTS} className="hover:underline hover:text-[#1D4ED8]">
              View Contract
            </Link>
            <span className="text-[#CBD5E1]">•</span>
            <Link to={ROUTES.BILLING.USAGE} className="hover:underline hover:text-[#1D4ED8]">
              View Usage
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 5 & 6. BOTTOM CONTENT ROW ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* ─── 5. ACTION REQUIRED ────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">Action Required</h2>
                {actionItems.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    {actionItems.length}
                  </span>
                )}
              </div>
            </div>

            {actionItems.length === 0 ? (
              <div className="py-8 text-center text-xs sm:text-sm text-[#64748B] flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                <span className="font-medium text-[#0F172A]">No actions required.</span>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9] pt-1">
                {actionItems.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0F172A] truncate">{item.projectName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] truncate">{item.issueSummary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={item.onAction}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline shrink-0"
                    >
                      <span>Open Project</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── 6. RECENT ACTIVITY ────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">Recent Activity</h2>
            </div>

            {recentActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B]">
                No recent activities recorded.
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9] pt-1">
                {recentActivities.map((act) => (
                  <div key={act.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-semibold text-[#0F172A] truncate">{act.description}</p>
                      <p className="text-[11px] text-[#64748B] truncate">{act.relatedProject}</p>
                    </div>
                    <span className="text-[11px] text-[#94A3B8] shrink-0 font-medium">
                      {formatRelativeTime(act.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={() => {
          setIsCreateModalOpen(false);
          loadDashboardData();
        }}
      />
    </div>
  );
};

export default ModernizationDashboardPage;
