import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, RefreshCcw } from 'lucide-react';
import { conversionService } from '../services/conversion.service';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { Breadcrumb } from '@/shared/navigation/Breadcrumb';
import { DeviceSwitcher } from '../components/DeviceSwitcher';
import type { DeviceMode } from '../components/DeviceSwitcher';
import { Button } from '@/shared/ui/Button';

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

  const previewTitle = screen ? screen.name.replace(/\.(bms|dspf)$/i, '.tsx') : screenId;

  const containerWidths = {
    desktop: 'w-full max-w-5xl',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]',
  };

  return (
    <div className="space-y-6 py-2">
      <Breadcrumb
        items={[
          { label: 'Projects', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'Acme Corp Modernization', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'Screens', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'UI Preview Studio' },
        ]}
      />

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
              http://localhost:3000/login
            </div>
            <button className="text-slate-400 hover:text-slate-700">
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-8 sm:p-12 bg-slate-50 flex flex-col items-center justify-center min-h-[420px]">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold shadow-xs">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">ACME CORP</h2>
                  <p className="text-xs text-slate-500">Sign in to your enterprise workspace</p>
                </div>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      defaultValue="admin@acmecorp.com"
                      className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-slate-700 font-semibold">Password</label>
                    <a href="#" className="text-brand-600 font-semibold hover:underline">Forgot password?</a>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      defaultValue="••••••••••••"
                      className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600 shadow-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-xs flex items-center justify-center space-x-2 text-sm transition-all"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500 flex justify-between">
                <span>Don't have an account? <a href="#" className="text-brand-600 font-semibold hover:underline">Request Access</a></span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-mono mt-6">
              Secure connection. IT Support ID: 994-A
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
