import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Search, Plus, FileCode, Layers, AlertTriangle, CheckCircle2, XCircle, Play, Eye, Code2, Stethoscope, Trash2, GitBranch } from 'lucide-react';
import { conversionService } from '@/features/conversion/services/conversion.service';
import { useBulkConvert } from '@/features/conversion/queries/useBulkConvert';
import type { LegacyScreen } from '../types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { Tabs } from '@/shared/ui/Tabs';
import { StatusBadge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ModernizationWorkflow } from '@/shared/ui/ModernizationWorkflow';
import { DependencyDiagnosticsModal } from '../components/DependencyDiagnosticsModal';
import {
  POLL_INTERVAL_MS,
  isActiveStatus,
  reconcileTracked,
  sameScreens,
  shouldPoll,
  trackConversions,
  withQueuedStatus,
  type TrackedConversions,
} from '../utils/conversionPolling';

const PROGRAM_SOURCE_TYPES = new Set(['COBOL', 'RPG']);

/** What the bulk-convert page passes when it hands over to this page after starting a batch. */
export interface ScreensListLocationState {
  startPolling?: boolean;
  screenIds?: string[];
}

export const ScreensListPage: React.FC = () => {
  const { projectId = 'proj-acme' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('screens');
  const [fetchedAssets, setFetchedAssets] = useState<LegacyScreen[]>([]);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  // Screens sent to the conversion queue from this page (or the bulk-convert page): the backend
  // keeps them "Ready" until a worker takes them, so they are watched and shown as queued.
  const [tracked, setTracked] = useState<TrackedConversions>({});
  const allAssets = React.useMemo(
    () => withQueuedStatus(fetchedAssets, tracked, Date.now()),
    [fetchedAssets, tracked],
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dependencyModalScreenId, setDependencyModalScreenId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LegacyScreen | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // A refresh that is still in flight when the next one is due, or that answers after the project
  // changed, must not be applied on top of newer data.
  const loadSequence = useRef(0);
  const loading = useRef(false);

  const loadScreens = useCallback(() => {
    if (loading.current) return;
    loading.current = true;
    const sequence = ++loadSequence.current;
    conversionService
      .getScreens(projectId)
      .then((data) => {
        if (sequence !== loadSequence.current) return;
        // Same list as before: keep the state, so the table is not re-rendered for nothing.
        setFetchedAssets((prev) => (sameScreens(prev, data) ? prev : data));
        setAssetsLoaded(true);
      })
      .catch(() => {
        // A failed background refresh keeps what is on screen; the next tick tries again.
      })
      .finally(() => {
        loading.current = false;
      });
  }, [projectId]);

  useEffect(() => {
    // Another project: its list starts empty and nothing of the previous one is tracked.
    setFetchedAssets([]);
    setAssetsLoaded(false);
    setTracked({});
    loading.current = false;
    loadScreens();
    return () => {
      // Plain counters, not DOM nodes: a late answer for the old project is thrown away.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      loadSequence.current++;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      loading.current = false;
    };
  }, [loadScreens]);

  // Coming from the bulk-convert page: watch the screens it just sent.
  useEffect(() => {
    const state = location.state as ScreensListLocationState | null;
    if (!state?.startPolling) return;
    setTracked((prev) => trackConversions(prev, state.screenIds ?? [], [], Date.now()));
    // Consumed: a reload of the page must not start watching again.
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop watching the screens that are done.
  useEffect(() => {
    if (!assetsLoaded) return;
    setTracked((prev) => reconcileTracked(prev, fetchedAssets, Date.now()));
  }, [fetchedAssets, assetsLoaded]);

  // Refresh every 3 s while something is converting or waiting in the queue, and only then:
  // the interval is cleared when everything is done, the project changes or the page closes.
  const polling = assetsLoaded && shouldPoll(fetchedAssets, tracked);
  useEffect(() => {
    if (!polling) return;
    const timer = setInterval(() => {
      if (!document.hidden) loadScreens();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [polling, loadScreens]);

  // ---- Bulk Convert of the COBOL programs, straight from this page ----
  const bulkConvert = useBulkConvert(projectId);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  };

  const closeBulkConfirm = () => {
    if (bulkConvert.isPending) return;
    bulkConvert.reset();
    setBulkConfirmOpen(false);
  };

  const handleDeleteScreen = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const ok = await conversionService.deleteScreen(projectId, deleteTarget.id);
    setIsDeleting(false);
    if (ok) {
      setFetchedAssets((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  // Screens (BMS/DSPF/TXT) vs Programs (COBOL/RPG) share the same real data source
  // (whatever was uploaded, plus the app's baseline demo screens) — split by sourceType
  // instead of keeping a second, disconnected hardcoded list.
  const screens = allAssets.filter((a) => !PROGRAM_SOURCE_TYPES.has(a.sourceType));
  const programs = allAssets.filter((a) => PROGRAM_SOURCE_TYPES.has(a.sourceType));

  const applyFilters = (items: LegacyScreen[]) =>
    items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const itemStatus = item.status.toUpperCase();
      const targetFilter = statusFilter.toUpperCase();
      const matchesStatus =
        statusFilter === 'ALL' ||
        itemStatus === targetFilter ||
        (targetFilter === 'PROCESSING' && itemStatus === 'QUEUED') ||
        (targetFilter === 'COMPLETED' && (itemStatus === 'CONVERTED' || itemStatus === 'COMPLETED')) ||
        (targetFilter === 'CONVERTED' && (itemStatus === 'CONVERTED' || itemStatus === 'COMPLETED'));
      return matchesSearch && matchesStatus;
    });

  const filteredScreens = applyFilters(screens);
  const filteredPrograms = applyFilters(programs);
  const activeList = activeTab === 'screens' ? filteredScreens : filteredPrograms;
  const activeFullList = activeTab === 'screens' ? screens : programs;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Reset to page 1 on filter or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, activeTab]);

  const totalCount = activeList.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedList = activeList.slice(startIndex, startIndex + pageSize);

  // Programs still to convert: everything not completed (a failed or reviewed one is converted
  // again), except what is already running or waiting in the queue.
  const pendingPrograms = programs.filter(
    (p) => !isActiveStatus(p.status) && !['completed', 'converted'].includes(p.status.toLowerCase()),
  );

  const handleBulkConvertClick = () => {
    if (activeTab === 'programs') setBulkConfirmOpen(true);
    else navigate(ROUTES.PROJECTS.BULK_CONVERT(projectId));
  };

  const handleConfirmBulkConvert = () => {
    const ids = pendingPrograms.map((p) => p.id);
    if (ids.length === 0) return;
    bulkConvert.mutate(ids, {
      onSuccess: (jobs) => {
        const startedIds = jobs.map((job) => job.screenId).filter((id): id is string => Boolean(id));
        const sent = startedIds.length > 0 ? startedIds : ids;
        // From now on they show as Queued, and the list follows them until each one is done.
        setTracked((prev) => trackConversions(prev, sent, fetchedAssets, Date.now()));
        setBulkConfirmOpen(false);
        showToast(`Bulk conversion started for ${sent.length} program${sent.length === 1 ? '' : 's'}`);
        loadScreens();
      },
    });
  };

  const metrics = {
    total: activeFullList.length,
    converted: activeFullList.filter(
      (a) => a.status === 'Completed' || a.status === 'Converted' || a.status === 'COMPLETED',
    ).length,
    reviewRequired: activeFullList.filter((a) => a.status === 'Review Required').length,
    failed: activeFullList.filter((a) => a.status === 'Failed').length,
  };

  return (
    <div className="space-y-6">
      {/* Reusable Standard PageHeader */}
      <PageHeader
        title="Screens & Programs Workspace"
        subtitle="Analyze, convert, validate, and inspect legacy screen mapsets and COBOL business logic programs."
        actions={
          <div className="flex items-center space-x-3 shrink-0">
            <Button
              variant="secondary"
              onClick={handleBulkConvertClick}
              className="space-x-1.5 text-xs font-semibold"
            >
              <Play className="w-4 h-4 text-[#0652CC]" />
              <span>Bulk Convert</span>
            </Button>
            <Button
              onClick={() => navigate(ROUTES.PROJECTS.UPLOAD(projectId))}
              className="bg-[#0652CC] hover:bg-[#0655FF] text-white space-x-1.5 text-xs font-bold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Source File</span>
            </Button>
          </div>
        }
      />

      {toast && (
        <div
          role="status"
          className="p-4 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toast}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className="text-xs font-bold text-slate-400 hover:text-slate-600 ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modernization Workflow Step Banner */}
      <ModernizationWorkflow
        currentStep="convert"
        completedSteps={['upload']}
        onStepClick={(stepId) => {
          const firstScreenId = activeList[0]?.id || 'Screen';
          if (stepId === 'upload') navigate(ROUTES.PROJECTS.UPLOAD(projectId));
          if (stepId === 'mapping') navigate(ROUTES.PROJECTS.MAPPING(projectId, firstScreenId));
          if (stepId === 'conversion') navigate(ROUTES.PROJECTS.CONVERT(projectId, firstScreenId));
          if (stepId === 'validation' || stepId === 'review') navigate(ROUTES.PROJECTS.REVIEW(projectId, firstScreenId));
          if (stepId === 'result') navigate(ROUTES.PROJECTS.RESULT(projectId, firstScreenId));
          if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
        }}
      />

      {/* Metric Cards - Interactive Filter & Quick Navigation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Assets Card -> Filter ALL */}
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`text-left bg-white border p-4 rounded-2xl flex items-center space-x-4 shadow-2xs cursor-pointer transition-all hover:border-[#0652CC] ${
            statusFilter === 'ALL' ? 'border-[#0652CC] ring-2 ring-blue-100 bg-blue-50/20' : 'border-[#D9E2EC]'
          }`}
          title="Click to view all assets"
        >
          <div className="p-3 bg-[#E8F1FF] text-[#0652CC] rounded-xl border border-blue-100 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#42526E]">Total Assets</p>
            <p className="text-2xl font-extrabold text-[#091E42] mt-0.5">
              {metrics.total} {activeTab === 'screens' ? 'Screens' : 'Programs'}
            </p>
          </div>
        </button>

        {/* 2. Converted Card -> Filter COMPLETED */}
        <button
          type="button"
          onClick={() => setStatusFilter('COMPLETED')}
          className={`text-left bg-white border p-4 rounded-2xl flex items-center space-x-4 shadow-2xs cursor-pointer transition-all hover:border-emerald-500 ${
            statusFilter === 'COMPLETED' ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20' : 'border-[#D9E2EC]'
          }`}
          title="Click to filter by Converted status"
        >
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#42526E]">Converted</p>
            <p className="text-2xl font-extrabold text-emerald-800 mt-0.5">{metrics.converted}</p>
          </div>
        </button>

        {/* 3. Review Required Card -> Filter REVIEW REQUIRED */}
        <button
          type="button"
          onClick={() => setStatusFilter('REVIEW REQUIRED')}
          className={`text-left bg-white border p-4 rounded-2xl flex items-center space-x-4 shadow-2xs cursor-pointer transition-all hover:border-amber-500 ${
            statusFilter === 'REVIEW REQUIRED' ? 'border-amber-500 ring-2 ring-amber-100 bg-amber-50/20' : 'border-[#D9E2EC]'
          }`}
          title="Click to filter by Review Required status"
        >
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#42526E]">Review Required</p>
            <p className="text-2xl font-extrabold text-amber-800 mt-0.5">{metrics.reviewRequired}</p>
          </div>
        </button>

        {/* 4. Failed Card -> Direct Link to Diagnostics */}
        <Link
          to={ROUTES.PROJECTS.DIAGNOSTICS(projectId)}
          className="bg-white border border-[#D9E2EC] p-4 rounded-2xl flex items-center space-x-4 shadow-2xs hover:border-rose-400 hover:shadow-xs transition-all cursor-pointer group"
          title="Click to view Diagnostics & Error Logs"
        >
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 group-hover:scale-105 transition-transform shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#42526E]">Failed (Diagnostics)</p>
            <p className="text-2xl font-extrabold text-rose-800 mt-0.5">{metrics.failed}</p>
          </div>
        </Link>
      </div>

      <Tabs
        tabs={[
          { id: 'screens', label: 'Legacy Screens (BMS/DSPF)', count: screens.length },
          { id: 'programs', label: 'COBOL Programs (Logic)', count: programs.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between bg-white p-4 rounded-2xl border border-[#D9E2EC] shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#6B778C]" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'screens' ? 'legacy screens' : 'COBOL programs'} by name...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0652CC] text-[#091E42] placeholder-[#6B778C]"
          />
        </div>

        <div className="flex space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F7F9FC] border border-[#D9E2EC] text-[#091E42] text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
          >
            <option value="ALL">Status: All</option>
            <option value="READY">Ready</option>
            <option value="COMPLETED">Completed</option>
            <option value="PROCESSING">Processing / Converting</option>
            <option value="REVIEW REQUIRED">Needs Review</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Enterprise Data Table with Exact 5 Columns & Width Proportions */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-xs table-fixed">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[16%]" />
              <col className="w-[14%]" />
              <col className="w-[18%]" />
              <col className="w-[28%]" />
            </colgroup>
            <thead className="bg-[#F7F9FC] text-[#42526E] font-bold uppercase tracking-wider text-[11px] border-b border-[#D9E2EC]">
              <tr>
                <th className="py-3.5 px-4">{activeTab === 'screens' ? 'SCREEN NAME' : 'PROGRAM NAME'}</th>
                <th className="py-3.5 px-4">LEGACY SOURCE TYPE</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4">LAST UPDATED</th>
                <th className="py-3.5 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {paginatedList.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-slate-500">
                    No {activeTab === 'screens' ? 'screens' : 'programs'} match your filters yet. Upload a
                    source file to get started.
                  </td>
                </tr>
              )}
              {paginatedList.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => navigate(ROUTES.PROJECTS.CONVERT(projectId, item.id))}
                  className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                >
                  {/* 1. SCREEN NAME (24%) */}
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#091E42]">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <FileCode className="w-4 h-4 text-[#0652CC] flex-shrink-0" />
                      <span className="group-hover:text-[#0652CC] group-hover:underline truncate">
                        {item.name}
                      </span>
                    </div>
                  </td>

                  {/* 2. LEGACY SOURCE TYPE (16%) */}
                  <td className="py-3.5 px-4 text-xs font-semibold text-[#42526E] font-mono truncate">
                    {item.sourceType ?? (activeTab === 'screens' ? 'BMS/DSPF' : 'COBOL')}
                  </td>

                  {/* 3. STATUS (14%) */}
                  <td className="py-3.5 px-4">
                    <StatusBadge status={item.status} />
                  </td>

                  {/* 4. LAST UPDATED (18%) */}
                  <td className="py-3.5 px-4 text-xs text-[#6B778C] truncate">
                    {item.lastUpdated}
                  </td>

                  {/* 5. ACTIONS (28%) */}
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center space-x-1.5 shrink-0 whitespace-nowrap">
                      {item.status === 'Failed' ? (
                        <>
                          <Link
                            to={ROUTES.PROJECTS.DIAGNOSTICS(projectId)}
                            className="inline-flex items-center space-x-1 text-xs text-rose-700 font-semibold bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>Diagnostics</span>
                          </Link>
                          {PROGRAM_SOURCE_TYPES.has(item.sourceType) && (
                            <button
                              onClick={() => setDependencyModalScreenId(item.id)}
                              className="inline-flex items-center space-x-1 text-xs text-[#42526E] font-semibold bg-[#F7F9FC] px-2.5 py-1.5 rounded-lg border border-[#D9E2EC] hover:bg-slate-100 transition-colors"
                              title="View copybook dependency diagnostics"
                            >
                              <GitBranch className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Dependencies</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <Link
                            to={ROUTES.PROJECTS.MAPPING(projectId, item.id)}
                            className="inline-flex items-center space-x-1 text-xs text-[#42526E] font-semibold hover:text-[#0652CC] bg-[#F7F9FC] px-2.5 py-1.5 rounded-lg border border-[#D9E2EC] transition-colors"
                            title="Inspect Field Mapping"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                            <span>Mapping</span>
                          </Link>

                          <Link
                            to={ROUTES.PROJECTS.CONVERT(projectId, item.id)}
                            className="inline-flex items-center space-x-1 text-xs text-[#0652CC] font-semibold hover:bg-blue-50 bg-[#E8F1FF] px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors"
                            title="Algorithm Conversion Engine"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Convert</span>
                          </Link>

                          <Link
                            to={ROUTES.PROJECTS.RESULT(projectId, item.id)}
                            className="inline-flex items-center space-x-1 text-xs text-emerald-700 font-semibold hover:bg-emerald-100 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                            title="View Modernized Output"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Result</span>
                          </Link>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                        className="inline-flex items-center space-x-1 text-xs text-rose-600 font-semibold hover:bg-rose-100 bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-200 transition-colors"
                        title="Delete this screen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Server-Side Style Pagination Footer */}
        <div className="bg-[#F7F9FC] px-4 py-3 border-t border-[#D9E2EC] flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[#6B778C] font-medium">
          <div className="flex items-center space-x-3">
            <span>
              Showing {totalCount === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, totalCount)} of {totalCount}{' '}
              {activeTab === 'screens' ? 'legacy screens' : 'COBOL programs'}
            </span>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] text-[#42526E]">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#D9E2EC] text-[#091E42] text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Page Controls */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-[#D9E2EC] bg-white text-[#42526E] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-semibold text-xs transition-colors"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    currentPage === pageNum
                      ? 'bg-[#0652CC] text-white shadow-2xs'
                      : 'bg-white border border-[#D9E2EC] text-[#42526E] hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-[#D9E2EC] bg-white text-[#42526E] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-semibold text-xs transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={bulkConfirmOpen} onClose={closeBulkConfirm} title="Bulk Convert" maxWidth="md">
        <div className="p-6 space-y-4">
          <p className="text-sm text-[#091E42]">
            {pendingPrograms.length > 0
              ? `Convert all pending COBOL programs (${pendingPrograms.length} programs)?`
              : 'There are no pending COBOL programs to convert.'}
          </p>
          <p className="text-xs text-[#6B778C]">
            They are put in the queue and converted a few at a time; this page follows their progress.
          </p>
          {bulkConvert.isError && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {bulkConvert.error instanceof Error
                ? bulkConvert.error.message
                : 'Could not start the bulk conversion. Please try again.'}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeBulkConfirm} disabled={bulkConvert.isPending} className="text-xs font-semibold">
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(ROUTES.PROJECTS.BULK_CONVERT(projectId))}
              disabled={bulkConvert.isPending}
              className="text-xs font-semibold"
            >
              Choose programs…
            </Button>
            <Button
              onClick={handleConfirmBulkConvert}
              isLoading={bulkConvert.isPending}
              disabled={pendingPrograms.length === 0}
              className="bg-[#0652CC] hover:bg-[#0655FF] text-white text-xs font-bold space-x-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Convert {pendingPrograms.length} programs</span>
            </Button>
          </div>
        </div>
      </Modal>

      <DependencyDiagnosticsModal
        isOpen={dependencyModalScreenId !== null}
        onClose={() => setDependencyModalScreenId(null)}
        screenId={dependencyModalScreenId}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-opacity"
            onClick={() => !isDeleting && setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-md mx-auto space-y-4 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Screen</h3>
                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-700">
              Are you sure you want to delete <strong className="font-mono text-rose-700">{deleteTarget.name}</strong>?
              All associated conversion results and data will be permanently removed.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteScreen}
                isLoading={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Screen</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreensListPage;
