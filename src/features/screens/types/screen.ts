export type SourceType = 'BMS' | 'DSPF' | 'COBOL' | 'RPG' | 'TXT';
export type ScreenStatus = 'Completed' | 'Processing' | 'Review Required' | 'Failed' | 'Ready' | 'Pending Parse' | 'Queued';
export type TargetFramework = 'React' | 'Vue' | 'Angular' | 'Next.js';

export interface LegacyScreen {
  id: string;
  projectId: string;
  name: string;
  sourceType: SourceType;
  status: ScreenStatus;
  framework: TargetFramework;
  lastUpdated: string;
  path?: string;
  sizeKb?: number;
}

export interface SourceFile {
  id: string;
  fileName: string;
  sizeKb: number;
  uploadedAt: string;
  status: 'Ready' | 'Uploading' | 'Failed to parse';
}
