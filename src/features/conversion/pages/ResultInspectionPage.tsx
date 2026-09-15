import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, RefreshCw, Sliders, FileCode, Tag } from 'lucide-react';
import { conversionService } from '../services/conversion.service';
import type { ConversionJob } from '../services/conversion.service';
import { useConversionJob } from '../queries/useConversionJob';
import { useConversionResult } from '../queries/useConversionResult';
import type { ASTNode } from '../types/conversion';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { Breadcrumb } from '@/shared/navigation/Breadcrumb';
import { CodeViewer } from '../components/CodeViewer';
import { ASTTree } from '../components/ASTTree';
import { Button } from '@/shared/ui/Button';
import { StatusBadge } from '@/shared/ui/Badge';

const JOB_STATUS_LABELS: Record<ConversionJob['status'], string> = {
  QUEUED: 'Queued',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  DEAD: 'Failed',
  CANCELLED: 'Failed',
};

function countAstNodes(node: ASTNode): number {
  return 1 + (node.children?.reduce((sum, child) => sum + countAstNodes(child), 0) ?? 0);
}

export const ResultInspectionPage: React.FC = () => {
  const { projectId = 'proj-acme', screenId = 'scr-login' } = useParams();
  const navigate = useNavigate();
  const [validating, setValidating] = useState(false);
  const [screen, setScreen] = useState<LegacyScreen | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [astData, setAstData] = useState<ASTNode | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([conversionService.getScreenById(screenId), conversionService.getASTData(screenId)]).then(
      ([screenData, ast]) => {
        if (cancelled) return;
        setScreen(screenData);
        setAstData(ast);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [screenId]);

  const { data: job } = useConversionJob(projectId, screenId);
  const hasRealResult = Boolean(job?.status === 'COMPLETED' && job.resultReference);
  const { data: resultBundle } = useConversionResult(job?.id, hasRealResult);

  const screenName = screen?.name ?? screenId;
  const files = useMemo(() => resultBundle?.files ?? [], [resultBundle]);
  const selectedFile = files[selectedFileIndex] ?? files[0] ?? null;

  const executionDuration = useMemo(() => {
    if (!job?.startedAt || !job?.completedAt) return null;
    const ms = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
    return `${(ms / 1000).toFixed(1)}s`;
  }, [job]);

  const generatedLoc = useMemo(
    () => (files.length ? files.reduce((sum, f) => sum + f.content.split('\n').length, 0) : null),
    [files],
  );

  const astNodesCount = astData ? countAstNodes(astData) : null;

  const handleReRunValidator = () => {
    setValidating(true);
    setTimeout(() => setValidating(false), 800);
  };

  return (
    <div className="space-y-6 py-2">
      <Breadcrumb
        items={[
          { label: 'Projects', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'Acme Corp Modernization', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'Screens', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'Result Inspection' },
        ]}
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
          <p className="text-xs text-slate-500 mt-1">Inspecting AST structure and generated React source code.</p>
        </div>

        <Button onClick={() => navigate(ROUTES.PROJECTS.EXPORT(projectId))} disabled={!hasRealResult} className="space-x-1.5 text-xs font-semibold">
          <Download className="w-4 h-4" />
          <span>Download</span>
        </Button>
      </div>

      {!hasRealResult && (
        <div className="bg-[#FFFAEB] border border-[#FEDF89] p-4 rounded-xl text-[#DC6803] text-xs font-medium">
          {job
            ? job.status === 'FAILED' || job.status === 'DEAD'
              ? `This screen's conversion job failed${job.errorCode ? ` (${job.errorCode})` : ''}: ${job.errorMessage ?? 'see Review Findings for details.'} The AST below is illustrative example output only.`
              : `This screen's conversion job is currently "${JOB_STATUS_LABELS[job.status]}" — code will appear here once it completes. The AST below is illustrative example output.`
            : 'No conversion job has been run for this screen yet. The AST below is illustrative example output.'}
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
          <p className="text-slate-500 text-[11px] font-semibold uppercase">AST NODES</p>
          <p className="font-bold text-brand-600 mt-0.5">{astNodesCount ?? '—'}</p>
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
            filename={selectedFile?.relativePath ?? screenName.replace(/\.(bms|dspf)$/i, '.tsx')}
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
            <span className="flex items-center space-x-1.5">
              <Tag className="w-4 h-4 text-brand-600" />
              <span>Abstract Syntax Tree (BMS Legacy)</span>
            </span>
          </div>
          {astData && <ASTTree data={astData} />}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
        <Button variant="outline" onClick={handleReRunValidator} isLoading={validating} className="space-x-1.5 text-xs font-semibold">
          <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          <span>Re-run Validation Engine</span>
        </Button>

        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate(ROUTES.PROJECTS.EXPORT(projectId))}
            disabled={!hasRealResult}
            className="space-x-1.5 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Single Component</span>
          </Button>
          <Button onClick={() => navigate(ROUTES.PROJECTS.MAPPING(projectId, screenId))} className="space-x-1.5 text-xs font-semibold">
            <Sliders className="w-3.5 h-3.5" />
            <span>Open in Field Editor</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ResultInspectionPage;
