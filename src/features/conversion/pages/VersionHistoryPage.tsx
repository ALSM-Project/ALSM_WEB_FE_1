import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Eye, XCircle } from 'lucide-react';
import { conversionService } from '../services/conversion.service';
import type { ConversionJob } from '../services/conversion.service';
import { useConversionHistory } from '../queries/useConversionHistory';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';
import { StatusBadge } from '@/shared/ui/Badge';

const JOB_STATUS_LABELS: Record<ConversionJob['status'], string> = {
  QUEUED: 'Queued',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  DEAD: 'Failed',
  CANCELLED: 'Cancelled',
};

function formatDuration(job: ConversionJob): string | null {
  if (!job.startedAt || !job.completedAt) return null;
  const ms = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
  return `${(ms / 1000).toFixed(1)}s`;
}

export const VersionHistoryPage: React.FC = () => {
  const { projectId = 'proj-acme', screenId = 'scr-login' } = useParams();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<LegacyScreen | null>(null);

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

  const { data: history, isLoading, isError, error } = useConversionHistory(projectId, screenId);
  const screenName = screen?.name ?? screenId;
  const total = history?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 font-mono">{screenName}</h1>
            <span className="bg-brand-50 text-brand-700 border border-brand-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              Version History
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Every past conversion attempt for this screen, newest first.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(ROUTES.PROJECTS.RESULT(projectId, screenId))}
          className="space-x-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Latest Result</span>
        </Button>
      </div>

      {isLoading && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500 shadow-sm">
          Loading version history…
        </div>
      )}

      {isError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 text-xs font-medium flex items-start space-x-3">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Could not load version history.</p>
            <p className="mt-0.5">{error instanceof Error ? error.message : 'Please try again.'}</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && total === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500 shadow-sm">
          No conversion attempts have been run for this screen yet.
        </div>
      )}

      {!isLoading && !isError && total > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-sm">
          {history!.map((job, index) => {
            // The backend already sorts newest first — this is a real ordinal derived from
            // that real order (oldest = 1 ... newest = total), not a fabricated field.
            const versionNumber = total - index;
            const isLatest = index === 0;
            const canViewResult = job.status === 'COMPLETED' && Boolean(job.resultReference);
            const duration = formatDuration(job);
            return (
              <div key={job.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-sm font-bold text-slate-900">Version {versionNumber}</span>
                    {isLatest && (
                      <span className="bg-brand-50 text-brand-700 border border-brand-200 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase">
                        Latest
                      </span>
                    )}
                    <StatusBadge status={JOB_STATUS_LABELS[job.status]} />
                  </div>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(job.createdAt).toLocaleString()}</span>
                    </span>
                    {duration && <span>Duration: {duration}</span>}
                    {job.toolVersion && <span className="font-mono">{job.toolVersion}</span>}
                  </div>
                  {(job.status === 'FAILED' || job.status === 'DEAD') && (
                    <p className="text-xs text-rose-600">
                      {job.errorCode ? `${job.errorCode}: ` : ''}
                      {job.errorMessage ?? 'Conversion failed.'}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {canViewResult ? (
                    <Link
                      to={`${ROUTES.PROJECTS.RESULT(projectId, screenId)}?jobId=${job.id}`}
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-700 hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Code</span>
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">No output</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default VersionHistoryPage;
