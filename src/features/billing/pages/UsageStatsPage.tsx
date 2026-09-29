import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Folder,
  HardDrive,
  Monitor,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useUsageStats } from '../queries/useUsageStats';
import { ROUTES } from '@/shared/constants/routes';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getQuotaColor(used: number, max: number): { bar: string; text: string; bg: string } {
  if (max === -1) return { bar: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50' };
  const pct = used / max;
  if (pct >= 1.0) return { bar: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' };
  if (pct >= 0.8) return { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' };
  return { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' };
}

function getQuotaPct(used: number, max: number): number {
  if (max === -1) return 100;
  return Math.min(100, Math.round((used / max) * 100));
}

function formatQuotaValue(value: number): string {
  if (value === -1) return 'Unlimited';
  return value.toLocaleString();
}

function getPlanBadgeClass(tier: string): string {
  switch (tier?.toUpperCase()) {
    case 'PROFESSIONAL': return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'ENTERPRISE': return 'bg-purple-100 text-purple-800 border border-purple-200';
    default: return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface QuotaCardProps {
  label: string;
  icon: React.ReactNode;
  used: number;
  max: number;
  unit?: string;
  isStorage?: boolean;
}

const QuotaCard: React.FC<QuotaCardProps> = ({ label, icon, used, max, unit = '', isStorage = false }) => {
  const colors = getQuotaColor(used, max);
  const pct = getQuotaPct(used, max);
  const isUnlimited = max === -1;
  const isCritical = !isUnlimited && pct >= 100;
  const isWarning = !isUnlimited && pct >= 80 && pct < 100;

  const usedDisplay = isStorage ? `${used.toFixed(1)} GB` : `${used.toLocaleString()}${unit}`;
  const maxDisplay = isStorage && max !== -1 ? `${max} GB` : formatQuotaValue(max);

  return (
    <div className={`rounded-xl border p-5 shadow-xs transition-all ${isCritical ? 'border-rose-300 bg-rose-50' : isWarning ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="text-slate-400">{icon}</span>
          <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
        </div>
        {isCritical && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Quota Exceeded
          </span>
        )}
        {isWarning && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
            <AlertTriangle className="w-3 h-3" />
            Near limit
          </span>
        )}
      </div>

      <div className="flex items-end justify-between mb-2">
        <span className={`text-2xl font-bold ${colors.text}`}>
          {isUnlimited ? '∞' : usedDisplay}
        </span>
        <span className="text-xs text-slate-400">
          {isUnlimited ? 'Unlimited' : `/ ${maxDisplay}`}
        </span>
      </div>

      {isUnlimited ? (
        <div className="h-2 rounded-full bg-indigo-100 overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full" />
        </div>
      ) : (
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <p className="text-[11px] text-slate-400 mt-1.5">
        {isUnlimited ? 'No limit on this plan' : `${pct}% used`}
      </p>
    </div>
  );
};

// ─── Monthly Chart ────────────────────────────────────────────────────────────

interface MonthlyChartProps {
  data: Array<{ month: string; count: number }>;
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-400">
        <BarChart3 className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">No conversion activity yet</p>
        <p className="text-xs mt-1">Conversions will appear here once you start processing screens</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-3 pt-2 pb-1 h-32">
      {data.map((item) => {
        const heightPct = Math.max(8, Math.round((item.count / maxCount) * 100));
        return (
          <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-600">{item.count}</span>
            <div className="w-full rounded-t-md bg-[#0652CC] opacity-80 transition-all" style={{ height: `${heightPct}%` }} />
            <span className="text-[10px] text-slate-400 font-medium">{item.month}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const UsageStatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isFetching } = useUsageStats();

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-28 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-52 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (isError || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-800 text-sm">Failed to load service usage</p>
            <p className="text-xs text-rose-600 mt-1">
              Could not retrieve usage data. Please check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { plan, screens, projects, storage, monthlyConversions } = data;
  const isEnterprise = plan.tier?.toUpperCase() === 'ENTERPRISE';
  const hasQuotaWarning = (!isEnterprise) && (
    (screens.max !== -1 && screens.used >= screens.max) ||
    (projects.max !== -1 && projects.used >= projects.max)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0652CC]" />
            Service Usage
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor your organisation's resource consumption and quota limits
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Plan Banner ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0652CC] bg-opacity-10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#0652CC]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{plan.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPlanBadgeClass(plan.tier)}`}>
                {plan.tier?.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEnterprise ? 'Unlimited resources — Enterprise plan' : 'Current active subscription plan'}
            </p>
          </div>
        </div>
        {!isEnterprise && (
          <button
            type="button"
            onClick={() => navigate(ROUTES.BILLING.UPGRADE_ENTERPRISE)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0652CC] text-white text-xs font-bold hover:bg-[#0448b3] transition-colors shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            Upgrade Plan
          </button>
        )}
      </div>

      {/* ── Quota Exceeded Banner ────────────────────────────────────────────── */}
      {hasQuotaWarning && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-rose-800">You have reached your plan quota</p>
              <p className="text-xs text-rose-600 mt-0.5">
                Upgrade your plan to continue converting screens and managing projects.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.BILLING.UPGRADE_ENTERPRISE)}
            className="shrink-0 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* ── Quota Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuotaCard
          label="Screens / Month"
          icon={<Monitor className="w-4 h-4" />}
          used={screens.used}
          max={screens.max}
        />
        <QuotaCard
          label="Projects"
          icon={<Folder className="w-4 h-4" />}
          used={projects.used}
          max={projects.max}
        />
        <QuotaCard
          label="Storage"
          icon={<HardDrive className="w-4 h-4" />}
          used={storage.usedGb}
          max={storage.maxGb}
          isStorage
        />
      </div>

      {/* ── Monthly Conversions Chart ────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Boxes className="w-4 h-4 text-[#0652CC]" />
            Monthly Conversion Volume
          </h2>
          <span className="text-[11px] text-slate-400">Past 6 months</span>
        </div>
        <MonthlyChart data={monthlyConversions} />
      </div>
    </div>
  );
};

export default UsageStatsPage;
