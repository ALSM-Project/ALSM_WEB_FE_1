import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Info, Layers, Cpu } from 'lucide-react';
import { projectService } from '../services/project.service';
import { ROUTES } from '@/shared/constants/routes';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (projectId: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError('');
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter a project name');

    setLoading(true);
    try {
      const proj = await projectService.createProject({ name: name.trim(), description: description.trim() });
      onClose();
      if (onProjectCreated) {
        onProjectCreated(proj.id);
      } else {
        navigate(ROUTES.PROJECTS.UPLOAD(proj.id));
      }
    } catch {
      setError('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#091E42]/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white border border-[#D9E2EC] rounded-2xl shadow-2xl w-full max-w-xl p-6 sm:p-8 space-y-5 my-auto overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E5EAF0] pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#091E42] tracking-tight flex items-center space-x-2">
              <span>Create New Project</span>
            </h2>
            <p className="text-xs text-[#6B778C]">
              Set up a modernization project workspace for BMS maps and COBOL applications.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B778C] hover:text-[#091E42] hover:bg-[#F7F9FC] transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] px-4 py-2.5 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="PROJECT NAME"
            placeholder="e.g. Core Banking Modernization"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#091E42]">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Briefly describe the scope of this modernization effort..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#F7F9FC] border border-[#D9E2EC] text-[#091E42] rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0652CC]/20 focus:border-[#0652CC] transition-all placeholder:text-[#6B778C]"
            />
          </div>

          <div className="bg-[#E8F1FF] border border-[#B3D4FF] p-3.5 rounded-xl flex items-start space-x-3 text-xs text-[#0652CC]">
            <Info className="w-4 h-4 flex-shrink-0 text-[#0652CC] mt-0.5" />
            <p className="leading-relaxed text-[11.5px]">
              Supports side-by-side modernization of BMS/DSPF screen maps (&rarr; React 19) and COBOL/RPG logic (&rarr; Java 21).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5EAF0] space-y-1">
              <span className="font-bold text-[#091E42] flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0652CC]" />
                <span>BMS / DSPF Screens</span>
              </span>
              <p className="text-[11px] text-[#6B778C]">Converts legacy screen maps to React TypeScript components.</p>
            </div>

            <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5EAF0] space-y-1">
              <span className="font-bold text-[#091E42] flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#0652CC]" />
                <span>COBOL Logic</span>
              </span>
              <p className="text-[11px] text-[#6B778C]">Converts COBOL business logic to Java Spring Boot services.</p>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-[#E5EAF0] flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="text-xs px-4 py-2 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              className="bg-[#0652CC] hover:bg-[#0655FF] text-white text-xs px-5 py-2 font-bold shadow-xs space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
