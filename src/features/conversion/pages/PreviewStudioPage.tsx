import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, RefreshCcw } from 'lucide-react';
import { conversionService } from '../services/conversion.service';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { DeviceSwitcher } from '../components/DeviceSwitcher';
import type { DeviceMode } from '../components/DeviceSwitcher';
import { Button } from '@/shared/ui/Button';
import { useConversionJob } from '../queries/useConversionJob';
import { useConversionResult } from '../queries/useConversionResult';
import { generateScreenBundle, parseConvertedTsx } from '../utils/screenGenerator';

export const PreviewStudioPage: React.FC = () => {
  const { projectId = 'proj-acme', screenId = 'scr-login' } = useParams();
  const navigate = useNavigate();
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [zoom] = useState(100);
  const [screen, setScreen] = useState<LegacyScreen | null>(null);

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
  const isCompleted = job?.status === 'COMPLETED';
  const { data: resultBundle } = useConversionResult(job?.id, isCompleted);

  const screenName = screen?.name ?? screenId;
  const fallbackBundle = useMemo(() => generateScreenBundle(screenName), [screenName]);

  const screenBundle = useMemo(() => {
    const tsxFile = resultBundle?.files?.find((f) => f.relativePath.endsWith('.tsx')) ?? resultBundle?.files?.[0];
    if (tsxFile?.content) {
      return parseConvertedTsx(tsxFile.content, screenName);
    }
    return fallbackBundle;
  }, [resultBundle, screenName, fallbackBundle]);

  const previewTitle = screenName.replace(/\.(bms|dspf)$/i, '.tsx');

  const containerWidths = {
    desktop: 'w-full max-w-5xl',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]',
  };

  return (
    <div className="space-y-6">

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-slate-900 font-mono">Preview: {previewTitle}</h1>
          <span className="bg-[#FFFAEB] text-[#DC6803] border border-[#FEDF89] text-xs font-semibold px-2 py-0.5 rounded uppercase">
            Draft
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <DeviceSwitcher mode={deviceMode} onChange={setDeviceMode} />
          <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200">
            {zoom}% Zoom
          </span>
        </div>
      </div>

      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-6 flex justify-center items-center overflow-auto min-h-[550px] shadow-inner">
        <div className={`transition-all duration-300 ${containerWidths[deviceMode]} bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-xl flex flex-col`}>
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-sans">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-400"></span>
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            </div>
            <div className="bg-white px-4 py-1 rounded-md border border-slate-200 text-slate-600 text-center flex-1 mx-8 truncate font-mono">
              http://localhost:3000/{screenName.toLowerCase().replace(/\.(bms|dspf|cob|cbl)$/i, '')}
            </div>
            <button className="text-slate-400 hover:text-slate-700">
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-8 sm:p-12 bg-slate-50 flex flex-col items-center justify-center min-h-[420px]">
            <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-md space-y-6">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#0652CC] flex items-center justify-center text-white font-bold shadow-xs">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-mono tracking-tight">{screenBundle.title}</h2>
                  <p className="text-xs text-slate-500">{screenBundle.subtitle}</p>
                </div>
              </div>

              {screenBundle.fields.length > 0 ? (
                <form onSubmit={(e) => e.preventDefault()} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {screenBundle.fields.map((f) => (
                      <div key={f.name} className={f.fullWidth ? 'md:col-span-2' : ''}>
                        <label className="block text-slate-700 font-semibold mb-1">{f.label}</label>
                        {f.type === 'select' ? (
                          <select defaultValue={f.defaultValue} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 shadow-xs font-semibold">
                            {(f.options || []).map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={f.type || 'text'}
                            defaultValue={f.defaultValue}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-900 shadow-xs"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#0652CC] hover:bg-[#0655FF] text-white font-semibold rounded-lg shadow-xs transition-all"
                    >
                      Submit Form
                    </button>
                    <button
                      type="button"
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg shadow-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs font-mono bg-slate-50 rounded-xl border border-slate-200">
                  Pure Modernized React Component Generated (No static mock fields).
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 font-mono mt-6">
              ALSM Modernization Preview • Generated deterministically
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button onClick={() => navigate(ROUTES.PROJECTS.CONVERT(projectId, screenId))} className="space-x-1.5 text-xs font-semibold">
          <span>Back to Conversion Studio</span>
        </Button>
      </div>
    </div>
  );
};
export default PreviewStudioPage;
