import { apiClient } from '@/services/api/apiClient';
import type { DiagnosticLog, DiagnosticSeverity } from '../types/diagnostics';

interface BackendErrorLog {
  id: string;
  projectId: string;
  screenName: string;
  errorCode: string;
  severity: 'FATAL' | 'ERROR' | 'WARNING' | 'INFO';
  status: 'UNRESOLVED' | 'RESOLVED' | 'IGNORED';
  lineNumber: number;
  offendingCode: string;
  suggestedPatch?: {
    offendingLine: string;
    suggestedLine: string;
    reason: string;
  };
  createdAt?: string;
  resolvedAt?: string;
}

interface BackendListResponse {
  items: BackendErrorLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function toDiagnosticLog(item: BackendErrorLog): DiagnosticLog {
  const sevLower = item.severity ? item.severity.toLowerCase() : 'error';
  const severityTitle = (sevLower.charAt(0).toUpperCase() + sevLower.slice(1)) as DiagnosticSeverity;

  return {
    id: item.id,
    timestamp: item.createdAt
      ? new Date(item.createdAt).toISOString().replace('T', ' ').slice(0, 19)
      : new Date().toISOString().slice(0, 19),
    screenName: item.screenName || 'UnknownScreen',
    errorCode: item.errorCode || 'ERR-UNKNOWN',
    severity: severityTitle,
    lineNumber: item.lineNumber || 1,
    offendingCode: item.offendingCode || '',
    snippet: [
      { lineNumber: Math.max(1, (item.lineNumber || 1) - 1), code: '       * PRECEDING CONVERSION CONTEXT' },
      { lineNumber: item.lineNumber || 1, code: item.offendingCode, isOffending: true },
      { lineNumber: (item.lineNumber || 1) + 1, code: '       * SUBSEQUENT LOGIC DEFINITION' },
    ],
    suggestedPatch: {
      offendingLine: item.suggestedPatch?.offendingLine || item.offendingCode,
      suggestedLine: item.suggestedPatch?.suggestedLine || '',
      reason: item.suggestedPatch?.reason || '',
    },
    resolved: item.status === 'RESOLVED',
  };
}

export class DiagnosticsService {
  /** Real error logs for a project — no mock fallback. A real failure must surface as a
   * real error (the page shows it), and a real empty result must show as genuinely empty,
   * not silently replaced by stale/mock data. */
  async getDiagnosticsLogs(projectId: string): Promise<DiagnosticLog[]> {
    const response = await apiClient.get<BackendListResponse | BackendErrorLog[]>(
      `/projects/${projectId}/error-logs`
    );
    const rawItems: BackendErrorLog[] = Array.isArray(response) ? response : (response?.items ?? []);
    return rawItems.map(toDiagnosticLog);
  }

  /** Resolves a real error log via the real backend. No fallback — if the request fails,
   * the caller must see the real failure rather than a UI that claims success anyway. */
  async applyDiagnosticPatch(logId: string, projectId: string): Promise<void> {
    await apiClient.patch(`/projects/${projectId}/error-logs/${logId}/resolve`);
  }

  /** Local-only UI action — there is no backend support/notification pipeline for a "support
   * escalation" queue yet (that's a separate, not-yet-built feature: UC-57 "Assist Customer
   * with Conversion Errors"). Kept as-is so the existing button doesn't break; not treated as
   * a real network call, unlike getDiagnosticsLogs/applyDiagnosticPatch above. */
  async escalateToSupport(_logId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return true;
  }

  /** Local-only UI action — see escalateToSupport; no real "manual review queue" backend exists yet. */
  async sendToManualReview(_logId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return true;
  }

  /** Builds a downloadable text dump from the logs the caller already has loaded (the page's
   * own state is the single source of truth — this service holds no separate copy). */
  downloadFullLog(projectId: string, logs: DiagnosticLog[]): string {
    const header = `=== ALSM ERROR LOG & DIAGNOSTICS DUMP ===\nProject: ${projectId}\nGenerated: ${new Date().toISOString()}\n\n`;
    const body = logs
      .map(
        (log) =>
          `[${log.timestamp}] [${log.severity}] ${log.screenName}:${log.lineNumber} - ${log.errorCode}\n  Offending Code: ${log.offendingCode}\n  Reason: ${log.suggestedPatch.reason}\n`
      )
      .join('\n');
    return header + body;
  }
}

export const diagnosticsService = new DiagnosticsService();
