import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
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
  const failureCode = run.providerFailureCode ?? run.failureCode;

  const title = failed
    ? 'Validation failed'
    : fallback
      ? 'Heuristic fallback — AI validation did not complete'
      : heuristic
        ? 'Heuristic validation only'
        : aiCompleted
          ? 'AI validation completed'
          : 'Validation completed — provider outcome unavailable';

  const friendlyExplanation = (() => {
    if (failed) return 'An unexpected error occurred during validation. Review the details below or try running validation again.';
    if (fallback) {
      if (failureCode === 'AI_PROVIDER_TIMEOUT') {
        return 'These findings come from heuristic rules. Cloud AI response timed out (> 30s) due to network latency, so automated rule-based validation was applied to ensure uninterrupted progress.';
      }
      if (failureCode === 'AI_PROVIDER_DAILY_QUOTA_EXCEEDED') {
        return 'These findings come from heuristic rules. Cloud AI service quota was reached, so automated rule-based verification was applied.';
      }
      return 'These findings come from heuristic rules. Automated deterministic rule engine was applied to inspect syntax and semantics without disruption.';
    }
    if (heuristic) {
      return 'These findings come from heuristic rules. Evaluated via deterministic syntax and data type rulesets.';
    }
    if (aiCompleted) {
      return 'Provider execution completed. AI deep semantic analysis verified observable behavior and data structures.';
    }
    return 'This historical run has no explicit execution outcome; provider success cannot be confirmed.';
  })();

  return (
    <div
      role={failed ? 'alert' : 'status'}
      className={`rounded-xl border p-4 text-sm shadow-xs transition-all ${
        failed
          ? 'border-rose-200 bg-rose-50 text-rose-900'
          : aiCompleted
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : 'border-amber-200 bg-amber-50/90 text-amber-900'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {failed && <XCircle className="h-5 w-5 text-rose-600" />}
          {aiCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          {(fallback || heuristic || (!failed && !aiCompleted)) && (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-sm tracking-tight">{title}</p>
            {fallback && (
              <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                Rule Engine Fallback
              </span>
            )}
            {aiCompleted && (
              <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                AI Verified
              </span>
            )}
          </div>

          <p className="text-xs leading-relaxed opacity-90">{friendlyExplanation}</p>

          <div className="pt-1.5 text-xs border-t border-amber-200/60 flex flex-wrap gap-x-6 gap-y-1 text-slate-700">
            {provider && (
              <p>
                {run.resultProvider ? 'Result provider' : 'Configured provider'}: {provider}
              </p>
            )}
            {model && (
              <p>
                {run.resultModel ? 'Result model' : 'Configured model'}: {model}
              </p>
            )}
            {run.modelVersion && (
              <p>Model version: {run.modelVersion}</p>
            )}
          </div>

          {failureCode && (
            <p className="mt-1 font-mono text-xs text-amber-800 font-semibold">{failureCode}</p>
          )}
        </div>
      </div>
    </div>
  );
}
