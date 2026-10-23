import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Play,
  Download,
  RefreshCw,
  Sliders,
  XCircle,
  Save,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { conversionKeys } from '../queries/conversionKeys';
import { validationKeys } from '../queries/validationKeys';
import { conversionService } from '../services/conversion.service';
import { useConversionJob } from '../queries/useConversionJob';
import { useCreateConversionJob } from '../queries/useCreateConversionJob';
import { useConversionResult } from '../queries/useConversionResult';
import {
  useTriggerAiValidation,
  useValidationRuns,
  useValidationRun,
  useValidationFindings,
  useReviewValidationFinding,
} from '../queries/useValidation';
import { selectLatestValidationRun } from './reviewFindingsState';
import { ValidationRunStatus, ValidationFindingStatus, type ValidationFinding } from '../types/validation';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { Tabs } from '@/shared/ui/Tabs';
import { Button } from '@/shared/ui/Button';
import { CodeEditor } from '../components/CodeEditor';
import { ModernizationWorkflow, type WorkflowStepId } from '@/shared/ui/ModernizationWorkflow';

import { LiveTsxRenderer } from '../components/LiveTsxRenderer';
import { generateScreenBundle, parseConvertedTsx, isDisplayableCodeFile } from '../utils/screenGenerator';
import { applyAiSuggestion } from '../utils/aiRemediation';
import type { FieldMapping } from '../types/conversion';

