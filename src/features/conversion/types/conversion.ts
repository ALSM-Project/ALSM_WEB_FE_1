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

export interface ASTNode {
  id: string;
  name: string;
  type: string;
  children?: ASTNode[];
  details?: string;
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
  };
}
