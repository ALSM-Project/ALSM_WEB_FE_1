import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, X } from 'lucide-react';
import { StatusBadge } from '@/shared/ui/Badge';
import { conversionService } from '@/features/conversion/services/conversion.service';
import type { DependencyEntry, ProgramAnalysis } from '../types/copybookDependency';

export interface DependencyDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenId: string | null;
}

interface Counts {
  resolved: number;
  missing: number;
  ambiguous: number;
  other: number;
  total: number;
}

function countDependencies(entries: DependencyEntry[]): Counts {
  const counts: Counts = { resolved: 0, missing: 0, ambiguous: 0, other: 0, total: 0 };
  const walk = (list: DependencyEntry[]) => {
    for (const entry of list) {
      counts.total += 1;
      if (entry.status === 'RESOLVED') counts.resolved += 1;
      else if (entry.status === 'MISSING') counts.missing += 1;
      else if (entry.status === 'AMBIGUOUS') counts.ambiguous += 1;
      else counts.other += 1;
      if (entry.dependencies?.length) walk(entry.dependencies);
    }
  };
  walk(entries);
  return counts;
}

/** Overall status badge doesn't naturally match StatusBadge's built-in keyword heuristic for
 * BLOCKED/NOT_ANALYZED, so the label text itself carries the keyword the heuristic looks for
 * (e.g. "error") rather than duplicating/forking the shared Badge component's color logic. */
function overallStatusLabel(status: ProgramAnalysis['status']): string {
  if (status === 'READY_FOR_CONVERSION') return 'Ready for conversion';
  if (status === 'BLOCKED') return 'Blocked (error)';
  return 'Not analyzed';
}

const ENTRY_ICON: Record<DependencyEntry['status'], React.ReactNode> = {
  RESOLVED: <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />,
  MISSING: <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />,
  AMBIGUOUS: <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />,
  CIRCULAR_DEPENDENCY: <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />,
  PARSE_ERROR: <HelpCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />,
};

const DependencyRow: React.FC<{ entry: DependencyEntry; depth: number }> = ({ entry, depth }) => (
  <div>
    <div
      className="flex items-start space-x-2 py-2 border-b border-slate-100 last:border-b-0"
      style={{ paddingLeft: `${depth * 16}px` }}
    >
      {ENTRY_ICON[entry.status]}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-mono font-semibold text-slate-900 truncate">
          {entry.resolvedFile ?? entry.copyName}
        </p>
        {entry.status !== 'RESOLVED' && (
          <p className="text-xs text-slate-500 mt-0.5">
            {entry.status}
            {entry.message ? ` — ${entry.message}` : ''}
          </p>
        )}
        {entry.status === 'AMBIGUOUS' && entry.candidates && (
          <p className="text-xs text-slate-500 mt-0.5">Candidates: {entry.candidates.join(', ')}</p>
        )}
      </div>
    </div>
    {entry.dependencies?.map((child) => (
      <DependencyRow key={`${child.copyName}-${depth}`} entry={child} depth={depth + 1} />
    ))}
  </div>
);

export const DependencyDiagnosticsModal: React.FC<DependencyDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  screenId,
}) => {
  const [analysis, setAnalysis] = useState<ProgramAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !screenId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    conversionService
      .getCopybookDependencies(screenId)
      .then((result) => {
        if (!cancelled) setAnalysis(result);
      })
      .catch((err) => {
        console.error('Failed to load copybook dependency diagnostics', err);
        if (!cancelled) setError('Could not load dependency diagnostics.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, screenId]);

  if (!isOpen) return null;

  const counts = analysis ? countDependencies(analysis.dependencies) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-8 flex flex-col space-y-6 max-h-[85vh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Program</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {analysis?.program ?? screenId}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading && <p className="text-sm text-slate-500">Loading dependency diagnostics…</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}

        {analysis && counts && (
          <div className="space-y-6 overflow-y-auto">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Dependency Status
              </p>
              <StatusBadge status={overallStatusLabel(analysis.status)} />
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Resolved', value: counts.resolved },
                { label: 'Missing', value: counts.missing },
                { label: 'Ambiguous', value: counts.ambiguous },
                { label: 'Total', value: counts.total },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Dependencies</p>
              {analysis.dependencies.length === 0 ? (
                <p className="text-sm text-slate-500">This program has no COPY statements.</p>
              ) : (
                <div className="border border-slate-200 rounded-xl px-3">
                  {analysis.dependencies.map((entry) => (
                    <DependencyRow key={entry.copyName} entry={entry} depth={0} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DependencyDiagnosticsModal;
