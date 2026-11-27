import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Download,
  Package,
  Layers,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { conversionService } from '../services/conversion.service';
import { exportService } from '../services/export.service';
import { projectService } from '@/features/projects/services/project.service';
import { ModernizationWorkflow } from '@/shared/ui/ModernizationWorkflow';
import { isCobolProjectSync } from '@/shared/utils/projectCache';
import { resolveWorkspace } from '@/features/projects/utils/conversionTypeResolver';
import type { LegacyScreen } from '@/features/screens/types/screen';
import type { Project } from '@/features/projects/types/project';
import type {
  ExportConfiguration,
  ExportFileItem,
  ExportOutputOption,
  FrameworkTarget,
  BundleMetrics,
} from '../types/export';
import { ExportScreenSelector } from '../components/ExportScreenSelector';
import { ExportFileTree } from '../components/ExportFileTree';
import { ExportProgressModal } from '../components/ExportProgressModal';

import { EnsureQueryClient } from '@/shared/ui/EnsureQueryClient';

const ExportCodeContent: React.FC = () => {
  const { projectId = 'proj-acme' } = useParams();
  const navigate = useNavigate();

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [screens, setScreens] = useState<LegacyScreen[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isCobolInit = isCobolProjectSync(projectId);
  const isCobol = Boolean(
    isCobolInit ||
    project?.conversionType === 'COBOL_TO_JAVA' ||
    resolveWorkspace(project?.conversionType) === 'PROGRAMS' ||
    project?.name?.toLowerCase().includes('cobol') ||
    screens.some((s) => s.sourceType === 'COBOL' || s.name?.toLowerCase().endsWith('.cbl'))
  );

  // Configuration options
  const [outputOption, setOutputOption] = useState<ExportOutputOption>('scaffold');
  const [frameworkTarget, setFrameworkTarget] = useState<FrameworkTarget>(
    isCobolInit ? 'java-17' : 'react-19'
  );
  const [includeTypeScriptStrict, setIncludeTypeScriptStrict] = useState(true);
  const [includeUnitTests, setIncludeUnitTests] = useState(true);
  const [includeDocumentation, setIncludeDocumentation] = useState(true);
  const [selectedScreenIds, setSelectedScreenIds] = useState<string[]>([]);

  // Generation / Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState('Initializing bundle...');
  const [isComplete, setIsComplete] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  // Load project & screens
  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const [projData, screensData] = await Promise.all([
          projectService.getProjectById(projectId),
          conversionService.getScreens(projectId),
        ]);
        if (mounted) {
          setProject(projData);
          setScreens(screensData);
          const isCobolDetected = Boolean(
            isCobolProjectSync(projectId) ||
            projData?.conversionType === 'COBOL_TO_JAVA' ||
            resolveWorkspace(projData?.conversionType) === 'PROGRAMS' ||
            projData?.name?.toLowerCase().includes('cobol') ||
            screensData.some((s) => s.sourceType === 'COBOL' || s.name?.toLowerCase().endsWith('.cbl'))
          );
          if (isCobolDetected) {
            setFrameworkTarget('java-17');
          }
          // Default select all completed screens
          const completedIds = screensData
            .filter((s) => s.status?.toLowerCase() === 'completed')
            .map((s) => s.id);
          setSelectedScreenIds(
            completedIds.length > 0 ? completedIds : screensData.map((s) => s.id)
          );
        }
      } catch (err) {
        console.error('Failed to load project export data', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  // Current export configuration
  const exportConfig: ExportConfiguration = useMemo(() => {
    return {
      projectId,
      projectName: project?.name || 'Acme Modernization',
      outputOption,
      frameworkTarget,
      stylingOption: 'tailwind',
      includeTypeScriptStrict,
      includeUnitTests,
      includeStorybook: outputOption === 'storybook',
      includeDocumentation,
      selectedScreenIds,
    };
  }, [
    projectId,
    project?.name,
    outputOption,
    frameworkTarget,
    includeTypeScriptStrict,
    includeUnitTests,
    includeDocumentation,
    selectedScreenIds,
  ]);

  // File tree preview and metrics come from the real backend (real generated code for
  // any screen with a completed conversion job) — exportService falls back to a local
  // mock only if the API call itself fails (offline/unreachable backend).
  const [fileTree, setFileTree] = useState<ExportFileItem[]>([]);
  const [metrics, setMetrics] = useState<BundleMetrics>({
    totalFiles: 0,
    totalLoc: 0,
    estimatedSizeKb: 0,
    selectedScreensCount: 0,
  });
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    if (selectedScreenIds.length === 0) {
      setFileTree([]);
      setMetrics({ totalFiles: 0, totalLoc: 0, estimatedSizeKb: 0, selectedScreensCount: 0 });
      return;
    }
    let cancelled = false;
    setIsPreviewLoading(true);
    exportService
      .fetchExportPreviewFromApi(exportConfig)
      .then((preview) => {
        if (cancelled) return;
        setFileTree(preview.fileTree);
        setMetrics(preview.metrics);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Failed to load export preview from API, falling back to client-side preview:', err);
        const fallbackTree = exportService.generateFileTreePreview(exportConfig, screens);
        const fallbackMetrics = exportService.calculateMetrics(exportConfig, screens);
        setFileTree(fallbackTree);
        setMetrics(fallbackMetrics);
      })
      .finally(() => {
        if (!cancelled) setIsPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportConfig]);

  const bundleFilename = useMemo(() => {
    const slug = (project?.name || 'alsm')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    return `${slug}-${outputOption}-bundle.zip`;
  }, [project?.name, outputOption]);

  // Screen selection toggles
  const handleToggleScreen = (screenId: string) => {
    setSelectedScreenIds((prev) =>
      prev.includes(screenId)
        ? prev.filter((id) => id !== screenId)
        : [...prev, screenId]
    );
  };

  const handleSelectAllConverted = () => {
    const completedIds = screens
      .filter((s) => s.status === 'Completed')
      .map((s) => s.id);
    setSelectedScreenIds(completedIds);
  };

  const handleDeselectAll = () => {
    setSelectedScreenIds([]);
  };

  // Start export bundle generation
  const handleStartExport = async () => {
    if (selectedScreenIds.length === 0) return;

    setIsExportModalOpen(true);
    setExportProgress(10);
    setStepLabel(
      isCobol
        ? 'Validating export eligibility & COBOL programs...'
        : 'Validating export eligibility & screens...'
    );
    setIsComplete(false);
    setExportError(null);

    try {
      const blob = await exportService.downloadZipBundleFromApi(exportConfig, (percent, label) => {
        setExportProgress(percent);
        setStepLabel(label);
      });

      setGeneratedBlob(blob);
      setIsComplete(true);
      // Trigger instant browser download
      exportService.downloadBlob(blob, bundleFilename);
    } catch (err) {
      setExportError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while compiling your package.'
      );
    }
  };

  const handleDownloadAgain = () => {
    if (generatedBlob) {
      exportService.downloadBlob(generatedBlob, bundleFilename);
    }
  };

  const handleCloseModal = () => {
    setIsExportModalOpen(false);
  };

  const handleCancel = () => {
    navigate(ROUTES.PROJECTS.SCREENS(projectId));
  };

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-500 font-medium">
          Loading project export settings...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <ModernizationWorkflow
        workflowType={isCobol ? 'PROGRAMS' : 'SCREENS'}
        currentStep="export"
        completedSteps={
          isCobol
            ? ['upload', 'analyze', 'convert', 'validate', 'review']
            : ['upload', 'conversion', 'validation', 'result']
        }
        onStepClick={(stepId: string) => {
          if (isCobol) {
            if (stepId === 'upload') navigate(`${ROUTES.PROJECTS.UPLOAD(projectId)}?tab=programs`);
            if (stepId === 'analyze') navigate(`${ROUTES.PROJECTS.SCREENS(projectId)}?stage=analyze`);
            if (stepId === 'convert') navigate(`${ROUTES.PROJECTS.SCREENS(projectId)}?stage=convert`);
            if (stepId === 'validate') navigate(`${ROUTES.PROJECTS.SCREENS(projectId)}?stage=validate`);
            if (stepId === 'review' || stepId === 'result') navigate(ROUTES.PROJECTS.SCREENS(projectId));
            if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
          } else {
            if (stepId === 'upload') navigate(ROUTES.PROJECTS.UPLOAD(projectId));
            if (stepId === 'conversion') navigate(ROUTES.PROJECTS.SCREENS(projectId));
            if (stepId === 'result') navigate(ROUTES.PROJECTS.SCREENS(projectId));
            if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
          }
        }}
      />

      {/* Page Header (ALSM Design System) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Export Code Package
            </h1>
            <Badge variant="success" className="space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Ready to Export</span>
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isCobol
              ? 'Package and download modernized Java Spring Boot source code and batch job components, with turnkey Maven application scaffolding.'
              : 'Package and download modernized React components (from BMS/DSPF screens) or generated Java source (from COBOL programs), with optional application scaffolding.'}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartExport}
            disabled={selectedScreenIds.length === 0}
            className="space-x-1.5 text-xs font-semibold"
          >
            <Download className="w-4 h-4" />
            <span>Generate & Download Bundle</span>
          </Button>
        </div>
      </div>

      {/* Main Studio Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Configuration & Screen Selector) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Output Option Cards */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. SELECT OUTPUT FORMAT
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose the architecture format that fits your engineering workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Option: Scaffold */}
              <div
                onClick={() => setOutputOption('scaffold')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  outputOption === 'scaffold'
                    ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        outputOption === 'scaffold'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {isCobol ? 'Full Maven / Spring Boot Scaffold' : 'Full Project Scaffold'}
                        </h3>
                        <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {isCobol
                          ? 'Turnkey Spring Boot application with Maven (pom.xml), Spring Batch, job configurations, models, and tasklets ready to build with mvn clean package.'
                          : 'Turnkey application with Vite, React 19/18, TypeScript, Tailwind CSS, routing, and all converted screens ready to run locally.'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="outputFormat"
                    checked={outputOption === 'scaffold'}
                    onChange={() => setOutputOption('scaffold')}
                    className="text-blue-600 mt-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Option: Standalone Components */}
              <div
                onClick={() => setOutputOption('standalone')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  outputOption === 'standalone'
                    ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        outputOption === 'standalone'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {isCobol ? 'Standalone Java Classes & Models' : 'Standalone Component Files'}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        {isCobol
                          ? 'Clean, isolated Java source files (Jobs, Tasklets, Models) in package hierarchy ready to copy directly into an existing repository or monorepo.'
                          : 'Clean, isolated TSX component files and index barrel. Perfect for copying directly into an existing repository or monorepo.'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="outputFormat"
                    checked={outputOption === 'standalone'}
                    onChange={() => setOutputOption('standalone')}
                    className="text-blue-600 mt-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Option: Storybook / Modular Suite */}
              <div
                onClick={() => setOutputOption('storybook')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  outputOption === 'storybook'
                    ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        outputOption === 'storybook'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {isCobol ? 'Modular Spring Batch Job Suite' : 'Storybook Design System'}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        {isCobol
                          ? 'Modular Spring Batch jobs with database configuration, job execution listeners, and execution properties.'
                          : 'Component library packaged with Storybook configuration, sample interactive stories, and design tokens documentation.'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="outputFormat"
                    checked={outputOption === 'storybook'}
                    onChange={() => setOutputOption('storybook')}
                    className="text-blue-600 mt-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Framework Target & Customization Options */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {isCobol ? '2. JAVA RUNTIME & FRAMEWORK SETTINGS' : '2. FRAMEWORK & TARGET SETTINGS'}
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                {isCobol
                  ? 'Specify target Java SDK version, Spring Boot release, and build tooling.'
                  : 'Specify compiler targets, test runners, and developer tooling.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-slate-700">
                  {isCobol ? 'Target Java Version' : 'Target Framework Version'}
                </span>
                {isCobol ? (
                  <select
                    value={frameworkTarget}
                    onChange={(e) => setFrameworkTarget(e.target.value as FrameworkTarget)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="java-17">Java 17 (LTS - Recommended)</option>
                    <option value="java-21">Java 21 (Modern LTS)</option>
                    <option value="java-11">Java 11 (Legacy LTS)</option>
                    <option value="java-8">Java 8 (Legacy Enterprise)</option>
                  </select>
                ) : (
                  <select
                    value={frameworkTarget}
                    onChange={(e) => setFrameworkTarget(e.target.value as FrameworkTarget)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="react-19">React 19.x (Modern with Compiler)</option>
                    <option value="react-18">React 18.2.0 (Stable LTS)</option>
                  </select>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-slate-700">
                  {isCobol ? 'Build & Framework Tooling' : 'CSS Styling Architecture'}
                </span>
                <input
                  type="text"
                  disabled
                  value={
                    isCobol
                      ? frameworkTarget === 'java-8' || frameworkTarget === 'java-11'
                        ? 'Spring Boot 2.7.18 + Maven pom.xml (LTS)'
                        : 'Spring Boot 3.3.5 + Maven pom.xml (Spring Batch 5)'
                      : 'Tailwind CSS 3.4 (Pre-configured)'
                  }
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            {/* Additional Features Toggle */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              {isCobol ? (
                <>
                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs select-none">
                    <input
                      type="checkbox"
                      checked={includeUnitTests}
                      onChange={(e) => setIncludeUnitTests(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-800 font-medium">
                      Include automated JUnit 5 / Spring Batch unit tests (*Test.java with Mockito)
                    </span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs select-none">
                    <input
                      type="checkbox"
                      checked={includeTypeScriptStrict}
                      onChange={(e) => setIncludeTypeScriptStrict(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-800 font-medium">
                      Include Maven build wrapper scripts (`mvnw`, `mvnw.cmd`, `.mvn/wrapper`)
                    </span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs select-none">
                    <input
                      type="checkbox"
                      checked={includeDocumentation}
                      onChange={(e) => setIncludeDocumentation(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-800 font-medium">
                      Include Quickstart & Architecture documentation (`README.md`, setup guide)
                    </span>
                  </label>
                </>
              ) : (
                <>
                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs select-none">
                    <input
                      type="checkbox"
                      checked={includeTypeScriptStrict}
                      onChange={(e) => setIncludeTypeScriptStrict(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-800 font-medium">
                      TypeScript strict type-checking (`tsconfig.json` strict mode)
                    </span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs select-none">
                    <input
                      type="checkbox"
                      checked={includeUnitTests}
                      onChange={(e) => setIncludeUnitTests(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-800 font-medium">
                      Include automated unit tests (`*.test.tsx` with Vitest & RTL)
                    </span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs select-none">
                    <input
                      type="checkbox"
                      checked={includeDocumentation}
                      onChange={(e) => setIncludeDocumentation(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-800 font-medium">
                      Include Quickstart documentation (`README.md`)
                    </span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Included Screens Checklist */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <ExportScreenSelector
              screens={screens}
              selectedScreenIds={selectedScreenIds}
              onToggleScreen={handleToggleScreen}
              onSelectAllConverted={handleSelectAllConverted}
              onDeselectAll={handleDeselectAll}
              isCobol={isCobol}
            />
          </div>
        </div>

        {/* Right Column (Live File Tree Preview & Bundle Summary) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Bundle Metrics Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                PACKAGE OVERVIEW
              </label>
              <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Eligibility Verified</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <p className="text-[10px] uppercase font-bold text-slate-500">
                  {isCobol ? 'Programs' : 'Screens'}
                </p>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {metrics.selectedScreensCount}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <p className="text-[10px] uppercase font-bold text-slate-500">
                  Generated LOC
                </p>
                <p className="text-lg font-extrabold text-blue-600 font-mono mt-0.5">
                  {metrics.totalLoc}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <p className="text-[10px] uppercase font-bold text-slate-500">
                  Est. Size
                </p>
                <p className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
                  {metrics.estimatedSizeKb > 1024
                    ? `${(metrics.estimatedSizeKb / 1024).toFixed(1)} MB`
                    : `${metrics.estimatedSizeKb} KB`}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span>Total Generated Files:</span>
                <strong className="text-slate-800 font-mono">
                  {metrics.totalFiles} files
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Output Format:</span>
                <strong className="text-slate-800 capitalize">
                  {isCobol
                    ? outputOption === 'scaffold'
                      ? 'Maven Spring Boot Scaffold'
                      : outputOption === 'standalone'
                      ? 'Standalone Java Classes'
                      : 'Spring Batch Suite'
                    : outputOption}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Runtime Target:</span>
                <strong className="text-slate-800">
                  {isCobol
                    ? frameworkTarget === 'java-21'
                      ? 'Java 21 + Spring Boot 3.3 (Maven)'
                      : frameworkTarget === 'java-11'
                      ? 'Java 11 + Spring Boot 2.7 (Maven)'
                      : frameworkTarget === 'java-8'
                      ? 'Java 8 + Spring Boot 2.7 (Maven)'
                      : 'Java 17 + Spring Boot 3.3 (Maven)'
                    : frameworkTarget === 'react-19'
                    ? 'React 19'
                    : 'React 18'}
                </strong>
              </div>
            </div>
          </div>

          {/* Interactive File Tree */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            {isPreviewLoading ? (
              <p className="text-xs text-slate-500 py-4 text-center">Loading real conversion output…</p>
            ) : (
              <ExportFileTree
                files={fileTree}
                projectName={project?.name || 'ALSM'}
              />
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar (matching the design system shown in Image 2) */}
      <div style={{ left: 'var(--sidebar-width, 15rem)' }} className="fixed bottom-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 py-3.5 px-6 lg:px-8 shadow-lg transition-[left] duration-300">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>
              <strong>{metrics.selectedScreensCount}</strong>{' '}
              {isCobol ? 'programs' : 'screens'} selected •{' '}
              <strong>{metrics.totalFiles}</strong> files in bundle • Est. size:{' '}
              <strong className="font-mono text-slate-800">
                {metrics.estimatedSizeKb > 1024
                  ? `${(metrics.estimatedSizeKb / 1024).toFixed(1)} MB`
                  : `${metrics.estimatedSizeKb} KB`}
              </strong>
            </span>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="text-xs font-semibold px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartExport}
              disabled={selectedScreenIds.length === 0}
              className="space-x-1.5 text-xs font-semibold px-5"
            >
              <Download className="w-4 h-4" />
              <span>Generate & Download Bundle</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Export Progress / Success Modal */}
      <ExportProgressModal
        isOpen={isExportModalOpen}
        progressPercent={exportProgress}
        currentStepLabel={stepLabel}
        isComplete={isComplete}
        error={exportError}
        bundleFilename={bundleFilename}
        bundleSizeKb={metrics.estimatedSizeKb}
        screensCount={metrics.selectedScreensCount}
        onDownloadAgain={handleDownloadAgain}
        onClose={handleCloseModal}
        onBackToWorkspace={() => navigate(ROUTES.PROJECTS.SCREENS(projectId))}
        onRetry={handleStartExport}
        isCobol={isCobol}
      />
    </div>
  );
};

export const ExportCodePage: React.FC = () => (
  <EnsureQueryClient>
    <ExportCodeContent />
  </EnsureQueryClient>
);

export default ExportCodePage;
