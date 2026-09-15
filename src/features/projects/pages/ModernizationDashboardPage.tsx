import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, ArrowRight, Upload, Cpu } from 'lucide-react';
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
            onClick={() => navigate(ROUTES.PROJECTS.LIST)}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 font-semibold text-xs space-x-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Legacy File</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row — only real, cheaply-derivable counts. No fabricated aggregate
          numbers (screens analyzed/converted/review-required across all projects
          would need real backend aggregation this page doesn't have yet). */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-[#42526E]">Total Projects</div>
            <div className="text-2xl font-extrabold text-[#091E42] mt-1">{projects.length}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#E8F1FF] text-[#0652CC] flex items-center justify-center">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-[#42526E]">Active Projects</div>
            <div className="text-2xl font-extrabold text-[#091E42] mt-1">
              {projects.filter((p) => p.status === 'ACTIVE').length}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Reusable Modernization Workflow Bar */}
      <ModernizationWorkflow currentStep="conversion" completedSteps={['analysis', 'mapping']} />

      {/* Recent Projects */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#091E42]">Recent Projects</h2>
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

        {recentProjects.length === 0 ? (
          <p className="text-xs text-[#6B778C] py-6 text-center">
            No projects yet — create one to start uploading and converting legacy files.
          </p>
        ) : (
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
                      {LEGACY_TYPE_LABEL[p.conversionType]} &rarr; {TARGET_FRAMEWORK_LABEL[p.conversionType]}
                    </span>
                    <span>Updated {new Date(p.updatedAt).toLocaleString()}</span>
                  </div>
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
            ))}
          </div>
        )}
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
