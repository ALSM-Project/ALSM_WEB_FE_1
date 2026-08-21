import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Info, ArrowUpRight, Plus } from 'lucide-react';
import { projectService } from '../services/project.service';
import { ROUTES } from '@/shared/constants/routes';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { Breadcrumb } from '@/shared/navigation/Breadcrumb';

export const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Project name is required');

    setLoading(true);
    try {
      const proj = await projectService.createProject({ name, description });
      navigate(ROUTES.PROJECTS.UPLOAD(proj.id));
    } catch {
      setError('Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      <Breadcrumb
        items={[
          { label: 'Projects', href: ROUTES.PROJECTS.SCREENS('proj-acme') },
          { label: 'Create Project' },
        ]}
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Create New Project</h1>
        <p className="text-slate-500 text-sm mt-1">Set up a new conversion project workspace for BMS maps and COBOL applications.</p>
      </div>

      {error && (
        <div className="bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] px-4 py-3 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm">
        <Input
          label="Project Name"
          placeholder="e.g. Core Banking Modernization"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Description (Optional)
          </label>
          <textarea
            rows={4}
            placeholder="Briefly describe the scope of this modernization effort..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 transition-all placeholder:text-slate-400 shadow-xs"
          />
        </div>

        <div className="bg-brand-50 border border-brand-200 p-4 rounded-xl flex items-start space-x-3 text-xs text-brand-700">
          <Info className="w-5 h-5 flex-shrink-0 text-brand-600 mt-0.5" />
          <p className="leading-relaxed">
            This project workspace supports concurrent modernization of both Screens (BMS/DSPF &rarr; Modern Frontend) and Programs (COBOL/RPG &rarr; Java/C#) side-by-side.
          </p>
        </div>

        <div className="border-t border-slate-100 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Workspace Quota</h3>
            <Link to={ROUTES.BILLING.PRICING} className="text-xs text-brand-600 hover:underline flex items-center space-x-1 font-semibold">
              <span>Upgrade plan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">Screens Quota</span>
                <span className="font-medium text-slate-900">45 / 500 used</span>
              </div>
              <ProgressBar progress={9} color="indigo" size="sm" />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">Programs Quota</span>
                <span className="font-medium text-slate-900">8 / 100 used</span>
              </div>
              <ProgressBar progress={8} color="indigo" size="sm" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.PROJECTS.SCREENS('proj-acme'))}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} className="space-x-1.5 font-semibold">
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
export default CreateProjectPage;
