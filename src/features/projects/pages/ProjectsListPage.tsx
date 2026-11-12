import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Layers, ArrowRight, FolderKanban, Trash2, Pencil } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { StatusBadge, Button, PageHeader } from '@/shared/ui';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { EditProjectModal } from '../components/EditProjectModal';
import { projectService } from '../services/project.service';
import type { Project } from '../types/project';

const LEGACY_TYPE_LABEL: Record<string, string> = {
  BMS_DSPF_TO_REACT: 'BMS / DSPF',
  BMS_DSPF_TO_FRONTEND: 'BMS / DSPF',
  COBOL_TO_JAVA: 'COBOL',
};
const TARGET_FRAMEWORK_LABEL: Record<string, string> = {
  BMS_DSPF_TO_REACT: 'React 19 + TypeScript',
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
            className="bg-[#244A70] hover:bg-[#1B3856] text-white font-bold text-xs shadow-xs space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </Button>
        }
      />

      {/* Filters and Search Bar */}
      <div className="bg-white border border-[#D9E2EC] rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search projects by name, legacy system type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl pl-10 pr-4 py-2 text-xs text-[#091E42] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#244A70] transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-[#42526E]">Type:</span>
          {['ALL', 'BMS', 'COBOL'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === t
                  ? 'bg-[#244A70] text-white'
                  : 'bg-[#F7F9FC] text-[#42526E] hover:bg-slate-200 border border-[#D9E2EC]'
              }`}
            >
              {t === 'BMS' ? 'BMS / DSPF' : t}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className="bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] px-4 py-3 rounded-xl text-xs font-medium">
          Failed to load projects: {loadError}
        </div>
      )}

      {/* Projects Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading && (
          <div className="bg-white border border-[#D9E2EC] rounded-xl p-12 text-center text-xs text-slate-500">
            Loading projects…
          </div>
        )}

        {!isLoading &&
          filteredProjects.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(ROUTES.PROJECTS.SCREENS(p.id))}
              className="bg-white border border-[#D9E2EC] hover:border-[#244A70] rounded-xl p-6 shadow-2xs hover:shadow-md transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6 cursor-pointer group"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F0F4F8] text-[#244A70] group-hover:bg-[#244A70] group-hover:text-white transition-colors flex items-center justify-center shrink-0 border border-[#DCE3EC]">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="font-bold text-base text-[#091E42] group-hover:text-[#244A70] transition-colors">{p.name}</h2>
                      <StatusBadge status={p.status} />
                    </div>
                    {p.description && <p className="text-xs text-[#42526E] mt-0.5 line-clamp-1">{p.description}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <span className="inline-flex items-center space-x-1.5 bg-[#F7F9FC] border border-[#D9E2EC] px-2.5 py-1 rounded-lg font-mono text-[#091E42]">
                    <Layers className="w-4 h-4 text-[#244A70]" />
                    <span>
                      {LEGACY_TYPE_LABEL[p.conversionType]} &rarr; {TARGET_FRAMEWORK_LABEL[p.conversionType]}
                    </span>
                  </span>

                  <span className="text-slate-500">
                    Updated: <strong className="text-[#091E42]">{new Date(p.updatedAt).toLocaleString()}</strong>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#E5EAF0]">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(ROUTES.PROJECTS.SCREENS(p.id));
                  }}
                  className="bg-[#244A70] hover:bg-[#1B3856] text-white text-xs font-bold space-x-1.5 shadow-2xs"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProject(p);
                  }}
                  className="p-2 border border-[#D9E2EC] text-slate-500 hover:text-[#244A70] hover:bg-[#F0F4F8] hover:border-[#244A70] transition-colors rounded-xl"
                  title="Edit Project"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(ROUTES.PROJECTS.DELETE(p.id));
                  }}
                  className="p-2 border border-[#D9E2EC] text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors rounded-xl"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

        {!isLoading && filteredProjects.length === 0 && (
          <div className="bg-white border border-[#D9E2EC] rounded-xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F0F4F8] text-[#244A70] border border-[#DCE3EC] mx-auto flex items-center justify-center">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-base text-[#091E42]">
              {projects.length === 0 ? 'No Projects Yet' : 'No Projects Found'}
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {projects.length === 0
                ? 'Create your first modernization project to start uploading and converting legacy files.'
                : 'No modernization projects match your search criteria.'}
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#244A70] hover:bg-[#1B3856] text-white text-xs font-bold space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </Button>
            {projects.length > 0 && (
              <Button variant="outline" onClick={() => { setSearchQuery(""); setFilterType("ALL"); }} className="text-xs font-semibold ml-2">Clear Filters</Button>
            )}
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
