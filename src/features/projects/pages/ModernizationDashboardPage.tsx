import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Upload, FolderKanban } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { StatusBadge, Button } from '@/shared/ui';
import { ModernizationWorkflow } from '@/shared/ui/ModernizationWorkflow';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { projectService } from '../services/project.service';
import type { Project } from '../types/project';

const LEGACY_TYPE_LABEL: Record<Project['conversionType'], string> = {
  BMS_DSPF_TO_FRONTEND: 'BMS / DSPF',
  COBOL_TO_JAVA: 'COBOL',
};

const TARGET_FRAMEWORK_LABEL: Record<Project['conversionType'], string> = {
  BMS_DSPF_TO_FRONTEND: 'React (TypeScript)',
  COBOL_TO_JAVA: 'Java 21 (Spring Boot)',
};

export const ModernizationDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    projectService
      .getProjects()
      .then(setProjects)
      .catch((err) => console.error('Failed to load projects for dashboard', err));
  }, []);

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const activeProjectsCount = projects.filter((p) => p.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Restrained Hero Section */}
      <div className="bg-[#091E42] rounded-xl p-6 lg:p-8 text-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Automating Legacy System Modernization
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Analyze legacy screens, map fields, generate modernization output, and validate results.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#0652CC] hover:bg-[#0655FF] text-white font-semibold text-xs border-none shadow-2xs space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.PROJECTS.LIST)}
            className="bg-transparent border-slate-600 text-slate-200 hover:bg-white/10 font-semibold text-xs space-x-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Legacy File</span>
          </Button>
        </div>
      </div>

      {/* Restrained Dashboard Metric Cards - Clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
        <button
          type="button"
          onClick={() => navigate(ROUTES.PROJECTS.LIST)}
          className="bg-white border border-[#D9E2EC] hover:border-[#0652CC] text-left rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
          title="Click to view all projects"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E8F1FF] text-[#0652CC] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#6B778C] uppercase tracking-wider">
                Total Projects
              </div>
              <div className="text-2xl font-extrabold text-[#091E42] mt-0.5">
                {projects.length}
              </div>
            </div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#0652CC]"></div>
        </button>

        <button
          type="button"
          onClick={() => navigate(ROUTES.PROJECTS.LIST)}
          className="bg-white border border-[#D9E2EC] hover:border-emerald-500 text-left rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
          title="Click to view active projects"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-emerald-100">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#6B778C] uppercase tracking-wider">
                Active Projects
              </div>
              <div className="text-2xl font-extrabold text-[#091E42] mt-0.5">
                {activeProjectsCount}
              </div>
            </div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
        </button>
      </div>

      {/* Reusable Modernization Workflow Stepper Bar */}
      <ModernizationWorkflow
        currentStep="convert"
        completedSteps={['upload']}
        onStepClick={(stepId) => {
          if (stepId === 'upload') navigate(ROUTES.PROJECTS.UPLOAD('proj-acme'));
          if (stepId === 'convert') navigate(ROUTES.PROJECTS.CONVERT('proj-acme', 'scr-acct010'));
          if (stepId === 'validate') navigate(ROUTES.PROJECTS.REVIEW('proj-acme', 'scr-acct010'));
          if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT('proj-acme'));
        }}
        onActionClick={() => {
          const targetProj = recentProjects[0];
          if (targetProj) {
            navigate(ROUTES.PROJECTS.SCREENS(targetProj.id));
          } else {
            navigate(ROUTES.PROJECTS.LIST);
          }
        }}
        actionLabel="Open Project"
      />

      {/* Enterprise Recent Projects List Cards */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#091E42]">Recent Projects</h2>
            <p className="text-xs text-[#6B778C] mt-0.5">
              Active modernization project workspaces
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

        {recentProjects.length === 0 ? (
          <p className="text-xs text-[#6B778C] py-10 text-center bg-[#F7F9FC] rounded-2xl border border-[#D9E2EC]">
            No projects found — create a project to begin legacy source ingestion.
          </p>
        ) : (
          <div className="space-y-3">
            {recentProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(ROUTES.PROJECTS.SCREENS(p.id))}
                className="bg-white border border-[#D9E2EC] hover:border-[#0652CC] rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F1FF] text-[#0652CC] group-hover:bg-[#0652CC] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2.5">
                      <h3 className="font-bold text-sm text-[#091E42] group-hover:text-[#0652CC] transition-colors truncate">
                        {p.name}
                      </h3>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#6B778C]">
                      <span className="font-mono bg-[#F7F9FC] px-2.5 py-0.5 rounded-lg border border-[#D9E2EC] text-[11px] text-[#42526E]">
                        {LEGACY_TYPE_LABEL[p.conversionType]} &rarr; {TARGET_FRAMEWORK_LABEL[p.conversionType]}
                      </span>
                      <span className="truncate">Updated {new Date(p.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(ROUTES.PROJECTS.SCREENS(p.id));
                  }}
                  className="bg-[#0652CC] hover:bg-[#0655FF] text-white text-xs font-bold space-x-1.5 shadow-2xs shrink-0 self-end sm:self-center"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
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
