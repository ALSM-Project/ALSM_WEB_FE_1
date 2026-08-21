import React from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export interface DeviceSwitcherProps {
  mode: DeviceMode;
  onChange: (mode: DeviceMode) => void;
}

export const DeviceSwitcher: React.FC<DeviceSwitcherProps> = ({ mode, onChange }) => {
  return (
    <div className="inline-flex bg-slate-100 border border-slate-200 rounded-lg p-1 space-x-1">
      <button
        onClick={() => onChange('desktop')}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
          mode === 'desktop' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Desktop (100%)"
      >
        <Monitor className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Desktop</span>
      </button>

      <button
        onClick={() => onChange('tablet')}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
          mode === 'tablet' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Tablet (768px)"
      >
        <Tablet className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Tablet</span>
      </button>

      <button
        onClick={() => onChange('mobile')}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
          mode === 'mobile' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Mobile (375px)"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Mobile</span>
      </button>
    </div>
  );
};
export default DeviceSwitcher;
