import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Upload, FolderKanban, Activity, Code2, ShieldCheck } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { StatusBadge, Button, PageHeader } from '@/shared/ui';
import { ModernizationWorkflow } from '@/shared/ui/ModernizationWorkflow';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { projectService } from '../services/project.service';
import type { Project } from '../types/project';

const LEGACY_TYPE_LABEL: Record<Project['conversionType'], string> = {
  BMS_DSPF_TO_FRONTEND: 'BMS / DSPF',
  COBOL_TO_JAVA: 'COBOL',
};

const TARGET_FRAMEWORK_LABEL: Record<Project['conversionType'], string> = {
  BMS_DSPF_TO_FRONTEND: 'React 19 (TypeScript)',
  COBOL_TO_JAVA: 'Java 21 (Spring Boot)',
};

export const ModernizationDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectService
      .getProjects()
      .then(setProjects)
      .catch((err) => console.error('Failed to load projects for dashboard', err))
      .finally(() => setLoading(false));
  }, []);

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const activeProjectsCount = projects.filter((p) => p.status === 'ACTIVE').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Enterprise Page Header */}
      <PageHeader
        title="Modernization Dashboard"
        subtitle="Automated workspace for IBM BMS/DSPF screen conversion, AST mapping, and COBOL logic modernization."
        actions={
          <div className="flex items-center space-x-2.5">
            <Button
              variant="outline"
              onClick={() => {
                const firstProj = recentProjects[0];
                if (firstProj) {
                  navigate(ROUTES.PROJECTS.UPLOAD(firstProj.id));
                } else {
                  navigate(ROUTES.PROJECTS.LIST);
                }
              }}
              className="text-xs font-medium space-x-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-[#42526E]" />
              <span>Upload Source</span>
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#0652CC] hover:bg-[#0655FF] text-white text-xs font-semibold space-x-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </Button>
          </div>
        }
      />

      {/* Operational Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Projects */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.PROJECTS.LIST)}
          className="bg-white border border-[#D9E2EC] hover:border-[#0652CC] text-left rounded-lg p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#6B778C] uppercase tracking-wider">
              Total Projects
            </span>
            <div className="w-7 h-7 rounded-md bg-[#E8F1FF] text-[#0652CC] flex items-center justify-center">
              <FolderKanban className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#091E42]">
            {loading ? '—' : projects.length}
          </div>
          <div className="text-[11px] text-[#6B778C] mt-1 flex items-center space-x-1">
            <span>Modernization repositories</span>
          </div>
        </button>

        {/* Active Workspaces */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.PROJECTS.LIST)}
          className="bg-white border border-[#D9E2EC] hover:border-emerald-500 text-left rounded-lg p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#6B778C] uppercase tracking-wider">
              Active Pipelines
            </span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#091E42]">
            {loading ? '—' : activeProjectsCount}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center space-x-1">
            <span>In-flight conversions</span>
          </div>
        </button>

        {/* Supported Technologies */}
        <div className="bg-white border border-[#D9E2EC] rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#6B778C] uppercase tracking-wider">
              Supported Sources
            </span>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-[#0652CC] flex items-center justify-center">
              <Code2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm font-bold text-[#091E42] mt-1 space-y-0.5">
            <div>BMS / DSPF Maps</div>
            <div className="text-xs font-normal text-[#6B778C]">COBOL Business Logic</div>
          </div>
        </div>

        {/* Pipeline Engine */}
        <div className="bg-white border border-[#D9E2EC] rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#6B778C] uppercase tracking-wider">
              Target Frameworks
            </span>
            <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm font-bold text-[#091E42] mt-1 space-y-0.5">
            <div>React 19 + TypeScript</div>
            <div className="text-xs font-normal text-[#6B778C]">Java 21 Spring Boot</div>
          </div>
        </div>
      </div>

      {/* Modernization Workflow Stepper Bar */}
      <ModernizationWorkflow
        currentStep="convert"
        completedSteps={['upload']}
        onStepClick={(stepId) => {
          const targetProj = recentProjects[0];
          const projId = targetProj ? targetProj.id : 'proj-acme';
          if (stepId === 'upload') navigate(ROUTES.PROJECTS.UPLOAD(projId));
          if (stepId === 'convert') navigate(ROUTES.PROJECTS.SCREENS(projId));
          if (stepId === 'validate') navigate(ROUTES.PROJECTS.SCREENS(projId));
          if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projId));
        }}
        onActionClick={() => {
          const targetProj = recentProjects[0];
          if (targetProj) {
            navigate(ROUTES.PROJECTS.SCREENS(targetProj.id));
          } else {
            navigate(ROUTES.PROJECTS.LIST);
          }
        }}
        actionLabel="Open Workspace"
      />

      {/* Recent Projects Table / List */}
      <div className="bg-white border border-[#D9E2EC] rounded-lg shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5EAF0] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#091E42]">Recent Workspaces</h2>
            <p className="text-xs text-[#6B778C] mt-0.5">
              Active modernization project environments
            </p>
          </div>
          <Link
            to={ROUTES.PROJECTS.LIST}
            className="text-xs font-semibold text-[#0652CC] hover:text-[#0655FF] hover:underline flex items-center space-x-1"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#6B778C]">
            Loading modernization projects...
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs text-[#6B778C]">
              No modernization projects found. Create your first project to begin ingesting legacy source assets.
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#0652CC] hover:bg-[#0655FF] text-white text-xs font-semibold"
            >
              Create Project
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[#E5EAF0]">
            {recentProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(ROUTES.PROJECTS.SCREENS(p.id))}
                className="p-4 sm:px-5 hover:bg-[#F8FAFC] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-[#E8F1FF] text-[#0652CC] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2.5">
                      <h3 className="font-semibold text-xs sm:text-sm text-[#091E42] group-hover:text-[#0652CC] transition-colors truncate">
                        {p.name}
                      </h3>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B778C]">
                      <span className="font-mono bg-[#F1F5F9] px-2 py-0.5 rounded text-[11px] text-[#42526E] border border-[#E2E8F0]">
                        {LEGACY_TYPE_LABEL[p.conversionType]} &rarr; {TARGET_FRAMEWORK_LABEL[p.conversionType]}
                      </span>
                      {p.description && (
                        <span className="hidden md:inline text-[11px] text-[#6B778C] truncate max-w-xs">
                          {p.description}
                        </span>
                      )}
                      <span className="text-[11px] text-[#6B778C]">
                        Updated {new Date(p.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(ROUTES.PROJECTS.SCREENS(p.id));
                    }}
                    className="bg-white hover:bg-[#F1F5F9] text-[#0652CC] border border-[#D9E2EC] text-xs font-semibold px-3 py-1.5 space-x-1.5 shadow-2xs"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default ModernizationDashboardPage;
