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
      {/* Refined Enterprise Hero Section */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 lg:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2563EB]" />

        <div className="space-y-2.5 max-w-3xl pl-1">
          <div className="inline-flex items-center space-x-2 bg-[#EFF6FF] border border-[#DBEAFE] px-3 py-1 rounded-full text-xs font-semibold text-[#1D4ED8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <span>ALSM Modernization Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold tracking-tight text-[#0F172A]">
            Automating Legacy System Modernization
          </h1>
          <p className="text-[#475569] text-sm sm:text-base leading-relaxed [text-wrap:pretty]">
            Analyze legacy screens, map fields, generate modernization output, and validate results.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm border-none shadow-xs space-x-2 h-11 px-5 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.PROJECTS.LIST)}
            className="bg-white hover:bg-[#F8FAFC] border-[#CBD5E1] hover:border-[#94A3B8] text-[#0F172A] font-semibold text-sm space-x-2 h-11 px-5 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Legacy File</span>
          </Button>
        </div>
      </div>

      {/* Enterprise Dashboard Metric Cards - Full Width Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
        <button
          type="button"
          onClick={() => navigate(ROUTES.PROJECTS.LIST)}
          className="bg-white border border-[#E2E8F0] hover:border-[#93C5FD] text-left rounded-xl p-6 shadow-xs hover:shadow-sm transition-all flex items-center justify-between group cursor-pointer"
          title="Click to view all projects"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold text-[#64748B] uppercase tracking-wider">
                Total Projects
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mt-1 tracking-tight">
                {projects.length}
              </div>
            </div>
          </div>
          <div className="w-3 h-3 rounded-full bg-[#2563EB]"></div>
        </button>

        <button
          type="button"
          onClick={() => navigate(ROUTES.PROJECTS.LIST)}
          className="bg-white border border-[#E2E8F0] hover:border-emerald-300 text-left rounded-xl p-6 shadow-xs hover:shadow-sm transition-all flex items-center justify-between group cursor-pointer"
          title="Click to view active projects"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-emerald-100">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold text-[#64748B] uppercase tracking-wider">
                Active Projects
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mt-1 tracking-tight">
                {activeProjectsCount}
              </div>
            </div>
          </div>
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
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

      {/* Enterprise Recent Projects List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">Recent Projects</h2>
            <p className="text-sm text-[#64748B] mt-0.5">
              Active modernization project workspaces
            </p>
          </div>
          <Link
            to={ROUTES.PROJECTS.LIST}
            className="inline-flex items-center space-x-1.5 bg-white hover:bg-[#F8FAFC] text-[#2563EB] hover:text-[#1D4ED8] border border-[#CBD5E1] hover:border-[#93C5FD] text-xs sm:text-sm font-medium h-9 px-3.5 sm:px-4 rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer group shrink-0"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] mx-auto flex items-center justify-center">
              <FolderKanban className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-lg text-[#0F172A]">No Projects Found</h3>
              <p className="text-sm text-[#64748B] max-w-sm mx-auto">
                You haven't created any modernization projects yet. Create a project to begin legacy source ingestion.
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold h-10 px-5 rounded-lg shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span>Create Project</span>
            </Button>
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs divide-y divide-[#E2E8F0] overflow-hidden">
            {recentProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(ROUTES.PROJECTS.SCREENS(p.id))}
                className="p-5 sm:px-6 sm:py-5 hover:bg-[#F8FAFC] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] group-hover:bg-[#EFF6FF] group-hover:text-[#2563EB] group-hover:border-[#BFDBFE] transition-colors flex items-center justify-center shrink-0">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-bold text-base text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">
                        {p.name}
                      </h3>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#64748B]">
                      <span className="inline-flex items-center space-x-1.5 bg-[#F1F5F9] border border-[#E2E8F0] px-2.5 py-1 rounded font-mono text-xs text-[#334155]">
                        {LEGACY_TYPE_LABEL[p.conversionType]} &rarr; {TARGET_FRAMEWORK_LABEL[p.conversionType]}
                      </span>
                      <span className="truncate">Updated {new Date(p.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(ROUTES.PROJECTS.SCREENS(p.id));
                  }}
                  className="bg-white hover:bg-[#EFF6FF] text-[#2563EB] hover:text-[#1D4ED8] border border-[#CBD5E1] hover:border-[#93C5FD] group-hover:border-[#2563EB] text-sm font-semibold h-10 px-4 rounded-lg shadow-2xs space-x-2 shrink-0 self-end sm:self-center transition-all cursor-pointer"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
