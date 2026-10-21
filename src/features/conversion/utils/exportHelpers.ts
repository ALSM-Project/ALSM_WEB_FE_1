/**
 * Utilities for formatting export file sizes and package names.
 */
export function formatExportArchiveName(projectName: string, targetType: string): string {
  const sanitized = projectName.trim().replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const timestamp = new Date().toISOString().slice(0, 10);
  return `${sanitized}_${targetType.toLowerCase()}_${timestamp}.zip`;
}

export function formatExportFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
