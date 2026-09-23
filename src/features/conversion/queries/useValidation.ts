import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/api/apiError';
import { validationService } from '../services/validation.service';
import {
  ValidationRunStatus,
  type ReviewFindingInput,
  type ValidationRun,
} from '../types/validation';
import { validationKeys } from './validationKeys';

const ACTIVE_VALIDATION_STATUSES = new Set<ValidationRunStatus>([
  ValidationRunStatus.QUEUED,
  ValidationRunStatus.PROCESSING,
]);

export function validationRunPollingInterval(run: ValidationRun | undefined): number | false {
  return run && ACTIVE_VALIDATION_STATUSES.has(run.status) ? 3000 : false;
}

export function useValidationRuns(
  projectId: string,
  conversionJobId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: validationKeys.runs(projectId, conversionJobId ?? 'none'),
    queryFn: () => validationService.listValidationRuns(projectId, conversionJobId as string),
    enabled: enabled && Boolean(projectId) && Boolean(conversionJobId),
  });
}

export function useValidationRun(
  projectId: string,
  validationRunId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: validationKeys.run(projectId, validationRunId ?? 'none'),
    queryFn: () => validationService.getValidationRun(projectId, validationRunId as string),
    enabled: enabled && Boolean(projectId) && Boolean(validationRunId),
    refetchInterval: (query) => validationRunPollingInterval(query.state.data),
  });
}

export function useValidationFindings(
  projectId: string,
  validationRunId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: validationKeys.findings(projectId, validationRunId ?? 'none'),
    queryFn: () =>
      validationService.listValidationFindings(projectId, validationRunId as string),
    enabled: enabled && Boolean(projectId) && Boolean(validationRunId),
  });
}

export function useTriggerAiValidation(projectId: string, conversionJobId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      validationService.triggerAiValidation(projectId, conversionJobId as string),
    retry: false,
    onSuccess: (run) => {
      queryClient.setQueryData(validationKeys.run(projectId, run.id), run);
      queryClient.invalidateQueries({
        queryKey: validationKeys.runs(projectId, run.conversionJobId),
      });
    },
  });
}

interface ReviewMutationVariables {
  findingId: string;
  input: ReviewFindingInput;
}

export function useReviewValidationFinding(projectId: string, validationRunId: string | undefined) {
  const queryClient = useQueryClient();
  const findingsKey = validationKeys.findings(projectId, validationRunId ?? 'none');

  return useMutation({
    mutationFn: ({ findingId, input }: ReviewMutationVariables) =>
      validationService.reviewFinding(
        projectId,
        validationRunId as string,
        findingId,
        input,
      ),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: findingsKey });
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.status === 400 || error.status === 409)) {
        queryClient.invalidateQueries({ queryKey: findingsKey });
      }
    },
  });
}
