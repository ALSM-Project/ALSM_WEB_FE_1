import { apiClient } from '@/services/api/apiClient';
import type { SupportAttachmentItem } from '@/features/chat/supportAttachment.service';

export const FEEDBACK_CATEGORIES = [
  'Overall Experience',
  'Conversion Quality',
  'System Performance',
  'User Interface',
  'Customer Support',
  'Feature Request',
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export type FeedbackStatus = 'SUBMITTED' | 'IN_REVIEW' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface FeedbackItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  rating: number;
  category: FeedbackCategory;
  description: string;
  attachments: SupportAttachmentItem[];
  status: FeedbackStatus;
  staffNotes?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedbackPayload {
  rating: number;
  category: FeedbackCategory;
  description: string;
  attachments?: SupportAttachmentItem[];
}

export const feedbackService = {
  async submitFeedback(payload: CreateFeedbackPayload): Promise<FeedbackItem> {
    return apiClient.post<FeedbackItem>('/support/feedback', payload);
  },

  async listMyFeedback(): Promise<FeedbackItem[]> {
    const res = await apiClient.get<FeedbackItem[]>('/support/feedback/my');
    return res || [];
  },
};
