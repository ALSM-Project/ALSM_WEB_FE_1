import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2, ArrowRight, Trash2, FolderPlus, FolderUp, Code2, Play, Eye, AlertCircle } from 'lucide-react';
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
  const [screenFiles, setScreenFiles] = useState<SourceFile[]>([]);
  const [programFiles, setProgramFiles] = useState<SourceFile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Load existing uploaded source screens for this project from backend
  React.useEffect(() => {
    let cancelled = false;
    conversionService.getScreens(projectId).then((screens) => {
      if (cancelled) return;
      const loadedFiles: SourceFile[] = screens.map((s) => ({
        id: s.id,
        fileName: s.name,
        sizeKb: s.sizeKb ?? 10,
        uploadedAt: s.lastUpdated ?? 'Recently',
        status: s.status, // Uses real status from API (Ready, Converted, Completed, Processing)
        inputReference: s.inputReference,
        screenId: s.id,
      }));
      setScreenFiles(loadedFiles);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const files = activeTab === 'screens' ? screenFiles : programFiles;
  const readyCount = files.filter((f) => f.status === 'Ready').length;

  const totalCount = files.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedFiles = files.slice(startIndex, startIndex + pageSize);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLabel, setUploadLabel] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

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
    setUploadError(null);
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
            // Real status from the backend (e.g. already COMPLETED if this screen name
            // matches a prior successful conversion) rather than always assuming 'Ready'.
            status: screen?.status ?? 'Ready',
            inputReference: result.inputReference,
            screenId: screen?.id,
          };
          setScreenFiles((prev) => [newFile, ...prev]);
        } catch (err) {
          console.error('Failed to upload source file', file.name, err);
          setUploadError(err instanceof Error ? err.message : 'Failed to upload this file.');
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
    setUploadError(null);
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
      setUploadError(err instanceof Error ? err.message : 'Failed to upload these files.');
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
          const firstScreenId = screenFiles[0]?.screenId || screenFiles[0]?.id || 'Screen';
          if (stepId === 'conversion') navigate(ROUTES.PROJECTS.SCREENS(projectId));
          if (stepId === 'validation') navigate(ROUTES.PROJECTS.REVIEW(projectId, firstScreenId));
          if (stepId === 'result') navigate(ROUTES.PROJECTS.RESULT(projectId, firstScreenId));
          if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
        }}
      />

      <Tabs
        tabs={[
          { id: 'screens', label: 'Screens (BMS / DSPF)', count: screenFiles.length },
          { id: 'programs', label: 'Programs (COBOL / RPG)', count: programFiles.length },
        ]}
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          setCurrentPage(1);
        }}
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

      {uploadError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 text-xs font-medium flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {isUploading && (
        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 shadow-sm">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-brand-600">{uploadLabel || 'Uploading…'}</span>
            <span className="text-slate-700">{uploadProgress}%</span>
          </div>
          <ProgressBar progress={uploadProgress} color="indigo" />
        </div>
      )}

      <div className="bg-white border border-[#D9E2EC] rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#D9E2EC] flex justify-between items-center bg-[#F7F9FC]">
          <h3 className="text-sm font-bold text-[#091E42]">Uploaded Files ({files.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs table-fixed">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[12%]" />
              <col className="w-[20%]" />
              <col className="w-[14%]" />
              <col className="w-[24%]" />
            </colgroup>
            <thead className="bg-[#F7F9FC] text-[#42526E] font-bold uppercase tracking-wider text-[11px] border-b border-[#D9E2EC]">
              <tr>
                <th className="py-3.5 px-4">FILE NAME</th>
                <th className="py-3.5 px-4">SIZE</th>
                <th className="py-3.5 px-4">UPLOADED</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {paginatedFiles.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-slate-500">
                    No files uploaded yet. Drag and drop a file above to start.
                  </td>
                </tr>
              )}
              {paginatedFiles.map((file) => (
                <tr
                  key={file.id}
                  onClick={() => {
                    if (file.screenId) {
                      navigate(ROUTES.PROJECTS.CONVERT(projectId, file.screenId));
                    }
                  }}
                  className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#091E42]">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-[#0652CC] flex-shrink-0" />
                      <span className="group-hover:text-[#0652CC] group-hover:underline truncate">
                        {file.fileName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono">{file.sizeKb} KB</td>
                  <td className="py-3.5 px-4 text-slate-600 truncate">{file.uploadedAt}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={file.status} />
                  </td>
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center space-x-1.5 shrink-0 whitespace-nowrap">
                      {file.screenId && (
                        <>
                          <Link
                            to={ROUTES.PROJECTS.MAPPING(projectId, file.screenId)}
                            className="inline-flex items-center space-x-1 text-xs text-[#42526E] font-semibold hover:text-[#0652CC] bg-[#F7F9FC] px-2.5 py-1.5 rounded-lg border border-[#D9E2EC] transition-colors"
                            title="Inspect Field Mapping"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                            <span>Mapping</span>
                          </Link>

                          <Link
                            to={ROUTES.PROJECTS.CONVERT(projectId, file.screenId)}
                            className="inline-flex items-center space-x-1 text-xs text-[#0652CC] font-semibold hover:bg-blue-50 bg-[#E8F1FF] px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors"
                            title="Run Conversion Algorithm"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Convert</span>
                          </Link>

                          <Link
                            to={ROUTES.PROJECTS.RESULT(projectId, file.screenId)}
                            className="inline-flex items-center space-x-1 text-xs text-emerald-700 font-semibold hover:bg-emerald-100 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                            title="View Modernized Output"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Result</span>
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => handleRemove(file.id)}
                        className="inline-flex items-center space-x-1 text-xs text-rose-600 font-semibold hover:bg-rose-100 bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-200 transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Server-Side Style Pagination Footer */}
        <div className="bg-[#F7F9FC] px-4 py-3 border-t border-[#D9E2EC] flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[#6B778C] font-medium">
          <div className="flex items-center space-x-3">
            <span>
              Showing {totalCount === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, totalCount)} of {totalCount}{' '}
              uploaded {activeTab === 'screens' ? 'screens' : 'programs'}
            </span>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] text-[#42526E]">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#D9E2EC] text-[#091E42] text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-[#D9E2EC] bg-white text-[#42526E] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-semibold text-xs transition-colors"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    currentPage === pageNum
                      ? 'bg-[#0652CC] text-white shadow-2xs'
                      : 'bg-white border border-[#D9E2EC] text-[#42526E] hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-[#D9E2EC] bg-white text-[#42526E] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-semibold text-xs transition-colors"
              >
                Next
              </button>
            </div>
          )}
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
