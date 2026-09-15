import { useQuery } from '@tanstack/react-query';
import { conversionService } from '../services/conversion.service';
import { conversionKeys } from './conversionKeys';

/** Fetches the real generated code for a completed conversion job. Pass `enabled: false` (or an undefined jobId) until the job's status is COMPLETED — the backend rejects the call otherwise. */
export function useConversionResult(jobId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: conversionKeys.result(jobId ?? 'none'),
    queryFn: () => conversionService.getConversionResult(jobId as string),
    enabled: Boolean(jobId) && enabled,
    retry: false,
  });
}
