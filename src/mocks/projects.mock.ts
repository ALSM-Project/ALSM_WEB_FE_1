import type { WorkspaceQuota } from '@/features/projects/types/project';

export const mockQuota: WorkspaceQuota = {
  screensUsed: 45,
  screensMax: 500,
  programsUsed: 8,
  programsMax: 100,
  storageUsedGb: 12.4,
  storageMaxGb: 50,
};
