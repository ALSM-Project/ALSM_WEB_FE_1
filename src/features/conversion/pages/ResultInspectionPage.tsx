import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, RefreshCw, Sliders, FileCode, Files, Eye, RotateCw } from 'lucide-react';
import { conversionService } from '../services/conversion.service';
import type { ConversionJob } from '../services/conversion.service';
import { useConversionJob } from '../queries/useConversionJob';
import { useConversionResult } from '../queries/useConversionResult';
import { useRetryConversionJob } from '../queries/useRetryConversionJob';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { CodeViewer } from '../components/CodeViewer';
import { Button } from '@/shared/ui/Button';
import { StatusBadge } from '@/shared/ui/Badge';
import { ModernizationWorkflow } from '@/shared/ui/ModernizationWorkflow';
import { generateScreenBundle } from '../utils/screenGenerator';

const JOB_STATUS_LABELS: Record<ConversionJob['status'], string> = {
  QUEUED: 'Queued',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  DEAD: 'Failed',
  CANCELLED: 'Failed',
};

/** Guesses a source-appropriate fallback filename before a real result exists —
 * COBOL programs produce .java, BMS/DSPF screens produce .tsx. */
function fallbackResultFilename(screenName: string): string {
  return /\.(cob|cbl)$/i.test(screenName)
    ? screenName.replace(/\.(cob|cbl)$/i, '.java')
    : screenName.replace(/\.(bms|dspf)$/i, '.tsx');
}

