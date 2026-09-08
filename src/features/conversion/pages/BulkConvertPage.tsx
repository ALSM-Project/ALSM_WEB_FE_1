import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, CheckSquare, Square, Clock, ArrowUpRight } from 'lucide-react';
import { conversionService } from '../services/conversion.service';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';
import { StatusBadge } from '@/shared/ui/Badge';
import { Breadcrumb } from '@/shared/navigation/Breadcrumb';

export const BulkConvertPage: React.FC = () => {
  const { projectId = 'proj-acme' } = useParams();
  const navigate = useNavigate();

  const [screens, setScreens] = useState<LegacyScreen[]>([]);
  const [screensLoading, setScreensLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetFramework, setTargetFramework] = useState('React');
  const [scheduleMode, setScheduleMode] = useState<'immediately' | 'later'>('immediately');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setScreensLoading(true);
    conversionService.getScreens(projectId).then((data) => {
      if (cancelled) return;
      setScreens(data);
      setSelectedIds(data.filter((s) => s.status !== 'Completed').map((s) => s.id));
      setScreensLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const handleToggleSelectAll = () => {
    if (selectedIds.length === screens.length) setSelectedIds([]);
    else setSelectedIds(screens.map((s) => s.id));
  };

  const handleToggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStartConversion = async () => {
    setLoading(true);
    try {
      await conversionService.bulkConvertScreens(projectId, selectedIds);
      navigate(ROUTES.PROJECTS.SCREENS(projectId));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-2">
      <Breadcrumb
        items={[
          { label: 'Projects', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'Acme Corp Modernization', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'Bulk Convert Screens' },
        ]}
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Bulk Convert Screens</h1>
        <p className="text-slate-500 text-sm mt-1">Convert multiple legacy screens to modern frameworks simultaneously.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <button
              onClick={handleToggleSelectAll}
              disabled={screensLoading || screens.length === 0}
              className="flex items-center space-x-2 text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedIds.length === screens.length && screens.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-brand-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All ({screens.length} screens in view)</span>
            </button>

            {selectedIds.length > 0 && (
              <span className="text-xs text-brand-600 font-semibold">
                {selectedIds.length} screens selected
              </span>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-sm">
            {screensLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading screens…</div>
            ) : screens.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No screens available for this project.</div>
            ) : (
              screens.map((screen) => {
                const isSelected = selectedIds.includes(screen.id);
                return (
                  <div
                    key={screen.id}
                    onClick={() => handleToggleOne(screen.id)}
                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-900 font-mono">{screen.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{screen.path}</p>
                      </div>
                    </div>

                    <StatusBadge status={screen.status} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversion Settings</h3>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">TARGET FRAMEWORK</label>
              <select
                value={targetFramework}
                onChange={(e) => setTargetFramework(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-600 shadow-xs font-medium"
              >
                <option value="React">React (Next.js compatible)</option>
                <option value="Vue">Vue 3 Composition API</option>
                <option value="Angular">Angular 17</option>
              </select>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-center font-medium">
                <span className="text-slate-600">Resource Utilization</span>
                <a href={ROUTES.BILLING.PRICING} className="text-brand-600 font-semibold hover:underline flex items-center">
                  <span>Upgrade plan</span>
                  <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </a>
              </div>
              <p className="text-brand-700 font-semibold">This operation will use {selectedIds.length} credits.</p>
              <div className="text-slate-500 pt-1.5 border-t border-slate-200">
                Monthly Usage: <strong className="text-slate-900">48 / 500 credits</strong>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">SCHEDULING</label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="radio"
                    name="schedule"
                    checked={scheduleMode === 'immediately'}
                    onChange={() => setScheduleMode('immediately')}
                    className="text-brand-600 focus:ring-brand-600"
                  />
                  <span className="text-slate-800 font-medium">Start immediately</span>
                </label>
                <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="radio"
                    name="schedule"
                    checked={scheduleMode === 'later'}
                    onChange={() => setScheduleMode('later')}
                    className="text-brand-600 focus:ring-brand-600"
                  />
                  <span className="text-slate-800 font-medium">Schedule for later (Off-peak)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>Estimated total time: 3 minutes</span>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                onClick={handleStartConversion}
                isLoading={loading}
                disabled={selectedIds.length === 0 || screensLoading}
                className="w-full py-2.5 space-x-2 font-semibold"
              >
                <Play className="w-4 h-4" />
                <span>Start Conversion ({selectedIds.length})</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate(ROUTES.PROJECTS.SCREENS(projectId))}
                className="w-full text-xs font-semibold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BulkConvertPage;
