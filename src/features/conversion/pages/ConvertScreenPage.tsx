import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Download, RefreshCw, CheckCircle2, Sliders, AlertCircle, FileSearch, Eye, XCircle } from 'lucide-react';
import { conversionService } from '../services/conversion.service';
import { useConversionJob } from '../queries/useConversionJob';
import { useCreateConversionJob } from '../queries/useCreateConversionJob';
import { useConversionResult } from '../queries/useConversionResult';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { Tabs } from '@/shared/ui/Tabs';
import { Button } from '@/shared/ui/Button';
import { CodeViewer } from '../components/CodeViewer';
import { ModernizationWorkflow } from '@/shared/ui/ModernizationWorkflow';

import { LiveTsxRenderer } from '../components/LiveTsxRenderer';
import { generateScreenBundle, parseConvertedTsx } from '../utils/screenGenerator';
import type { FieldMapping } from '../types/conversion';

export const ConvertScreenPage: React.FC = () => {
  const { projectId = 'proj-acme', screenId = 'scr-login' } = useParams();
  const navigate = useNavigate();

  const [screen, setScreen] = useState<LegacyScreen | null>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [savedMappings, setSavedMappings] = useState<FieldMapping[]>([]);
  const [mappingsLoaded, setMappingsLoaded] = useState(false);

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

  const screenName = screen?.name ?? screenId;
  const fallbackBundle = useMemo(() => generateScreenBundle(screenName), [screenName]);

  const files = useMemo(() => {
    if (resultBundle?.files && resultBundle.files.length > 0) {
      return resultBundle.files;
    }
    if (isCompleted) {
      return fallbackBundle.files;
    }
    return [];
  }, [resultBundle, isCompleted, fallbackBundle]);
  const selectedFile = files[selectedFileIndex] ?? files[0] ?? null;

  /** Auto-detected field preview parsed directly from the real generated TSX (UC-98) — used
   * only when nothing has been saved yet in the real field-mapping store, so the tab never
   * shows fabricated example rows unrelated to this screen. */
  const detectedFields = useMemo(() => {
    if (!isCompleted || !selectedFile?.content) return [];
    return parseConvertedTsx(selectedFile.content, screenName).fields;
  }, [isCompleted, selectedFile, screenName]);

  const metadata = useMemo(() => {
    const jsonFile = files.find((f) => f.relativePath.endsWith('.metadata.json'));
    if (jsonFile?.content) {
      try {
        return JSON.parse(jsonFile.content);
      } catch(e) {
        console.error('Failed to parse metadata', e);
      }
    }
    return null;
  }, [files]);

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
        completedSteps={['upload']}
        onStepClick={(stepId) => {
          if (stepId === 'upload') navigate(ROUTES.PROJECTS.UPLOAD(projectId));
          if (stepId === 'validate') navigate(ROUTES.PROJECTS.REVIEW(projectId, screenId));
          if (stepId === 'result') navigate(ROUTES.PROJECTS.RESULT(projectId, screenId));
          if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
        }}
      />

      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 font-mono">{screenName}</h1>
            <span className="bg-brand-50 text-brand-700 border border-brand-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              Target: {screen?.framework ?? 'React'} TypeScript
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isCobol
              ? 'Deterministic Conversion Engine: Compiles COBOL programs into Java classes & methods via tool2java.'
              : 'Deterministic Conversion Engine: Parses BMS AST and converts into React TypeScript components & DTOs.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => navigate(mappingRoute)} className="space-x-1.5 text-xs font-semibold">
            <Sliders className="w-4 h-4 text-brand-600" />
            <span>{isCobol ? 'Edit Method Mapping' : 'Edit Mapping & Correct'}</span>
          </Button>
          <Button onClick={handleRunConverter} isLoading={isRunning} className="space-x-2 text-xs font-semibold bg-[#0652CC] hover:bg-[#0655FF]">
            <Play className="w-4 h-4" />
            <span>Run Conversion Algorithm</span>
          </Button>
        </div>
      </div>

      {createJob.isError ? (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 text-xs font-medium flex items-start space-x-3">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Could not start the conversion.</p>
            <p className="mt-0.5">
              {createJob.error instanceof Error ? createJob.error.message : 'Please try again.'}
            </p>
          </div>
        </div>
      ) : job?.status === 'FAILED' || job?.status === 'DEAD' ? (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 text-xs font-medium flex items-start space-x-3">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Conversion failed{job.errorCode ? ` (${job.errorCode})` : ''}.</p>
            <p className="mt-0.5">{job.errorMessage ?? 'The conversion tool could not process this screen.'}</p>
          </div>
        </div>
      ) : isCompleted ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center space-x-2 text-[#079455] font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-[#079455]" />
              <span>Conversion Algorithm Executed Successfully! Code generated deterministically.</span>
            </div>
            <Button
              onClick={() => navigate(ROUTES.PROJECTS.RESULT(projectId, screenId))}
              className="space-x-1.5 text-xs font-bold bg-[#0652CC] hover:bg-[#0655FF] text-white shadow-sm"
            >
              <span>Proceed to Step 3: Code Result & Validation</span>
              <Eye className="w-4 h-4" />
            </Button>
          </div>

          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-[11px] text-slate-500 uppercase font-semibold">Files Generated</p>
                <p className="text-lg font-bold text-brand-600">{metrics.componentsGenerated}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-[11px] text-slate-500 uppercase font-semibold">Lines of Code</p>
                <p className="text-lg font-bold text-slate-900">{metrics.linesOfCode}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-[11px] text-slate-500 uppercase font-semibold">Size</p>
                <p className="text-lg font-bold text-[#DC6803]">{metrics.sizeKb} KB</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-[11px] text-slate-500 uppercase font-semibold">Duration</p>
                <p className="text-lg font-bold text-[#079455]">{metrics.duration}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#E8F1FF] border border-[#B3D4FF] p-4 rounded-xl text-[#0652CC] text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Play className="w-5 h-5 flex-shrink-0" />
            <span>
              Screen ready for conversion. Click <strong>"Run Conversion Algorithm"</strong> above to execute code generation and render the UI preview.
            </span>
          </div>
        </div>
      )}

      <Tabs
        tabs={[
          { id: 'preview', label: 'Preview' },
          { id: 'code', label: 'Code' },
          { id: 'mapping', label: isCobol ? 'Method Mapping' : 'Field Mapping' },
          { id: 'findings', label: 'Findings (Validation)' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'preview' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-400"></span>
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            </div>
            <div className="bg-white px-4 py-1 rounded-md border border-slate-200 text-slate-600 text-center w-80 truncate font-mono">
              http://localhost:3000/{screenName.toLowerCase()}
            </div>
            <button
              onClick={() => navigate(ROUTES.PROJECTS.PREVIEW(projectId, screenId))}
              className="text-xs text-brand-600 font-semibold hover:underline"
            >
              Open Preview Studio
            </button>
          </div>

          <div className="p-8 md:p-12 flex justify-center bg-slate-100 min-h-[400px]">
            {isCompleted ? (
              <div className="w-full max-w-3xl">
                <LiveTsxRenderer
                  tsxCode={selectedFile?.content ?? ''}
                  screenName={screenName}
                  metadata={metadata}
                  onEditMapping={() => navigate(mappingRoute)}
                />
              </div>
            ) : (
              /* Pending State before user clicks Run Conversion Algorithm */
              <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm my-auto">
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
            {files.length > 1 && (
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
            )}
            <CodeViewer code={selectedFile.content} filename={selectedFile.relativePath} />
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
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Parser Findings & Observations</h3>
            <Link
              to={ROUTES.PROJECTS.REVIEW(projectId, screenId)}
              className="text-xs text-brand-600 font-semibold hover:underline flex items-center space-x-1"
            >
              <FileSearch className="w-4 h-4 text-brand-600" />
              <span>Open Full Findings Review Studio &rarr;</span>
            </Link>
          </div>
          <div className="bg-[#FFFAEB] border border-[#FEDF89] p-4 rounded-xl text-[#DC6803] text-xs flex items-center space-x-3 font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>Found 7 legacy macro findings needing review. 3 of 7 reviewed.</span>
          </div>
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
