import React, { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2, ArrowRight, Trash2, FolderPlus, FolderUp, Code2, Play, Eye, AlertCircle } from 'lucide-react';
import { conversionService } from '@/features/conversion/services/conversion.service';
import { projectService } from '@/features/projects/services/project.service';
import type { Project } from '@/features/projects/types/project';
import { resolveWorkspace } from '@/features/projects/utils/conversionTypeResolver';
import { UnsupportedProjectState } from '@/features/projects/components/UnsupportedProjectState';
import type { SourceFile } from '../types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { StatusBadge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { ModernizationWorkflow } from '@/shared/ui/ModernizationWorkflow';
import { PageHeader } from '@/shared/ui/PageHeader';
import { cacheProjectConversionType, getCachedProjectConversionType } from '@/shared/utils/projectCache';

/** Source types that are uploaded and listed as programs rather than screens. */
const PROGRAM_TYPES = new Set(['COBOL', 'RPG']);

interface WebkitFileSystemEntry {
  isFile: boolean;
  isDirectory: boolean;
  file: (success: (file: File) => void, error?: () => void) => void;
  createReader: () => {
    readEntries: (success: (entries: WebkitFileSystemEntry[]) => void, error?: () => void) => void;
  };
}

async function extractFilesFromDataTransfer(dataTransfer: DataTransfer): Promise<File[]> {
  const files: File[] = [];
  const items = dataTransfer.items;
  if (items && items.length > 0 && typeof (items[0] as unknown as { webkitGetAsEntry?: () => unknown }).webkitGetAsEntry === 'function') {
    const entries: WebkitFileSystemEntry[] = [];
    for (let i = 0; i < items.length; i++) {
      const entry = (items[i] as unknown as { webkitGetAsEntry: () => WebkitFileSystemEntry | null }).webkitGetAsEntry();
      if (entry) entries.push(entry);
    }
    const readEntry = async (entry: any, currentPath = ''): Promise<void> => {
      if (entry.isFile) {
        await new Promise<void>((resolve) => {
          entry.file(
            (file: File) => {
              const relPath = currentPath ? `${currentPath}/${file.name}` : (entry.fullPath?.replace(/^\//, '') || file.name);
              try {
                Object.defineProperty(file, 'webkitRelativePath', {
                  value: relPath,
                  writable: false,
                  configurable: true,
                });
              } catch {
                // ignore
              }
              files.push(file);
              resolve();
            },
            () => resolve(),
          );
        });
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const dirPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        const readBatch = async (): Promise<void> => {
          const batch: any[] = await new Promise((resolve) => {
            reader.readEntries(
              (results: any[]) => resolve(results),
              () => resolve([]),
            );
          });
          if (batch.length > 0) {
            for (const child of batch) {
              await readEntry(child, dirPath);
            }
            await readBatch();
          }
        };
        await readBatch();
      }
    };
    for (const entry of entries) {
      await readEntry(entry);
    }
    return files;
  }
  return Array.from(dataTransfer.files);
}

export const UploadSourcePage: React.FC = () => {
  const { projectId = 'proj-acme' } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const locationState = location.state as { workspace?: string; tab?: string } | null;

  const urlTab = searchParams.get('tab') || searchParams.get('type');
  const cachedConversionType = getCachedProjectConversionType(projectId);
  const isInitialCobol =
    urlTab === 'programs' ||
    urlTab === 'cobol' ||
    locationState?.tab === 'programs' ||
    locationState?.workspace === 'PROGRAMS' ||
    cachedConversionType === 'COBOL_TO_JAVA';

  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(!isInitialCobol);
  const [screenFiles, setScreenFiles] = useState<SourceFile[]>([]);
  const [programFiles, setProgramFiles] = useState<SourceFile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Load project details and existing uploaded source screens for this project
  React.useEffect(() => {
    let cancelled = false;
    if (!isInitialCobol) {
      setProjectLoading(true);
    }

    Promise.resolve(projectService.getProjectById(projectId))
      ?.then((p) => {
        if (!cancelled) {
          setProject(p);
          if (p?.conversionType) cacheProjectConversionType(p.id, p.conversionType);
          setProjectLoading(false);
        }
      })
      ?.catch(() => {
        if (!cancelled) setProjectLoading(false);
      });

    Promise.resolve(conversionService.getScreens(projectId))
      ?.then((screens) => {
        if (cancelled || !Array.isArray(screens)) return;
        // Programs (COBOL / RPG) and screens (BMS / DSPF) live on separate tabs, so each
        // loaded item has to be filed under the tab it belongs to.
        const toSourceFile = (s: (typeof screens)[number]): SourceFile => ({
          id: s.id,
          fileName: s.name,
          sizeKb: s.sizeKb ?? 10,
          uploadedAt: s.lastUpdated ?? 'Recently',
          status: s.status, // Uses real status from API (Ready, Converted, Completed, Processing)
          inputReference: s.inputReference,
          screenId: s.id,
        });
        setScreenFiles(screens.filter((s) => !PROGRAM_TYPES.has(s.sourceType)).map(toSourceFile));
        setProgramFiles(screens.filter((s) => PROGRAM_TYPES.has(s.sourceType)).map(toSourceFile));
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, isInitialCobol]);

  const workspace = resolveWorkspace(
    project?.conversionType || (isInitialCobol ? 'COBOL_TO_JAVA' : undefined)
  );
  const isProgramProject = isInitialCobol || workspace === 'PROGRAMS';

  const activeTab = isProgramProject ? 'programs' : 'screens';
  const files = isProgramProject ? programFiles : screenFiles;
  const readyCount = files.filter((f) => f.status === 'Ready').length;

  const totalCount = files.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedFiles = files.slice(startIndex, startIndex + pageSize);

  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[] | null>(null);
  const [uploadStats, setUploadStats] = useState<{ totalScanned: number; ignored: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLabel, setUploadLabel] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const setFolderInputRef = useCallback((node: HTMLInputElement | null) => {
    folderInputRef.current = node;
    if (node) {
      node.setAttribute('webkitdirectory', '');
      node.setAttribute('directory', '');
      (node as unknown as { webkitdirectory: boolean }).webkitdirectory = true;
    }
  }, []);

  const acceptedExtensions = activeTab === 'screens'
    ? ['.bms', '.dspf', '.zip']
    : ['.cbl', '.cob', '.cpy', '.zip'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (picked.length > 0) {
      handleFiles(picked, false);
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (picked.length > 0) {
      handleFiles(picked, true);
    }
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      const extractedFiles = await extractFilesFromDataTransfer(e.dataTransfer);
      if (extractedFiles.length > 0) {
        handleFiles(extractedFiles, true);
        return;
      }
    } catch {
      // fallback
    }
    if (e.dataTransfer.files.length) {
      handleFiles(Array.from(e.dataTransfer.files), true);
    }
  };

  const failedRow = (file: File): SourceFile => ({
    id: `file-${Date.now()}-${Math.random()}`,
    fileName: file.name,
    sizeKb: Math.round(file.size / 1024),
    uploadedAt: 'Just now',
    status: 'Failed to parse',
  });

  const handleFiles = (files: File[], isFromFolderOrDrop = false) => {
    if (!files || files.length === 0) return;

    if (isFromFolderOrDrop) {
      // 1. Lọc các file theo đuôi file được hỗ trợ của dự án
      let candidateFiles = files.filter((file) =>
        acceptedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext)),
      );

      if (candidateFiles.length === 0) {
        setUploadError(
          `Không tìm thấy file nguồn hợp lệ trong ${files.length} file đã chọn. Đuôi file được chấp nhận: ${acceptedExtensions.join(', ')}. Gợi ý: Hãy chọn đúng thư mục chứa mã nguồn (ví dụ: ${isProgramProject ? 'app/cbl, app/cpy' : 'app/bms'}).`,
        );
        return;
      }

      // 2. Nếu có file nguồn dạng thường (uncompressed), bỏ qua các file .zip lồng bên trong
      const hasUncompressed = candidateFiles.some((f) => !f.name.toLowerCase().endsWith('.zip'));
      if (hasUncompressed) {
        candidateFiles = candidateFiles.filter((f) => !f.name.toLowerCase().endsWith('.zip'));
      }

      // 3. Khử trùng lặp tên file (giữ file nằm trong thư mục app/ hoặc file có dung lượng lớn hơn)
      const seenMap = new Map<string, File>();
      for (const f of candidateFiles) {
        const key = f.name.toLowerCase();
        if (seenMap.has(key)) {
          const existing = seenMap.get(key)!;
          const currentRelPath = (f as any).webkitRelativePath || '';
          const existingRelPath = (existing as any).webkitRelativePath || '';
          if (
            (currentRelPath.includes('/app/') && !existingRelPath.includes('/app/')) ||
            f.size > existing.size
          ) {
            seenMap.set(key, f);
          }
          continue;
        }
        seenMap.set(key, f);
      }
      candidateFiles = Array.from(seenMap.values());

      setUploadStats({
        totalScanned: files.length,
        ignored: Math.max(0, files.length - candidateFiles.length),
      });
      setUploadError(null);
      setPendingUploadFiles(candidateFiles);
    } else {
      setUploadStats(null);
      // Direct file selection from file input: validate extensions
      const invalidFile = files.find(
        (file) => !acceptedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext)),
      );
      if (invalidFile) {
        setUploadError(
          isProgramProject
            ? 'Cannot upload BMS/DSPF screens to a COBOL → Java project. Please create a "BMS / DSPF → React" project to convert screen files.'
            : 'Cannot upload COBOL/RPG programs to a BMS/DSPF → React project. Please create a "COBOL → Java" project to convert COBOL files.',
        );
        return;
      }

      setUploadError(null);
      void handleUploadBundle(files);
    }
  };

  const confirmPendingUpload = () => {
    if (!pendingUploadFiles || pendingUploadFiles.length === 0) return;
    const filesToUpload = pendingUploadFiles;
    setPendingUploadFiles(null);
    return handleUploadBundle(filesToUpload);
  };

  /** Real upload: the file(s) are stored by the backend and the returned inputReference is
   * what conversion jobs use — works for both single files, folders, and ZIP archives. */
  const handleUploadBundle = async (files: File[]) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    setUploadLabel(
      files.length > 1
        ? `Uploading ${files.length} files…`
        : `Uploading ${files[0].name}…`,
    );
    try {
      const result = await conversionService.uploadSource(projectId, files, setUploadProgress);
      const screenByName = new Map(result.screens.map((s) => [s.name, s]));
      const newRows: SourceFile[] = result.files.map((f) => ({
        id: `file-${Date.now()}-${Math.random()}`,
        fileName: f.name,
        sizeKb: Math.round(f.sizeBytes / 1024),
        uploadedAt: 'Just now',
        status: (screenByName.get(f.name)?.status as any) || 'Ready',
        inputReference: result.inputReference,
        screenId: screenByName.get(f.name)?.id,
      }));
      if (isProgramProject) {
        setProgramFiles((prev) => [...newRows, ...prev]);
      } else {
        setScreenFiles((prev) => [...newRows, ...prev]);
      }
    } catch (err: unknown) {
      console.error('Failed to upload source files', err);
      const message =
        (err as any)?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to upload these files.');
      setUploadError(message);
      const failedRows = files.map(failedRow);
      if (isProgramProject) {
        setProgramFiles((prev) => [...failedRows, ...prev]);
      } else {
        setScreenFiles((prev) => [...failedRows, ...prev]);
      }
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

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-xs text-slate-500 space-x-2">
        <div className="w-5 h-5 border-2 border-[#244A70] border-t-transparent rounded-full animate-spin" />
        <span>Loading project details...</span>
      </div>
    );
  }

  if (workspace === 'UNSUPPORTED' || !project) {
    return (
      <UnsupportedProjectState
        conversionType={project?.conversionType}
        backUrl={ROUTES.PROJECTS.LIST}
        backLabel="Back to Projects List"
      />
    );
  }

  const navigateToScreens = (stage: 'ANALYZE' | 'CONVERT' | 'VALIDATE' = 'ANALYZE') => {
    if (isProgramProject) {
      navigate(`${ROUTES.PROJECTS.SCREENS(projectId)}?tab=programs&stage=${stage.toLowerCase()}`, {
        state: { workspace: 'PROGRAMS', tab: 'programs', stage },
      });
    } else {
      navigate(ROUTES.PROJECTS.SCREENS(projectId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={isProgramProject ? 'Upload COBOL Source Files' : 'Upload Source File'}
        actions={
          <Button
            onClick={() => navigateToScreens('ANALYZE')}
            className="bg-[#244A70] hover:bg-[#1B3856] text-white space-x-1.5 text-xs font-bold shadow-xs cursor-pointer"
          >
            <span>Proceed to {activeTab === 'screens' ? 'Screens List' : 'Programs List'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        }
      />

      {/* Modernization Step-by-Step Workflow Bar */}
      <ModernizationWorkflow
        workflowType={workspace}
        currentStep="upload"
        completedSteps={[]}
        onStepClick={(stepId) => {
          if (isProgramProject) {
            const firstProgramId = programFiles[0]?.screenId || programFiles[0]?.id;
            if (stepId === 'upload') return;
            if (stepId === 'analyze') navigateToScreens('ANALYZE');
            if (stepId === 'convert' || stepId === 'conversion') navigateToScreens('CONVERT');
            if (stepId === 'validate' || stepId === 'validation') navigateToScreens('VALIDATE');
            if (stepId === 'review' || stepId === 'result') {
              if (firstProgramId) navigate(ROUTES.PROJECTS.RESULT(projectId, firstProgramId));
              else navigateToScreens('ANALYZE');
            }
            if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
          } else {
            const firstScreenId = screenFiles[0]?.screenId || screenFiles[0]?.id;
            if (stepId === 'upload') return;
            if (stepId === 'mapping') {
              if (firstScreenId) navigate(ROUTES.PROJECTS.MAPPING(projectId, firstScreenId));
              else navigate(ROUTES.PROJECTS.SCREENS(projectId));
            }
            if (stepId === 'conversion' || stepId === 'convert') {
              if (firstScreenId) navigate(ROUTES.PROJECTS.CONVERT(projectId, firstScreenId));
              else navigate(ROUTES.PROJECTS.SCREENS(projectId));
            }
            if (stepId === 'validation' || stepId === 'validate' || stepId === 'review') {
              if (firstScreenId) navigate(ROUTES.PROJECTS.REVIEW(projectId, firstScreenId));
              else navigate(ROUTES.PROJECTS.SCREENS(projectId));
            }
            if (stepId === 'result') {
              if (firstScreenId) navigate(ROUTES.PROJECTS.RESULT(projectId, firstScreenId));
              else navigate(ROUTES.PROJECTS.SCREENS(projectId));
            }
            if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
          }
        }}
      />

      
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-8 lg:p-12 text-center transition-all group shadow-sm"
      >
        <input
          type="file"
          id="folder-upload"
          ref={setFolderInputRef}
          onChange={handleFolderChange}
          multiple
          className="hidden"
        />
        <input
          type="file"
          id="file-upload"
          ref={fileInputRef}
          accept={
            isProgramProject
              ? '.cbl,.cob,.cpy,.zip,application/zip,application/x-zip-compressed'
              : '.bms,.dspf,.zip,application/zip,application/x-zip-compressed'
          }
          onChange={handleFileChange}
          multiple
          className="hidden"
        />
        <div className="w-16 h-16 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center mx-auto text-brand-600 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div className="mt-4">
          <span className="text-base font-bold text-slate-900 block group-hover:text-brand-600 transition-colors">
            {isProgramProject
              ? 'Upload COBOL Project Folder, Files, or ZIP Archive'
              : 'Upload BMS/DSPF Screen Maps, Folder, or ZIP Archive'}
          </span>
          <p className="text-xs text-slate-500 mt-1">
            Drag & drop your folder, files, or ZIP archive here, or select using the buttons below
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg border border-[#244A70] bg-[#244A70] hover:bg-[#1B3856] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <FolderUp className="w-4 h-4 text-white" />
              <span>{isProgramProject ? 'Select Entire COBOL Folder' : 'Select Entire BMS Folder'}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Select Files or ZIP Archive</span>
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          {isProgramProject
            ? 'Accepted: COBOL programs (.cbl, .cob), copybooks (.cpy), or a .zip archive (max 50MB/file). Subfolders and duplicates are auto-handled.'
            : 'Accepted: Screen map files (.bms, .dspf), application folder, or a .zip archive (max 50MB/file).'}
        </p>
      </div>

      {/* Upload Confirmation Modal */}
      <Modal
        isOpen={pendingUploadFiles !== null}
        onClose={() => !isUploading && setPendingUploadFiles(null)}
        title="Confirm Source Upload"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl p-4 flex items-start space-x-3.5 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-[#EEF1F6] border border-[#DCE3EC] flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5 text-[#244A70]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#17263A]">
                {pendingUploadFiles?.length === 1 && pendingUploadFiles[0].name.toLowerCase().endsWith('.zip')
                  ? `ZIP Archive Ready to Upload: ${pendingUploadFiles[0].name}`
                  : `Ready to upload ${pendingUploadFiles?.length} ${isProgramProject ? 'files (programs & copybooks)' : 'screens'}`}
              </p>
              <p className="text-xs text-[#8491A3] mt-0.5">
                Target Project: <span className="font-semibold text-[#17263A]">{project?.name}</span> ({isProgramProject ? 'COBOL → Java Modernization' : 'BMS/DSPF → React Modernization'})
              </p>
              {uploadStats && uploadStats.ignored > 0 && (
                <div className="mt-2.5 text-xs text-[#244A70] bg-[#EEF1F6] px-3 py-1.5 rounded-lg border border-[#DCE3EC] flex items-center space-x-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Auto-filtered: <strong className="text-[#17263A]">{pendingUploadFiles?.length}</strong> valid {isProgramProject ? 'COBOL' : 'BMS/DSPF'} files selected ({uploadStats.ignored} non-source assets ignored).
                  </span>
                </div>
              )}
              {pendingUploadFiles?.length === 1 && pendingUploadFiles[0].name.toLowerCase().endsWith('.zip') && (
                <p className="text-xs text-[#244A70] mt-2 font-medium bg-[#EEF1F6] p-2.5 rounded-lg border border-[#DCE3EC]">
                  {isProgramProject
                    ? 'ALSM will automatically extract this ZIP archive, flatten subfolders (e.g. cbl/ and cpy/), and index all COBOL programs and copybooks into your modernization pipeline.'
                    : 'ALSM will automatically extract this ZIP archive and index all screen map files (.bms, .dspf) into your modernization pipeline.'}
                </p>
              )}
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto border border-[#DCE3EC] rounded-xl divide-y divide-[#DCE3EC] bg-[#F8FAFC]/40">
            {pendingUploadFiles?.slice(0, 50).map((file, i) => (
              <div key={i} className="flex items-center justify-between px-3.5 py-2 text-xs hover:bg-[#EEF1F6]/50 transition-colors">
                <span className="font-mono text-[#17263A] truncate" title={(file as any).webkitRelativePath || file.name}>
                  {(file as any).webkitRelativePath || file.name}
                </span>
                <span className="text-[#8491A3] font-mono shrink-0 ml-3">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
            {(pendingUploadFiles?.length ?? 0) > 50 && (
              <div className="px-3.5 py-2 text-xs text-[#8491A3] font-semibold bg-[#EEF1F6] text-center">
                + {(pendingUploadFiles?.length ?? 0) - 50} more files
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#DCE3EC]">
            <span className="text-xs text-[#8491A3] font-medium">
              Total size: <span className="font-semibold text-[#17263A]">{pendingUploadFiles ? (pendingUploadFiles.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(1) : 0} KB</span>
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setPendingUploadFiles(null)}
                disabled={isUploading}
                className="text-xs font-semibold border-[#DCE3EC] text-[#17263A] hover:bg-[#EEF1F6]"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmPendingUpload}
                isLoading={isUploading}
                className="bg-[#244A70] hover:bg-[#1B3856] text-white text-xs font-bold space-x-1.5 shadow-xs"
              >
                <UploadCloud className="w-4 h-4" />
                <span>
                  {pendingUploadFiles?.length === 1 && pendingUploadFiles[0].name.toLowerCase().endsWith('.zip')
                    ? 'Extract & Upload Archive'
                    : `Upload ${pendingUploadFiles?.length} Files`}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </Modal>

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

      <div className="bg-white border border-[#D9E2EC] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#D9E2EC] flex justify-between items-center bg-[#F7F9FC]">
          <h3 className="text-sm font-bold text-[#091E42]">Uploaded Files ({files.length})</h3>
        </div>

        <div className="overflow-x-auto p-3 sm:p-4">
          <table className="w-full min-w-[850px] text-left text-xs table-fixed">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[12%]" />
              <col className="w-[20%]" />
              <col className="w-[14%]" />
              <col className="w-[24%]" />
            </colgroup>
            <thead className="text-slate-600 font-bold uppercase tracking-wider text-xs border-b border-[#D9E2EC]">
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
                    if (isProgramProject) {
                      navigate(ROUTES.PROJECTS.SCREENS(projectId));
                    } else if (file.screenId) {
                      navigate(ROUTES.PROJECTS.CONVERT(projectId, file.screenId));
                    }
                  }}
                  className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#091E42]">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-[#244A70] flex-shrink-0" />
                      <span className="group-hover:text-[#244A70] group-hover:underline truncate">
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
                            to={
                              isProgramProject
                                ? ROUTES.PROJECTS.METHOD_MAPPING(projectId, file.screenId)
                                : ROUTES.PROJECTS.MAPPING(projectId, file.screenId)
                            }
                            className="inline-flex items-center space-x-1 text-xs text-[#42526E] font-semibold hover:text-[#244A70] hover:bg-slate-100 px-2.5 py-1 rounded-md transition-colors"
                            title={isProgramProject ? 'Inspect Paragraph-to-Method Mapping' : 'Inspect Field Mapping'}
                          >
                            <Code2 className="w-4 h-4" />
                            <span>{isProgramProject ? 'Method Mapping' : 'Mapping'}</span>
                          </Link>

                          <Link
                            to={
                              isProgramProject
                                ? `${ROUTES.PROJECTS.SCREENS(projectId)}?tab=programs&stage=convert`
                                : ROUTES.PROJECTS.CONVERT(projectId, file.screenId)
                            }
                            state={
                              isProgramProject
                                ? { workspace: 'PROGRAMS', tab: 'programs', stage: 'CONVERT' }
                                : undefined
                            }
                            className="inline-flex items-center space-x-1 text-xs text-[#244A70] font-semibold hover:bg-slate-100 bg-[#F0F4F8] px-2.5 py-1 rounded-md border border-[#DCE3EC] transition-colors"
                            title={isProgramProject ? 'Go to Programs Modernization Pipeline' : 'Run Conversion Algorithm'}
                          >
                            <Play className="w-4 h-4" />
                            <span>Convert</span>
                          </Link>

                          <Link
                            to={ROUTES.PROJECTS.RESULT(projectId, file.screenId)}
                            className="inline-flex items-center space-x-1 text-xs text-emerald-700 font-semibold hover:bg-emerald-100 bg-emerald-50 px-2.5 py-1 rounded-md transition-colors"
                            title="View Modernized Output"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Result</span>
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => handleRemove(file.id)}
                        className="inline-flex items-center space-x-1 text-xs text-rose-600 font-semibold hover:bg-rose-100 px-2 py-1 rounded-md transition-colors"
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

      {/* Standalone Pagination Footer outside table card */}
      <div className="px-2 pt-3 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600 font-medium">
          <div className="flex items-center space-x-3">
            <span>
              Showing {totalCount === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, totalCount)} of {totalCount}{' '}
              uploaded {activeTab === 'screens' ? 'screens' : 'programs'}
            </span>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-slate-600">Per page:</span>
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
                      ? 'bg-[#244A70] text-white shadow-2xs'
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
        <Button variant="secondary" onClick={() => navigateToScreens('ANALYZE')}>
          Save for Later
        </Button>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            className="space-x-1.5 cursor-pointer font-semibold"
            onClick={() => fileInputRef.current?.click()}
          >
            <FolderPlus className="w-4 h-4 text-slate-600" />
            <span>Add More Files</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="space-x-1.5 cursor-pointer font-semibold"
            onClick={() => folderInputRef.current?.click()}
          >
            <FolderUp className="w-4 h-4 text-slate-600" />
            <span>Add Folder</span>
          </Button>
          <Button onClick={() => navigateToScreens(isProgramProject ? 'ANALYZE' : 'CONVERT')} className="space-x-2 font-semibold">
            <span>{isProgramProject ? 'Proceed to Programs Workspace' : 'Proceed to Conversion'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
export default UploadSourcePage;

