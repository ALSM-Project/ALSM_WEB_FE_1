import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { Breadcrumb } from '@/shared/navigation/Breadcrumb';
import { Button } from '@/shared/ui/Button';

export const DiagnosticsPage: React.FC = () => {
  const { projectId = 'proj-acme' } = useParams();
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
    <div className="space-y-6 py-3 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: selectedLog?.screenName || 'LoginScreen.bms' },
          { label: 'Diagnostics' },
        ]}
      />

      {/* Header Bar with Title, Status Pill, and Download Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Error Logs & Diagnostics</h1>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 space-x-1.5 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse"></span>
            <span>Failed</span>
          </span>
        </div>

        <Button
          variant="secondary"
          onClick={handleDownloadFullLog}
          className="self-start sm:self-auto space-x-2 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Download Full Log</span>
        </Button>
      </div>

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
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <select
              aria-label="Filter by Severity"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="pl-8 pr-8 py-2 bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="FATAL">Fatal</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>
          </div>

          <div className="relative flex items-center">
            <Clock className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <select
              aria-label="Filter by Time Range"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="pl-8 pr-8 py-2 bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white cursor-pointer"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search error codes, screens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white placeholder-slate-400"
          />
        </div>
      </div>

      {/* Error Log Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 font-sans font-semibold uppercase text-[11px] border-b border-slate-200/80 tracking-wider">
              <tr>
                <th className="p-3.5 pl-5">Timestamp</th>
                <th className="p-3.5">Screen Name</th>
                <th className="p-3.5">Error Code</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Offending Line</th>
                <th className="p-3.5 pr-5 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-sans text-xs">
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
                          ? 'bg-blue-50/80 text-slate-900 border-l-4 border-brand-600 font-semibold'
                          : 'hover:bg-slate-50/80 text-slate-700 border-l-4 border-transparent'
                      }`}
                    >
                      <td className="p-3.5 pl-5 font-sans text-xs text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-3.5 font-sans text-xs font-medium text-slate-900 whitespace-nowrap">{log.screenName}</td>
                      <td className="p-3.5 whitespace-nowrap font-mono text-xs">
                        <span
                          className={
                            log.severity === 'Fatal'
                              ? 'text-slate-900 font-bold'
                              : log.severity === 'Warning'
                              ? 'text-amber-700 font-semibold'
                              : 'text-blue-700 font-semibold'
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
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {log.severity}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-mono text-xs text-slate-600">
                        {log.offendingLineDisplay || `Line ${log.lineNumber}`}
                      </td>
                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <ChevronRight
                          className={`w-4 h-4 transition-all ${
                            isSelected
                              ? 'text-brand-600 translate-x-0.5'
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
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                  <Code2 className="w-4 h-4 text-slate-600" />
                  <span>Source Code Snippet</span>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  {selectedLog.screenName}
                </span>
              </div>

              {/* Dark Code Snippet Viewer */}
              <div className="mt-4 bg-[#1E293B] rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-300 shadow-inner overflow-x-auto">
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
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span>AI-Suggested Resolution</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {selectedLog.suggestedPatch.confidence || 'High Confidence Match'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {selectedLog.suggestedPatch.reason}
              </p>

              {/* Suggested Patch Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {selectedLog.suggestedPatch.targetFramework || 'Suggested Patch (React)'}
                  </span>
                  <button
                    onClick={() =>
                      handleCopyPatch(
                        selectedLog.suggestedPatch.patchSnippet || selectedLog.suggestedPatch.suggestedLine
                      )
                    }
                    className="flex items-center space-x-1 text-[11px] text-slate-500 hover:text-slate-800 font-semibold transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 font-mono text-xs text-emerald-300 overflow-x-auto shadow-inner">
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {selectedLog.suggestedPatch.patchSnippet || selectedLog.suggestedPatch.suggestedLine}
                  </pre>
                </div>
              </div>
            </div>

            {/* Resolution Action Buttons inside AI Card */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="primary"
                onClick={handleApplyPatch}
                isLoading={patching}
                disabled={selectedLog.resolved}
                className="w-full sm:w-auto space-x-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg shadow-xs"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{selectedLog.resolved ? 'Patch Applied & Retried' : 'Apply Patch & Retry'}</span>
              </Button>

              <Button
                variant="secondary"
                onClick={handleEscalate}
                disabled={selectedLog.escalated}
                className="w-full sm:w-auto space-x-2 text-xs font-semibold border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100/50 px-4 py-2.5 rounded-lg"
              >
                <Headphones className="w-3.5 h-3.5 text-rose-600" />
                <span>{selectedLog.escalated ? 'Escalated' : 'Escalate to Support'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Global Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
        <Button
          variant="secondary"
          onClick={handleSendManualReview}
          disabled={selectedLog?.manualReview}
          className="w-full sm:w-auto space-x-2 text-xs font-semibold border-amber-300 text-amber-800 bg-amber-50/60 hover:bg-amber-100/60 px-4 py-2.5 rounded-lg shadow-xs"
        >
          <FileText className="w-3.5 h-3.5 text-amber-600" />
          <span>{selectedLog?.manualReview ? 'Sent to Manual Review' : 'Send to Manual Review'}</span>
        </Button>

        <Button
          variant="primary"
          onClick={handleDownloadFullLog}
          className="w-full sm:w-auto space-x-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Log Archive</span>
        </Button>
      </div>
    </div>
  );
};

export default DiagnosticsPage;
