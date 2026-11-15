export type WorkspaceType = 'SCREENS' | 'PROGRAMS' | 'UNSUPPORTED';

/**
 * Resolves the modernization workspace mode based strictly on the project's
 * persisted conversion type. Never infers from project name, filenames, or user roles.
 */
export function resolveWorkspace(conversionType?: string | null): WorkspaceType {
  switch (conversionType) {
    case 'COBOL_TO_JAVA':
      return 'PROGRAMS';

    case 'BMS_DSPF_TO_REACT':
    case 'BMS_DSPF_TO_FRONTEND':
      return 'SCREENS';

    default:
      return 'UNSUPPORTED';
  }
}

export function isCobolProject(conversionType?: string | null): boolean {
  return resolveWorkspace(conversionType) === 'PROGRAMS';
}

export function isScreensProject(conversionType?: string | null): boolean {
  return resolveWorkspace(conversionType) === 'SCREENS';
}

export const WORKSPACE_METADATA = {
  PROGRAMS: {
    title: 'Programs Workspace',
    description: 'Analyze, convert, validate, and inspect legacy COBOL business logic programs.',
    badgeLabel: 'COBOL → Java',
    sourceLabel: 'COBOL',
    targetFramework: 'Java 21 + Spring Boot',
    itemNoun: 'program',
    itemNounPlural: 'programs',
  },
  SCREENS: {
    title: 'Screens Workspace',
    description: 'Analyze, convert, validate, and inspect legacy BMS/DSPF screen maps.',
    badgeLabel: 'BMS/DSPF → React',
    sourceLabel: 'BMS/DSPF',
    targetFramework: 'React 19 + TypeScript',
    itemNoun: 'screen',
    itemNounPlural: 'screens',
  },
} as const;
