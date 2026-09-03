import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Download, RefreshCw, CheckCircle2, Shield, Sliders, AlertCircle, Eye } from 'lucide-react';
import { conversionService } from '../services/conversion.service';
import type { ConversionResult } from '../types/conversion';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { Breadcrumb } from '@/shared/navigation/Breadcrumb';
import { Tabs } from '@/shared/ui/Tabs';
import { Button } from '@/shared/ui/Button';
import { CodeViewer } from '../components/CodeViewer';

export const ConvertScreenPage: React.FC = () => {
  const { projectId = 'proj-acme', screenId = 'scr-login' } = useParams();
  const navigate = useNavigate();

  const [screen, setScreen] = useState<LegacyScreen | null>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    conversionService.getScreenById(screenId).then((data) => {
      if (cancelled) return;
      setScreen(data);
      if (data?.status === 'Completed') {
        conversionService.convertScreen(screenId).then((res) => {
          if (!cancelled) setResult(res);
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [screenId]);

  const screenName = screen?.name ?? screenId;

  const handleRunConverter = async () => {
    setIsRunning(true);
    try {
      const res = await conversionService.convertScreen(screenId);
      setResult(res);
    } finally {
      setIsRunning(false);
    }
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
          <p className="text-xs text-slate-500 mt-1">Convert legacy BMS map set into clean React TypeScript frontend component.</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={() => navigate(ROUTES.PROJECTS.EXPORT(projectId))} className="space-x-1.5 text-xs font-semibold">
            <Download className="w-4 h-4" />
            <span>Export Code</span>
          </Button>
          <Button onClick={handleRunConverter} isLoading={isRunning} className="space-x-2 text-xs font-semibold">
            <Play className="w-4 h-4" />
            <span>Run Converter</span>
          </Button>
        </div>
      </div>

      {result && (
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

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-center">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Fields Processed</p>
              <p className="text-lg font-bold text-brand-600">{result.metrics.fieldsProcessed}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Components Generated</p>
              <p className="text-lg font-bold text-brand-600">{result.metrics.componentsGenerated}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Lines of Code</p>
              <p className="text-lg font-bold text-slate-900">{result.metrics.linesOfCode}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Size</p>
              <p className="text-lg font-bold text-[#DC6803]">{result.metrics.sizeKb} KB</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Duration</p>
              <p className="text-lg font-bold text-[#079455]">{result.metrics.duration}</p>
            </div>
          </div>
        </div>
      )}

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
        result ? (
          <CodeViewer code={result.generatedCode} filename={screenName.replace(/\.(bms|dspf)$/i, '.tsx')} />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500 shadow-sm">
            Run the converter to generate React code for this screen.
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
          <h3 className="text-sm font-bold text-slate-900">Parser Findings & Observations</h3>
          <div className="bg-[#FFFAEB] border border-[#FEDF89] p-4 rounded-xl text-[#DC6803] text-xs flex items-center space-x-3 font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>Found 1 legacy macro reference (@CUSTOM_MACRO_X) resolved cleanly using standard fallback.</span>
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
          <Button onClick={() => alert('Downloading code bundle .zip...')} className="space-x-1.5 text-xs font-semibold">
            <Download className="w-3.5 h-3.5" />
            <span>Download Code (.zip)</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ConvertScreenPage;
