import { useQuery } from '@tanstack/react-query';
import { conversionService } from '../services/conversion.service';
import type { ConversionJob } from '../services/conversion.service';
import { conversionKeys } from './conversionKeys';

const ACTIVE_STATUSES: ConversionJob['status'][] = ['QUEUED', 'PROCESSING'];

/** Polls a screen's latest conversion job every 2s while it's QUEUED/PROCESSING, and stops once it reaches a terminal status (FE guideline 02 §11 / 04 §12). */
export function useConversionJob(projectId: string, screenId: string) {
  return useQuery({
    queryKey: conversionKeys.job(projectId, screenId),
    queryFn: () => conversionService.getLatestConversion(projectId, screenId),
    refetchInterval: (query) => {
      const job = query.state.data;
      return job && ACTIVE_STATUSES.includes(job.status) ? 2000 : false;
    },
  });
}
