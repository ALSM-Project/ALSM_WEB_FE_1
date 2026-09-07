export type ExportOutputOption = 'scaffold' | 'standalone' | 'storybook';

export type FrameworkTarget = 'react-19' | 'react-18';

export type StylingOption = 'tailwind' | 'css-modules';

export interface ExportFileItem {
  path: string;
  name: string;
  size: string;
  type: 'file' | 'dir';
  language?: 'typescript' | 'javascript' | 'json' | 'markdown' | 'html' | 'css';
  content?: string;
  children?: ExportFileItem[];
}

export interface ExportConfiguration {
  projectId: string;
  projectName: string;
  outputOption: ExportOutputOption;
  frameworkTarget: FrameworkTarget;
  stylingOption: StylingOption;
  includeTypeScriptStrict: boolean;
  includeUnitTests: boolean;
  includeStorybook: boolean;
  includeDocumentation: boolean;
  selectedScreenIds: string[];
}

export interface ExportProgressStep {
  id: string;
  label: string;
  status: 'idle' | 'in-progress' | 'completed' | 'error';
}

export interface BundleMetrics {
  totalFiles: number;
  totalLoc: number;
  estimatedSizeKb: number;
  selectedScreensCount: number;
}

export type FindingStatus = 'pending' | 'needs-correction' | 'manual-review' | 'not-applicable';

export interface Finding {
  id: string;
  lineNumber: string; // e.g. "Ln 20", "Ln 27-30"
  startLine: number;
  endLine?: number;
  badge?: string; // e.g. "AI-Suggested"
  title?: string;
  description: string;
  status: FindingStatus;
  notApplicableReason?: string;
  codeSnippet?: string;
}

