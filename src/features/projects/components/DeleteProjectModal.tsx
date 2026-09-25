import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { projectService } from '../services/project.service';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

export interface DeleteProjectModalProps {
  isOpen: boolean;
  projectId: string;
  projectName?: string;
  onClose: () => void;
  onDeleted?: () => void;
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  projectId,
  projectName: initialProjectName,
  onClose,
  onDeleted,
}) => {
  const [confirmName, setConfirmName] = useState(initialProjectName || '');
  const [typedName, setTypedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch project details if name not provided
  useEffect(() => {
    if (isOpen) {
      setTypedName('');
      setError(null);
      setSuccessMsg(null);
      document.body.style.overflow = 'hidden';

      if (initialProjectName) {
        setConfirmName(initialProjectName);
      } else if (projectId) {
        projectService
          .getProjectById(projectId)
          .then((p) => {
            if (p?.name) setConfirmName(p.name);
          })
          .catch(() => setConfirmName(''));
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, projectId, initialProjectName]);

  // ESC key handler
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

  const isConfirmed = typedName.trim() === confirmName.trim() && confirmName.length > 0;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;

    setLoading(true);
    setError(null);
    try {
      await projectService.deleteProject(projectId);
      setSuccessMsg(`Project "${confirmName}" was deleted successfully.`);
      setTimeout(() => {
        onClose();
        if (onDeleted) onDeleted();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen top-0 left-0 right-0 bottom-0 bg-[#091E42]/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
      style={{ zIndex: 999999 }}
      onClick={onClose}
    >
      <div
        className="relative bg-white border border-[#D9E2EC] rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-5 my-auto overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Warning Icon */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5.5 h-5.5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#091E42] tracking-tight">
                Delete Modernization Project?
              </h2>
              <p className="text-xs text-[#6B778C] mt-0.5">
                This action cannot be easily undone.
              </p>
            </div>
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

        <p className="text-xs text-[#42526E] leading-relaxed bg-[#F7F9FC] p-3.5 rounded-xl border border-[#D9E2EC]">
          This project will be soft-deleted and archived. All screen conversion files and field mappings associated with <strong className="text-[#091E42] font-semibold">{confirmName || 'this project'}</strong> will be hidden.
        </p>

        {successMsg && (
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] px-4 py-2.5 rounded-xl text-xs font-semibold">
            {successMsg}
          </div>
        )}

        {error && (
          <div className="bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] px-4 py-2.5 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Confirmation Input Form */}
        <form onSubmit={handleDelete} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#091E42]">
              Type <span className="text-[#D92D20] select-all font-mono">{confirmName || 'project name'}</span> to confirm
            </label>
            <Input
              placeholder={confirmName || 'Type project name...'}
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Modal Actions */}
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
              disabled={!isConfirmed}
              className="bg-[#D92D20] hover:bg-[#B71C1C] disabled:bg-slate-300 text-white text-xs px-5 py-2 font-bold shadow-xs space-x-1.5 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Project</span>
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default DeleteProjectModal;
