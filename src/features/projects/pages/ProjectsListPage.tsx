import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Folder, MoreVertical, Trash2, ExternalLink } from 'lucide-react';
import { projectService } from '../services/project.service';
import type { Project } from '../types/project';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';

export const ProjectsListPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    projectService.getProjects().then((data) => setProjects(data));
  }, []);

  return (
    <div className="space-y-6 py-4 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Manage your legacy modernization workspaces and screen conversion pipelines.
          </p>
        </div>

        <Button
          onClick={() => navigate(ROUTES.PROJECTS.NEW)}
          className="space-x-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Projects Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] border-b border-slate-200/80 tracking-wider">
              <tr>
                <th className="p-4 pl-6">Project Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Modified</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((project, index) => {
                const isSelected = index === 0;
                return (
                  <tr
                    key={project.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="p-4 pl-6 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-xl bg-blue-50 text-brand-600 border border-blue-100 flex-shrink-0">
                          <Folder className="w-4 h-4" />
                        </div>
                        <div>
                          <Link
                            to={ROUTES.PROJECTS.SCREENS(project.id)}
                            className="font-bold text-sm text-slate-900 hover:text-brand-600 transition-colors"
                          >
                            {project.name}
                          </Link>
                          {project.description && (
                            <p className="text-[11px] text-slate-400 font-sans mt-0.5 line-clamp-1 max-w-md">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {project.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 whitespace-nowrap font-medium">{project.updatedAt}</td>
                    <td className="p-4 pr-6 text-right whitespace-nowrap relative">
                      <div className="inline-block text-left">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === project.id ? null : project.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === project.id && (
                          <div className="absolute right-6 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-left">
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                navigate(ROUTES.PROJECTS.SCREENS(project.id));
                              }}
                              className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                              <span>View Screens</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                navigate(ROUTES.PROJECTS.DELETE(project.id));
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Delete Project</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectsListPage;
