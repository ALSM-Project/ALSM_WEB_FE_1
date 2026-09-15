import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2, ArrowRight, Trash2, FolderPlus, Cpu } from 'lucide-react';
import { conversionService } from '@/features/conversion/services/conversion.service';
import type { SourceFile } from '../types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { Tabs } from '@/shared/ui/Tabs';
import { StatusBadge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { ModernizationWorkflow } from '@/shared/ui/ModernizationWorkflow';
import { PageHeader } from '@/shared/ui/PageHeader';

export const UploadSourcePage: React.FC = () => {
  const { projectId = 'proj-acme' } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('screens');

  // Starts empty — no seed/demo rows. Real rows only appear once a real file has
  // actually been uploaded to the backend (see handleUpload).
  const [screenFiles, setScreenFiles] = useState<SourceFile[]>([]);
  const [programFiles, setProgramFiles] = useState<SourceFile[]>([]);

  const files = activeTab === 'screens' ? screenFiles : programFiles;
  const readyCount = files.filter((f) => f.status === 'Ready').length;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      void handleUpload(e.target.files[0]);
    }
  };

  /** Real upload: the file is stored by the backend and the returned inputReference is what
   * conversion jobs use to run the actual BMS/DSPF/COBOL conversion tool — nothing is simulated. */
  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const result = await conversionService.uploadSource(projectId, [file], setUploadProgress);
      const uploaded = result.files[0];
      const fileName = uploaded?.name ?? file.name;
      // The backend already created a real, persisted Screen record for this upload
      // (see UploadConversionSourceResult.screens) — nothing to register client-side.
      const screen = result.screens[0];
      const newFile: SourceFile = {
        id: `file-${Date.now()}`,
        fileName,
        sizeKb: Math.round((uploaded?.sizeBytes ?? file.size) / 1024),
        uploadedAt: 'Just now',
        status: 'Ready',
        inputReference: result.inputReference,
        screenId: screen?.id,
      };
      if (activeTab === 'screens') {
        setScreenFiles((prev) => [newFile, ...prev]);
      } else {
        setProgramFiles((prev) => [newFile, ...prev]);
      }
    } catch (err) {
      console.error('Failed to upload source file', err);
      const failedFile: SourceFile = {
        id: `file-${Date.now()}`,
        fileName: file.name,
        sizeKb: Math.round(file.size / 1024),
        uploadedAt: 'Just now',
        status: 'Failed to parse',
      };
      if (activeTab === 'screens') {
        setScreenFiles((prev) => [failedFile, ...prev]);
      } else {
        setProgramFiles((prev) => [failedFile, ...prev]);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = (id: string) => {
    if (activeTab === 'screens') {
      setScreenFiles((prev) => prev.filter((f) => f.id !== id));
    } else {
      setProgramFiles((prev) => prev.filter((f) => f.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Upload Source File"
        subtitle={`Add legacy ${activeTab === 'screens' ? 'BMS/DSPF screen map' : 'COBOL/RPG program source'} files to start modernization pipeline.`}
        actions={
          <Button
            onClick={() => navigate(ROUTES.PROJECTS.SCREENS(projectId))}
            className="bg-[#0652CC] hover:bg-[#0655FF] text-white space-x-1.5 text-xs font-bold shadow-xs"
          >
            <span>Proceed to {activeTab === 'screens' ? 'Screens List' : 'Programs List'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        }
      />

      {/* Modernization Step-by-Step Workflow Bar */}
      <ModernizationWorkflow
        currentStep="upload"
        completedSteps={[]}
        onStepClick={(stepId) => {
          if (stepId === 'analysis') navigate(ROUTES.PROJECTS.SCREENS(projectId));
          if (stepId === 'mapping') navigate(ROUTES.PROJECTS.MAPPING(projectId, 'scr-acct010'));
          if (stepId === 'conversion') navigate(ROUTES.PROJECTS.CONVERT(projectId, 'scr-acct010'));
          if (stepId === 'validation' || stepId === 'result') navigate(ROUTES.PROJECTS.RESULT(projectId, 'scr-acct010'));
          if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
        }}
      />

      <Tabs
        tabs={[
          { id: 'screens', label: 'Screens (BMS / DSPF)', count: screenFiles.length },
          { id: 'programs', label: 'Programs (COBOL / RPG)', count: programFiles.length },
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
          accept={activeTab === 'screens' ? '.bms,.dspf' : '.cob,.cbl,.cpy'}
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
          <p className="text-xs text-slate-500">
            {activeTab === 'screens'
              ? 'Accepted: .bms, .dspf (max 50MB/file)'
              : 'Accepted: .cob, .cbl, .cpy — upload the program together with its copybooks (max 50MB/file)'}
          </p>
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
                    <div className="flex items-center justify-end space-x-2">
                      {file.status === 'Ready' && file.screenId && (
                        <Link
                          to={ROUTES.PROJECTS.CONVERT(projectId, file.screenId)}
                          className="inline-flex items-center space-x-1 text-xs text-brand-700 font-semibold hover:bg-brand-100 bg-brand-50 px-2.5 py-1.5 rounded-lg border border-brand-200 transition-colors"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                          <span>Convert</span>
                        </Link>
                      )}
                      <button
                        onClick={() => handleRemove(file.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {readyCount > 0 && (
        <div className="bg-[#ECFDF3] border border-[#ABEFC6] p-4 rounded-xl flex items-center justify-between text-xs text-[#079455] font-medium">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>
              You're ready to start conversion — {readyCount} file{readyCount === 1 ? '' : 's'} ready.
              Use the Convert action on a row, or proceed to the screens list below.
            </span>
          </div>
        </div>
      )}

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
