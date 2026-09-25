import { useQuery } from '@tanstack/react-query';
import { conversionService } from '../services/conversion.service';
import { conversionKeys } from './conversionKeys';

/** Real, full version history for a screen (UC-19) — every past conversion attempt, newest first. */
export function useConversionHistory(projectId: string, screenId: string) {
  return useQuery({
    queryKey: conversionKeys.history(projectId, screenId),
    queryFn: () => conversionService.getConversionHistory(projectId, screenId),
  });
}
