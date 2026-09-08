import { mockASTData, mockConversionResult, mockFieldMappings } from '@/mocks/conversions.mock';
import { mockDiagnosticsLogs } from '@/mocks/diagnostics.mock';
import { mockScreens, mockUploadedFiles } from '@/mocks/screens.mock';
import { apiClient } from '@/services/api/apiClient';
import type { ASTNode, ConversionResult, FieldMapping } from '../types/conversion';
import type { LegacyScreen, SourceFile } from '@/features/screens/types/screen';
import type { DiagnosticLog } from '@/features/diagnostics/types/diagnostics';

export interface ConversionJob {
  id: string;
  screenId?: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DEAD' | 'CANCELLED';
  resultReference?: string;
  errorCode?: string;
  errorMessage?: string;
  toolVersion?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export class ConversionService {
  private screens: LegacyScreen[] = [...mockScreens];
  private uploadedFiles: SourceFile[] = [...mockUploadedFiles];

  async getScreens(projectId: string): Promise<LegacyScreen[]> {
    console.log('[ConversionService] Getting screens for project:', projectId);
    return [...this.screens];
  }

  async getScreenById(screenId: string): Promise<LegacyScreen | null> {
    return this.screens.find((s) => s.id === screenId) || this.screens[0] || null;
  }

  async uploadFile(file: File): Promise<SourceFile> {
    const newFile: SourceFile = {
      id: `file-${Date.now()}`,
      fileName: file.name,
      sizeKb: Math.round(file.size / 1024),
      uploadedAt: 'Just now',
      status: 'Ready',
    };
    this.uploadedFiles.unshift(newFile);
    return newFile;
  }

  async getUploadedFiles(): Promise<SourceFile[]> {
    return [...this.uploadedFiles];
  }

  async convertScreen(_screenId: string): Promise<ConversionResult> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return mockConversionResult;
  }

  async bulkConvertScreens(projectId: string, screenIds: string[]): Promise<ConversionJob[]> {
    const jobs = await apiClient.post<ConversionJob[]>(`/projects/${projectId}/conversions/bulk`, {
      screenIds,
    });
    // Real conversion jobs start QUEUED — there is no conversion engine configured
    // yet, so reflect "queued for processing" locally rather than faking completion.
    this.screens = this.screens.map((s) =>
      screenIds.includes(s.id) ? { ...s, status: 'Processing' as const } : s
    );
    return jobs;
  }

  async getLatestConversion(projectId: string, screenId: string): Promise<ConversionJob | null> {
    const jobs = await apiClient.get<ConversionJob[]>(
      `/projects/${projectId}/screens/${screenId}/conversions`,
    );
    return jobs[0] ?? null;
  }

  async getASTData(_screenId: string): Promise<ASTNode> {
    return mockASTData;
  }

  async getFieldMappings(_screenId: string): Promise<FieldMapping[]> {
    return mockFieldMappings;
  }

  async saveFieldMapping(_screenId: string, _mappings: FieldMapping[]): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return true;
  }

  async getDiagnosticsLogs(_projectId: string): Promise<DiagnosticLog[]> {
    return mockDiagnosticsLogs;
  }

  async applyDiagnosticPatch(_logId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  }
}

export const conversionService = new ConversionService();
