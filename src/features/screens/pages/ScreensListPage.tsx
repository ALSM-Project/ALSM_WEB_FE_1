import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Search, Plus, FileCode, Layers, AlertTriangle, CheckCircle2, XCircle, Play, Eye, FileSearch, Cpu, Stethoscope } from 'lucide-react';
import { screenService } from '../services/screen.service';
import type { LegacyScreen } from '../types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { Tabs } from '@/shared/ui/Tabs';
import { StatusBadge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ModernizationWorkflow } from '@/shared/ui/ModernizationWorkflow';

export const ScreensListPage: React.FC = () => {
  const { projectId = 'proj-acme' } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('screens');
  const [screens, setScreens] = useState<LegacyScreen[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    screenService.getScreens(projectId).then((data) => setScreens(data));
  }, [projectId]);

  const cobolPrograms = [
    { id: 'prog-acctproc', name: 'ACCTPROC.cbl', sourceType: 'COBOL (IBM Enterprise)', status: 'COMPLETED', framework: 'Java 21 (Spring Boot)', lastUpdated: '10 mins ago' },
    { id: 'prog-ledgereng', name: 'LEDGERENG.cob', sourceType: 'COBOL Batch Engine', status: 'PROCESSING', framework: 'Java 21 (Spring Boot)', lastUpdated: '1 hour ago' },
    { id: 'prog-invpay', name: 'INVPAY01.cbl', sourceType: 'COBOL Online Module', status: 'REVIEW REQUIRED', framework: 'Java 21 (Spring Boot)', lastUpdated: '2 hours ago' },
    { id: 'prog-cobstp', name: 'COBSTP02.cbl', sourceType: 'COBOL Batch Processor', status: 'COMPLETED', framework: 'Java 21 (Spring Boot)', lastUpdated: 'Yesterday' },
  ];

  const filteredScreens = screens.filter((screen) => {
    const matchesSearch = screen.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || screen.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const filteredPrograms = cobolPrograms.filter((prog) => {
    const matchesSearch = prog.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || prog.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Reusable Standard PageHeader */}
      <PageHeader
        title="Screens & Programs Workspace"
        subtitle="Analyze, convert, validate, and inspect legacy screen mapsets and COBOL business logic programs."
        actions={
          <div className="flex items-center space-x-3 shrink-0">
            <Button
              variant="secondary"
              onClick={() => navigate(ROUTES.PROJECTS.BULK_CONVERT(projectId))}
              className="space-x-1.5 text-xs font-semibold"
            >
              <Play className="w-4 h-4 text-[#0652CC]" />
              <span>Bulk Convert</span>
            </Button>
            <Button
              onClick={() => navigate(ROUTES.PROJECTS.UPLOAD(projectId))}
              className="bg-[#0652CC] hover:bg-[#0655FF] text-white space-x-1.5 text-xs font-bold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Source File</span>
            </Button>
          </div>
        }
      />

      {/* Modernization Workflow Step Banner */}
      <ModernizationWorkflow
        currentStep="analysis"
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

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#D9E2EC] p-4 rounded-2xl flex items-center space-x-4 shadow-2xs">
          <div className="p-3 bg-[#E8F1FF] text-[#0652CC] rounded-xl border border-blue-100">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#42526E]">Total Assets</p>
            <p className="text-2xl font-extrabold text-[#091E42] mt-0.5">
              {activeTab === 'screens' ? '48 Screens' : '12 Programs'}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#D9E2EC] p-4 rounded-2xl flex items-center space-x-4 shadow-2xs">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#42526E]">Converted</p>
            <p className="text-2xl font-extrabold text-emerald-800 mt-0.5">
              {activeTab === 'screens' ? '36' : '9'}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#D9E2EC] p-4 rounded-2xl flex items-center space-x-4 shadow-2xs">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#42526E]">Review Required</p>
            <p className="text-2xl font-extrabold text-amber-800 mt-0.5">
              {activeTab === 'screens' ? '3' : '2'}
            </p>
          </div>
        </div>

        <Link
          to={ROUTES.PROJECTS.DIAGNOSTICS(projectId)}
          className="bg-white border border-[#D9E2EC] p-4 rounded-2xl flex items-center space-x-4 shadow-2xs hover:border-rose-300 transition-all group"
        >
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 group-hover:scale-105 transition-transform">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#42526E]">Failed (Diagnostics)</p>
            <p className="text-2xl font-extrabold text-rose-800 mt-0.5 flex items-center gap-1.5">
              <span>{activeTab === 'screens' ? '1' : '1'}</span>
              <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">View Logs &rarr;</span>
            </p>
          </div>
        </Link>
      </div>

      <Tabs
        tabs={[
          { id: 'screens', label: 'Legacy Screens (BMS/DSPF)', count: 48 },
          { id: 'programs', label: 'COBOL Programs (Logic)', count: 12 },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between bg-white p-4 rounded-2xl border border-[#D9E2EC] shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#6B778C]" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'screens' ? 'legacy screens' : 'COBOL programs'} by name...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0652CC] text-[#091E42] placeholder-[#6B778C]"
          />
        </div>

        <div className="flex space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F7F9FC] border border-[#D9E2EC] text-[#091E42] text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
          >
            <option value="ALL">Status: All</option>
            <option value="COMPLETED">Completed</option>
            <option value="PROCESSING">Processing</option>
            <option value="REVIEW REQUIRED">Review Required</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Enterprise Data Table */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-[#42526E] font-bold uppercase tracking-wider text-[11px] border-b border-[#D9E2EC]">
              <tr>
                <th className="p-4">{activeTab === 'screens' ? 'Screen Name' : 'Program Name'}</th>
                <th className="p-4">Legacy Source Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Target Framework</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4 text-right">PoC Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {(activeTab === 'screens' ? filteredScreens : filteredPrograms).map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-xs font-bold text-[#091E42]">
                    <div className="flex items-center space-x-2.5">
                      <FileCode className="w-4 h-4 text-[#0652CC] flex-shrink-0" />
                      <Link
                        to={ROUTES.PROJECTS.CONVERT(projectId, item.id)}
                        className="hover:text-[#0652CC] hover:underline"
                      >
                        {item.name}
                      </Link>
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="p-4 text-[#091E42] font-semibold">{item.framework}</td>
                  <td className="p-4 text-[#6B778C]">{item.lastUpdated}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {item.status === 'FAILED' ? (
                        <Link
                          to={ROUTES.PROJECTS.DIAGNOSTICS(projectId)}
                          className="inline-flex items-center space-x-1 text-xs text-rose-700 font-semibold bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Diagnostics</span>
                        </Link>
                      ) : (
                        <>
                          <Link
                            to={ROUTES.PROJECTS.MAPPING(projectId, item.id)}
                            className="inline-flex items-center space-x-1 text-xs text-[#42526E] font-semibold hover:text-[#0652CC] bg-[#F7F9FC] px-2.5 py-1.5 rounded-lg border border-[#D9E2EC] transition-colors"
                            title={activeTab === 'screens' ? 'Inspect Field Mapping' : 'Inspect Paragraph Mapping'}
                          >
                            <FileSearch className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Mapping</span>
                          </Link>

                          <Link
                            to={ROUTES.PROJECTS.CONVERT(projectId, item.id)}
                            className="inline-flex items-center space-x-1 text-xs text-[#0652CC] font-semibold hover:bg-blue-50 bg-[#E8F1FF] px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors"
                            title="Algorithm Conversion Engine"
                          >
                            <Cpu className="w-3.5 h-3.5" />
                            <span>Convert</span>
                          </Link>

                          <Link
                            to={ROUTES.PROJECTS.RESULT(projectId, item.id)}
                            className="inline-flex items-center space-x-1 text-xs text-emerald-700 font-semibold hover:bg-emerald-100 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                            title="View Modernized Output"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Result</span>
                          </Link>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-[#F7F9FC] px-4 py-3 border-t border-[#D9E2EC] flex justify-between items-center text-xs text-[#6B778C] font-medium">
          <span>Showing 1-{filteredScreens.length} of 48 legacy screens</span>
          <div className="flex space-x-1">
            <button className="px-3 py-1 rounded-lg bg-white border border-[#D9E2EC] text-[#6B778C] cursor-not-allowed">Prev</button>
            <button className="px-3 py-1 rounded-lg bg-[#0652CC] text-white font-bold shadow-2xs">1</button>
            <button className="px-3 py-1 rounded-lg bg-white border border-[#D9E2EC] text-[#091E42] hover:bg-slate-100">2</button>
            <button className="px-3 py-1 rounded-lg bg-white border border-[#D9E2EC] text-[#091E42] hover:bg-slate-100">3</button>
            <button className="px-3 py-1 rounded-lg bg-white border border-[#D9E2EC] text-[#091E42] hover:bg-slate-100">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreensListPage;
