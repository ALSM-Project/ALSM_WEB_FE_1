import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';
import { diagnosticsService } from '../services/diagnostics.service';
import type { DiagnosticLog } from '../types/diagnostics';
import { Breadcrumb } from '@/shared/navigation/Breadcrumb';
import { StatusBadge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';

export const DiagnosticsPage: React.FC = () => {
  const { projectId = 'proj-acme' } = useParams();
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [selectedId, setSelectedId] = useState<string>('diag-1');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [patching, setPatching] = useState(false);

  useEffect(() => {
    diagnosticsService.getDiagnosticsLogs(projectId).then((data) => setLogs(data));
  }, [projectId]);

  const selectedLog = logs.find((l) => l.id === selectedId) || logs[0];

  const handleApplyPatch = async () => {
    if (!selectedLog) return;
    setPatching(true);
    try {
      await diagnosticsService.applyDiagnosticPatch(selectedLog.id);
      setLogs((prev) => prev.map((l) => (l.id === selectedLog.id ? { ...l, resolved: true } : l)));
    } finally {
      setPatching(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.screenName.toLowerCase().includes(search.toLowerCase()) || log.errorCode.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || log.severity.toUpperCase() === severityFilter.toUpperCase();
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6 py-2">
      <Breadcrumb
        items={[
          { label: 'Projects' },
          { label: 'CoreBanking_Legacy' },
          { label: 'Error Logs & Diagnostics' },
        ]}
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Error Logs & Diagnostics</h1>
        <p className="text-slate-500 text-sm mt-1">Analyze and resolve parsing and modernization failures.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600 shadow-xs"
          />
        </div>

        <div className="flex space-x-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600 shadow-xs"
          >
            <option value="ALL">All Severities</option>
            <option value="FATAL">Fatal</option>
            <option value="WARNING">Warning</option>
          </select>
          <div className="bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg px-3 py-2 flex items-center font-medium">
            Oct 10, 2024 - Oct 12, 2024
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 font-sans font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Screen Name</th>
                <th className="p-3.5">Error Code</th>
                <th className="p-3.5">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const isSelected = log.id === selectedId;
                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedId(log.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-50/70 text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <td className="p-3.5 text-slate-500 font-sans text-xs">{log.timestamp}</td>
                    <td className="p-3.5 text-slate-900 font-semibold">{log.screenName}</td>
                    <td className="p-3.5 font-bold text-rose-600">{log.errorCode}</td>
                    <td className="p-3.5">
                      <StatusBadge status={log.severity} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selectedLog && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {selectedLog.screenName} (Line {selectedLog.lineNumber})
                </h3>
                <p className="text-xs text-rose-600 font-mono mt-0.5 font-semibold">{selectedLog.errorCode}</p>
              </div>
              <StatusBadge status={selectedLog.resolved ? 'Completed' : selectedLog.severity} />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Legacy Source (Offending Line)
              </label>
              <div className="bg-[#FEF3F2] border border-[#FECDCA] rounded-xl p-4 font-mono text-xs text-[#B42318]">
                <span className="text-slate-400 mr-4 font-bold">{selectedLog.lineNumber}</span>
                <span className="font-semibold">{selectedLog.offendingCode}</span>
              </div>
            </div>

            <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-brand-700">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>AI-ASSISTED FINDING & CANDIDATE FIX</span>
              </div>

              {/* Dark syntax preview panel */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400">
                {selectedLog.suggestedPatch.suggestedLine}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                <strong className="text-slate-800">Reason:</strong> {selectedLog.suggestedPatch.reason}
              </p>
              <p className="text-[11px] text-slate-500 italic">
                Candidate findings are generated by the optional AI Validator for developer review. Human approval is required.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button variant="secondary" className="text-xs font-semibold">
                Ignore
              </Button>
              <Button
                onClick={handleApplyPatch}
                isLoading={patching}
                disabled={selectedLog.resolved}
                className="space-x-1.5 text-xs font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{selectedLog.resolved ? 'Patch Applied' : 'Review & Apply Candidate Fix'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default DiagnosticsPage;
