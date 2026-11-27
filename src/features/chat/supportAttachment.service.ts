import { apiClient } from '@/services/api/apiClient';
import { env } from '@/shared/constants/env';

export interface SupportAttachmentItem {
  fileId?: string;
  name: string;
  url?: string;
  size?: number;
  mimeType?: string;
}

export async function uploadSupportAttachment(file: File): Promise<SupportAttachmentItem> {
  const form = new FormData();
  form.append('file', file);
  return apiClient.postForm<SupportAttachmentItem>('/support/attachments', form);
}

export function resolveAttachmentUrl(url?: string): string {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = env.apiBaseUrl.replace(/\/+$/, '');
  const normalized = url.startsWith('/') ? url : `/${url}`;
  return `${base}/api/v1${normalized}`;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
