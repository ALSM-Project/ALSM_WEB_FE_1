import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Folder } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';

export const ExportCodePage: React.FC = () => {
  const { projectId = 'proj-acme' } = useParams();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(true);
  const [outputOption, setOutputOption] = useState<'scaffold' | 'standalone' | 'storybook'>('scaffold');
  const [frameworkVersion, setFrameworkVersion] = useState('18.2.0');
  const [downloading, setDownloading] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    navigate(ROUTES.PROJECTS.SCREENS(projectId));
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert('Code Package .zip downloaded successfully!');
      handleClose();
    }, 800);
  };

  return (
    <div className="p-8">
      <Modal isOpen={isOpen} onClose={handleClose} title="Export Code Package" maxWidth="xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">OUTPUT OPTIONS</label>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <label
                onClick={() => setOutputOption('scaffold')}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  outputOption === 'scaffold' ? 'bg-brand-50 border-brand-300 shadow-xs' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <p className="font-bold text-slate-900">Full Project Scaffold</p>
                  <p className="text-slate-500 text-[11px]">(Vite + React + Tailwind + TypeScript)</p>
                </div>
                <input type="radio" name="output" checked={outputOption === 'scaffold'} readOnly className="text-brand-600 focus:ring-brand-600" />
              </label>

              <label
                onClick={() => setOutputOption('standalone')}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  outputOption === 'standalone' ? 'bg-brand-50 border-brand-300 shadow-xs' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <p className="font-bold text-slate-900">Standalone Component Files</p>
                  <p className="text-slate-500 text-[11px]">Individual TSX component files only</p>
                </div>
                <input type="radio" name="output" checked={outputOption === 'standalone'} readOnly className="text-brand-600 focus:ring-brand-600" />
              </label>

              <label
                onClick={() => setOutputOption('storybook')}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  outputOption === 'storybook' ? 'bg-brand-50 border-brand-300 shadow-xs' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <p className="font-bold text-slate-900">Storybook Design System</p>
                  <p className="text-slate-500 text-[11px]">Component library with interactive stories</p>
                </div>
                <input type="radio" name="output" checked={outputOption === 'storybook'} readOnly className="text-brand-600 focus:ring-brand-600" />
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">FRAMEWORK VERSION TARGET</label>
            <select
              value={frameworkVersion}
              onChange={(e) => setFrameworkVersion(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-600 shadow-xs font-semibold"
            >
              <option value="18.2.0">React 18.2.0 (Latest)</option>
              <option value="17.0.2">React 17.0.2</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">PACKAGE PREVIEW</label>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-1 max-h-48 overflow-y-auto shadow-inner">
              <p className="text-brand-400 font-bold flex items-center space-x-1.5">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span>project-root/</span>
              </p>
              <p className="pl-4 text-slate-400">├── src/</p>
              <p className="pl-8 text-cyan-300">├── components/ (Button.tsx, Card.tsx, index.ts)</p>
              <p className="pl-8 text-slate-400">├── hooks/</p>
              <p className="pl-8 text-slate-400">├── App.tsx</p>
              <p className="pl-8 text-slate-400">└── main.tsx</p>
              <p className="pl-4 text-slate-400">├── public/</p>
              <p className="pl-4 text-slate-400">├── package.json</p>
              <p className="pl-4 text-slate-400">├── tailwind.config.js</p>
              <p className="pl-4 text-slate-400">├── tsconfig.json</p>
              <p className="pl-4 text-slate-400">└── vite.config.ts</p>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
            <span>Est. Package Size: <strong className="text-brand-600 font-semibold">2.4 MB</strong></span>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={handleClose} className="font-semibold">
              Cancel
            </Button>
            <Button onClick={handleDownload} isLoading={downloading} className="space-x-1.5 font-semibold">
              <Download className="w-4 h-4" />
              <span>Download .ZIP Bundle</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default ExportCodePage;
