import React, { useEffect, useState } from 'react';
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
  AlertTriangle,
  Code2,
} from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { StatusBadge, Button } from '@/shared/ui';
import { ModernizationWorkflow } from '@/shared/ui/ModernizationWorkflow';
import { projectService } from '../services/project.service';
import { conversionService } from '@/features/conversion/services/conversion.service';
import { resolveWorkspace } from '../utils/conversionTypeResolver';
import type { Project } from '../types/project';
import type { LegacyScreen } from '@/features/screens/types/screen';

const LEGACY_TYPE_LABEL: Record<string, string> = {
  BMS_DSPF_TO_REACT: 'BMS / DSPF Screen Maps',
  BMS_DSPF_TO_FRONTEND: 'BMS / DSPF Screen Maps',
  COBOL_TO_JAVA: 'COBOL Source Programs',
};

const TARGET_FRAMEWORK_LABEL: Record<string, string> = {
  BMS_DSPF_TO_REACT: 'React 19 (TypeScript + Tailwind)',
  BMS_DSPF_TO_FRONTEND: 'React 19 (TypeScript + Tailwind)',
  COBOL_TO_JAVA: 'Java 21 + Spring Boot Batch',
};

export const ProjectOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { projectId = 'proj-acme' } = useParams();

  const [project, setProject] = useState<Project | null>(null);
  const [screens, setScreens] = useState<LegacyScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      projectService.getProjectById(projectId),
      conversionService.getScreens(projectId).catch(() => []),
    ])
      .then(([projData, screensData]) => {
        if (cancelled) return;
        if (!projData) {
          setError('Project not found');
        } else {
          setProject(projData);
          setScreens(screensData || []);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load project');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-16 text-center shadow-2xs space-y-4">
        <div className="w-8 h-8 border-3 border-[#244A70] border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-sm font-semibold text-[#091E42]">Loading project workspace…</div>
        <p className="text-xs text-[#6B778C]">Fetching project details and asset metadata.</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-12 text-center shadow-2xs space-y-4 max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#091E42]">Project Not Found</h2>
        <p className="text-xs text-[#6B778C] leading-relaxed">
          {error || 'The requested modernization project does not exist or has been removed.'}
        </p>
        <div className="pt-2 flex items-center justify-center space-x-3">
          <Button
            onClick={() => navigate(ROUTES.PROJECTS.LIST)}
            className="bg-[#244A70] hover:bg-[#1B3856] text-white text-xs font-bold px-4 py-2"
          >
            Back to Projects List
          </Button>
        </div>
      </div>
    );
  }

  const workspace = resolveWorkspace(project.conversionType);
  const isCobol = workspace === 'PROGRAMS';
  const firstAssetId = screens[0]?.id;

  const convertedCount = screens.filter((s) => s.status === 'Converted' || s.status === 'Completed' || s.status === 'COMPLETED').length;
  const reviewRequiredCount = screens.filter((s) => s.status === 'Review Required' || s.status === 'Processing').length;
  const failedCount = screens.filter((s) => s.status === 'Failed').length;

  const cobolWorkflowModules = [
    {
      title: '1. Upload COBOL Sources',
      desc: 'Upload COBOL programs (.cbl, .cob) and copybooks (.cpy) to initialize transpilation.',
      icon: Upload,
      link: ROUTES.PROJECTS.UPLOAD(projectId),
      btnText: 'Upload Sources',
    },
    {
      title: '2. Analyze & Prepare (Passes 1-2.4)',
      desc: 'Project index, CICS normalization, preprocessing, AST parsing, symbol resolution, and CFG.',
      icon: Layers,
      link: ROUTES.PROJECTS.SCREENS(projectId),
      btnText: 'Inspect Pipeline',
    },
    {
      title: '3. Method & Variable Mapping',
      desc: 'Inspect paragraph-to-method and data-division-to-class deterministic mapping rules.',
      icon: Code2,
      link: firstAssetId ? ROUTES.PROJECTS.METHOD_MAPPING(projectId, firstAssetId) : ROUTES.PROJECTS.SCREENS(projectId),
      btnText: 'Inspect Mapping',
    },
    {
      title: '4. Convert to Java (Pass 2.5)',
      desc: 'Transpile divisions, statements, and SQL into Java Spring Boot components.',
      icon: Cpu,
      link: ROUTES.PROJECTS.SCREENS(projectId),
      btnText: 'Transpile to Java',
    },
    {
      title: '5. Validate & Build (Pass 3)',
      desc: 'Assemble Spring Batch project scaffold and verify compilation with Maven build verification.',
      icon: ShieldCheck,
      link: ROUTES.PROJECTS.SCREENS(projectId),
      btnText: 'Validate & Build',
    },
    {
      title: '6. Review Results & Findings',
      desc: 'Inspect generated Java classes, conversion diagnostics, and AI-assisted validation reports.',
      icon: Eye,
      link: firstAssetId ? ROUTES.PROJECTS.RESULT(projectId, firstAssetId) : ROUTES.PROJECTS.SCREENS(projectId),
      btnText: 'Review Results',
    },
    {
      title: '7. Export Java Project',
      desc: 'Download complete modernized Spring Boot Maven project bundle and conversion reports.',
      icon: Download,
      link: ROUTES.PROJECTS.EXPORT(projectId),
      btnText: 'Export Project',
    },
  ];

  const bmsWorkflowModules = [
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
      link: firstAssetId ? ROUTES.PROJECTS.MAPPING(projectId, firstAssetId) : ROUTES.PROJECTS.SCREENS(projectId),
      btnText: 'Inspect Mapping',
    },
    {
      title: '4. Algorithm Conversion',
      desc: 'Run deterministic conversion engine to produce modern React components.',
      icon: Cpu,
      link: firstAssetId ? ROUTES.PROJECTS.CONVERT(projectId, firstAssetId) : ROUTES.PROJECTS.SCREENS(projectId),
      btnText: 'Convert Engine',
    },
    {
      title: '5. Rule-Based Validation',
      desc: 'Review automated rule diagnostics & optional AI-assisted validation findings.',
      icon: ShieldCheck,
      link: firstAssetId ? ROUTES.PROJECTS.REVIEW(projectId, firstAssetId) : ROUTES.PROJECTS.SCREENS(projectId),
      btnText: 'Review Findings',
    },
    {
      title: '6. Preview & Result Studio',
      desc: 'Side-by-side comparison of original legacy screen vs modernized output.',
      icon: Eye,
      link: firstAssetId ? ROUTES.PROJECTS.RESULT(projectId, firstAssetId) : ROUTES.PROJECTS.SCREENS(projectId),
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

  const workflowModules = isCobol ? cobolWorkflowModules : bmsWorkflowModules;

  return (
    <div className="space-y-6">
      {/* Central Project Workspace Header */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#244A70] bg-[#E8F1FF] px-2.5 py-0.5 rounded-full">
                {isCobol ? 'COBOL Modernization' : 'Screen Modernization'}
              </span>
              <StatusBadge status={project.status || 'Active'} />
            </div>
            <h1 className="text-2xl font-extrabold text-[#091E42] tracking-tight">{project.name}</h1>
            <div className="flex items-center space-x-3 text-xs text-[#42526E] font-mono">
              <span>Legacy: <strong className="text-[#091E42]">{LEGACY_TYPE_LABEL[project.conversionType] || 'COBOL / Legacy'}</strong></span>
              <span>&rarr;</span>
              <span>Target: <strong className="text-[#244A70]">{TARGET_FRAMEWORK_LABEL[project.conversionType] || 'Java 21'}</strong></span>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Button
              onClick={() => navigate(ROUTES.PROJECTS.UPLOAD(projectId))}
              className="bg-[#244A70] hover:bg-[#1B3856] text-white text-xs font-bold space-x-1.5 shadow-2xs"
            >
              <Upload className="w-4 h-4" />
              <span>{isCobol ? 'Upload COBOL Sources' : 'Upload Legacy Source'}</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(ROUTES.PROJECTS.SCREENS(projectId))}
              className="text-xs font-semibold space-x-1"
            >
              <Layers className="w-4 h-4" />
              <span>{isCobol ? 'Programs Workspace' : 'Screens Workspace'}</span>
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
          <button
            type="button"
            onClick={() => navigate(ROUTES.PROJECTS.SCREENS(projectId))}
            className="bg-[#F7F9FC] border border-[#D9E2EC] hover:border-[#244A70] p-3 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.02] shadow-2xs"
            title={isCobol ? 'Click to view all programs' : 'Click to view all screens'}
          >
            <div className="text-xs font-semibold text-[#6B778C]">{isCobol ? 'Total Programs' : 'Total Screens'}</div>
            <div className="text-xl font-extrabold text-[#091E42] mt-0.5">{screens.length}</div>
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.PROJECTS.SCREENS(projectId))}
            className="bg-emerald-50 border border-emerald-200 hover:border-emerald-500 p-3 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.02] shadow-2xs"
            title="Click to view converted assets"
          >
            <div className="text-xs font-bold text-emerald-700">Converted</div>
            <div className="text-xl font-extrabold text-emerald-800 mt-0.5">{convertedCount}</div>
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.PROJECTS.SCREENS(projectId))}
            className="bg-amber-50 border border-amber-200 hover:border-amber-500 p-3 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.02] shadow-2xs"
            title="Click to view assets requiring review"
          >
            <div className="text-xs font-bold text-amber-700">Review Required</div>
            <div className="text-xl font-extrabold text-amber-800 mt-0.5">{reviewRequiredCount}</div>
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.PROJECTS.SCREENS(projectId))}
            className="bg-rose-50 border border-rose-200 hover:border-rose-400 p-3 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.02] shadow-2xs"
            title="Click to view failed assets"
          >
            <div className="text-xs font-bold text-rose-700">Failed / Errors</div>
            <div className="text-xl font-extrabold text-rose-800 mt-0.5">{failedCount}</div>
          </button>
        </div>
      </div>

      {/* Modernization Workflow Progress Bar */}
      <ModernizationWorkflow
        workflowType={workspace === 'PROGRAMS' ? 'PROGRAMS' : 'SCREENS'}
        currentStep={isCobol ? 'analyze' : 'conversion'}
        completedSteps={['upload']}
        onStepClick={(stepId) => {
          if (isCobol) {
            if (stepId === 'upload') navigate(ROUTES.PROJECTS.UPLOAD(projectId));
            if (stepId === 'analyze' || stepId === 'convert' || stepId === 'validate') navigate(ROUTES.PROJECTS.SCREENS(projectId));
            if (stepId === 'review' || stepId === 'result') {
              if (firstAssetId) navigate(ROUTES.PROJECTS.RESULT(projectId, firstAssetId));
              else navigate(ROUTES.PROJECTS.SCREENS(projectId));
            }
            if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
          } else {
            if (stepId === 'upload') navigate(ROUTES.PROJECTS.UPLOAD(projectId));
            if (stepId === 'mapping' && firstAssetId) navigate(ROUTES.PROJECTS.MAPPING(projectId, firstAssetId));
            if (stepId === 'conversion' && firstAssetId) navigate(ROUTES.PROJECTS.CONVERT(projectId, firstAssetId));
            if ((stepId === 'validation' || stepId === 'review') && firstAssetId) navigate(ROUTES.PROJECTS.REVIEW(projectId, firstAssetId));
            if (stepId === 'result' && firstAssetId) navigate(ROUTES.PROJECTS.RESULT(projectId, firstAssetId));
            if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
          }
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
                className="bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl p-4 flex flex-col justify-between hover:border-[#244A70]/40 transition-all space-y-3"
              >
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E8F1FF] text-[#244A70] flex items-center justify-center">
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
                  <ArrowRight className="w-4 h-4" />
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
