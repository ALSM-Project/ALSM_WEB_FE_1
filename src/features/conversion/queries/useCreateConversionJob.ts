import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversionService } from '../services/conversion.service';
import { conversionKeys } from './conversionKeys';

/** Creates a single conversion job. Never auto-retries (FE guideline 04 §16 — job creation is not idempotent). */
export function useCreateConversionJob(projectId: string, screenId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { inputReference?: string } = {}) =>
      conversionService.createConversion(projectId, { screenId, inputReference: input.inputReference }),
    onSuccess: (job) => {
      queryClient.setQueryData(conversionKeys.job(projectId, screenId), job);
    },
  });
}
