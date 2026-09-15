import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  FileSearch,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Upload,
  Cpu,
  Eye,
} from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { StatusBadge, Button } from '@/shared/ui';
import { ModernizationWorkflow } from '@/shared/ui/ModernizationWorkflow';
import { CreateProjectModal } from '../components/CreateProjectModal';

export const ModernizationDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Demonstration PoC data
  const metrics = [
    { label: 'Active Projects', value: '4', icon: FolderKanban, color: 'text-[#0652CC]', bg: 'bg-[#E8F1FF]' },
    { label: 'Screens Analyzed', value: '148', icon: FileSearch, color: 'text-[#0655FF]', bg: 'bg-blue-50' },
    { label: 'Screens Converted', value: '124', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Review Required', value: '12', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const recentProjects = [
    {
      id: 'proj-acme',
      name: 'Acme Core Banking Modernization',
      legacyType: 'BMS / DSPF',
      target: 'React (TypeScript)',
      convertedCount: 36,
      totalCount: 48,
      status: 'Active',
      lastUpdated: '10 mins ago',
    },
    {
      id: 'proj-cobol-java',
      name: 'Insurance Ledger Engine',
      legacyType: 'COBOL (IBM Enterprise)',
      target: 'Java 21 (Spring Boot)',
      convertedCount: 22,
      totalCount: 30,
      status: 'Active',
      lastUpdated: '1 hour ago',
    },
    {
      id: 'proj-[#091E42]',
      name: 'Logistics DSPF Order Entry',
      legacyType: 'DSPF Screen Maps',
      target: 'React (Tailwind)',
      convertedCount: 15,
      totalCount: 15,
      status: 'Completed',
      lastUpdated: 'Yesterday',
    },
  ];

  const recentActivity = [
    {
      screen: 'ACCT010 - Account Inquiry',
      project: 'Acme Core Banking',
      source: 'BMS Map Definition',
      target: 'React Component',
      status: 'Passed',
      screenId: 'scr-acct010',
      projectId: 'proj-acme',
    },
    {
      screen: 'PAYM040 - Wire Transfer Confirmation',
      project: 'Acme Core Banking',
      source: 'BMS Map Definition',
      target: 'React Component',
      status: 'Review Required',
      screenId: 'scr-paym040',
      projectId: 'proj-acme',
    },
    {
      screen: 'CALC099 - Interest Calculation Engine',
      project: 'Insurance Ledger',
      source: 'COBOL Source',
      target: 'Java Service Class',
      status: 'Passed',
      screenId: 'scr-calc099',
      projectId: 'proj-cobol-java',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#091E42] to-[#0652CC] rounded-2xl p-6 lg:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold text-blue-100">
            <Cpu className="w-3.5 h-3.5" />
            <span>ALSM Modernization Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Automating Legacy System Modernization
          </h1>
          <p className="text-blue-100/90 text-xs sm:text-sm leading-relaxed">
            Deterministic screen analysis, field mapping, algorithm-based code conversion, and rule-based validation for BMS/DSPF maps and COBOL applications.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-white text-[#0652CC] hover:bg-blue-50 border-none font-bold text-xs shadow-md space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(ROUTES.PROJECTS.UPLOAD('proj-acme'))}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 font-semibold text-xs space-x-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Legacy File</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="bg-white border border-[#D9E2EC] rounded-2xl p-5 shadow-2xs flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-medium text-[#42526E]">{m.label}</div>
                <div className="text-2xl font-extrabold text-[#091E42] mt-1">{m.value}</div>
              </div>
              <div className={`w-11 h-11 rounded-xl ${m.bg} ${m.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Reusable Modernization Workflow Bar */}
      <ModernizationWorkflow currentStep="conversion" completedSteps={['analysis', 'mapping']} />

      {/* Main Grid: Recent Projects & Conversion Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Projects (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[#091E42]">Active Projects</h2>
                <p className="text-xs text-[#6B778C]">Managed modernization project workspaces</p>
              </div>
              <Link
                to={ROUTES.PROJECTS.LIST}
                className="text-xs font-semibold text-[#0652CC] hover:underline flex items-center space-x-1"
              >
                <span>View All Projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentProjects.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl p-4 hover:border-[#0652CC]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-[#091E42]">{p.name}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-[#42526E]">
                      <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#D9E2EC] text-[11px]">
                        {p.legacyType} &rarr; {p.target}
                      </span>
                      <span>Updated {p.lastUpdated}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right text-xs">
                      <div className="font-bold text-[#091E42]">
                        {p.convertedCount} / {p.totalCount} Screens
                      </div>
                      <div className="text-[10px] text-[#6B778C]">Converted</div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => navigate(ROUTES.PROJECTS.SCREENS(p.id))}
                      className="text-xs font-semibold space-x-1"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Conversion Activity */}
        <div className="space-y-4">
          <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[#091E42]">Recent Activity</h2>
                <p className="text-xs text-[#6B778C]">Screen conversions & validation results</p>
              </div>
            </div>

            <div className="space-y-3">
              {recentActivity.map((act, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-[#D9E2EC] bg-[#F7F9FC] space-y-2 hover:bg-white transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#091E42] truncate max-w-[180px]">
                        {act.screen}
                      </div>
                      <div className="text-[11px] text-[#6B778C]">{act.project}</div>
                    </div>
                    <StatusBadge status={act.status} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#42526E] pt-1 border-t border-[#E5EAF0]">
                    <span>{act.source} &rarr; {act.target}</span>
                    <Link
                      to={ROUTES.PROJECTS.RESULT(act.projectId, act.screenId)}
                      className="text-[#0652CC] font-semibold hover:underline flex items-center space-x-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Blurred Backdrop Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default ModernizationDashboardPage;
