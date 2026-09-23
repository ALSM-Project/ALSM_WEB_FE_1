import type { AxiosProgressEvent } from 'axios';
import { mockASTData } from '@/mocks/conversions.mock';
import { mockDiagnosticsLogs } from '@/mocks/diagnostics.mock';
import { apiClient } from '@/services/api/apiClient';
import type { ASTNode, ConversionResultBundle, FieldMapping } from '../types/conversion';
import type { LegacyScreen } from '@/features/screens/types/screen';
import type { DiagnosticLog } from '@/features/diagnostics/types/diagnostics';
import type { ProgramAnalysis } from '@/features/screens/types/copybookDependency';

/** Shape returned by the real backend — see ScreenRecord in ALSM_WEB_BE. */
interface ScreenRecordDto {
  id: string;
  projectId: string;
  name: string;
  sourceType: 'BMS' | 'DSPF' | 'COBOL';
  status: 'READY' | 'PROCESSING' | 'COMPLETED' | 'REVIEW_REQUIRED' | 'FAILED';
  inputReference: string;
  sizeBytes?: number;
  createdAt: string;
  updatedAt: string;
}

const SCREEN_STATUS_LABELS: Record<ScreenRecordDto['status'], LegacyScreen['status']> = {
  READY: 'Ready',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  REVIEW_REQUIRED: 'Review Required',
  FAILED: 'Failed',
};

function toLegacyScreen(record: ScreenRecordDto): LegacyScreen {
  return {
    id: record.id,
    projectId: record.projectId,
    name: record.name,
    sourceType: record.sourceType,
    status: SCREEN_STATUS_LABELS[record.status],
    framework: 'React',
    lastUpdated: new Date(record.updatedAt).toLocaleString(),
    sizeKb: record.sizeBytes ? Math.round(record.sizeBytes / 1024) : undefined,
    inputReference: record.inputReference,
  };
}

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

export interface UploadConversionSourceResult {
  inputReference: string;
  files: { name: string; sizeBytes: number }[];
  screens: LegacyScreen[];
}

interface FieldMappingResponse {
  mappings: Omit<FieldMapping, 'id'>[];
}

export class ConversionService {
  /** Real, backend-persisted screens — a screen only exists once a real source file has been uploaded (see uploadSource). No in-memory or seeded fallback list. */
  async getScreens(projectId: string): Promise<LegacyScreen[]> {
    const records = await apiClient.get<ScreenRecordDto[]>(`/projects/${projectId}/screens`);
    return records.map(toLegacyScreen);
  }

  async getScreenById(screenId: string): Promise<LegacyScreen | null> {
    try {
      return toLegacyScreen(await apiClient.get<ScreenRecordDto>(`/screens/${screenId}`));
    } catch {
      return null;
    }
  }

  /** Real COBOL copybook dependency analysis for one screen (computed by the backend at
   * upload time). No mock fallback — a real failure here must surface as a real error. */
  async getCopybookDependencies(screenId: string): Promise<ProgramAnalysis> {
    return apiClient.get<ProgramAnalysis>(`/screens/${screenId}/copybook-dependencies`);
  }

  /** Uploads real legacy source files (BMS/DSPF or COBOL + copybooks) to the backend. The
   * backend persists both the file bytes and a real Screen record per uploaded program/screen —
   * nothing is simulated and nothing needs to be re-registered client-side afterward. */
  async uploadSource(
    projectId: string,
    files: File[],
    onUploadProgress?: (percent: number) => void,
  ): Promise<UploadConversionSourceResult> {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    const response = await apiClient.postForm<{
      inputReference: string;
      files: { name: string; sizeBytes: number }[];
      screens: ScreenRecordDto[];
    }>(`/projects/${projectId}/conversion-sources`, form, {
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (!onUploadProgress || !event.total) return;
        onUploadProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
    return { ...response, screens: response.screens.map(toLegacyScreen) };
  }

  /** Creates a single conversion job. Jobs start QUEUED — there is no fake instant success; poll getLatestConversion for real status. */
  async createConversion(
    projectId: string,
    input: { screenId?: string; inputReference?: string },
  ): Promise<ConversionJob> {
    return apiClient.post<ConversionJob>(`/projects/${projectId}/conversions`, input);
  }

  /** Fetches the real generated code for a COMPLETED conversion job. Throws if the job hasn't completed yet — callers should only call this once status === 'COMPLETED'. */
  async getConversionResult(jobId: string): Promise<ConversionResultBundle> {
    return apiClient.get<ConversionResultBundle>(`/conversions/${jobId}/result`);
  }

  async bulkConvertScreens(projectId: string, screenIds: string[]): Promise<ConversionJob[]> {
    // Real conversion jobs start QUEUED — the real per-screen status now comes from the
    // backend (synced onto the Screen record as its job progresses), not a local guess.
    return apiClient.post<ConversionJob[]>(`/projects/${projectId}/conversions/bulk`, { screenIds });
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

  async getFieldMappings(projectId: string, screenId: string): Promise<FieldMapping[]> {
    const res = await apiClient.get<FieldMappingResponse>(
      `/projects/${projectId}/screens/${screenId}/field-mapping`,
    );
    return res.mappings.map((entry, index) => ({ id: `fm-${index}`, ...entry }));
  }

  async saveFieldMapping(
    projectId: string,
    screenId: string,
    mappings: FieldMapping[],
  ): Promise<boolean> {
    await apiClient.put(`/projects/${projectId}/screens/${screenId}/field-mapping`, {
      mappings: mappings.map(({ legacyField, componentMapping }) => ({
        legacyField,
        componentMapping,
      })),
    });
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
