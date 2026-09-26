import { apiClient } from '@/services/api/apiClient';
import type {
  ConversionQualityReviewRecord,
  ConversionQualityReviewResponse,
  SubmitQualityReviewPayload,
} from '../types/quality-review';

export class QualityReviewService {
  getQualityReview(
    projectId: string,
    conversionJobId: string,
  ): Promise<ConversionQualityReviewResponse> {
    return apiClient.get<ConversionQualityReviewResponse>(
      `/projects/${projectId}/conversions/${conversionJobId}/quality-review`,
    );
  }

  submitQualityReview(
    projectId: string,
    conversionJobId: string,
    payload: SubmitQualityReviewPayload,
  ): Promise<ConversionQualityReviewRecord> {
    return apiClient.patch<ConversionQualityReviewRecord>(
      `/projects/${projectId}/conversions/${conversionJobId}/quality-review`,
      payload,
    );
  }
}

export const qualityReviewService = new QualityReviewService();
