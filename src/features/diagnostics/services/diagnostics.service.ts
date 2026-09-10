import { mockDiagnosticsLogs } from '@/mocks/diagnostics.mock';
import type { DiagnosticLog } from '../types/diagnostics';

export class DiagnosticsService {
  private logs: DiagnosticLog[] = mockDiagnosticsLogs.map((l) => ({ ...l }));

  async getDiagnosticsLogs(_projectId: string): Promise<DiagnosticLog[]> {
    return [...this.logs];
  }

  async applyDiagnosticPatch(logId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    this.logs = this.logs.map((l) => (l.id === logId ? { ...l, resolved: true } : l));
    return true;
  }

  async escalateToSupport(logId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    this.logs = this.logs.map((l) => (l.id === logId ? { ...l, escalated: true } : l));
    return true;
  }

  async sendToManualReview(logId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    this.logs = this.logs.map((l) => (l.id === logId ? { ...l, manualReview: true } : l));
    return true;
  }

  async downloadFullLog(projectId: string): Promise<string> {
    const header = `=== ALSM ERROR LOG & DIAGNOSTICS DUMP ===\nProject: ${projectId}\nGenerated: ${new Date().toISOString()}\n\n`;
    const body = this.logs
      .map(
        (log) =>
          `[${log.timestamp}] [${log.severity}] ${log.screenName}:${log.lineNumber} - ${log.errorCode}\n  Offending Code: ${log.offendingCode}\n  Reason: ${log.suggestedPatch.reason}\n`
      )
      .join('\n');
    return header + body;
  }
}

export const diagnosticsService = new DiagnosticsService();
