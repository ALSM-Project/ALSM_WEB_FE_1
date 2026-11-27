import { apiClient } from '@/services/api/apiClient';

export type CustomerMeetingCategoryStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

export interface CustomerMeetingItem {
  id: string;
  source: 'MEETING' | 'MEETING_REQUEST' | 'LEAD_DEMO';
  title: string;
  purpose: string;
  agenda: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  timezone: string;
  organizerName: string;
  organizerEmail: string;
  platform: string;
  meetingUrl?: string;
  participants: string[];
  status: CustomerMeetingCategoryStatus;
  rawStatus: string;
}

export const customerMeetingsService = {
  async listMyMeetings(): Promise<CustomerMeetingItem[]> {
    const res = await apiClient.get<CustomerMeetingItem[]>('/meetings/my');
    return res || [];
  },

  async getMyMeetingById(id: string): Promise<CustomerMeetingItem> {
    return apiClient.get<CustomerMeetingItem>(`/meetings/my/${encodeURIComponent(id)}`);
  },
};
