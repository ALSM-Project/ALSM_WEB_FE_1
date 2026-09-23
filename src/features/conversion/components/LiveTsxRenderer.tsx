import React, { useState, useMemo } from 'react';
import { parseConvertedTsx, type ScreenField } from '../utils/screenGenerator';
import { Play, CheckCircle2, Sliders, Shield, Code, Monitor } from 'lucide-react';

interface LiveTsxRendererProps {
  tsxCode: string;
  screenName: string;
  onEditMapping?: () => void;
  metadata?: any;
}

export const LiveTsxRenderer: React.FC<LiveTsxRendererProps> = ({
  tsxCode,
  screenName,
  onEditMapping,
  metadata,
}) => {
  const [viewMode, setViewMode] = useState<'legacy' | 'ui' | 'code'>(metadata ? 'legacy' : 'ui');

  // Parse TSX code into structured bundle (title, subtitle, fields)
  const bundle = useMemo(() => parseConvertedTsx(tsxCode, screenName), [tsxCode, screenName]);

  // Maintain live form state for interactive inputs
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    bundle.fields.forEach((f) => {
      initial[f.name] = f.defaultValue || '';
    });
    return initial;
  });

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Form submitted with live values:\n${JSON.stringify(formData, null, 2)}`);
  };


  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">
      {/* Header Bar with Toggle */}
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#0652CC] text-white flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 font-mono text-sm">{bundle.title}</h3>
            <p className="text-slate-500 text-[11px]">{bundle.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onEditMapping && (
            <button
              onClick={onEditMapping}
              className="bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center space-x-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit Mapping</span>
            </button>
          )}

          {/* Toggle UI vs Code View */}
          {!metadata && (
            <div className="bg-slate-200 p-0.5 rounded-lg flex items-center text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('ui')}
                className={`px-3 py-1 rounded-md transition-all flex items-center space-x-1.5 ${
                  viewMode === 'ui'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-[#0652CC]" />
                <span>Modern UI</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('code')}
                className={`px-3 py-1 rounded-md transition-all flex items-center space-x-1.5 ${
                  viewMode === 'code'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code className="w-3.5 h-3.5 text-slate-600" />
                <span>Generated TSX</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Body */}
      {viewMode === 'legacy' && metadata ? (
        <div className="bg-black p-6 sm:p-8 overflow-auto flex justify-center" style={{ minHeight: '400px' }}>
          <div style={{ position: 'relative', width: '80ch', height: '25em', fontFamily: 'monospace', fontSize: '16px', backgroundColor: 'black', lineHeight: 1 }}>
            {metadata.labels?.filter((l: any) => l.row > 0 && l.col > 0).map((l: any, idx: number) => (
              <div key={`l-${idx}`} style={{ position: 'absolute', top: `${l.row - 1}em`, left: `${l.col - 1}ch`, color: l.color === 'blue' ? '#87ceeb' : '#00ff00', whiteSpace: 'pre' }}>
                {l.initial || (l.name ? `[${l.name}]` : '')}
              </div>
            ))}
            {metadata.inputs?.filter((i: any) => i.row > 0 && i.col > 0).map((i: any, idx: number) => (
              <div key={`i-${idx}`} style={{ position: 'absolute', top: `${i.row - 1}em`, left: `${i.col - 1}ch` }}>
                 <input 
                   type="text" 
                   name={i.name.toLowerCase()} 
                   placeholder={i.name} 
                   maxLength={i.length} 
                   style={{ width: `${i.length}ch`, backgroundColor: '#002200', color: '#00ff00', border: '1px solid #00ff00', outline: 'none', fontFamily: 'monospace', padding: 0, margin: 0, lineHeight: 1 }} 
                   value={formData[i.name] ?? i.defaultValue ?? ''}
                   onChange={(e) => handleInputChange(i.name, e.target.value)}
                 />
              </div>
            ))}
            {metadata.functionKeys?.length > 0 && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, color: '#888', whiteSpace: 'pre' }}>
                {metadata.functionKeys.join('  ')}
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'ui' ? (
        <div className="p-6 sm:p-8 bg-white space-y-6">
          {/* Live Interactive Form */}
          <form onSubmit={handleFormSubmit} className="space-y-5 text-xs">
            {bundle.fields.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bundle.fields.map((field) => (
                  <div key={field.name} className={field.fullWidth ? 'md:col-span-2' : ''}>
                    <label className="block text-slate-700 font-semibold mb-1.5 font-mono">
                      {field.label}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={formData[field.name] ?? field.defaultValue}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 shadow-xs font-semibold focus:ring-2 focus:ring-[#0652CC]"
                      >
                        {(field.options || ['A (Admin)', 'U (User)']).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        name={field.name.toLowerCase()}
                        value={formData[field.name] ?? field.defaultValue}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={`Enter ${field.name}...`}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-900 shadow-xs focus:ring-2 focus:ring-[#0652CC]"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                <p className="text-sm font-bold text-slate-700">Modernized Screen Rendered</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Component generated cleanly without inputs. Switch to <strong>"Generated TSX"</strong> tab above to view full source code.
                </p>
              </div>
            )}

            {/* Form Actions */}
            {bundle.fields.length > 0 && (
              <div className="flex space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0652CC] hover:bg-[#0655FF] text-white font-bold rounded-lg shadow-xs transition-colors text-xs"
                >
                  Submit Form
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const reset: Record<string, string> = {};
                    bundle.fields.forEach((f) => (reset[f.name] = f.defaultValue || ''));
                    setFormData(reset);
                  }}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg shadow-xs text-xs"
                >
                  Reset Form
                </button>
              </div>
            )}
          </form>
        </div>
      ) : (
        /* TSX Code View */
        <div className="p-4 bg-[#0d1117] text-slate-100 font-mono text-xs overflow-auto max-h-[480px]">
          <pre>{tsxCode || '// No TSX code available'}</pre>
        </div>
      )}
    </div>
  );
};
