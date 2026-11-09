import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ValidationRun } from '../types/validation';
import { ValidationOutcomeNotice } from './ValidationOutcomeNotice';

afterEach(cleanup);
const run = { status: 'COMPLETED', provider: 'gemini', model: 'configured-model' } as ValidationRun;
describe('validation execution provenance', () => {
  it('renders explicit provider success and actual model metadata', () => {
    render(<ValidationOutcomeNotice run={{ ...run, executionOutcome: 'AI_COMPLETED',
      resultProvider: 'gemini', resultModel: 'reviewed-model', modelVersion: 'observed-version' }} />);
    expect(screen.getByText('AI validation completed')).toBeInTheDocument();
    expect(screen.getByText('Result model: reviewed-model')).toBeInTheDocument();
    expect(screen.getByText('Model version: observed-version')).toBeInTheDocument();
  });
  it.each(['HEURISTIC_FALLBACK', 'HEURISTIC_ONLY'] as const)('does not label %s as provider success', outcome => {
    render(<ValidationOutcomeNotice run={{ ...run, executionOutcome: outcome,
      resultProvider: outcome === 'HEURISTIC_ONLY' ? 'fake' : 'heuristic-fallback', resultModel: 'heuristic-rules-v1',
      providerFailureCode: 'AI_PROVIDER_DAILY_QUOTA_EXCEEDED' }} />);
    expect(screen.queryByText('AI validation completed')).not.toBeInTheDocument();
    expect(screen.getByText(outcome === 'HEURISTIC_ONLY' ? 'Heuristic validation only'
      : 'Heuristic fallback — AI validation did not complete')).toBeInTheDocument();
    expect(screen.getByText(/These findings come from heuristic rules/)).toBeInTheDocument();
    expect(screen.getByText('AI_PROVIDER_DAILY_QUOTA_EXCEEDED')).toBeInTheDocument();
  });
  it('does not infer provider success for historical records', () => {
    render(<ValidationOutcomeNotice run={run} />);
    expect(screen.getByText('Validation completed — provider outcome unavailable')).toBeInTheDocument();
    expect(screen.queryByText('AI validation completed')).not.toBeInTheDocument();
  });
  it('shows failures even if stale success metadata is present', () => {
    render(<ValidationOutcomeNotice run={{ ...run, status: 'FAILED', executionOutcome: 'AI_COMPLETED',
      failureCode: 'AI_PROVIDER_AUTHENTICATION_FAILED' }} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Validation failed');
    expect(screen.queryByText('AI validation completed')).not.toBeInTheDocument();
  });
});
