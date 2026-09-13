export type DiagnosticSeverity = 'Fatal' | 'Warning' | 'Error' | 'Info';

export interface CodeSnippetLine {
  lineNumber: number;
  code: string;
  isOffending?: boolean;
}

export interface SuggestedPatch {
  offendingLine: string;
  suggestedLine: string;
  reason: string;
  confidence?: string;
  targetFramework?: string;
  patchSnippet?: string;
}

export interface DiagnosticLog {
  id: string;
  timestamp: string;
  screenName: string;
  errorCode: string;
  severity: DiagnosticSeverity;
  lineNumber: number;
  offendingCode: string;
  offendingLineDisplay?: string;
  snippet: CodeSnippetLine[];
  suggestedPatch: SuggestedPatch;
  resolved: boolean;
  escalated?: boolean;
  manualReview?: boolean;
}
