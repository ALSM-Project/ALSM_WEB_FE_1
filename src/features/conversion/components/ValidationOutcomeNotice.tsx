import type { ValidationRun } from '../types/validation';

/** Missing provenance on historical runs must never imply successful provider execution. */
export function ValidationOutcomeNotice({ run }: { run?: ValidationRun }) {
  if (!run || (run.status !== 'COMPLETED' && run.status !== 'FAILED')) return null;
  const provider = run.resultProvider ?? run.provider;
  const model = run.resultModel ?? run.model;
  const fallback = run.executionOutcome === 'HEURISTIC_FALLBACK' || provider === 'heuristic-fallback';
  const heuristic = run.executionOutcome === 'HEURISTIC_ONLY' || provider === 'fake' || provider === 'heuristic';
  const failed = run.status === 'FAILED';
  const aiCompleted = run.executionOutcome === 'AI_COMPLETED' && !fallback && !heuristic && !failed;
  const title = failed ? 'Validation failed'
    : fallback ? 'Heuristic fallback — AI validation did not complete'
      : heuristic ? 'Heuristic validation only'
        : aiCompleted ? 'AI validation completed'
          : 'Validation completed — provider outcome unavailable';
  return (
    <div role={failed ? 'alert' : 'status'} className={`rounded-lg border p-4 text-sm ${
      failed ? 'border-rose-200 bg-rose-50 text-rose-900'
        : aiCompleted ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-amber-200 bg-amber-50 text-amber-900'
    }`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{failed ? 'Review the failure before requesting another validation.'
        : fallback || heuristic ? 'These findings come from heuristic rules. Successful Gemini execution is not established.'
          : aiCompleted ? 'Provider execution completed. Findings remain advisory and do not establish semantic equivalence.'
            : 'This historical run has no explicit execution outcome; provider success cannot be confirmed.'}</p>
      {provider && <p className="mt-2">{run.resultProvider ? 'Result provider' : 'Configured provider'}: {provider}</p>}
      {model && <p>{run.resultModel ? 'Result model' : 'Configured model'}: {model}</p>}
      {run.modelVersion && <p>Model version: {run.modelVersion}</p>}
      {(run.providerFailureCode || run.failureCode) && (
        <p className="mt-1 font-mono text-xs">{run.providerFailureCode ?? run.failureCode}</p>
      )}
    </div>
  );
}
