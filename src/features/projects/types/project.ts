export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'SOFT_DELETED';

export interface WorkspaceQuota {
  screensUsed: number;
  screensMax: number;
  programsUsed: number;
  programsMax: number;
  storageUsedGb: number;
  storageMaxGb: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  screensCount: number;
  programsCount: number;
  progressPercentage: number;
  targetFramework: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
}
