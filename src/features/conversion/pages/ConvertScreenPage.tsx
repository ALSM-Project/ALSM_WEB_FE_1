import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Download, RefreshCw, CheckCircle2, Shield, Sliders, AlertCircle, FileSearch, Eye, XCircle } from 'lucide-react';
import { conversionService } from '../services/conversion.service';
import { useConversionJob } from '../queries/useConversionJob';
import { useCreateConversionJob } from '../queries/useCreateConversionJob';
import { useConversionResult } from '../queries/useConversionResult';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { Breadcrumb } from '@/shared/navigation/Breadcrumb';
import { Tabs } from '@/shared/ui/Tabs';
import { Button } from '@/shared/ui/Button';
import { CodeViewer } from '../components/CodeViewer';

const ACTIVE_STATUSES = ['QUEUED', 'PROCESSING'];

export const ConvertScreenPage: React.FC = () => {
  const { projectId = 'proj-acme', screenId = 'scr-login' } = useParams();
  const navigate = useNavigate();

  const [screen, setScreen] = useState<LegacyScreen | null>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    conversionService.getScreenById(screenId).then((data) => {
      if (!cancelled) setScreen(data);
    });
    return () => {
      cancelled = true;
    };
  }, [screenId]);

  const { data: job } = useConversionJob(projectId, screenId);
  const createJob = useCreateConversionJob(projectId, screenId);
  const isCompleted = job?.status === 'COMPLETED';
  const isRunning = createJob.isPending || (job ? ACTIVE_STATUSES.includes(job.status) : false);
  const { data: resultBundle } = useConversionResult(job?.id, isCompleted);

  const screenName = screen?.name ?? screenId;
  const files = useMemo(() => resultBundle?.files ?? [], [resultBundle]);
  const selectedFile = files[selectedFileIndex] ?? files[0] ?? null;

  const metrics = useMemo(() => {
    if (!files.length) return null;
    const totalLoc = files.reduce((sum, f) => sum + f.content.split('\n').length, 0);
    const sizeKb = Math.round(files.reduce((sum, f) => sum + f.content.length, 0) / 1024);
    const durationMs =
      job?.startedAt && job?.completedAt
        ? new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
        : null;
    return {
      componentsGenerated: files.length,
      linesOfCode: totalLoc,
      sizeKb,
      duration: durationMs !== null ? `${(durationMs / 1000).toFixed(1)}s` : '—',
    };
  }, [files, job]);

  const handleRunConverter = () => {
    createJob.mutate({ inputReference: screen?.inputReference });
  };

  return (
    <div className="space-y-6 py-2">
      <Breadcrumb
        items={[
          { label: 'Projects', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'Acme Corp Modernization', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'Screens', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: screenName },
        ]}
      />

      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 font-mono">{screenName}</h1>
            <span className="bg-brand-50 text-brand-700 border border-brand-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              Target: {screen?.framework ?? 'React'} TypeScript
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Algorithm-based Conversion of legacy BMS maps into modular React TypeScript components.</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => navigate(ROUTES.PROJECTS.REVIEW(projectId, screenId))} className="space-x-1.5 text-xs font-semibold">
            <FileSearch className="w-4 h-4 text-brand-600" />
            <span>Review Findings</span>
          </Button>
          <Button variant="secondary" onClick={() => navigate(ROUTES.PROJECTS.EXPORT(projectId))} className="space-x-1.5 text-xs font-semibold">
            <Download className="w-4 h-4" />
            <span>Export Code</span>
          </Button>
          <Button onClick={handleRunConverter} isLoading={isRunning} className="space-x-2 text-xs font-semibold">
            <Play className="w-4 h-4" />
            <span>Run Conversion Algorithm</span>
          </Button>
        </div>
      </div>

      {job?.status === 'FAILED' || job?.status === 'DEAD' ? (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 text-xs font-medium flex items-start space-x-3">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Conversion failed{job.errorCode ? ` (${job.errorCode})` : ''}.</p>
            <p className="mt-0.5">{job.errorMessage ?? 'The conversion tool could not process this screen. Check Review Findings for details.'}</p>
          </div>
        </div>
      ) : isCompleted ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center space-x-2 text-[#079455] font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-[#079455]" />
              <span>Conversion Complete! Your screen has been successfully converted to React.</span>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.PROJECTS.RESULT(projectId, screenId))}
              className="space-x-1.5 text-xs font-semibold"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Full Result</span>
            </Button>
          </div>

          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-[11px] text-slate-500 uppercase font-semibold">Files Generated</p>
                <p className="text-lg font-bold text-brand-600">{metrics.componentsGenerated}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-[11px] text-slate-500 uppercase font-semibold">Lines of Code</p>
                <p className="text-lg font-bold text-slate-900">{metrics.linesOfCode}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-[11px] text-slate-500 uppercase font-semibold">Size</p>
                <p className="text-lg font-bold text-[#DC6803]">{metrics.sizeKb} KB</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-[11px] text-slate-500 uppercase font-semibold">Duration</p>
                <p className="text-lg font-bold text-[#079455]">{metrics.duration}</p>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <Tabs
        tabs={[
          { id: 'preview', label: 'Preview' },
          { id: 'code', label: 'Code' },
          { id: 'mapping', label: 'Field Mapping' },
          { id: 'findings', label: 'Findings' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'preview' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-400"></span>
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            </div>
            <div className="bg-white px-4 py-1 rounded-md border border-slate-200 text-slate-600 text-center w-80 truncate font-mono">
              http://localhost:3000/login
            </div>
            <button
              onClick={() => navigate(ROUTES.PROJECTS.PREVIEW(projectId, screenId))}
              className="text-xs text-brand-600 font-semibold hover:underline"
            >
              Open Preview Studio
            </button>
          </div>

          <div className="p-8 md:p-12 flex justify-center bg-slate-100 min-h-[400px]">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-md space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">ACME CORP</h3>
                  <p className="text-xs text-slate-500">Sign in to your enterprise workspace</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    defaultValue="admin@acmecorp.com"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Password</label>
                  <input
                    type="password"
                    defaultValue="••••••••••••"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 shadow-xs"
                  />
                </div>
                <button className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-xs">
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'code' && (
        selectedFile ? (
          <div className="space-y-3">
            {files.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <button
                    key={file.relativePath}
                    onClick={() => setSelectedFileIndex(index)}
                    className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${
                      index === selectedFileIndex
                        ? 'bg-brand-50 border-brand-300 text-brand-700 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {file.relativePath}
                  </button>
                ))}
              </div>
            )}
            <CodeViewer code={selectedFile.content} filename={selectedFile.relativePath} />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500 shadow-sm">
            {isRunning
              ? 'Conversion in progress…'
              : job?.status === 'FAILED' || job?.status === 'DEAD'
                ? 'Conversion failed — no code was generated. See the error above.'
                : 'Run the converter to generate code for this screen.'}
          </div>
        )
      )}

      {activeTab === 'mapping' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Synthesized Field Mappings</h3>
            <Link to={ROUTES.PROJECTS.MAPPING(projectId, screenId)} className="text-xs text-brand-600 hover:underline flex items-center space-x-1 font-semibold">
              <Sliders className="w-4 h-4" />
              <span>Open Field Editor</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <p className="text-brand-700 font-bold">USER-ID-INPUT (BMS Pos R10 C15)</p>
              <p className="text-slate-600">&rarr; Mapped to: &lt;TextField label="Username" /&gt;</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <p className="text-brand-700 font-bold">PASS-KEY-ATTR (BMS Pos R12 C15)</p>
              <p className="text-slate-600">&rarr; Mapped to: &lt;PasswordInput label="Password" /&gt;</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'findings' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Parser Findings & Observations</h3>
            <Link
              to={ROUTES.PROJECTS.REVIEW(projectId, screenId)}
              className="text-xs text-brand-600 font-semibold hover:underline flex items-center space-x-1"
            >
              <FileSearch className="w-4 h-4 text-brand-600" />
              <span>Open Full Findings Review Studio &rarr;</span>
            </Link>
          </div>
          <div className="bg-[#FFFAEB] border border-[#FEDF89] p-4 rounded-xl text-[#DC6803] text-xs flex items-center space-x-3 font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>Found 7 legacy macro findings needing review. 3 of 7 reviewed.</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
        <Button variant="secondary" className="text-xs font-semibold">
          Save as Template
        </Button>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => navigate(ROUTES.PROJECTS.MAPPING(projectId, screenId))} className="space-x-1.5 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Edit & Re-convert</span>
          </Button>
          <Button
            onClick={() => navigate(ROUTES.PROJECTS.EXPORT(projectId))}
            disabled={!isCompleted}
            className="space-x-1.5 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Code (.zip)</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ConvertScreenPage;
