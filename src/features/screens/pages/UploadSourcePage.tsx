import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2, ArrowRight, Trash2, FolderPlus, FolderUp, Cpu } from 'lucide-react';
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
  const [uploadLabel, setUploadLabel] = useState('');

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) void handleFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) void handleFiles(Array.from(e.target.files));
    // Reset so selecting the exact same file(s) again still fires onChange.
    e.target.value = '';
  };

  const acceptedExtensions = activeTab === 'screens' ? ['.bms', '.dspf'] : ['.cob', '.cbl', '.cpy'];

  /** Folder picks (webkitdirectory) return every file in the tree, including ones we don't
   * accept (README, .gitignore, etc.) and files nested in different subfolders (e.g. a
   * carddemo layout with sibling cbl/ and cpy/ dirs) — only the browser-reported basename
   * (not the subfolder path) is sent to the backend, so programs and their copybooks still
   * land in the same upload bundle/directory regardless of which subfolder they came from. */
  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    const matched = picked.filter((file) =>
      acceptedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext)),
    );
    if (matched.length === 0) return;
    if (matched.length < picked.length) {
      console.warn(`Skipped ${picked.length - matched.length} file(s) with unsupported extension from folder upload`);
    }
    void handleFiles(matched);
  };

  const failedRow = (file: File): SourceFile => ({
    id: `file-${Date.now()}-${Math.random()}`,
    fileName: file.name,
    sizeKb: Math.round(file.size / 1024),
    uploadedAt: 'Just now',
    status: 'Failed to parse',
  });

  const handleFiles = (files: File[]) => {
    if (activeTab === 'screens') {
      // Each screen file is an independent conversion unit — upload one at a time so
      // every file gets its own real inputReference/Screen instead of accidentally
      // sharing one storage bundle with unrelated screens.
      return handleUploadScreensSequentially(files);
    }
    // Program files (a .cob/.cbl plus its .cpy copybooks) must be uploaded together in
    // one request — tool2java only resolves COPY statements from files in the same
    // directory as the program, so splitting these into separate uploads would break it.
    return handleUploadProgramBundle(files);
  };

  const handleUploadScreensSequentially = async (files: File[]) => {
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadLabel(files.length > 1 ? `Uploading ${i + 1} of ${files.length}: ${file.name}` : `Uploading ${file.name}`);
        setUploadProgress(0);
        try {
          const result = await conversionService.uploadSource(projectId, [file], setUploadProgress);
          const uploaded = result.files[0];
          const screen = result.screens[0];
          const newFile: SourceFile = {
            id: `file-${Date.now()}-${Math.random()}`,
            fileName: uploaded?.name ?? file.name,
            sizeKb: Math.round((uploaded?.sizeBytes ?? file.size) / 1024),
            uploadedAt: 'Just now',
            status: 'Ready',
            inputReference: result.inputReference,
            screenId: screen?.id,
          };
          setScreenFiles((prev) => [newFile, ...prev]);
        } catch (err) {
          console.error('Failed to upload source file', file.name, err);
          setScreenFiles((prev) => [failedRow(file), ...prev]);
        }
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadLabel('');
    }
  };

  /** Real upload: the file(s) are stored by the backend and the returned inputReference is
   * what conversion jobs use to run the actual COBOL conversion tool — nothing is simulated. */
  const handleUploadProgramBundle = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadLabel(
      files.length > 1
        ? `Uploading ${files.length} files (program + copybooks)…`
        : `Uploading ${files[0].name}`,
    );
    try {
      const result = await conversionService.uploadSource(projectId, files, setUploadProgress);
      // The backend already created real, persisted Screen records for this upload (one
      // per program file — copybooks don't get their own screen) — nothing to register
      // client-side. Match each uploaded file back to its screen (if any) by name.
      const screenByName = new Map(result.screens.map((s) => [s.name, s]));
      const newRows: SourceFile[] = result.files.map((f) => ({
        id: `file-${Date.now()}-${Math.random()}`,
        fileName: f.name,
        sizeKb: Math.round(f.sizeBytes / 1024),
        uploadedAt: 'Just now',
        status: 'Ready',
        inputReference: result.inputReference,
        screenId: screenByName.get(f.name)?.id,
      }));
      setProgramFiles((prev) => [...newRows, ...prev]);
    } catch (err) {
      console.error('Failed to upload source files', err);
      setProgramFiles((prev) => [...files.map(failedRow), ...prev]);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadLabel('');
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
          multiple
          className="hidden"
        />
        <input
          type="file"
          id="folder-upload"
          onChange={handleFolderSelect}
          multiple
          className="hidden"
          {...{ webkitdirectory: 'true', directory: 'true', mozdirectory: 'true' }}
        />
        <div className="w-16 h-16 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center mx-auto text-brand-600 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div className="mt-4">
          <label htmlFor="file-upload" className="text-base font-bold text-slate-900 cursor-pointer block">
            Drag and drop your files here
          </label>
          <p className="text-xs text-brand-600 font-semibold mt-1">
            <label htmlFor="file-upload" className="underline hover:text-brand-800 cursor-pointer">
              click to browse from device
            </label>
            {' · '}
            <label htmlFor="folder-upload" className="underline hover:text-brand-800 cursor-pointer">
              select an entire folder
            </label>
          </p>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          {activeTab === 'screens'
            ? 'Accepted: .bms, .dspf — select or drop multiple screens at once (max 50MB/file)'
            : 'Accepted: .cob, .cbl, .cpy — select the program(s) together with their copybooks, or select the whole application folder at once (max 50MB/file)'}
        </p>
      </div>

      {isUploading && (
        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 shadow-sm">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-brand-600">{uploadLabel || 'Uploading…'}</span>
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
          <label htmlFor="folder-upload">
            <Button type="button" variant="outline" className="space-x-1.5 cursor-pointer font-semibold">
              <FolderUp className="w-4 h-4 text-slate-600" />
              <span>Add Folder</span>
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
