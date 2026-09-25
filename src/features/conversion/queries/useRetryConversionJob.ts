import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversionService } from '../services/conversion.service';
import { conversionKeys } from './conversionKeys';

/** Re-enqueues a real failed/dead conversion job (UC-54). Never auto-retries — this is only
 * ever triggered by an explicit user click. */
export function useRetryConversionJob(projectId: string, screenId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => conversionService.retryConversion(jobId),
    onSuccess: (job) => {
      queryClient.setQueryData(conversionKeys.job(projectId, screenId), job);
      queryClient.invalidateQueries({ queryKey: ['screens', projectId] });
    },
  });
}
