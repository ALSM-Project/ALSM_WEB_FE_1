import type { SourceType, ScreenStatus, TargetFramework } from '@/features/screens/types/screen';

export type { SourceType, ScreenStatus, TargetFramework };

export interface ConversionMetrics {
  fieldsProcessed: number;
  componentsGenerated: number;
  linesOfCode: number;
  sizeKb: number;
  duration: string;
}

export interface ConversionResult {
  screenId: string;
  screenName: string;
  targetFramework: string;
  timestamp: string;
  executionDuration: string;
  astNodesCount: number;
  generatedLoc: number;
  generatedCode: string;
  metrics: ConversionMetrics;
}

export interface ConversionResultFile {
  relativePath: string;
  content: string;
}

export interface ConversionResultBundle {
  conversionJobId: string;
  toolVersion?: string;
  files: ConversionResultFile[];
}

export interface FieldMapping {
  id: string;
  legacyField: {
    name: string;
    type: string;
    length: number;
    position: string;
  };
  componentMapping: {
    componentType: string;
    labelText: string;
    isRequired: boolean;
    minLength: number;
    maxLength: number;
    regexPattern: string;
    displayRow?: number;
    displayCol?: number;
  };
}

/** UC-28: real class/method names detected in a screen's generated Java code (COBOL→Java),
 * plus any user override. targetName equals originalName until the user renames it. */
export interface MethodMappingEntry {
  relativePath: string;
  kind: 'CLASS' | 'METHOD';
  originalName: string;
  targetName: string;
}

export interface MethodMappingView {
  projectId: string;
  screenId: string;
  hasGeneratedCode: boolean;
  entries: MethodMappingEntry[];
  updatedBy: string | null;
  updatedAt: string | null;
}
