import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Layers, ArrowRight, FolderKanban, Trash2 } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { StatusBadge, Button, PageHeader } from '@/shared/ui';
import { CreateProjectModal } from '../components/CreateProjectModal';

export const ProjectsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const projects = [
    {
      id: 'proj-acme',
      name: 'Acme Core Banking Modernization',
      description: 'Full modernization of core banking BMS screen maps and transaction screens into modular React components.',
      legacyType: 'BMS / DSPF',
      sourceFormat: 'IBM 3270 BMS Map',
      targetFramework: 'React 19 + TypeScript',
      convertedCount: 36,
      totalCount: 48,
      status: 'Active',
      lastActivity: '10 mins ago',
    },
    {
      id: 'proj-cobol-java',
      name: 'Insurance Policy Ledger Engine',
      description: 'Algorithm-based conversion of COBOL batch and online policy calculation modules to Java 21 Spring Boot.',
      legacyType: 'COBOL',
      sourceFormat: 'COBOL Source (.cbl)',
      targetFramework: 'Java 21 + Spring Boot',
      convertedCount: 22,
      totalCount: 30,
      status: 'Active',
      lastActivity: '1 hour ago',
    },
    {
      id: 'proj-logistics',
      name: 'Logistics Order Entry System',
      description: 'Modernization of AS/400 DSPF display files into responsive modern web interfaces.',
      legacyType: 'BMS / DSPF',
      sourceFormat: 'AS/400 DSPF Map',
      targetFramework: 'React + Tailwind CSS',
      convertedCount: 15,
      totalCount: 15,
      status: 'Completed',
      lastActivity: 'Yesterday',
    },
  ];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.legacyType.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'ALL') return matchesSearch;
    if (filterType === 'BMS') return matchesSearch && p.legacyType.includes('BMS');
    if (filterType === 'COBOL') return matchesSearch && p.legacyType.includes('COBOL');
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
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B778C]" />
          <input
            type="text"
            placeholder="Search projects by name, legacy system type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl pl-10 pr-4 py-2 text-xs text-[#091E42] placeholder-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#0652CC] transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#6B778C]" />
          <span className="text-xs font-semibold text-[#42526E]">Type:</span>
          {['ALL', 'BMS', 'COBOL'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === t
                  ? 'bg-[#0652CC] text-white'
                  : 'bg-[#F7F9FC] text-[#42526E] hover:bg-slate-200 border border-[#D9E2EC]'
              }`}
            >
              {t === 'BMS' ? 'BMS / DSPF' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProjects.map((p) => {
          const progressPct = Math.round((p.convertedCount / p.totalCount) * 100);

          return (
            <div
              key={p.id}
              className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-2xs hover:border-[#0652CC]/50 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F1FF] text-[#0652CC] flex items-center justify-center shrink-0">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-base text-[#091E42]">{p.name}</h3>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-[#42526E] mt-0.5 line-clamp-1">{p.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <span className="inline-flex items-center space-x-1.5 bg-[#F7F9FC] border border-[#D9E2EC] px-2.5 py-1 rounded-lg font-mono text-[#091E42]">
                    <Layers className="w-3.5 h-3.5 text-[#0652CC]" />
                    <span>{p.legacyType} &rarr; {p.targetFramework}</span>
                  </span>

                  <span className="text-[#6B778C]">
                    Source: <strong className="text-[#091E42]">{p.sourceFormat}</strong>
                  </span>
                  <span className="text-[#6B778C]">
                    Updated: <strong className="text-[#091E42]">{p.lastActivity}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between lg:justify-end gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#E5EAF0]">
                {/* Progress bar info */}
                <div className="w-44 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#42526E]">Conversion Progress</span>
                    <span className="text-[#0652CC]">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-[#F7F9FC] border border-[#D9E2EC] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0652CC] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-[#6B778C] text-right">
                    {p.convertedCount} of {p.totalCount} screens converted
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => navigate(ROUTES.PROJECTS.SCREENS(p.id))}
                    className="bg-[#0652CC] hover:bg-[#0655FF] text-white text-xs font-bold space-x-1.5 shadow-2xs"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => navigate(ROUTES.PROJECTS.DELETE(p.id))}
                    className="p-2 border border-[#D9E2EC] text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors rounded-xl"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="bg-white border border-[#D9E2EC] rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#E8F1FF] text-[#0652CC] mx-auto flex items-center justify-center">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#091E42]">No Projects Found</h3>
            <p className="text-xs text-[#6B778C] max-w-sm mx-auto">
              No modernization projects match your search criteria. Create a new project to get started.
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#0652CC] text-white text-xs font-bold space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </Button>
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

export default ProjectsListPage;