export const ResultInspectionPage: React.FC = () => {
  const { projectId = 'proj-acme', screenId = 'scr-login' } = useParams();
  const navigate = useNavigate();
  const [validating, setValidating] = useState(false);
  const [screen, setScreen] = useState<LegacyScreen | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

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

  const { data: job } = useConversionJob(projectId, screenId);
  const hasRealResult = Boolean(job?.status === 'COMPLETED' && job.resultReference);
  const { data: resultBundle } = useConversionResult(job?.id, hasRealResult);
  const retryJob = useRetryConversionJob(projectId, screenId);
  const isRetryable = job?.status === 'FAILED' || job?.status === 'DEAD';

  const screenName = screen?.name ?? screenId;
  const screenBundle = useMemo(() => generateScreenBundle(screenName), [screenName]);
  const files = useMemo(() => {
    if (resultBundle?.files && resultBundle.files.length > 0) return resultBundle.files;
    return screenBundle.files;
  }, [resultBundle, screenBundle]);
  const selectedFile = files[selectedFileIndex] ?? files[0] ?? null;

  const executionDuration = useMemo(() => {
    if (!job?.startedAt || !job?.completedAt) return null;
    const ms = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
    return `${(ms / 1000).toFixed(1)}s`;
  }, [job]);

  const generatedLoc = useMemo(
    () => (files.length ? files.reduce((sum, f) => sum + f.content.split('\n').length, 0) : screenBundle.linesOfCode),
    [files, screenBundle],
  );

  const handleReRunValidator = () => {
    setValidating(true);
    setTimeout(() => setValidating(false), 800);
  };

  return (
    <div className="space-y-6">

      {/* Modernization Workflow Step Bar */}
      <ModernizationWorkflow
        currentStep="result"
        completedSteps={['upload', 'conversion']}
        onStepClick={(stepId) => {
          if (stepId === 'upload') navigate(ROUTES.PROJECTS.UPLOAD(projectId));
          if (stepId === 'conversion') navigate(ROUTES.PROJECTS.CONVERT(projectId, screenId));
          if (stepId === 'validation') navigate(ROUTES.PROJECTS.REVIEW(projectId, screenId));
          if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
        }}
      />

      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 font-mono">{screenName}</h1>
            {job ? (
              <StatusBadge status={JOB_STATUS_LABELS[job.status]} />
            ) : (
              <StatusBadge status="Queued" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Inspecting generated source code and output files.</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.PROJECTS.PREVIEW(projectId, screenId))}
            className="space-x-1.5 text-xs font-bold border-brand-300 text-brand-700 bg-brand-50 hover:bg-brand-100"
          >
            <Eye className="w-4 h-4 text-brand-600" />
            <span>Open UI Screen Preview</span>
          </Button>
          <Button onClick={() => navigate(ROUTES.PROJECTS.EXPORT(projectId))} disabled={!hasRealResult} className="space-x-1.5 text-xs font-semibold">
            <Download className="w-4 h-4" />
            <span>Download</span>
          </Button>
        </div>
      </div>

      {!hasRealResult && (
        <div className="bg-[#FFFAEB] border border-[#FEDF89] p-4 rounded-xl text-[#DC6803] text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>
            {job
              ? isRetryable
                ? `This screen's conversion job failed${job.errorCode ? ` (${job.errorCode})` : ''}: ${job.errorMessage ?? 'see Review Findings for details.'}`
                : `This screen's conversion job is currently "${JOB_STATUS_LABELS[job.status]}" — code will appear here once it completes.`
              : 'No conversion job has been run for this screen yet.'}
          </span>
          {isRetryable && job && (
            <Button
              variant="outline"
              onClick={() => retryJob.mutate(job.id)}
              isLoading={retryJob.isPending}
              className="space-x-1.5 text-xs font-bold border-[#FEDF89] text-[#DC6803] bg-white hover:bg-amber-50 flex-shrink-0"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry Job</span>
            </Button>
          )}
        </div>
      )}
      {retryJob.isError && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-700 text-xs font-medium">
          Failed to retry this job: {retryJob.error instanceof Error ? retryJob.error.message : 'unknown error'}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-[11px] font-semibold uppercase">SCREEN NAME</p>
          <p className="font-bold text-slate-900 font-mono truncate mt-0.5">{screenName}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-[11px] font-semibold uppercase">TIMESTAMP</p>
          <p className="font-bold text-slate-700 mt-0.5">{job ? new Date(job.createdAt).toLocaleString() : '—'}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-[11px] font-semibold uppercase">EXECUTION</p>
          <p className="font-bold text-[#079455] mt-0.5">{executionDuration ?? '—'}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-[11px] font-semibold uppercase">FILES GENERATED</p>
          <p className="font-bold text-brand-600 mt-0.5">{hasRealResult ? files.length : '—'}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-[11px] font-semibold uppercase">GENERATED LOC</p>
          <p className="font-bold text-brand-600 mt-0.5">{generatedLoc ?? '—'} lines</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
            <span className="flex items-center space-x-1.5">
              <FileCode className="w-4 h-4 text-brand-600" />
              <span>Generated Code</span>
            </span>
          </div>
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
          <CodeViewer
            code={selectedFile?.content ?? ''}
            filename={selectedFile?.relativePath ?? fallbackResultFilename(screenName)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
            <span className="flex items-center space-x-1.5">
              <Files className="w-4 h-4 text-brand-600" />
              <span>Generated Files</span>
            </span>
          </div>
          {files.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500">
              No generated files yet — this appears once the conversion job completes.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {files.map((file, index) => (
                <button
                  key={file.relativePath}
                  onClick={() => setSelectedFileIndex(index)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-xs transition-colors ${
                    index === selectedFileIndex ? 'bg-brand-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center space-x-2 min-w-0">
                    <FileCode className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                    <span className={`font-mono truncate ${index === selectedFileIndex ? 'text-brand-700 font-semibold' : 'text-slate-700'}`}>
                      {file.relativePath}
                    </span>
                  </span>
                  <span className="text-slate-400 flex-shrink-0">{file.content.split('\n').length} lines</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
        <Button variant="outline" onClick={handleReRunValidator} isLoading={validating} className="space-x-1.5 text-xs font-semibold">
          <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          <span>Re-run Validation Engine</span>
        </Button>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.PROJECTS.PREVIEW(projectId, screenId))}
            className="space-x-1.5 text-xs font-bold border-brand-300 text-brand-700 bg-brand-50 hover:bg-brand-100"
          >
            <Eye className="w-3.5 h-3.5 text-brand-600" />
            <span>Open UI Screen Preview</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(ROUTES.PROJECTS.MAPPING(projectId, screenId))}
            className="space-x-1.5 text-xs font-semibold"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Edit Field Mapping</span>
          </Button>
          <Button
            onClick={() => navigate(ROUTES.PROJECTS.REVIEW(projectId, screenId))}
            className="space-x-1.5 text-xs font-bold bg-[#0652CC] hover:bg-[#0655FF] text-white"
          >
            <span>Proceed to Human Review & Findings &rarr;</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ResultInspectionPage;
