export type ProjectStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'SOFT_DELETED';

export interface WorkspaceQuota {
  screensUsed: number;
  screensMax: number;
  programsUsed: number;
  programsMax: number;
  storageUsedGb: number;
  storageMaxGb: number;
}

export type ConversionType = 'BMS_DSPF_TO_FRONTEND' | 'COBOL_TO_JAVA';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  conversionType: ConversionType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  conversionType: ConversionType;
}
