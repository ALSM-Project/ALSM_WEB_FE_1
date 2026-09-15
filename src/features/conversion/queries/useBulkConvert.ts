import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversionService } from '../services/conversion.service';
import { conversionKeys } from './conversionKeys';

/** Creates one conversion job per screen. Never auto-retries (FE guideline 04 §16). */
export function useBulkConvert(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (screenIds: string[]) => conversionService.bulkConvertScreens(projectId, screenIds),
    onSuccess: (jobs) => {
      for (const job of jobs) {
        if (job.screenId) {
          queryClient.setQueryData(conversionKeys.job(projectId, job.screenId), job);
        }
      }
    },
  });
}
