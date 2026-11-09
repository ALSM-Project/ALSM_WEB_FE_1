import React, { useState } from 'react';
import { Bell, Code, ShieldCheck, CheckCircle2, Sliders } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

export const PreferencesPage: React.FC = () => {
  const [emailSecurityAlerts, setEmailSecurityAlerts] = useState(true);
  const [emailConversionAlerts, setEmailConversionAlerts] = useState(true);
  const [emailWeeklyDigest, setEmailWeeklyDigest] = useState(false);
  const [defaultFramework, setDefaultFramework] = useState<'REACT' | 'JAVA'>('REACT');
  const [editorTheme, setEditorTheme] = useState('dark');
  const [autoFormatCode, setAutoFormatCode] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [displayDensity, setDisplayDensity] = useState('comfortable');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 400);
  };

  return (
    <div className="w-full space-y-6">
      {isSaved && (
        <div className="bg-[#ECFDF3] border border-[#ABEFC6] text-[#079455] p-3.5 rounded-lg text-xs sm:text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Preferences updated successfully.</span>
        </div>
      )}

      {/* Meaningful 4-Group Responsive Grid Layout */}
      <form onSubmit={handleSave} className="space-y-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* Group 1: General Preferences */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs min-w-0">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">General Preferences</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Workspace Display Density
                </label>
                <select
                  value={displayDensity}
                  onChange={(e) => setDisplayDensity(e.target.value)}
                  className="w-full h-11 bg-white border border-slate-200 text-slate-900 rounded-lg px-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-100 transition-all shadow-xs"
                >
                  <option value="comfortable">Comfortable (Enterprise Standard)</option>
                  <option value="compact">Compact (High-Density AST Inspector)</option>
                </select>
                <p className="text-xs text-slate-600 font-medium max-w-[55ch] [text-wrap:pretty]">
                  Controls row spacing and component padding across modernization studios.
                </p>
              </div>

              {/* Seamless keyboard shortcuts callout without nested card border */}
              <div className="p-3 bg-slate-100/80 rounded-lg text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-900">Keyboard Shortcuts</p>
                <p className="text-slate-600 max-w-[55ch] [text-wrap:pretty]">
                  Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono shadow-2xs">Ctrl + K</kbd> anywhere to open the ALSM global command launcher.
                </p>
              </div>
            </div>
          </div>

          {/* Group 2: Notification Preferences */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs min-w-0">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <Bell className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notification Preferences</h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-slate-900">Security & Sign-in Alerts</p>
                  <p className="text-xs text-slate-600 max-w-[55ch] [text-wrap:pretty]">
                    Receive instant notifications when a new login occurs from an unrecognized device or IP.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={emailSecurityAlerts}
                  onChange={(e) => setEmailSecurityAlerts(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-slate-900">Conversion Completion Notifications</p>
                  <p className="text-xs text-slate-600 max-w-[55ch] [text-wrap:pretty]">
                    Get notified when batch AST modernization pipelines or source exports finish.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={emailConversionAlerts}
                  onChange={(e) => setEmailConversionAlerts(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-slate-900">Weekly System Modernization Digest</p>
                  <p className="text-xs text-slate-600 max-w-[55ch] [text-wrap:pretty]">
                    Summary of migrated screen components, rule accuracy rates, and team throughput.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={emailWeeklyDigest}
                  onChange={(e) => setEmailWeeklyDigest(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Group 3: Workspace Preferences */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs min-w-0">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <Code className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Workspace Preferences</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Target Framework Default
                  </label>
                  <select
                    value={defaultFramework}
                    onChange={(e) => setDefaultFramework(e.target.value as 'REACT' | 'JAVA')}
                    className="w-full h-11 bg-white border border-slate-200 text-slate-900 rounded-lg px-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-100 transition-all shadow-xs"
                  >
                    <option value="REACT">React 19 (TypeScript)</option>
                    <option value="JAVA">Java 21 (Spring Boot)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Code Editor Theme
                  </label>
                  <select
                    value={editorTheme}
                    onChange={(e) => setEditorTheme(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-200 text-slate-900 rounded-lg px-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-100 transition-all shadow-xs"
                  >
                    <option value="dark">Deep Navy (#0B132B)</option>
                    <option value="light">Clean Light (#FFFFFF)</option>
                  </select>
                </div>
              </div>

              <label className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-slate-900">Auto-Format Generated Code</p>
                  <p className="text-xs text-slate-600 max-w-[55ch] [text-wrap:pretty]">
                    Format TypeScript JSX and Spring Boot files with Prettier & Google Java Format upon AST compilation.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoFormatCode}
                  onChange={(e) => setAutoFormatCode(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Group 4: Session Preferences */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs min-w-0">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Session Preferences</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Inactivity Auto-Logout Timeout
                </label>
                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full h-11 bg-white border border-slate-200 text-slate-900 rounded-lg px-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-100 transition-all shadow-xs"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes (Recommended)</option>
                  <option value="60">1 hour</option>
                  <option value="240">4 hours</option>
                </select>
                <p className="text-xs text-slate-600 mt-1 max-w-[55ch] [text-wrap:pretty]">
                  Active sessions will be automatically terminated when no user activity is detected across any workstation.
                </p>
              </div>

              {/* Seamless callout without nested card border */}
              <div className="p-3 bg-slate-100/80 rounded-lg text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-900">Security Invalidation Policy</p>
                <p className="text-slate-600 max-w-[55ch] [text-wrap:pretty]">
                  Password updates or 2FA resets trigger immediate revocation of all non-current active sessions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Action Footer */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setEmailSecurityAlerts(true);
              setEmailConversionAlerts(true);
              setEmailWeeklyDigest(false);
              setDefaultFramework('REACT');
              setEditorTheme('dark');
              setAutoFormatCode(true);
              setSessionTimeout('30');
              setDisplayDensity('comfortable');
            }}
            className="h-9 px-4 text-xs sm:text-sm font-medium"
          >
            Reset to Default
          </Button>
          <Button
            type="submit"
            isLoading={isSaving}
            className="h-9 px-4 text-xs sm:text-sm font-semibold"
          >
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PreferencesPage;