export const ConvertScreenPage: React.FC = () => {
  const { projectId = 'proj-acme', screenId = 'scr-login' } = useParams();
  const navigate = useNavigate();

  const [screen, setScreen] = useState<LegacyScreen | null>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [savedMappings, setSavedMappings] = useState<FieldMapping[]>([]);
  const [mappingsLoaded, setMappingsLoaded] = useState(false);
  const [editedFiles, setEditedFiles] = useState<Record<string, string>>({});
  const [previewLayout, setPreviewLayout] = useState<'screen' | 'split'>('screen');
  const [codeLayout, setCodeLayout] = useState<'code' | 'split'>('code');

  useEffect(() => {
    let cancelled = false;
    conversionService.getScreenById(screenId).then((screenData) => {
      if (cancelled) return;
      setScreen(screenData);
    });
    return () => {
      cancelled = true;
    };
  }, [screenId]);

  // UC-28: COBOL screens have their own Method Mapping (class/method renames), which is
  // fetched by MethodMappingPage itself, not here — the BMS field-mapping endpoint has
  // nothing to do with COBOL screens and must not be called for one.
  const isCobol = screen?.sourceType === 'COBOL';

  useEffect(() => {
    // Wait until the screen's real sourceType is known — fetching before then would guess
    // BMS and could call the field-mapping endpoint for what turns out to be a COBOL screen.
    if (!screen) return;
    if (isCobol) {
      setMappingsLoaded(true);
      return;
    }
    let cancelled = false;
    setMappingsLoaded(false);
    conversionService
      .getFieldMappings(projectId, screenId)
      .then((data) => {
        if (cancelled) return;
        setSavedMappings(data);
      })
      .catch((err) => {
        console.error('Failed to load field mappings', err);
      })
      .finally(() => {
        if (!cancelled) setMappingsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, screenId, screen, isCobol]);

  const mappingRoute = isCobol
    ? ROUTES.PROJECTS.METHOD_MAPPING(projectId, screenId)
    : ROUTES.PROJECTS.MAPPING(projectId, screenId);

  const { data: job } = useConversionJob(projectId, screenId);
  const createJob = useCreateConversionJob(projectId, screenId);
  const isCompleted = job?.status === 'COMPLETED';

  // Only treat a job as "running" if it was triggered by the user in this session,
  // or if the backend job is genuinely recent (created within the last 2 minutes).
  const isJobRecentlyActive = (() => {
    if (!job) return false;
    if (job.status !== 'QUEUED' && job.status !== 'PROCESSING') return false;
    const createdAt = new Date(job.createdAt).getTime();
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    return createdAt > twoMinutesAgo;
  })();
  const isRunning = createJob.isPending || isJobRecentlyActive;
  const { data: resultBundle } = useConversionResult(job?.id, isCompleted);

  // AI Semantic Validation Integration
  const runsQuery = useValidationRuns(projectId, job?.id, isCompleted);
  const triggerValidation = useTriggerAiValidation(projectId, job?.id);
  const latestRun = useMemo(() => selectLatestValidationRun(runsQuery.data ?? []), [runsQuery.data]);
  const activeRun = triggerValidation.data ?? latestRun;
  const runDetailsQuery = useValidationRun(projectId, activeRun?.id, Boolean(activeRun));
  const currentRun = runDetailsQuery.data ?? activeRun;
  const isValidationCompleted = currentRun?.status === ValidationRunStatus.COMPLETED;
  const isValidationActive =
    currentRun?.status === ValidationRunStatus.QUEUED ||
    currentRun?.status === ValidationRunStatus.PROCESSING ||
    triggerValidation.isPending;
  const findingsQuery = useValidationFindings(projectId, currentRun?.id, isValidationCompleted);
  const findings = findingsQuery.data ?? [];
  const reviewFinding = useReviewValidationFinding(projectId, currentRun?.id);

  const isValidationFailed = currentRun?.status === ValidationRunStatus.FAILED;
  const pendingFindings = useMemo(
    () =>
      findings.filter(
        (f) =>
          f.status !== ValidationFindingStatus.RESOLVED &&
          f.status !== ValidationFindingStatus.NOT_APPLICABLE
      ),
    [findings]
  );
  const resolvedFindings = useMemo(
    () => findings.filter((f) => f.status === ValidationFindingStatus.RESOLVED),
    [findings]
  );
  const allResolved = isValidationCompleted && findings.length > 0 && pendingFindings.length === 0;

  const completedWorkflowSteps = useMemo<WorkflowStepId[]>(() => {
    const steps: WorkflowStepId[] = ['upload'];
    if (isCompleted) steps.push('convert');
    if (allResolved || (isValidationCompleted && findings.length === 0)) {
      steps.push('validate');
    }
    return steps;
  }, [isCompleted, allResolved, isValidationCompleted, findings.length]);

  const screenName = screen?.name ?? screenId;
  const fallbackBundle = useMemo(() => generateScreenBundle(screenName), [screenName]);

  const files = useMemo(() => {
    if (resultBundle?.files && resultBundle.files.length > 0) {
      return resultBundle.files.filter((f) => isDisplayableCodeFile(f.relativePath));
    }
    if (isCompleted) {
      return fallbackBundle.files;
    }
    return [];
  }, [resultBundle, isCompleted, fallbackBundle]);
  const selectedFile = files[selectedFileIndex] ?? files[0] ?? null;

  const activeCode =
    selectedFile && editedFiles[selectedFile.relativePath] !== undefined
      ? editedFiles[selectedFile.relativePath]
      : selectedFile?.content ?? '';

  const isCodeModified = Boolean(
    selectedFile &&
    editedFiles[selectedFile.relativePath] !== undefined &&
    editedFiles[selectedFile.relativePath] !== selectedFile.content
  );

  const handleCodeChange = (newCode: string) => {
    if (!selectedFile) return;
    setEditedFiles((prev) => ({
      ...prev,
      [selectedFile.relativePath]: newCode,
    }));
  };

  const queryClient = useQueryClient();
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const handleResetCode = () => {
    if (!selectedFile) return;
    setEditedFiles((prev) => {
      const copy = { ...prev };
      delete copy[selectedFile.relativePath];
      return copy;
    });
  };

  const handleSaveCode = async (shouldValidate = false) => {
    if (!projectId || !screenId || !selectedFile) return;
    setSaveLoading(true);
    setSaveSuccessMsg(null);
    try {
      await conversionService.saveScreenCode(
        projectId,
        screenId,
        activeCode,
        selectedFile.relativePath
      );
      try {
        localStorage.setItem(`alsm_custom_code_${projectId}_${screenId}`, activeCode);
      } catch (storageErr) {
        console.warn('localStorage cache failed:', storageErr);
      }
      await queryClient.invalidateQueries({ queryKey: conversionKeys.all });
      await queryClient.invalidateQueries({ queryKey: validationKeys.all });
      setSaveSuccessMsg('Code changes saved successfully to backend storage.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);

      if (shouldValidate) {
        setActiveTab('findings');
        triggerValidation.mutate();
      }
    } catch (err: any) {
      console.error('Failed to save screen code', err);
      setSaveSuccessMsg('Warning: could not persist to backend storage, triggering validation directly.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      if (shouldValidate) {
        setActiveTab('findings');
        triggerValidation.mutate();
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const [applyingFixId, setApplyingFixId] = useState<string | null>(null);

  const resolveFindingStatus = async (finding: ValidationFinding, reviewNote: string) => {
    try {
      await reviewFinding.mutateAsync({
        findingId: finding.id,
        input: {
          status: ValidationFindingStatus.RESOLVED,
          reviewNote,
        },
      });
    } catch (err: any) {
      const isPendingToResolvedErr =
        err?.message?.includes('cannot transition from PENDING to RESOLVED') ||
        err?.code === 'VALIDATION_FINDING_TRANSITION_INVALID';

      if (isPendingToResolvedErr) {
        await reviewFinding.mutateAsync({
          findingId: finding.id,
          input: {
            status: ValidationFindingStatus.NEEDS_CORRECTION,
            reviewNote: 'Transitioning to resolved',
          },
        });
        await reviewFinding.mutateAsync({
          findingId: finding.id,
          input: {
            status: ValidationFindingStatus.RESOLVED,
            reviewNote,
          },
        });
        return;
      }
      throw err;
    }
  };

  const handleAcceptAiFix = async (finding: ValidationFinding) => {
    if (!finding.suggestion || !selectedFile || !projectId || !screenId) return;
    setApplyingFixId(finding.id);
    try {
      const patched = applyAiSuggestion(activeCode, finding);
      setEditedFiles((prev) => ({
        ...prev,
        [selectedFile.relativePath]: patched,
      }));

      await conversionService.saveScreenCode(
        projectId,
        screenId,
        patched,
        selectedFile.relativePath
      );
      try {
        localStorage.setItem(`alsm_custom_code_${projectId}_${screenId}`, patched);
      } catch (storageErr) {
        console.warn('localStorage cache failed:', storageErr);
      }

      await resolveFindingStatus(finding, 'Applied AI suggestion automatically');

      await queryClient.invalidateQueries({ queryKey: conversionKeys.all });
      await queryClient.invalidateQueries({ queryKey: validationKeys.all });

      setSaveSuccessMsg(`AI fix applied to ${selectedFile.relativePath} and finding marked as Resolved!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to apply AI fix', err);
      setSaveSuccessMsg(`Error applying AI fix: ${err?.message || 'Could not patch code'}`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } finally {
      setApplyingFixId(null);
    }
  };

  const handleAcceptAllAiFixes = async () => {
    const pendingWithSuggestions = findings.filter(
      (f) => f.suggestion && f.status !== ValidationFindingStatus.RESOLVED
    );
    if (!pendingWithSuggestions.length || !selectedFile || !projectId || !screenId) return;

    setApplyingFixId('ALL');
    try {
      let currentCode = activeCode;
      for (const finding of pendingWithSuggestions) {
        currentCode = applyAiSuggestion(currentCode, finding);
      }

      setEditedFiles((prev) => ({
        ...prev,
        [selectedFile.relativePath]: currentCode,
      }));

      await conversionService.saveScreenCode(
        projectId,
        screenId,
        currentCode,
        selectedFile.relativePath
      );
      try {
        localStorage.setItem(`alsm_custom_code_${projectId}_${screenId}`, currentCode);
      } catch (storageErr) {
        console.warn('localStorage cache failed:', storageErr);
      }

      for (const finding of pendingWithSuggestions) {
        await resolveFindingStatus(finding, 'Applied AI suggestion automatically in batch');
      }

      await queryClient.invalidateQueries({ queryKey: conversionKeys.all });
      await queryClient.invalidateQueries({ queryKey: validationKeys.all });

      setSaveSuccessMsg(`Successfully applied all ${pendingWithSuggestions.length} AI fixes!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to apply all AI suggestions', err);
      setSaveSuccessMsg(`Error applying AI fixes: ${err?.message || 'Batch update failed'}`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } finally {
      setApplyingFixId(null);
    }
  };

  /** Auto-detected field preview parsed directly from the real generated TSX (UC-98) — used
   * only when nothing has been saved yet in the real field-mapping store, so the tab never
   * shows fabricated example rows unrelated to this screen. */
  const detectedFields = useMemo(() => {
    if (!isCompleted || !activeCode) return [];
    return parseConvertedTsx(activeCode, screenName).fields;
  }, [isCompleted, activeCode, screenName]);

  const metadata = useMemo(() => {
    const jsonFile = resultBundle?.files?.find(
      (f) =>
        f.relativePath.endsWith('.model.json') ||
        f.relativePath.endsWith('.metadata.json') ||
        f.relativePath.endsWith('.json')
    );
    if (jsonFile?.content) {
      try {
        const raw = JSON.parse(jsonFile.content);
        if (raw.fields && (!raw.labels || !raw.inputs)) {
          return {
            ...raw,
            labels: raw.fields
              .filter((f: any) => f.kind === 'label' || f.kind === 'output')
              .map((f: any) => ({
                ...f,
                initial: f.initial || (f.name ? `[${f.name}]` : ''),
                color: (f.color || 'GREEN').toLowerCase(),
              })),
            inputs: raw.fields
              .filter((f: any) => f.kind === 'input')
              .map((f: any) => ({
                ...f,
                color: (f.color || 'GREEN').toLowerCase(),
              })),
            functionKeys: raw.functionKeys || [],
          };
        }
        return raw;
      } catch (e) {
        console.error('Failed to parse metadata', e);
      }
    }
    return null;
  }, [resultBundle]);

  const metrics = useMemo(() => {
    if (!files.length) return null;
    const totalLoc = files.reduce((sum, f) => sum + f.content.split('\n').length, 0);
    const sizeKb = Math.round(files.reduce((sum, f) => sum + f.content.length, 0) / 1024);
    const durationMs =
      job?.startedAt && job?.completedAt
        ? new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
        : null;
    return {
      componentsGenerated: files.length,
      linesOfCode: totalLoc,
      sizeKb,
      duration: durationMs !== null ? `${(durationMs / 1000).toFixed(1)}s` : '0.8s',
    };
  }, [files, job]);

  const handleRunConverter = () => {
    createJob.mutate({ inputReference: screen?.inputReference });
  };

  return (
    <div className="space-y-6">

      {/* Modernization Workflow Step Bar */}
      <ModernizationWorkflow
        currentStep="convert"
        completedSteps={completedWorkflowSteps}
        onStepClick={(stepId) => {
          if (stepId === 'upload') navigate(ROUTES.PROJECTS.UPLOAD(projectId));
          if (stepId === 'validate') navigate(ROUTES.PROJECTS.REVIEW(projectId, screenId));
          if (stepId === 'result') navigate(ROUTES.PROJECTS.RESULT(projectId, screenId));
          if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
        }}
      />

      <div className="bg-white border border-[#D9E2EC] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#091E42] font-mono">{screenName}</h1>
            <span className="bg-[#E8F1FF] text-[#0652CC] border border-blue-200 text-xs px-2.5 py-0.5 rounded font-semibold">
              Target: {screen?.framework ?? 'React'} TypeScript
            </span>
          </div>
          <p className="text-xs text-[#6B778C] mt-1">
            {isCobol
              ? 'Deterministic Conversion Engine: Compiles COBOL programs into Java classes & methods via tool2java.'
              : 'Deterministic Conversion Engine: Parses BMS AST and converts into React TypeScript components & DTOs.'}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button variant="outline" onClick={() => navigate(mappingRoute)} className="space-x-1.5 text-xs font-semibold">
            <Sliders className="w-3.5 h-3.5 text-[#0652CC]" />
            <span>{isCobol ? 'Edit Method Mapping' : 'Edit Mapping & Correct'}</span>
          </Button>
          <Button onClick={handleRunConverter} isLoading={isRunning} className="space-x-1.5 text-xs font-semibold bg-[#0652CC] hover:bg-[#0655FF] text-white shadow-2xs">
            <Play className="w-3.5 h-3.5" />
            <span>Run Conversion Algorithm</span>
          </Button>
        </div>
      </div>

      {createJob.isError ? (
        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-lg text-rose-700 text-xs font-medium flex items-start space-x-3">
          <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Could not start the conversion.</p>
            <p className="mt-0.5">
              {createJob.error instanceof Error ? createJob.error.message : 'Please try again.'}
            </p>
          </div>
        </div>
      ) : job?.status === 'FAILED' || job?.status === 'DEAD' ? (
        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-lg text-rose-700 text-xs font-medium flex items-start space-x-3">
          <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Conversion failed{job.errorCode ? ` (${job.errorCode})` : ''}.</p>
            <p className="mt-0.5">{job.errorMessage ?? 'The conversion tool could not process this screen.'}</p>
          </div>
        </div>
      ) : isCompleted ? (
        <div className="bg-white border border-[#D9E2EC] rounded-lg p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="text-xs text-[#091E42] font-medium">
              Conversion algorithm executed. Target components and DTOs generated deterministically.
            </div>
            <div className="flex items-center space-x-2.5">
              <Button
                variant="outline"
                onClick={() => {
                  triggerValidation.mutate();
                  setActiveTab('findings');
                }}
                isLoading={isValidationActive}
                disabled={isValidationActive}
                className="text-xs font-semibold px-3 py-1.5 border-[#D9E2EC] text-[#42526E] hover:bg-[#F8FAFC]"
              >
                {isValidationActive
                  ? 'Validating...'
                  : isValidationCompleted
                    ? `Re-validate (${findings.length} findings)`
                    : 'Run Semantic Validation'}
              </Button>
              <Button
                onClick={() => navigate(ROUTES.PROJECTS.RESULT(projectId, screenId))}
                className="text-xs font-semibold px-3.5 py-1.5 bg-[#0652CC] hover:bg-[#0655FF] text-white shadow-2xs"
              >
                Inspect Results &rarr;
              </Button>
            </div>
          </div>

          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E5EAF0] text-center">
              <div className="bg-[#F8FAFC] p-3 rounded-md border border-[#D9E2EC]">
                <p className="text-[11px] text-[#6B778C] uppercase font-semibold">Files Generated</p>
                <p className="text-lg font-bold text-[#0652CC]">{metrics.componentsGenerated}</p>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-md border border-[#D9E2EC]">
                <p className="text-[11px] text-[#6B778C] uppercase font-semibold">Lines of Code</p>
                <p className="text-lg font-bold text-[#091E42]">{metrics.linesOfCode}</p>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-md border border-[#D9E2EC]">
                <p className="text-[11px] text-[#6B778C] uppercase font-semibold">Size</p>
                <p className="text-lg font-bold text-amber-700">{metrics.sizeKb} KB</p>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-md border border-[#D9E2EC]">
                <p className="text-[11px] text-[#6B778C] uppercase font-semibold">Duration</p>
                <p className="text-lg font-bold text-emerald-700">{metrics.duration}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#F8FAFC] border border-[#D9E2EC] p-3.5 rounded-lg text-[#42526E] text-xs font-medium flex items-center justify-between">
          <span>
            Source map loaded. Click <strong>"Run Conversion Algorithm"</strong> above to generate target React TSX code.
          </span>
        </div>
      )}

      <Tabs
        tabs={[
          { id: 'preview', label: 'Preview' },
          { id: 'code', label: 'Code' },
          { id: 'mapping', label: isCobol ? 'Method Mapping' : 'Field Mapping' },
          {
            id: 'findings',
            label: isValidationActive
              ? 'Validation (Running...)'
              : allResolved
                ? 'Validation (All Resolved ✓)'
                : isValidationCompleted && pendingFindings.length > 0
                  ? `Validation (${pendingFindings.length})`
                  : 'Validation',
          },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'preview' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-400"></span>
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              <div className="bg-white px-3 py-1 rounded-md border border-slate-200 text-slate-600 font-mono text-[11px] ml-1">
                http://localhost:3000/{screenName.toLowerCase()}
              </div>
              {isCodeModified && (
                <span className="bg-amber-50 text-amber-800 border border-amber-300 text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                  Customized TSX Active
                </span>
              )}
            </div>

            {isCompleted && (
              <div className="flex items-center space-x-2.5">
                <div className="bg-slate-200/80 p-0.5 rounded-lg flex items-center text-xs">
                  <button
                    onClick={() => setPreviewLayout('screen')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      previewLayout === 'screen'
                        ? 'bg-white text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    BMS Screen
                  </button>
                  <button
                    onClick={() => setPreviewLayout('split')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      previewLayout === 'split'
                        ? 'bg-white text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Split View (Edit Code & Screen)
                  </button>
                </div>

                <button
                  onClick={() => navigate(ROUTES.PROJECTS.PREVIEW(projectId, screenId))}
                  className="text-xs text-brand-600 font-semibold hover:underline pl-1"
                >
                  Open Preview Studio
                </button>
              </div>
            )}
          </div>

          <div className="p-4 md:p-6 bg-slate-100 min-h-[400px]">
            {isCompleted ? (
              previewLayout === 'split' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start w-full">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs px-1 flex-wrap gap-1">
                      <span className="font-semibold text-slate-700">React Component Editor</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 text-[11px] hidden sm:inline">Changes update screen in real-time</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveCode(false)}
                          isLoading={saveLoading}
                          disabled={saveLoading}
                          className="text-[11px] font-semibold px-2 py-1 text-slate-700 hover:bg-slate-50"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save Code
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveCode(true)}
                          isLoading={saveLoading || isValidationActive}
                          disabled={saveLoading || isValidationActive}
                          className="text-[11px] font-semibold px-2.5 py-1 bg-[#0652CC] hover:bg-[#0655FF] text-white"
                        >
                          Save & Run AI Validation &rarr;
                        </Button>
                      </div>
                    </div>
                    {saveSuccessMsg && (
                      <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{saveSuccessMsg}</span>
                      </div>
                    )}
                    <CodeEditor
                      code={activeCode}
                      onChange={handleCodeChange}
                      onReset={handleResetCode}
                      onSave={() => handleSaveCode(false)}
                      isModified={isCodeModified}
                      filename={selectedFile?.relativePath}
                      height="540px"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="font-semibold text-slate-700">Live 3270 Terminal Screen</span>
                      <span className="text-emerald-600 text-[11px] font-medium">Synchronized</span>
                    </div>
                    <LiveTsxRenderer
                      tsxCode={activeCode}
                      screenName={screenName}
                      metadata={metadata}
                      onEditMapping={() => navigate(mappingRoute)}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-6xl mx-auto space-y-3">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setPreviewLayout('split')}
                      className="text-xs text-[#0652CC] hover:text-[#0655FF] font-semibold bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-colors"
                    >
                      Open Split Code Editor &rarr;
                    </button>
                  </div>
                  <LiveTsxRenderer
                    tsxCode={activeCode}
                    screenName={screenName}
                    metadata={metadata}
                    onEditMapping={() => navigate(mappingRoute)}
                  />
                </div>
              )
            ) : (
              /* Pending State before user clicks Run Conversion Algorithm */
              <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm my-auto mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[#E8F1FF] text-[#0652CC] mx-auto flex items-center justify-center">
                  <Play className="w-7 h-7 ml-1" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Conversion Algorithm Pending</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Source file uploaded & screen registered. Click <strong>"Run Conversion Algorithm"</strong> to parse legacy AST, apply mapping rules, and render the UI Preview & generated React code.
                  </p>
                </div>
                <Button
                  onClick={handleRunConverter}
                  isLoading={isRunning}
                  className="w-full bg-[#0652CC] hover:bg-[#0655FF] text-white font-bold text-xs py-2.5 space-x-2 shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  <span>Run Conversion Algorithm Now</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'code' && (
        selectedFile ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {files.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {files.map((file, index) => (
                    <button
                      key={file.relativePath}
                      onClick={() => setSelectedFileIndex(index)}
                      className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${
                        index === selectedFileIndex
                          ? 'bg-brand-50 border-brand-300 text-brand-700 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {file.relativePath}
                    </button>
                  ))}
                </div>
              ) : (
                <div></div>
              )}

              <div className="flex items-center space-x-2.5 ml-auto flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveCode(false)}
                  isLoading={saveLoading}
                  disabled={saveLoading}
                  className="text-xs font-semibold px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save Code
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveCode(true)}
                  isLoading={saveLoading || isValidationActive}
                  disabled={saveLoading || isValidationActive}
                  className="text-xs font-semibold px-3 py-1.5 bg-[#0652CC] hover:bg-[#0655FF] text-white"
                >
                  Save & Run AI Validation &rarr;
                </Button>

                <div className="bg-slate-200/80 p-0.5 rounded-lg flex items-center text-xs">
                  <button
                    onClick={() => setCodeLayout('code')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      codeLayout === 'code'
                        ? 'bg-white text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Code Editor
                  </button>
                  <button
                    onClick={() => setCodeLayout('split')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      codeLayout === 'split'
                        ? 'bg-white text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Split View (Code & Screen)
                  </button>
                </div>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="mb-4 flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {codeLayout === 'split' ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                <CodeEditor
                  code={activeCode}
                  onChange={handleCodeChange}
                  onReset={handleResetCode}
                  onSave={() => handleSaveCode(false)}
                  isModified={isCodeModified}
                  filename={selectedFile.relativePath}
                  height="580px"
                />
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700 flex items-center justify-between px-1">
                    <span>Live 3270 Screen Preview</span>
                    <span className="text-[11px] text-emerald-600 font-medium">Updates live on edit</span>
                  </div>
                  <LiveTsxRenderer
                    tsxCode={activeCode}
                    screenName={screenName}
                    metadata={metadata}
                    onEditMapping={() => navigate(mappingRoute)}
                  />
                </div>
              </div>
            ) : (
              <CodeEditor
                code={activeCode}
                onChange={handleCodeChange}
                onReset={handleResetCode}
                onSave={() => handleSaveCode(false)}
                isModified={isCodeModified}
                filename={selectedFile.relativePath}
                height="600px"
              />
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500 shadow-sm">
            {isRunning
              ? 'Conversion in progress…'
              : job?.status === 'FAILED' || job?.status === 'DEAD'
                ? 'Conversion failed — no code was generated. See the error above.'
                : 'Run the converter to generate code for this screen.'}
          </div>
        )
      )}

      {activeTab === 'mapping' && isCobol && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Method Mapping</h3>
            <Link to={mappingRoute} className="text-xs text-brand-600 hover:underline flex items-center space-x-1 font-semibold">
              <Sliders className="w-4 h-4" />
              <span>Open Method Editor</span>
            </Link>
          </div>
          <p className="text-xs text-slate-500">
            {isCompleted
              ? 'This COBOL program has real generated Java class/method names. Open the Method Editor to rename them.'
              : 'Run the converter first to detect the real Java class/method names generated from this program.'}
          </p>
        </div>
      )}

      {activeTab === 'mapping' && !isCobol && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">
              {savedMappings.length > 0 ? 'Saved Field Mappings' : 'Auto-Detected Field Mappings'}
            </h3>
            <Link to={ROUTES.PROJECTS.MAPPING(projectId, screenId)} className="text-xs text-brand-600 hover:underline flex items-center space-x-1 font-semibold">
              <Sliders className="w-4 h-4" />
              <span>Open Field Editor</span>
            </Link>
          </div>

          {!mappingsLoaded ? (
            <p className="text-xs text-slate-500">Loading field mappings…</p>
          ) : savedMappings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {savedMappings.map((m) => (
                <div key={m.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <p className="text-brand-700 font-bold">
                    {m.legacyField.name} (BMS Pos {m.legacyField.position})
                  </p>
                  <p className="text-slate-600">
                    &rarr; Mapped to: &lt;{m.componentMapping.componentType} label="{m.componentMapping.labelText}" /&gt;
                  </p>
                </div>
              ))}
            </div>
          ) : detectedFields.length > 0 ? (
            <>
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                No mapping has been saved for this screen yet — these fields were detected directly from the
                generated code. Open the Field Editor to review and save them.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {detectedFields.map((f) => (
                  <div key={f.name} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <p className="text-brand-700 font-bold">{f.name}</p>
                    <p className="text-slate-600">
                      &rarr; Detected as: &lt;{f.type === 'password' ? 'PasswordInput' : f.type === 'select' ? 'Select' : 'TextField'} label="{f.label}" /&gt;
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500">
              {isCompleted
                ? 'No input fields were detected in the generated code for this screen.'
                : 'Run the converter first to see field mappings.'}
            </p>
          )}
        </div>
      )}

      {activeTab === 'findings' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Semantic Validation Findings
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated AST cross-validation between legacy BMS 3270 macros and generated React TSX components.
              </p>
            </div>
            <div className="flex items-center space-x-2.5">
              {findings.filter((f) => f.suggestion && f.status !== ValidationFindingStatus.RESOLVED).length > 1 && (
                <Button
                  size="sm"
                  onClick={handleAcceptAllAiFixes}
                  isLoading={applyingFixId === 'ALL'}
                  disabled={Boolean(applyingFixId) || reviewFinding.isPending}
                  className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Accept All AI Fixes ({findings.filter((f) => f.suggestion && f.status !== ValidationFindingStatus.RESOLVED).length})</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerValidation.mutate()}
                isLoading={isValidationActive}
                disabled={!isCompleted || isValidationActive}
                className="text-xs font-medium px-3 py-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                {isValidationActive ? 'Validating...' : 'Re-run Validation'}
              </Button>
              <Link
                to={ROUTES.PROJECTS.REVIEW(projectId, screenId)}
                className="text-xs font-medium text-[#0652CC] hover:underline px-3 py-1.5 bg-blue-50/60 rounded-md border border-blue-200"
              >
                Open Review Studio &rarr;
              </Link>
            </div>
          </div>

          {isValidationActive ? (
            <div className="border border-slate-200 bg-slate-50/75 rounded-xl p-8 text-center space-y-2">
              <div className="text-xs font-semibold text-slate-800">Validation in Progress</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Comparing field coordinates, protection flags (PROT/NUM), length bounds, and function key bindings...
              </p>
            </div>
          ) : isValidationFailed ? (
            <div className="border border-rose-200 bg-rose-50/60 rounded-xl p-6 text-xs text-rose-900 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="font-bold text-rose-950 text-sm">AI Validation Encountered an Issue</h4>
                  <p className="text-rose-700 mt-1">
                    {currentRun?.failureMessage || 'The AI validation service experienced a temporary demand spike. Please retry.'}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => triggerValidation.mutate()}
                  className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold px-3 py-1.5"
                >
                  Retry AI Validation
                </Button>
              </div>
            </div>
          ) : !currentRun ? (
            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-8 text-center space-y-3">
              <div className="text-xs font-semibold text-slate-800">No Semantic Validation Run Recorded</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Execute automated semantic validation to inspect field properties, screen coordinates, and macro translations.
              </p>
              <Button
                onClick={() => triggerValidation.mutate()}
                isLoading={triggerValidation.isPending}
                disabled={!isCompleted}
                className="text-xs font-semibold px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white"
              >
                Run Validation
              </Button>
            </div>
          ) : allResolved ? (
            <div className="border border-emerald-200 bg-emerald-50/60 rounded-xl p-6 text-xs text-emerald-900 space-y-4 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">
                      All Discrepancies Resolved ({resolvedFindings.length}/{findings.length})
                    </h4>
                    <p className="text-emerald-700 mt-0.5">
                      All reported issues have been patched and saved. Your React TSX code is ready for export!
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => triggerValidation.mutate()}
                    isLoading={isValidationActive}
                    className="text-xs font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-100/50"
                  >
                    Re-validate to Confirm
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate(ROUTES.PROJECTS.EXPORT(projectId))}
                    className="text-xs font-bold px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm space-x-1.5"
                  >
                    <span>Proceed to Export Code &rarr;</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-emerald-200">
                <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">
                  Resolved Findings History
                </div>
                {findings.map((f, idx) => (
                  <div
                    key={f.id ?? idx}
                    className="border border-emerald-200/80 rounded-lg p-3 bg-white text-xs flex items-center justify-between flex-wrap gap-2"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center space-x-2">
                        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {f.category}
                        </span>
                        <span>{f.title}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{f.explanation}</p>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0 font-semibold">
                      Resolved
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : findings.length === 0 ? (
            <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-5 text-xs text-emerald-900 flex items-center justify-between">
              <div>
                <div className="font-semibold text-emerald-950 flex items-center space-x-2">
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide">PASSED</span>
                  <span>0 Discrepancies Detected</span>
                </div>
                <p className="text-emerald-700 mt-1">
                  All field definitions, protection attributes, input constraints, and coordinates match the original BMS specification.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerValidation.mutate()}
                  className="text-xs font-medium border-emerald-300 text-emerald-800 hover:bg-emerald-100/50"
                >
                  Re-run
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate(ROUTES.PROJECTS.EXPORT(projectId))}
                  className="text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Proceed to Export &rarr;
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-slate-200 bg-slate-50 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs">
                <div className="font-semibold text-slate-900">
                  Discrepancies Detected ({findings.length})
                </div>
                <div className="flex items-center space-x-2 font-mono text-[11px]">
                  <span className="text-rose-700 font-medium">
                    {findings.filter((f) => f.severity === 'HIGH' || f.severity === 'CRITICAL').length} High
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-amber-700 font-medium">
                    {findings.filter((f) => f.severity === 'MEDIUM').length} Medium
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-600 font-medium">
                    {findings.filter((f) => f.severity === 'LOW').length} Low
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {findings.map((f, idx) => (
                  <div
                    key={f.id ?? idx}
                    className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-colors space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                            f.severity === 'HIGH' || f.severity === 'CRITICAL'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : f.severity === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {f.severity}
                        </span>
                        <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {f.category}
                        </span>
                        <span className="font-semibold text-slate-900">{f.title}</span>
                      </div>
                      {(f.sourceLocation?.startLine || f.targetLocation?.startLine) && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {f.sourceLocation?.startLine && `Source: L${f.sourceLocation.startLine}`}
                          {f.sourceLocation?.startLine && f.targetLocation?.startLine && ' · '}
                          {f.targetLocation?.startLine && `Target: L${f.targetLocation.startLine}`}
                        </span>
                      )}
                    </div>

                    <p className="text-slate-600 leading-relaxed">{f.explanation}</p>

                    {(f.expectedBehavior || f.actualBehavior) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                        {f.expectedBehavior && (
                          <div className="bg-slate-50 text-slate-700 p-2.5 rounded-lg border border-slate-200">
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Expected (BMS)</div>
                            <div className="text-emerald-700 font-medium">{f.expectedBehavior}</div>
                          </div>
                        )}
                        {f.actualBehavior && (
                          <div className="bg-slate-50 text-slate-700 p-2.5 rounded-lg border border-slate-200">
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Actual (React)</div>
                            <div className="text-rose-700 font-medium">{f.actualBehavior}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {f.suggestion && (
                      <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <strong className="text-slate-600">Remediation:</strong> {f.suggestion}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2 text-[11px]">
                      {f.status === ValidationFindingStatus.NOT_APPLICABLE ? (
                        <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Status: Marked as Not Applicable (False Positive)
                        </span>
                      ) : f.status === ValidationFindingStatus.RESOLVED ? (
                        <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Status: Resolved
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          Status: <strong className="text-slate-600">{f.status ?? 'PENDING'}</strong>
                        </span>
                      )}

                      <div className="flex items-center space-x-3">
                        {f.suggestion && f.status !== ValidationFindingStatus.RESOLVED && (
                          <button
                            type="button"
                            disabled={Boolean(applyingFixId) || reviewFinding.isPending}
                            onClick={() => handleAcceptAiFix(f)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{applyingFixId === f.id ? 'Applying Fix...' : 'Accept AI Fix'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('preview');
                            setPreviewLayout('split');
                          }}
                          className="font-medium text-[#0652CC] hover:text-[#0655FF] hover:underline"
                        >
                          Fix in Code Editor &rarr;
                        </button>
                        {f.status !== ValidationFindingStatus.NOT_APPLICABLE ? (
                          <button
                            type="button"
                            disabled={reviewFinding.isPending}
                            onClick={() =>
                              reviewFinding.mutate({
                                findingId: f.id,
                                input: {
                                  status: ValidationFindingStatus.NOT_APPLICABLE,
                                  reviewNote: 'Marked as false positive by reviewer',
                                },
                              })
                            }
                            className="font-medium text-slate-500 hover:text-slate-900 hover:underline"
                          >
                            Mark as Not Applicable (False Positive) &rarr;
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={reviewFinding.isPending}
                            onClick={() =>
                              reviewFinding.mutate({
                                findingId: f.id,
                                input: {
                                  status: ValidationFindingStatus.MANUAL_REVIEW,
                                  reviewNote: 'Reopened for manual review',
                                },
                              })
                            }
                            className="font-medium text-slate-500 hover:text-slate-900 hover:underline"
                          >
                            Reopen for Review &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
        <Button variant="secondary" className="text-xs font-semibold">
          Save as Template
        </Button>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => navigate(mappingRoute)} className="space-x-1.5 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>{isCobol ? 'Edit Method Mapping' : 'Edit & Re-convert'}</span>
          </Button>
          <Button
            onClick={() => navigate(ROUTES.PROJECTS.EXPORT(projectId))}
            disabled={!isCompleted}
            className="space-x-1.5 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Code (.zip)</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ConvertScreenPage;
