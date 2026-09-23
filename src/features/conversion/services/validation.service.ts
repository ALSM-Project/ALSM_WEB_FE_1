import { apiClient } from '@/services/api/apiClient';
import type {
  ReviewFindingInput,
  ValidationFinding,
  ValidationRun,
} from '../types/validation';

export class ValidationService {
  triggerAiValidation(projectId: string, conversionJobId: string): Promise<ValidationRun> {
    return apiClient.post<ValidationRun>(
      `/projects/${projectId}/conversions/${conversionJobId}/validation-runs`,
    );
  }

  listValidationRuns(projectId: string, conversionJobId: string): Promise<ValidationRun[]> {
    return apiClient.get<ValidationRun[]>(
      `/projects/${projectId}/conversions/${conversionJobId}/validation-runs`,
    );
  }

  getValidationRun(projectId: string, validationRunId: string): Promise<ValidationRun> {
    return apiClient.get<ValidationRun>(
      `/projects/${projectId}/validation-runs/${validationRunId}`,
    );
  }

  listValidationFindings(
    projectId: string,
    validationRunId: string,
  ): Promise<ValidationFinding[]> {
    return apiClient.get<ValidationFinding[]>(
      `/projects/${projectId}/validation-runs/${validationRunId}/findings`,
    );
  }

  reviewFinding(
    projectId: string,
    validationRunId: string,
    findingId: string,
    input: ReviewFindingInput,
  ): Promise<ValidationFinding> {
    return apiClient.patch<ValidationFinding>(
      `/projects/${projectId}/validation-runs/${validationRunId}/findings/${findingId}/review`,
      input,
    );
  }
}

export const validationService = new ValidationService();
