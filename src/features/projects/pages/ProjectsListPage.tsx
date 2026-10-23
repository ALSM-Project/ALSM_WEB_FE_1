import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Layers, ArrowRight, FolderKanban, Trash2, Pencil } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { StatusBadge, Button, PageHeader } from '@/shared/ui';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { EditProjectModal } from '../components/EditProjectModal';
import { projectService } from '../services/project.service';
import type { Project } from '../types/project';

const LEGACY_TYPE_LABEL: Record<Project['conversionType'], string> = {
  BMS_DSPF_TO_FRONTEND: 'BMS / DSPF',
  COBOL_TO_JAVA: 'COBOL',
};
const TARGET_FRAMEWORK_LABEL: Record<Project['conversionType'], string> = {
  BMS_DSPF_TO_FRONTEND: 'React 19 + TypeScript',
  COBOL_TO_JAVA: 'Java 21 + Spring Boot',
};

export const ProjectsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProjects = () => {
    setIsLoading(true);
    setLoadError(null);
    projectService
      .getProjects()
      .then(setProjects)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load projects'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const legacyType = LEGACY_TYPE_LABEL[p.conversionType];
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      legacyType.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'ALL') return matchesSearch;
    if (filterType === 'BMS') return matchesSearch && legacyType.includes('BMS');
    if (filterType === 'COBOL') return matchesSearch && legacyType.includes('COBOL');
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Reusable Standard PageHeader */}
      <PageHeader
        title="Modernization Projects"
        subtitle="Manage your legacy BMS/DSPF and COBOL modernization workspace projects."
        actions={
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#0652CC] hover:bg-[#0655FF] text-white font-bold text-xs shadow-xs space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </Button>
        }
      />

      {/* Filters and Search Bar */}
      <div className="bg-white border border-[#D9E2EC] rounded-lg p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C]" />
          <input
            type="text"
            placeholder="Search projects by name, legacy type (BMS, DSPF, COBOL)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#D9E2EC] rounded-md pl-9 pr-3.5 py-1.5 text-xs text-[#091E42] placeholder-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#0652CC]/15 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto bg-[#F1F5F9] p-1 rounded-md border border-[#E2E8F0]">
          <span className="text-[11px] font-semibold text-[#42526E] px-2">Type:</span>
          {['ALL', 'BMS', 'COBOL'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                filterType === t
                  ? 'bg-white text-[#091E42] shadow-2xs'
                  : 'text-[#6B778C] hover:text-[#091E42]'
              }`}
            >
              {t === 'BMS' ? 'BMS / DSPF' : t}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-lg text-xs font-medium">
          Failed to load projects: {loadError}
        </div>
      )}

      {/* Projects Cards List */}
      <div className="grid grid-cols-1 gap-3">
        {isLoading && (
          <div className="bg-white border border-[#D9E2EC] rounded-lg p-10 text-center text-xs text-[#6B778C]">
            Loading projects…
          </div>
        )}

        {!isLoading &&
          filteredProjects.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(ROUTES.PROJECTS.SCREENS(p.id))}
              className="bg-white border border-[#D9E2EC] hover:border-[#0652CC] rounded-lg p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer group"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-md bg-[#E8F1FF] text-[#0652CC] group-hover:bg-[#0652CC] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-sm text-[#091E42] group-hover:text-[#0652CC] transition-colors">{p.name}</h3>
                      <StatusBadge status={p.status} />
                    </div>
                    {p.description && <p className="text-xs text-[#6B778C] mt-0.5 line-clamp-1">{p.description}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                  <span className="inline-flex items-center space-x-1.5 bg-[#F8FAFC] border border-[#D9E2EC] px-2 py-0.5 rounded font-mono text-[11px] text-[#091E42]">
                    <Layers className="w-3 h-3 text-[#0652CC]" />
                    <span>
                      {LEGACY_TYPE_LABEL[p.conversionType]} &rarr; {TARGET_FRAMEWORK_LABEL[p.conversionType]}
                    </span>
                  </span>

                  <span className="text-[11px] text-[#6B778C]">
                    Updated: <strong className="text-[#42526E] font-medium">{new Date(p.updatedAt).toLocaleDateString()}</strong>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#E5EAF0]">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(ROUTES.PROJECTS.SCREENS(p.id));
                  }}
                  className="bg-[#0652CC] hover:bg-[#0655FF] text-white text-xs font-semibold px-3 py-1.5 space-x-1.5 shadow-2xs"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProject(p);
                  }}
                  className="p-1.5 border border-[#D9E2EC] text-[#6B778C] hover:text-[#0652CC] hover:bg-[#F1F5F9] transition-colors rounded-md cursor-pointer"
                  title="Edit Project"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(ROUTES.PROJECTS.DELETE(p.id));
                  }}
                  className="p-1.5 border border-[#D9E2EC] text-[#6B778C] hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors rounded-md cursor-pointer"
                  title="Delete Project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

        {!isLoading && filteredProjects.length === 0 && (
          <div className="bg-white border border-[#D9E2EC] rounded-lg p-10 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#E8F1FF] text-[#0652CC] mx-auto flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-[#091E42]">
              {projects.length === 0 ? 'No Projects Yet' : 'No Projects Found'}
            </h3>
            <p className="text-xs text-[#6B778C] max-w-sm mx-auto">
              {projects.length === 0
                ? 'Create your first modernization project to start uploading and converting legacy files.'
                : 'No modernization projects match your search criteria.'}
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#0652CC] hover:bg-[#0655FF] text-white text-xs font-semibold space-x-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </Button>
          </div>
        )}
      </div>

      {/* Blurred Backdrop Create Project Modal */}
      <CreateProjectModal
        onProjectCreated={(projectId) => {
          loadProjects();
          navigate(ROUTES.PROJECTS.UPLOAD(projectId));
        }}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditProjectModal
        isOpen={editingProject !== null}
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onProjectUpdated={() => loadProjects()}
      />
    </div>
  );
};

export default ProjectsListPage;
