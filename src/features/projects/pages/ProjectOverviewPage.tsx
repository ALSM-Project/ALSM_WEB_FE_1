import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Upload,
  Layers,
  FileSearch,
  Cpu,
  ShieldCheck,
  Eye,
  Download,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { StatusBadge, Button } from '@/shared/ui';
import { ModernizationWorkflow } from '@/shared/ui/ModernizationWorkflow';

export const ProjectOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { projectId = 'proj-acme' } = useParams();

  const projectDetails = {
    id: projectId,
    name: 'Acme Core Banking Modernization',
    legacyType: 'BMS / DSPF Screen Maps',
    targetFramework: 'React 19 (TypeScript + Tailwind)',
    status: 'Active',
    totalScreens: 48,
    convertedScreens: 36,
    reviewRequired: 8,
    failedScreens: 4,
  };

  const workflowModules = [
    {
      title: '1. Upload Legacy Files',
      desc: 'Upload IBM 3270 BMS map files or AS/400 DSPF display source maps.',
      icon: Upload,
      link: ROUTES.PROJECTS.UPLOAD(projectId),
      btnText: 'Upload Source',
    },
    {
      title: '2. Screens & Workspace',
      desc: 'Inspect detected legacy screens, metadata, field definitions & status.',
      icon: Layers,
      link: ROUTES.PROJECTS.SCREENS(projectId),
      btnText: 'View Screens',
    },
    {
      title: '3. Automated Field Mapping',
      desc: 'Inspect screen field structure and automated field name mappings.',
      icon: FileSearch,
      link: ROUTES.PROJECTS.MAPPING(projectId, 'scr-acct010'),
      btnText: 'Inspect Mapping',
    },
    {
      title: '4. Algorithm Conversion',
      desc: 'Run deterministic conversion engine to produce modern React components.',
      icon: Cpu,
      link: ROUTES.PROJECTS.CONVERT(projectId, 'scr-acct010'),
      btnText: 'Convert Engine',
    },
    {
      title: '5. Rule-Based Validation',
      desc: 'Review automated rule diagnostics & optional AI-assisted validation findings.',
      icon: ShieldCheck,
      link: ROUTES.PROJECTS.REVIEW(projectId, 'scr-acct010'),
      btnText: 'Review Findings',
    },
    {
      title: '6. Preview & Result Studio',
      desc: 'Side-by-side comparison of original legacy screen vs modernized output.',
      icon: Eye,
      link: ROUTES.PROJECTS.RESULT(projectId, 'scr-acct010'),
      btnText: 'Result Studio',
    },
    {
      title: '7. Export Code Bundle',
      desc: 'Export finalized React code components and modern project bundle.',
      icon: Download,
      link: ROUTES.PROJECTS.EXPORT(projectId),
      btnText: 'Export Code',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Central Project Workspace Header */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0652CC] bg-[#E8F1FF] px-2.5 py-0.5 rounded-full">
                Modernization Project
              </span>
              <StatusBadge status={projectDetails.status} />
            </div>
            <h1 className="text-2xl font-extrabold text-[#091E42] tracking-tight">{projectDetails.name}</h1>
            <div className="flex items-center space-x-3 text-xs text-[#42526E] font-mono">
              <span>Legacy: <strong className="text-[#091E42]">{projectDetails.legacyType}</strong></span>
              <span>&rarr;</span>
              <span>Target: <strong className="text-[#0652CC]">{projectDetails.targetFramework}</strong></span>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Button
              onClick={() => navigate(ROUTES.PROJECTS.UPLOAD(projectId))}
              className="bg-[#0652CC] hover:bg-[#0655FF] text-white text-xs font-bold space-x-1.5 shadow-2xs"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Legacy Source</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(ROUTES.PROJECTS.SCREENS(projectId))}
              className="text-xs font-semibold space-x-1"
            >
              <Layers className="w-4 h-4" />
              <span>Screens Workspace</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(ROUTES.PROJECTS.DELETE(projectId))}
              className="p-2 border border-[#D9E2EC] text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors rounded-xl"
              title="Delete Project"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#E5EAF0]">
          <div className="bg-[#F7F9FC] border border-[#D9E2EC] p-3 rounded-xl text-center">
            <div className="text-xs text-[#6B778C]">Total Screens</div>
            <div className="text-xl font-extrabold text-[#091E42]">{projectDetails.totalScreens}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
            <div className="text-xs text-emerald-700">Converted</div>
            <div className="text-xl font-extrabold text-emerald-800">{projectDetails.convertedScreens}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
            <div className="text-xs text-amber-700">Review Required</div>
            <div className="text-xl font-extrabold text-amber-800">{projectDetails.reviewRequired}</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center">
            <div className="text-xs text-rose-700">Failed / Errors</div>
            <div className="text-xl font-extrabold text-rose-800">{projectDetails.failedScreens}</div>
          </div>
        </div>
      </div>

      {/* Modernization Workflow Progress Bar */}
      <ModernizationWorkflow
        currentStep="conversion"
        completedSteps={['analysis', 'mapping']}
        onStepClick={(stepId) => {
          if (stepId === 'analysis' || stepId === 'mapping') navigate(ROUTES.PROJECTS.SCREENS(projectId));
          if (stepId === 'conversion') navigate(ROUTES.PROJECTS.CONVERT(projectId, 'scr-acct010'));
          if (stepId === 'validation' || stepId === 'review') navigate(ROUTES.PROJECTS.REVIEW(projectId, 'scr-acct010'));
          if (stepId === 'result') navigate(ROUTES.PROJECTS.RESULT(projectId, 'scr-acct010'));
          if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
        }}
      />

      {/* Modernization Golden Path Grid */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#091E42]">Modernization Golden Path</h2>
          <p className="text-xs text-[#6B778C]">Step-by-step legacy conversion modules in this workspace</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflowModules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl p-4 flex flex-col justify-between hover:border-[#0652CC]/40 transition-all space-y-3"
              >
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E8F1FF] text-[#0652CC] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#091E42]">{m.title}</h3>
                  <p className="text-xs text-[#42526E] leading-relaxed">{m.desc}</p>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => navigate(m.link)}
                  className="w-full text-xs font-semibold justify-between space-x-1 bg-white border border-[#D9E2EC] hover:bg-slate-50"
                >
                  <span>{m.btnText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProjectOverviewPage;
