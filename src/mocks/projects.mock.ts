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
    id: 'proj-acme',
    name: 'Acme Corp Modernization',
    description: 'BMS and COBOL conversion workspace for Core Banking System migration',
    status: 'ACTIVE',
    screensCount: 48,
    programsCount: 12,
    progressPercentage: 75,
    targetFramework: 'React TypeScript',
    createdAt: '2023-09-01T10:00:00Z',
    updatedAt: '2023-10-12T14:30:00Z',
  },
  {
    id: 'proj-banking',
    name: 'CoreBanking_Legacy',
    description: 'COBOL to Java Spring Boot migration pipeline',
    status: 'ACTIVE',
    screensCount: 24,
    programsCount: 6,
    progressPercentage: 45,
    targetFramework: 'React TypeScript',
    createdAt: '2023-09-15T09:00:00Z',
    updatedAt: '2023-10-10T11:20:00Z',
  },
  {
    id: 'proj-inventory',
    name: 'Inventory_AS400',
    description: 'RPG to Node.js / React modernization effort',
    status: 'ACTIVE',
    screensCount: 18,
    programsCount: 4,
    progressPercentage: 92,
    targetFramework: 'React TypeScript',
    createdAt: '2023-08-20T16:00:00Z',
    updatedAt: '2023-10-05T08:10:00Z',
  },
];
