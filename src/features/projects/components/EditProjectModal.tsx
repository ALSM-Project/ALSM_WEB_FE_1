import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import { projectService } from '../services/project.service';
import type { Project } from '../types/project';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

export interface EditProjectModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onProjectUpdated?: (project: Project) => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  project,
  onClose,
  onProjectUpdated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset the form to the real current values of the project being edited each time
  // the modal opens — never a stale value from whichever project was edited last.
  useEffect(() => {
    if (isOpen && project) {
      setName(project.name);
      setDescription(project.description ?? '');
      setError('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, project]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter a project name');

    setLoading(true);
    setError('');
    try {
      const updated = await projectService.updateProject(project.id, {
        name: name.trim(),
        description: description.trim(),
      });
      onClose();
      onProjectUpdated?.(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen top-0 left-0 right-0 bottom-0 bg-[#091E42]/50 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
      style={{ zIndex: 999999 }}
      onClick={onClose}
    >
      <div
        className="relative bg-white border border-[#D9E2EC] rounded-xl shadow-xl w-full max-w-xl p-6 sm:p-8 space-y-5 my-auto overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#E5EAF0] pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#091E42] tracking-tight">Edit Project</h2>
            <p className="text-xs text-[#6B778C]">
              Update this project's name or description. The conversion type cannot be changed
              after creation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#6B778C] hover:text-[#091E42] hover:bg-[#F7F9FC] transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] px-4 py-2.5 rounded-md text-xs font-medium">
            {error}
          </div>
        )}

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
              className="w-full bg-[#F7F9FC] border border-[#D9E2EC] text-[#091E42] rounded-md p-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0652CC]/20 focus:border-[#0652CC] transition-colors placeholder:text-[#6B778C]"
            />
          </div>

          <div className="pt-4 border-t border-[#E5EAF0] flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="text-xs px-4 py-2 font-medium rounded-md"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              className="bg-[#0652CC] hover:bg-[#0655FF] text-white text-xs px-5 py-2 font-bold shadow-xs space-x-1.5 rounded-md"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditProjectModal;
