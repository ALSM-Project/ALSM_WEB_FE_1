export type ExportOutputOption = 'scaffold' | 'standalone' | 'storybook';

export type FrameworkTarget = 'react-19' | 'react-18';

export type StylingOption = 'tailwind' | 'css-modules';

export interface ExportFileItem {
  path: string;
  name: string;
  size: string;
  type: 'file' | 'dir';
  language?: 'typescript' | 'javascript' | 'json' | 'markdown' | 'html' | 'css' | 'java' | 'xml' | 'yaml';
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


/** Output formats of a Java (COBOL to Java) export. Used by the page only - the API keeps its own formats. */
export type JavaExportFormat = 'spring-boot-batch' | 'java-sources';

export interface JavaExportOptions {
  format: JavaExportFormat;
  includeJUnitTests: boolean;
  includeReadme: boolean;
}
