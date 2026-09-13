import type { Project, WorkspaceQuota } from '@/features/projects/types/project';

export const mockQuota: WorkspaceQuota = {
  screensUsed: 45,
  screensMax: 500,
  programsUsed: 8,
  programsMax: 100,
  storageUsedGb: 12.4,
  storageMaxGb: 50,
};

export const mockProjects: Project[] = [
  {
    id: 'proj-mortgage',
    name: 'Mortgage-System-v1',
    description: 'Legacy mortgage management system BMS and COBOL modernization workspace',
    status: 'ACTIVE',
    screensCount: 24,
    programsCount: 6,
    progressPercentage: 65,
    targetFramework: 'React TypeScript',
    createdAt: '2023-09-01T10:00:00Z',
    updatedAt: '2 hours ago',
  },
  {
    id: 'proj-crm',
    name: 'Legacy-CRM-Export',
    description: 'DSPF screen layout export and CRM integration workspace',
    status: 'DRAFT',
    screensCount: 12,
    programsCount: 3,
    progressPercentage: 20,
    targetFramework: 'React TypeScript',
    createdAt: '2023-09-10T09:00:00Z',
    updatedAt: 'Yesterday',
  },
  {
    id: 'proj-acme',
    name: 'Acme Corp Modernization',
    description: 'BMS and COBOL conversion workspace for Core Banking System migration',
    status: 'ACTIVE',
    screensCount: 48,
    programsCount: 12,
    progressPercentage: 75,
    targetFramework: 'React TypeScript',
    createdAt: '2023-09-01T10:00:00Z',
    updatedAt: '3 days ago',
  },
];
