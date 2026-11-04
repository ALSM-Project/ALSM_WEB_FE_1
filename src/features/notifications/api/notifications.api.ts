import { apiClient } from '@/services/api/apiClient';

export interface SystemNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationList {
  items: SystemNotification[];
  unreadCount: number;
}

export const notificationsApi = {
  list: () => apiClient.get<NotificationList>('/notifications'),
  markRead: (id: string) => apiClient.patch<{ id: string; isRead: boolean }>(`/notifications/${encodeURIComponent(id)}/read`, {}),
  markAllRead: () => apiClient.patch<{ updatedCount: number }>('/notifications/read-all', {}),
};
