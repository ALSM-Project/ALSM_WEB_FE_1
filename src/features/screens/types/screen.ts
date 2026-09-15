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
  /** Storage reference returned by the real conversion-sources upload endpoint, if this screen was uploaded (not seed/mock data). */
  inputReference?: string;
}

export interface SourceFile {
  id: string;
  fileName: string;
  sizeKb: number;
  uploadedAt: string;
  status: 'Ready' | 'Uploading' | 'Failed to parse';
  /** Storage reference returned by the real conversion-sources upload endpoint. Undefined for pre-seeded mock rows. */
  inputReference?: string;
}
