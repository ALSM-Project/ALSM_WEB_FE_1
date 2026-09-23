import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Download,
  ChevronRight,
  Code2,
  Wrench,
  Headphones,
  FileText,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { diagnosticsService } from '../services/diagnostics.service';
import type { DiagnosticLog } from '../types/diagnostics';
import { Button } from '@/shared/ui/Button';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ModernizationWorkflow } from '@/shared/ui/ModernizationWorkflow';
import { ROUTES } from '@/shared/constants/routes';

export const DiagnosticsPage: React.FC = () => {
  const { projectId = 'proj-acme' } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [selectedId, setSelectedId] = useState<string>('diag-1');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('24h');
  const [search, setSearch] = useState('');
  const [patching, setPatching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'warning'; message: string } | null>(
    null
  );

  useEffect(() => {
    diagnosticsService.getDiagnosticsLogs(projectId).then((data) => {
      setLogs(data);
      if (data.length > 0) {
        setSelectedId(data[0].id);
      }
    });
  }, [projectId]);

  const selectedLog = logs.find((l) => l.id === selectedId) || logs[0];

  const showNotification = (type: 'success' | 'info' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApplyPatch = async () => {
    if (!selectedLog) return;
    setPatching(true);
    try {
      await diagnosticsService.applyDiagnosticPatch(selectedLog.id);
      setLogs((prev) => prev.map((l) => (l.id === selectedLog.id ? { ...l, resolved: true } : l)));
      showNotification('success', `Patch successfully applied for ${selectedLog.screenName} (${selectedLog.errorCode}).`);
    } catch {
      showNotification('warning', 'Failed to apply patch. Please try again.');
    } finally {
      setPatching(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedLog) return;
    await diagnosticsService.escalateToSupport(selectedLog.id);
    setLogs((prev) => prev.map((l) => (l.id === selectedLog.id ? { ...l, escalated: true } : l)));
    showNotification('info', `Ticket escalated to ALSM Engineering Support for error ${selectedLog.errorCode}.`);
  };

  const handleSendManualReview = async () => {
    if (!selectedLog) return;
    await diagnosticsService.sendToManualReview(selectedLog.id);
    setLogs((prev) => prev.map((l) => (l.id === selectedLog.id ? { ...l, manualReview: true } : l)));
    showNotification('success', `Log sent to Manual Review queue.`);
  };

  const handleDownloadFullLog = async () => {
    const content = await diagnosticsService.downloadFullLog(projectId);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagnostics-full-${projectId}.log`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('success', 'Full diagnostic log downloaded successfully.');
  };

  const handleCopyPatch = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.screenName.toLowerCase().includes(search.toLowerCase()) ||
      log.errorCode.toLowerCase().includes(search.toLowerCase()) ||
      log.offendingCode.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || log.severity.toUpperCase() === severityFilter.toUpperCase();
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Standard Reusable PageHeader */}
      <PageHeader
        title="Diagnostics & Error Logs"
        subtitle="Analyze parsing failures, syntax diagnostics, and rule-based validation findings across workspace assets."
        actions={
          <Button
            onClick={handleDownloadFullLog}
            className="bg-[#0652CC] hover:bg-[#0655FF] text-white space-x-1.5 text-xs font-bold shadow-xs shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Full Log</span>
          </Button>
        }
      />

      {/* Modernization Workflow Step Banner */}
      <ModernizationWorkflow
        currentStep="convert"
        completedSteps={['upload']}
        onStepClick={(stepId) => {
          if (stepId === 'upload') navigate(ROUTES.PROJECTS.UPLOAD(projectId));
          if (stepId === 'mapping') navigate(ROUTES.PROJECTS.MAPPING(projectId, 'scr-acct010'));
          if (stepId === 'conversion') navigate(ROUTES.PROJECTS.CONVERT(projectId, 'scr-acct010'));
          if (stepId === 'validation' || stepId === 'review') navigate(ROUTES.PROJECTS.REVIEW(projectId, 'scr-acct010'));
          if (stepId === 'result') navigate(ROUTES.PROJECTS.RESULT(projectId, 'scr-acct010'));
          if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
        }}
      />

      {/* Notification Toast Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : notification.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center space-x-2 text-xs font-semibold">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#0652CC] flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#D9E2EC] shadow-2xs">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 absolute left-3 text-[#6B778C] pointer-events-none" />
            <select
              aria-label="Filter by Severity"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="pl-8 pr-8 py-2 bg-[#F7F9FC] border border-[#D9E2EC] text-[#091E42] text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0652CC] cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="FATAL">Fatal</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>
          </div>

          <div className="relative flex items-center">
            <Clock className="w-3.5 h-3.5 absolute left-3 text-[#6B778C] pointer-events-none" />
            <select
              aria-label="Filter by Time Range"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="pl-8 pr-8 py-2 bg-[#F7F9FC] border border-[#D9E2EC] text-[#091E42] text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0652CC] cursor-pointer"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#6B778C] pointer-events-none" />
          <input
            type="text"
            placeholder="Search error codes, screens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs text-[#091E42] focus:outline-none focus:ring-2 focus:ring-[#0652CC] placeholder-[#6B778C]"
          />
        </div>
      </div>

      {/* Error Log Table */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#F7F9FC] text-[#42526E] font-sans font-bold uppercase text-[11px] border-b border-[#D9E2EC] tracking-wider">
              <tr>
                <th className="p-3.5 pl-5">Timestamp</th>
                <th className="p-3.5">Screen Name</th>
                <th className="p-3.5">Error Code</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Offending Line</th>
                <th className="p-3.5 pr-5 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#6B778C] font-sans text-xs">
                    No error logs matching your current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isSelected = log.id === selectedId;
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedId(log.id)}
                      className={`cursor-pointer transition-all duration-150 group ${
                        isSelected
                          ? 'bg-blue-50/80 text-[#091E42] border-l-4 border-[#0652CC] font-semibold'
                          : 'hover:bg-slate-50/80 text-[#42526E] border-l-4 border-transparent'
                      }`}
                    >
                      <td className="p-3.5 pl-5 font-sans text-xs text-[#6B778C] whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-3.5 font-sans text-xs font-bold text-[#091E42] whitespace-nowrap">{log.screenName}</td>
                      <td className="p-3.5 whitespace-nowrap font-mono text-xs">
                        <span
                          className={
                            log.severity === 'Fatal'
                              ? 'text-[#091E42] font-bold'
                              : log.severity === 'Warning'
                              ? 'text-amber-700 font-semibold'
                              : 'text-[#0652CC] font-semibold'
                          }
                        >
                          {log.errorCode}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            log.severity === 'Fatal'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : log.severity === 'Warning'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-blue-50 text-[#0652CC] border-blue-200'
                          }`}
                        >
                          {log.severity}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-mono text-xs text-[#42526E]">
                        {log.offendingLineDisplay || `Line ${log.lineNumber}`}
                      </td>
                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <ChevronRight
                          className={`w-4 h-4 transition-all ${
                            isSelected
                              ? 'text-[#0652CC] translate-x-0.5'
                              : 'text-slate-300 opacity-0 group-hover:opacity-100'
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Split Details View: Source Code Snippet (Left) & AI Resolution (Right) */}
      {selectedLog && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Source Code Snippet */}
          <div className="bg-white border border-[#D9E2EC] rounded-2xl p-5 space-y-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-3">
                <div className="flex items-center space-x-2 text-[#091E42] font-bold text-xs uppercase tracking-wider">
                  <Code2 className="w-4 h-4 text-[#0652CC]" />
                  <span>Source Code Snippet</span>
                </div>
                <span className="font-mono text-xs font-bold text-[#0652CC] bg-[#E8F1FF] px-2.5 py-1 rounded-lg border border-blue-200">
                  {selectedLog.screenName}
                </span>
              </div>

              {/* Dark Code Snippet Viewer */}
              <div className="mt-4 bg-[#0F172A] rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-300 shadow-inner overflow-x-auto">
                <div className="space-y-1">
                  {selectedLog.snippet?.map((line) => (
                    <div
                      key={line.lineNumber}
                      className={`flex items-center rounded-sm px-2 py-0.5 transition-colors ${
                        line.isOffending
                          ? 'bg-rose-950/80 text-rose-200 border-l-2 border-rose-500 font-semibold -mx-2 px-3 py-1'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="w-10 text-slate-500 text-right pr-4 select-none font-mono text-[11px]">
                        {line.lineNumber}
                      </span>
                      <span className="whitespace-pre">{line.code}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: AI-Suggested Resolution */}
          <div className="bg-white border border-[#D9E2EC] rounded-2xl p-5 space-y-4 shadow-2xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-3">
                <div className="flex items-center space-x-2 text-[#091E42] font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#0652CC]" />
                  <span>AI-Suggested Resolution</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {selectedLog.suggestedPatch.confidence || 'High Confidence Match'}
                </span>
              </div>

              <p className="text-xs text-[#42526E] leading-relaxed font-sans font-medium">
                {selectedLog.suggestedPatch.reason}
              </p>

              {/* Suggested Patch Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">
                    {selectedLog.suggestedPatch.targetFramework || 'Suggested Patch (React)'}
                  </span>
                  <button
                    onClick={() =>
                      handleCopyPatch(
                        selectedLog.suggestedPatch.patchSnippet || selectedLog.suggestedPatch.suggestedLine
                      )
                    }
                    className="flex items-center space-x-1 text-[11px] text-[#0652CC] hover:underline font-bold transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Patch</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto shadow-inner">
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {selectedLog.suggestedPatch.patchSnippet || selectedLog.suggestedPatch.suggestedLine}
                  </pre>
                </div>
              </div>
            </div>

            {/* Resolution Action Buttons inside AI Card */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-3 border-t border-[#E5EAF0]">
              <Button
                variant="primary"
                onClick={handleApplyPatch}
                isLoading={patching}
                disabled={selectedLog.resolved}
                className="w-full sm:w-auto space-x-1.5 text-xs font-bold bg-[#0652CC] hover:bg-[#0655FF] text-white px-4 py-2 rounded-xl shadow-xs"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{selectedLog.resolved ? 'Patch Applied & Retried' : 'Apply Patch & Retry'}</span>
              </Button>

              <Button
                variant="secondary"
                onClick={handleEscalate}
                disabled={selectedLog.escalated}
                className="w-full sm:w-auto space-x-1.5 text-xs font-semibold border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl"
              >
                <Headphones className="w-3.5 h-3.5 text-rose-600" />
                <span>{selectedLog.escalated ? 'Escalated' : 'Escalate to Support'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Global Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#E5EAF0]">
        <Button
          variant="secondary"
          onClick={handleSendManualReview}
          disabled={selectedLog?.manualReview}
          className="w-full sm:w-auto space-x-1.5 text-xs font-semibold border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl"
        >
          <FileText className="w-3.5 h-3.5 text-amber-600" />
          <span>{selectedLog?.manualReview ? 'Sent to Manual Review' : 'Send to Manual Review'}</span>
        </Button>

        <Button
          variant="primary"
          onClick={handleDownloadFullLog}
          className="w-full sm:w-auto space-x-1.5 text-xs font-bold bg-[#0652CC] hover:bg-[#0655FF] text-white px-5 py-2 rounded-xl shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Log Archive</span>
        </Button>
      </div>
    </div>
  );
};

export default DiagnosticsPage;
