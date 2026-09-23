export type SourceType = 'BMS' | 'DSPF' | 'COBOL' | 'RPG' | 'TXT';
export type ScreenStatus = 'Completed' | 'Converted' | 'COMPLETED' | 'Processing' | 'Review Required' | 'Failed' | 'Ready' | 'Pending Parse' | 'Queued';
export type TargetFramework = 'React' | 'Vue' | 'Angular' | 'Next.js';
export type SourceFileStatus = ScreenStatus | 'Uploading' | 'Failed to parse';

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
  status: SourceFileStatus;
  /** Storage reference returned by the real conversion-sources upload endpoint. Undefined for pre-seeded mock rows. */
  inputReference?: string;
  /** Id of the LegacyScreen registered for this upload, so the row can link straight to its Convert page. */
  screenId?: string;
}
