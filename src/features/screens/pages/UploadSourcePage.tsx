import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2, ArrowRight, Trash2, FolderPlus } from 'lucide-react';
import { screenService } from '../services/screen.service';
import type { SourceFile } from '../types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { Tabs } from '@/shared/ui/Tabs';
import { StatusBadge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { Breadcrumb } from '@/shared/navigation/Breadcrumb';

export const UploadSourcePage: React.FC = () => {
  const { projectId = 'proj-acme' } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('screens');
  const [files, setFiles] = useState<SourceFile[]>([
    { id: '1', fileName: 'LoginScreen.bms', sizeKb: 245, uploadedAt: 'Oct 12, 2023 10:30 AM', status: 'Ready' },
    { id: '2', fileName: 'ReportScreen.dspf', sizeKb: 189, uploadedAt: 'Oct 12, 2023 10:32 AM', status: 'Failed to parse' },
  ]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      simulateUpload(e.target.files[0]);
    }
  };

  const simulateUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(20);
    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer);
          return 90;
        }
        return prev + 25;
      });
    }, 200);

    setTimeout(async () => {
      clearInterval(timer);
      setUploadProgress(100);
      const newFile = await screenService.uploadFile(file);
      setFiles((prev) => [newFile, ...prev]);
      setIsUploading(false);
      setUploadProgress(0);
    }, 1000);
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6 py-2 max-w-5xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Projects', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'Acme Corp Modernization', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'Upload Source File' },
        ]}
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Upload Source File</h1>
        <p className="text-slate-500 text-sm mt-1">Add BMS/DSPF legacy files to start conversion pipeline.</p>
      </div>

      <Tabs
        tabs={[
          { id: 'screens', label: 'Screens (BMS / DSPF)' },
          { id: 'programs', label: 'Programs (COBOL / RPG)' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className="bg-white border-2 border-dashed border-slate-300 hover:border-brand-600 rounded-2xl p-8 lg:p-12 text-center transition-all cursor-pointer group shadow-sm"
      >
        <input
          type="file"
          id="file-upload"
          accept=".bms,.dspf,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        <label htmlFor="file-upload" className="cursor-pointer space-y-4 block">
          <div className="w-16 h-16 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center mx-auto text-brand-600 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">Drag and drop your files here</p>
            <p className="text-xs text-brand-600 font-semibold mt-1">or click to browse from device</p>
          </div>
          <p className="text-xs text-slate-500">Accepted: .bms, .dspf, .txt (max 50MB/file)</p>
        </label>
      </div>

      {isUploading && (
        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 shadow-sm">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-brand-600">Uploading file...</span>
            <span className="text-slate-700">{uploadProgress}%</span>
          </div>
          <ProgressBar progress={uploadProgress} color="indigo" />
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm space-y-4">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">Uploaded Files ({files.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">File Name</th>
                <th className="p-3.5">Size</th>
                <th className="p-3.5">Uploaded</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-mono text-xs font-semibold text-slate-900 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-brand-600 flex-shrink-0" />
                    <span>{file.fileName}</span>
                  </td>
                  <td className="p-3.5 text-slate-500">{file.sizeKb} KB</td>
                  <td className="p-3.5 text-slate-500">{file.uploadedAt}</td>
                  <td className="p-3.5">
                    <StatusBadge status={file.status} />
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleRemove(file.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#ECFDF3] border border-[#ABEFC6] p-4 rounded-xl flex items-center justify-between text-xs text-[#079455] font-medium">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>You're ready to start conversion — 1 file ready. Proceed to select conversion settings.</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <Button variant="secondary" onClick={() => navigate(ROUTES.PROJECTS.SCREENS(projectId))}>
          Save for Later
        </Button>
        <div className="flex space-x-3">
          <label htmlFor="file-upload">
            <Button type="button" variant="outline" className="space-x-1.5 cursor-pointer font-semibold">
              <FolderPlus className="w-4 h-4 text-slate-600" />
              <span>Add More Files</span>
            </Button>
          </label>
          <Button onClick={() => navigate(ROUTES.PROJECTS.SCREENS(projectId))} className="space-x-2 font-semibold">
            <span>Proceed to Conversion</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
export default UploadSourcePage;
