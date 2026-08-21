import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { projectService } from '../services/project.service';
import { ROUTES } from '@/shared/constants/routes';
import { Modal } from '@/shared/ui/Modal';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

export const DeleteProjectPage: React.FC = () => {
  const { projectId = 'proj-acme' } = useParams();
  const navigate = useNavigate();

  const projectNameToConfirm = 'CoreBanking_Legacy';
  const [typedName, setTypedName] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    navigate(ROUTES.PROJECTS.SCREENS(projectId));
  };

  const handleDelete = async () => {
    if (typedName !== projectNameToConfirm) return;
    setLoading(true);
    try {
      await projectService.deleteProject(projectId);
      alert('Project soft-deleted successfully!');
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="opacity-40 pointer-events-none space-y-4 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-slate-900">Project Dashboard</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-2 shadow-xs">
            <h3 className="font-bold text-slate-900">CoreBanking_Legacy</h3>
            <p className="text-xs text-slate-500">COBOL to Java Spring • Progress 45%</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-2 shadow-xs">
            <h3 className="font-bold text-slate-900">Inventory_AS400</h3>
            <p className="text-xs text-slate-500">RPG to Node.js • 92%</p>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={handleClose} title="Delete Modernization Project?" maxWidth="md">
        <div className="space-y-6">
          <div className="bg-[#FEF3F2] border border-[#FECDCA] p-4 rounded-xl text-[#D92D20] flex items-start space-x-3 text-xs font-medium">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              This project will be soft-deleted and can be recovered within 30 days. All 24 screen conversions will be archived.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Type <strong className="text-slate-900 font-mono">{projectNameToConfirm}</strong> to confirm deletion:
            </label>
            <Input
              placeholder="CoreBanking_Legacy"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={handleClose} className="font-semibold">
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={loading}
              disabled={typedName !== projectNameToConfirm}
              className="space-x-1.5 font-semibold"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Project</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default DeleteProjectPage;
