import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, HardDrive, Layers, ArrowUpRight } from 'lucide-react';
import { usageService } from '../services/usage.service';
import type { UsageStatistics } from '@/features/billing/types/billing';
import { ROUTES } from '@/shared/constants/routes';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { Button } from '@/shared/ui/Button';

export const ResourceUsagePage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UsageStatistics | null>(null);

  useEffect(() => {
    usageService.getUsageStats().then((data) => setStats(data));
  }, []);

  if (!stats) return <div className="p-8 text-center text-slate-500">Loading resource metrics...</div>;

  const maxMonthVal = Math.max(...stats.monthlyConversions.map((m) => m.count));

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Resource Usage</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor your monthly consumption and limits</p>
        </div>

        <Button onClick={() => navigate(ROUTES.BILLING.PRICING)} className="space-x-1.5 text-xs font-semibold">
          <span>Upgrade Quota</span>
          <ArrowUpRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Screen Conversions</span>
            <div className="p-2 rounded-lg bg-brand-50 border border-brand-200 text-brand-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-extrabold text-slate-900">{stats.screensUsed} / {stats.screensMax}</p>
            <p className="text-xs text-slate-500">Used this billing period</p>
          </div>
          <ProgressBar progress={Math.round((stats.screensUsed / stats.screensMax) * 100)} color="indigo" showPercentage />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Project Containers</span>
            <div className="p-2 rounded-lg bg-brand-50 border border-brand-200 text-brand-600">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-extrabold text-slate-900">{stats.containersUsed} / Unlimited</p>
            <p className="text-xs text-slate-500">Active workspaces</p>
          </div>
          <ProgressBar progress={40} color="indigo" showPercentage />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Storage Allocation</span>
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-extrabold text-slate-900">{stats.storageUsedGb} GB / {stats.storageMaxGb} GB</p>
            <p className="text-xs text-slate-500">Archived AST & generated code</p>
          </div>
          <ProgressBar progress={Math.round((stats.storageUsedGb / stats.storageMaxGb) * 100)} color="emerald" showPercentage />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Conversion Volume</h3>
            <p className="text-xs text-slate-500">Monthly conversion activity over past 6 months</p>
          </div>
          <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            November: 45 conversions
          </span>
        </div>

        <div className="pt-8 pb-4">
          <div className="h-64 flex items-end justify-between gap-4 border-b border-slate-200 px-4">
            {stats.monthlyConversions.map((m, idx) => {
              const heightPercent = Math.round((m.count / maxMonthVal) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-xs font-bold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {m.count}
                  </span>
                  <div
                    className="w-full max-w-[48px] bg-brand-600 hover:bg-brand-700 rounded-t-lg transition-all duration-300 shadow-xs"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-xs font-medium text-slate-600 mt-2">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ResourceUsagePage;
