import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Plus, Folder, MoreVertical } from 'lucide-react';
import { projectService } from '../services/project.service';
import type { Project } from '../types/project';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';

export const DeleteProjectPage: React.FC = () => {
  const { projectId = 'proj-mortgage' } = useParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [targetProject, setTargetProject] = useState<Project | null>(null);
  const [typedName, setTypedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    projectService.getProjects().then((data) => {
      setProjects(data);
      const proj = data.find((p) => p.id === projectId) || data[0];
      if (proj) setTargetProject(proj);
    });
  }, [projectId]);

  const confirmName = targetProject?.name || 'Mortgage-System-v1';

  const handleClose = () => {
    navigate(ROUTES.PROJECTS.LIST);
  };

  const handleDelete = async () => {
    if (typedName !== confirmName || !targetProject) return;
    setLoading(true);
    try {
      await projectService.deleteProject(targetProject.id);
      setNotification(`Project "${confirmName}" was soft-deleted successfully.`);
      setTimeout(() => {
        navigate(ROUTES.PROJECTS.LIST);
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[80vh]">
      {/* Background Projects List (Dimmed) */}
      <div className="space-y-6 py-4 max-w-7xl mx-auto px-4 sm:px-6 pointer-events-none select-none opacity-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Projects</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Manage your legacy modernization workspaces and screen conversion pipelines.
            </p>
          </div>

          <Button className="space-x-2 text-xs font-semibold bg-brand-600 text-white px-4 py-2.5 rounded-xl">
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </Button>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-4 pl-6">Project Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Modified</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((proj, idx) => (
                <tr key={proj.id} className={idx === 0 ? 'bg-blue-50/60 font-semibold' : ''}>
                  <td className="p-4 pl-6 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-blue-50 text-brand-600 border border-blue-100">
                        <Folder className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{proj.name}</span>
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {proj.status === 'ACTIVE' ? (
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
                  <td className="p-4 text-slate-500 whitespace-nowrap">{proj.updatedAt}</td>
                  <td className="p-4 pr-6 text-right whitespace-nowrap">
                    <MoreVertical className="w-4 h-4 text-slate-400 inline-block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Backdrop and Active Modal Box */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-5 text-center">
          {/* Warning Icon Header */}
          <div className="w-12 h-12 rounded-full bg-rose-100/80 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Delete Modernization Project?</h2>
            <p className="text-xs text-slate-500 leading-relaxed mt-2 px-1">
              This project will be soft-deleted and can be recovered within 30 days. All 24 screen conversions will be archived.
            </p>
          </div>

          {notification && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl">
              {notification}
            </div>
          )}

          {/* Form Confirmation Input */}
          <div className="text-left space-y-1.5 pt-1">
            <label htmlFor="confirm-project-input" className="block text-xs font-semibold text-slate-700">
              Type project name to confirm
            </label>
            <input
              id="confirm-project-input"
              type="text"
              placeholder={confirmName}
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs placeholder-slate-400"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={handleClose}
              className="text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={loading}
              disabled={typedName !== confirmName}
              className="text-xs font-semibold bg-[#F04438] hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Project
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteProjectPage;
