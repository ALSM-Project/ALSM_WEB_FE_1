import { useQuery } from '@tanstack/react-query';
import { conversionService } from '../services/conversion.service';
import { conversionKeys } from './conversionKeys';

/** Fetches one specific conversion job by id (UC-19: viewing a specific historical
 * version, not just the screen's latest job). */
export function useConversionJobById(jobId: string | undefined) {
  return useQuery({
    queryKey: conversionKeys.jobById(jobId ?? 'none'),
    queryFn: () => conversionService.getConversionJobById(jobId as string),
    enabled: Boolean(jobId),
  });
}
