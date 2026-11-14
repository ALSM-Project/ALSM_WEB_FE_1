import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Play,
  CheckSquare,
  Square,
  Clock,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCode,
  Search,
  ArrowRight,
  Eye,
  ShieldCheck,
  Cpu,
  Loader2,
  Layers,
  XCircle,
} from 'lucide-react';
import { conversionService, type ConversionJob } from '../services/conversion.service';
import { projectService } from '@/features/projects/services/project.service';
import type { Project } from '@/features/projects/types/project';
import { resolveWorkspace } from '@/features/projects/utils/conversionTypeResolver';
import { UnsupportedProjectState } from '@/features/projects/components/UnsupportedProjectState';
import { useBulkConvert } from '../queries/useBulkConvert';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';
import { StatusBadge } from '@/shared/ui/Badge';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { ModernizationWorkflow } from '@/shared/ui/ModernizationWorkflow';

type FilterTab = 'ELIGIBLE' | 'ALL' | 'COMPLETED' | 'IN_FLIGHT' | 'FAILED';

export const BulkConvertPage: React.FC = () => {
  const { projectId = 'proj-acme' } = useParams();
  const navigate = useNavigate();

  const [screens, setScreens] = useState<LegacyScreen[]>([]);
  const [, setRecentJobs] = useState<ConversionJob[]>([]);
  const [screensLoading, setScreensLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ELIGIBLE');
  const [scheduleMode, setScheduleMode] = useState<'immediately' | 'later'>('immediately');
  const [batchSubmitted, setBatchSubmitted] = useState(false);
  const [activeBatchIds, setActiveBatchIds] = useState<string[]>([]);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const bulkConvert = useBulkConvert(projectId);

  // Load Project metadata
  useEffect(() => {
    let cancelled = false;
    Promise.resolve(projectService.getProjectById(projectId))
      .then((p) => {
        if (!cancelled) setProject(p ?? null);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const workspace = resolveWorkspace(project?.conversionType);
  const isCobol = workspace === 'PROGRAMS';

  // Helper status checks
  const isCompletedStatus = useCallback((status?: string): boolean => {
    if (!status) return false;
    const s = status.toLowerCase();
    return s === 'completed' || s === 'converted';
  }, []);

  const isInFlightStatus = useCallback((status?: string): boolean => {
    if (!status) return false;
    const s = status.toLowerCase();
    return s === 'queued' || s === 'processing' || s === 'running';
  }, []);

  const isFailedStatus = useCallback((status?: string): boolean => {
    if (!status) return false;
    const s = status.toLowerCase();
    return s === 'failed' || s === 'dead';
  }, []);

  // Fetch screens and recent jobs from real backend
  const loadData = useCallback(async () => {
    try {
      const [screensData, jobsData] = await Promise.all([
        conversionService.getScreens(projectId),
        conversionService.getProjectConversions(projectId),
      ]);

      const filtered = isCobol
        ? screensData.filter((s) => s.sourceType === 'COBOL' || s.sourceType === 'RPG' || /\.(cob|cbl)$/i.test(s.name))
        : screensData.filter((s) => s.sourceType !== 'COBOL' && s.sourceType !== 'RPG' && !/\.(cob|cbl)$/i.test(s.name));

      setScreens(filtered);
      setRecentJobs(jobsData);
      return { screens: filtered, jobs: jobsData };
    } catch (err) {
      console.error('Failed to load screens or jobs for bulk conversion', err);
      return { screens: [], jobs: [] };
    } finally {
      setScreensLoading(false);
    }
  }, [projectId, isCobol]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    setScreensLoading(true);
    loadData().then((res) => {
      if (cancelled) return;
      // Pre-select all eligible programs by default (never completed, never in-flight)
      const initialEligible = res.screens
        .filter((s) => !isCompletedStatus(s.status) && !isInFlightStatus(s.status))
        .map((s) => s.id);
      setSelectedIds(initialEligible);
    });

    return () => {
      cancelled = true;
    };
  }, [loadData, isCompletedStatus, isInFlightStatus]);

  // Derive program groups
  const completedScreens = useMemo(
    () => screens.filter((s) => isCompletedStatus(s.status)),
    [screens, isCompletedStatus],
  );

  const inFlightScreens = useMemo(
    () => screens.filter((s) => isInFlightStatus(s.status)),
    [screens, isInFlightStatus],
  );

  const failedScreens = useMemo(
    () => screens.filter((s) => isFailedStatus(s.status)),
    [screens, isFailedStatus],
  );

  const eligibleScreens = useMemo(
    () => screens.filter((s) => !isCompletedStatus(s.status) && !isInFlightStatus(s.status)),
    [screens, isCompletedStatus, isInFlightStatus],
  );

  // Check if there are any active batch jobs currently executing
  const isAnyJobActive = useMemo(() => {
    return inFlightScreens.length > 0 || (activeBatchIds.length > 0 && screens.some((s) => activeBatchIds.includes(s.id) && isInFlightStatus(s.status)));
  }, [inFlightScreens, activeBatchIds, screens, isInFlightStatus]);

  // Real-time polling when jobs are active in the BullMQ queue
  useEffect(() => {
    if (isAnyJobActive || batchSubmitted) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          loadData();
        }, 2500);
      }
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isAnyJobActive, batchSubmitted, loadData]);

  // Filtered list based on active tab and search query
  const displayedScreens = useMemo(() => {
    let list = screens;
    switch (activeTab) {
      case 'ELIGIBLE':
        list = eligibleScreens;
        break;
      case 'COMPLETED':
        list = completedScreens;
        break;
      case 'IN_FLIGHT':
        list = inFlightScreens;
        break;
      case 'FAILED':
        list = failedScreens;
        break;
      case 'ALL':
      default:
        list = screens;
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.path && s.path.toLowerCase().includes(q)) ||
          (s.inputReference && s.inputReference.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [screens, activeTab, eligibleScreens, completedScreens, inFlightScreens, failedScreens, searchQuery]);

  // Selection handlers: STRICTLY DISALLOW selecting Completed or In-Flight programs
  const handleToggleOne = (id: string) => {
    const targetScreen = screens.find((s) => s.id === id);
    if (!targetScreen) return;
    if (isCompletedStatus(targetScreen.status)) return; // Strictly locked
    if (isInFlightStatus(targetScreen.status)) return; // Already running

    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleToggleSelectAllEligible = () => {
    const selectableIds = eligibleScreens.map((s) => s.id);
    const allEligibleSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));

    if (allEligibleSelected) {
      // Deselect all eligible
      setSelectedIds((prev) => prev.filter((id) => !selectableIds.includes(id)));
    } else {
      // Select all eligible (never select completed)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...selectableIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Bulk convert execution with real backend
  const handleStartConversion = () => {
    if (selectedIds.length === 0) return;

    // Safety filter: ensure no completed programs are in the payload
    const safeIds = selectedIds.filter((id) => {
      const s = screens.find((item) => item.id === id);
      return s && !isCompletedStatus(s.status);
    });

    if (safeIds.length === 0) return;

    bulkConvert.mutate(safeIds, {
      onSuccess: (jobs) => {
        const submitted = jobs.map((j) => j.screenId).filter((id): id is string => Boolean(id));
        setActiveBatchIds(submitted.length > 0 ? submitted : safeIds);
        setBatchSubmitted(true);
        loadData();
      },
    });
  };

  // Batch progress metrics
  const batchPrograms = useMemo(() => {
    if (activeBatchIds.length === 0) return [];
    return screens.filter((s) => activeBatchIds.includes(s.id));
  }, [screens, activeBatchIds]);

  const batchCompletedCount = useMemo(
    () => batchPrograms.filter((s) => isCompletedStatus(s.status)).length,
    [batchPrograms, isCompletedStatus],
  );

  const batchProcessingCount = useMemo(
    () => batchPrograms.filter((s) => s.status?.toLowerCase() === 'processing').length,
    [batchPrograms],
  );

  const batchQueuedCount = useMemo(
    () => batchPrograms.filter((s) => s.status?.toLowerCase() === 'queued').length,
    [batchPrograms],
  );

  const batchFailedCount = useMemo(
    () => batchPrograms.filter((s) => isFailedStatus(s.status)).length,
    [batchPrograms, isFailedStatus],
  );

  const batchProgressPercent = useMemo(() => {
    if (batchPrograms.length === 0) return 0;
    return Math.round(((batchCompletedCount + batchFailedCount) / batchPrograms.length) * 100);
  }, [batchPrograms, batchCompletedCount, batchFailedCount]);

  if (workspace === 'UNSUPPORTED' && project) {
    return (
      <UnsupportedProjectState
        conversionType={project?.conversionType}
        backUrl={ROUTES.PROJECTS.LIST}
        backLabel="Back to Projects List"
      />
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* Modernization Workflow Step Banner */}
      <ModernizationWorkflow
        workflowType={isCobol ? 'PROGRAMS' : 'SCREENS'}
        currentStep="convert"
        completedSteps={['upload', 'analyze']}
        onStepClick={(stepId) => {
          if (stepId === 'upload') navigate(ROUTES.PROJECTS.UPLOAD(projectId));
          if (stepId === 'analyze') navigate(ROUTES.PROJECTS.SCREENS(projectId));
          if (stepId === 'validate') navigate(ROUTES.PROJECTS.SCREENS(projectId));
          if (stepId === 'review' || stepId === 'result') {
            const firstId = screens[0]?.id;
            if (firstId) navigate(ROUTES.PROJECTS.RESULT(projectId, firstId));
            else navigate(ROUTES.PROJECTS.SCREENS(projectId));
          }
          if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
        }}
      />

      {/* Enterprise Page Header */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#244A70] bg-[#E8F1FF] px-2.5 py-0.5 rounded-full border border-[#D4E3FC]">
                Contract 1: Platform-Based Modernization
              </span>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                {isCobol ? 'COBOL -> Java Spring Boot' : 'BMS/DSPF -> React'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#091E42] tracking-tight">
              {isCobol ? 'Bulk Convert COBOL Programs' : 'Bulk Convert Screens'}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">
              {isCobol
                ? 'Parallel deterministic transpilation: Ingest multiple COBOL programs, resolve copybook symbols, and synthesize Spring Boot Batch models & job tasklets.'
                : 'Convert multiple legacy screens to modern target frameworks simultaneously.'}
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Button
              variant="secondary"
              onClick={() => navigate(ROUTES.PROJECTS.SCREENS(projectId))}
              className="text-xs font-semibold space-x-1.5"
            >
              <Layers className="w-4 h-4 text-[#244A70]" />
              <span>Programs Workspace</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => loadData()}
              disabled={screensLoading}
              className="text-xs font-semibold p-2"
              title="Refresh status from backend"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 ${screensLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Global Statistics Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-[#E5EAF0]">
          <div className="bg-[#F7F9FC] border border-[#D9E2EC] p-3 rounded-xl text-center shadow-2xs">
            <div className="text-[11px] font-semibold text-[#6B778C]">Total Programs</div>
            <div className="text-lg font-extrabold text-[#091E42] mt-0.5">{screens.length}</div>
          </div>
          <div className="bg-blue-50/60 border border-blue-200 p-3 rounded-xl text-center shadow-2xs">
            <div className="text-[11px] font-bold text-[#244A70]">Eligible / Pending</div>
            <div className="text-lg font-extrabold text-[#244A70] mt-0.5">{eligibleScreens.length}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center shadow-2xs">
            <div className="text-[11px] font-bold text-emerald-700 flex items-center justify-center space-x-1">
              <Lock className="w-3 h-3 text-emerald-600 inline" />
              <span>Completed (Locked)</span>
            </div>
            <div className="text-lg font-extrabold text-emerald-800 mt-0.5">{completedScreens.length}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center shadow-2xs">
            <div className="text-[11px] font-bold text-amber-700">In Queue / Running</div>
            <div className="text-lg font-extrabold text-amber-800 mt-0.5">{inFlightScreens.length}</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center shadow-2xs">
            <div className="text-[11px] font-bold text-rose-700">Failed / Needs Retry</div>
            <div className="text-lg font-extrabold text-rose-800 mt-0.5">{failedScreens.length}</div>
          </div>
        </div>
      </div>

      {/* Completed Programs Safety Notice */}
      {completedScreens.length > 0 && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-emerald-900 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Source Protection Active</p>
            <p className="text-emerald-800 leading-relaxed">
              <strong>{completedScreens.length} COBOL programs</strong> have already been successfully transpiled into Java Spring Boot.
              To preserve generated code integrity and avoid accidental overwrites, completed programs are <strong>automatically locked</strong> and excluded from bulk conversion selection.
            </p>
          </div>
        </div>
      )}

      {/* Live Conversion Queue & Progress Monitor (Shows when batch is active or just submitted) */}
      {(batchSubmitted || isAnyJobActive || batchPrograms.length > 0) && (
        <div className="bg-white border-2 border-[#244A70]/30 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E8F1FF] text-[#244A70] flex items-center justify-center">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#091E42]">Live Conversion Queue & Progress</h3>
                <p className="text-xs text-[#6B778C]">
                  Real-time monitoring of BullMQ transpiler worker executing tool2java pipeline
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#244A70] border border-blue-200">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Worker Active</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-700">
                {batchCompletedCount}/{batchPrograms.length} Completed
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-[#244A70]">Overall Batch Completion</span>
              <span className="font-mono text-slate-800">{batchProgressPercent}%</span>
            </div>
            <ProgressBar progress={batchProgressPercent} color="indigo" size="md" />
          </div>

          {/* Progress Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-500">Queued</div>
              <div className="text-base font-bold text-slate-800">{batchQueuedCount}</div>
            </div>
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
              <div className="text-[11px] font-semibold text-blue-700">Transpiling (Passes 1-2.5)</div>
              <div className="text-base font-bold text-[#244A70]">{batchProcessingCount}</div>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="text-[11px] font-semibold text-emerald-700">Java Ready</div>
              <div className="text-base font-bold text-emerald-800">{batchCompletedCount}</div>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <div className="text-[11px] font-semibold text-rose-700">Failed / Blocked</div>
              <div className="text-base font-bold text-rose-800">{batchFailedCount}</div>
            </div>
          </div>

          {/* Batch Items Real-Time List */}
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {batchPrograms.map((prog) => {
              const isDone = isCompletedStatus(prog.status);
              const isRunning = prog.status?.toLowerCase() === 'processing';
              const isFail = isFailedStatus(prog.status);

              return (
                <div key={prog.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : isRunning ? (
                      <Loader2 className="w-4 h-4 text-[#244A70] animate-spin flex-shrink-0" />
                    ) : isFail ? (
                      <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                    <span className="font-mono font-bold text-slate-900 truncate">{prog.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline truncate">
                      {prog.path || prog.inputReference}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <StatusBadge status={prog.status} />
                    {isDone && (
                      <Link
                        to={ROUTES.PROJECTS.RESULT(projectId, prog.id)}
                        className="inline-flex items-center space-x-1 text-[11px] text-[#244A70] font-bold bg-[#E8F1FF] hover:bg-[#D4E3FC] px-2 py-1 rounded transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Java Code</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Workflow Action on Completion */}
          {batchProgressPercent === 100 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 bg-emerald-50/50 p-4 rounded-xl">
              <div className="flex items-center space-x-2 text-xs text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Batch Transpilation Finished. All selected programs modernized.</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => navigate(ROUTES.PROJECTS.SCREENS(projectId))}
                  className="bg-[#244A70] hover:bg-[#1B3856] text-white text-xs font-bold space-x-1.5"
                >
                  <span>Proceed to Validate & Build (Pass 3)</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(ROUTES.PROJECTS.EXPORT(projectId))}
                  className="text-xs font-bold"
                >
                  Export Project Bundle
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Two-Column Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Programs Selector Table (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Tabs & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isCobol ? 'Search COBOL programs by name or path (e.g. CBACT01C.cbl)...' : 'Search screens by name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl focus:bg-white focus:outline-none focus:border-[#244A70] font-mono text-slate-800 transition-colors"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('ELIGIBLE')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'ELIGIBLE'
                    ? 'bg-[#244A70] text-white font-bold'
                    : 'text-[#42526E] bg-slate-100 hover:bg-slate-200'
                }`}
              >
                Eligible to Convert ({eligibleScreens.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'ALL'
                    ? 'bg-[#244A70] text-white font-bold'
                    : 'text-[#42526E] bg-slate-100 hover:bg-slate-200'
                }`}
              >
                All Programs ({screens.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('COMPLETED')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${
                  activeTab === 'COMPLETED'
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>Completed ({completedScreens.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('IN_FLIGHT')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'IN_FLIGHT'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                In Queue ({inFlightScreens.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('FAILED')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'FAILED'
                    ? 'bg-rose-700 text-white font-bold'
                    : 'text-rose-800 bg-rose-50 hover:bg-rose-100'
                }`}
              >
                Failed ({failedScreens.length})
              </button>
            </div>
          </div>

          {/* Quick Select Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleToggleSelectAllEligible}
                disabled={screensLoading || eligibleScreens.length === 0}
                className="flex items-center space-x-2 text-xs font-bold text-[#244A70] hover:text-[#1B3856] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {eligibleScreens.length > 0 && eligibleScreens.every((s) => selectedIds.includes(s.id)) ? (
                  <CheckSquare className="w-4 h-4 text-[#244A70]" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Select All Eligible ({eligibleScreens.length})</span>
              </button>

              {selectedIds.length > 0 && (
                <button
                  onClick={handleClearSelection}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div className="text-xs font-semibold text-slate-600">
              <strong className="text-[#244A70]">{selectedIds.length}</strong> of{' '}
              <strong>{eligibleScreens.length}</strong> eligible programs selected
            </div>
          </div>

          {/* Programs Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
            {screensLoading ? (
              <div className="p-12 text-center text-sm text-slate-500 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#244A70]" />
                <p>Loading COBOL programs repository…</p>
              </div>
            ) : displayedScreens.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500 space-y-1">
                <FileCode className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No programs match this filter</p>
                <p className="text-xs text-slate-400">Try changing the tab or clear search query.</p>
              </div>
            ) : (
              displayedScreens.map((screen) => {
                const isSelected = selectedIds.includes(screen.id);
                const isCompleted = isCompletedStatus(screen.status);
                const isInFlight = isInFlightStatus(screen.status);

                return (
                  <div
                    key={screen.id}
                    onClick={() => {
                      if (!isCompleted && !isInFlight) {
                        handleToggleOne(screen.id);
                      }
                    }}
                    className={`p-4 flex items-center justify-between transition-colors ${
                      isCompleted
                        ? 'bg-slate-50/70 opacity-90 cursor-not-allowed'
                        : isInFlight
                        ? 'bg-amber-50/40 cursor-wait'
                        : isSelected
                        ? 'bg-blue-50/70 border-l-4 border-l-[#244A70] cursor-pointer'
                        : 'hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0 pr-3">
                      {/* Checkbox or Lock Icon */}
                      <div className="shrink-0">
                        {isCompleted ? (
                          <div
                            className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300"
                            title="Program already completed. Selection locked to protect generated artifacts."
                          >
                            <Lock className="w-3 h-3" />
                          </div>
                        ) : isInFlight ? (
                          <div
                            className="w-5 h-5 rounded bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-300"
                            title="Program currently queued or converting."
                          >
                            <Loader2 className="w-3 h-3 animate-spin" />
                          </div>
                        ) : isSelected ? (
                          <CheckSquare className="w-5 h-5 text-[#244A70]" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                        )}
                      </div>

                      {/* File Details */}
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-bold text-slate-900 font-mono truncate">{screen.name}</p>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                            {screen.sourceType}
                          </span>
                          {isCompleted && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                              Java Ready (Protected)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
                          {screen.path || screen.inputReference || 'Source root program'}
                        </p>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center space-x-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={screen.status} />

                      {isCompleted ? (
                        <Link
                          to={ROUTES.PROJECTS.RESULT(projectId, screen.id)}
                          className="inline-flex items-center space-x-1 text-xs text-[#244A70] font-bold hover:bg-slate-100 bg-[#F0F4F8] px-2.5 py-1 rounded-md border border-[#DCE3EC] transition-colors"
                          title="Inspect Generated Java Code"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Code</span>
                        </Link>
                      ) : (
                        <Link
                          to={ROUTES.PROJECTS.METHOD_MAPPING(projectId, screen.id)}
                          className="inline-flex items-center space-x-1 text-xs text-[#42526E] font-semibold hover:text-[#244A70] hover:bg-slate-100 px-2.5 py-1 rounded-md transition-colors"
                          title="Inspect Method Mapping"
                        >
                          <span>Mapping</span>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Settings & Execution Controller (1/3) */}
        <div className="space-y-6">
          <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 space-y-6 shadow-2xs">
            <h3 className="text-xs font-bold text-[#42526E] uppercase tracking-wider">
              Batch Conversion Parameters
            </h3>

            {/* Architecture Overview */}
            <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#D9E2EC] space-y-3 text-xs">
              <div className="flex justify-between items-start gap-3 font-medium">
                <span className="text-[#6B778C]">Modernization Tier</span>
                <span className="text-[#244A70] font-bold text-right">
                  Contract 1: Platform-Based
                </span>
              </div>
              <div className="flex justify-between items-start gap-3 font-medium">
                <span className="text-[#6B778C]">Target Architecture</span>
                <span className="text-[#091E42] font-semibold text-right">
                  Java 21 • Spring Boot Batch
                </span>
              </div>
              <div className="flex justify-between items-start gap-3 font-medium">
                <span className="text-[#6B778C]">Conversion Engine</span>
                <span className="text-[#091E42] font-semibold text-right">
                  ALSM tool2java Project Compiler
                </span>
              </div>
              <div className="flex justify-between items-start gap-3 font-medium">
                <span className="text-[#6B778C]">Database Adapter</span>
                <span className="text-[#091E42] font-semibold text-right">
                  JDBC via SqlSupport Runtime
                </span>
              </div>

              <div className="pt-2 border-t border-[#E5EAF0] space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#244A70]">
                  <span>Selected for Modernization</span>
                  <span className="font-mono">{selectedIds.length} program(s)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Workers will run AST parsing, CICS normalizations, and Java class synthesis in parallel.
                </p>
              </div>
            </div>

            {/* Scheduling Options */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#42526E]">BATCH SCHEDULE</label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center space-x-2.5 p-2.5 bg-[#F7F9FC] rounded-xl border border-[#D9E2EC] cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="radio"
                    name="schedule"
                    checked={scheduleMode === 'immediately'}
                    onChange={() => setScheduleMode('immediately')}
                    className="text-[#244A70] focus:ring-[#244A70]"
                  />
                  <div>
                    <span className="text-[#091E42] font-semibold block">Execute immediately</span>
                    <span className="text-[11px] text-slate-500">Enqueue into BullMQ conversion worker pool right away</span>
                  </div>
                </label>
                <label className="flex items-center space-x-2.5 p-2.5 bg-[#F7F9FC] rounded-xl border border-[#D9E2EC] cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="radio"
                    name="schedule"
                    checked={scheduleMode === 'later'}
                    onChange={() => setScheduleMode('later')}
                    className="text-[#244A70] focus:ring-[#244A70]"
                  />
                  <div>
                    <span className="text-[#091E42] font-semibold block">Off-peak batch queue</span>
                    <span className="text-[11px] text-slate-500">Assign lower priority for overnight worker processing</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Estimated time */}
            <div className="flex items-center space-x-2 text-xs text-[#6B778C] pt-2 border-t border-[#E5EAF0] font-medium">
              <Clock className="w-4 h-4 text-[#244A70] shrink-0" />
              <span>
                Estimated execution: ~{Math.max(1, Math.round(selectedIds.length * 0.4))} minute(s) across concurrent worker threads.
              </span>
            </div>

            {/* Execution Trigger */}
            <div className="space-y-2 pt-2">
              {bulkConvert.error && (
                <div className="flex items-start space-x-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    {bulkConvert.error instanceof Error
                      ? bulkConvert.error.message
                      : 'Could not enqueue the bulk conversion jobs. Please check network and retry.'}
                  </span>
                </div>
              )}

              <Button
                onClick={handleStartConversion}
                isLoading={bulkConvert.isPending}
                disabled={selectedIds.length === 0 || screensLoading}
                className="w-full py-3 space-x-2 font-bold bg-[#244A70] hover:bg-[#1B3856] text-white shadow-xs cursor-pointer text-xs"
              >
                <Play className="w-4 h-4" />
                <span>Start Bulk Conversion ({selectedIds.length} Programs)</span>
              </Button>

              <Button
                variant="secondary"
                onClick={() => navigate(ROUTES.PROJECTS.SCREENS(projectId))}
                className="w-full text-xs font-semibold"
              >
                Return to Programs Workspace
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkConvertPage;
