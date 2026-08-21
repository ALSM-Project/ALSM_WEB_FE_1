export type DiagnosticSeverity = 'Fatal' | 'Warning' | 'Error';

export interface SuggestedPatch {
  offendingLine: string;
  suggestedLine: string;
  reason: string;
}

export interface DiagnosticLog {
  id: string;
  timestamp: string;
  screenName: string;
  errorCode: string;
  severity: DiagnosticSeverity;
  lineNumber: number;
  offendingCode: string;
  suggestedPatch: SuggestedPatch;
  resolved: boolean;
}
