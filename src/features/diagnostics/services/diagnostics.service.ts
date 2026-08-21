import { mockDiagnosticsLogs } from '@/mocks/diagnostics.mock';
import type { DiagnosticLog } from '../types/diagnostics';

export class DiagnosticsService {
  private logs: DiagnosticLog[] = [...mockDiagnosticsLogs];

  async getDiagnosticsLogs(_projectId: string): Promise<DiagnosticLog[]> {
    return [...this.logs];
  }

  async applyDiagnosticPatch(logId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.logs = this.logs.map((l) => (l.id === logId ? { ...l, resolved: true } : l));
    return true;
  }
}

export const diagnosticsService = new DiagnosticsService();
