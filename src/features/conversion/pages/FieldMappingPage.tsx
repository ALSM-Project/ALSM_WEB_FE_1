import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Search, AlertTriangle, Save, CheckCircle2 } from 'lucide-react';
import { conversionService } from '../services/conversion.service';
import { validationService } from '../services/validation.service';
import type { FieldMapping } from '../types/conversion';
import { ROUTES } from '@/shared/constants/routes';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { LiveTsxRenderer } from '../components/LiveTsxRenderer';
import { CodeEditor } from '../components/CodeEditor';
import { isDisplayableCodeFile } from '../utils/screenGenerator';
import { conversionKeys } from '../queries/conversionKeys';
import { validationKeys } from '../queries/validationKeys';

export const FieldMappingPage: React.FC = () => {
  const { projectId = 'proj-acme', screenId = 'scr-login' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [mappingsLoading, setMappingsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [tsxCode, setTsxCode] = useState('');
  const [originalTsxCode, setOriginalTsxCode] = useState('');
  const [codeFilename, setCodeFilename] = useState('');
  const [metadata, setMetadata] = useState<any>(null);
  const [editMode, setEditMode] = useState<'form' | 'code'>('form');

  useEffect(() => {
    let cancelled = false;
    setMappingsLoading(true);
    conversionService.getFieldMappings(projectId, screenId).then((mappingData) => {
      if (cancelled) return;
      setMappings(mappingData);
      setSelectedId(mappingData[0]?.id ?? '');
      setMappingsLoading(false);
    });

    conversionService.getLatestConversion(projectId, screenId).then((job) => {
      if (cancelled || !job) return;
      conversionService.getConversionResult(job.id).then((result) => {
        if (cancelled) return;
        const tsxFile = result.files.find(
          (f) => f.relativePath.endsWith('.tsx') && isDisplayableCodeFile(f.relativePath),
        );
        if (tsxFile) {
          setCodeFilename(tsxFile.relativePath);
          setOriginalTsxCode(tsxFile.content);
          const cachedCode = localStorage.getItem(`alsm_custom_code_${projectId}_${screenId}`);
          setTsxCode(cachedCode || tsxFile.content);
        }
        const jsonFile = result.files.find(
          (f) =>
            f.relativePath.endsWith('.model.json') ||
            f.relativePath.endsWith('.metadata.json') ||
            f.relativePath.endsWith('.json')
        );
        if (jsonFile?.content) {
          try {
            const raw = JSON.parse(jsonFile.content);
            if (raw.fields && (!raw.labels || !raw.inputs)) {
              setMetadata({
                ...raw,
                labels: raw.fields
                  .filter((f: any) => f.kind === 'label' || f.kind === 'output')
                  .map((f: any) => ({
                    ...f,
                    initial: f.initial || (f.name ? `[${f.name}]` : ''),
                    color: (f.color || 'GREEN').toLowerCase(),
                  })),
                inputs: raw.fields
                  .filter((f: any) => f.kind === 'input')
                  .map((f: any) => ({
                    ...f,
                    color: (f.color || 'GREEN').toLowerCase(),
                  })),
                functionKeys: raw.functionKeys || [],
              });
            } else {
              setMetadata(raw);
            }
          } catch (e) {}
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [projectId, screenId]);

  const selectedMapping = mappings.find((m) => m.id === selectedId) ?? mappings[0];

  const handleUpdateCurrent = (fieldKey: string, value: any) => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.id === selectedId) {
          return {
            ...m,
            componentMapping: {
              ...m.componentMapping,
              [fieldKey]: value,
            },
          };
        }
        return m;
      })
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let reconverted = false;
      try {
        await conversionService.reconvert(projectId, screenId, mappings);
        reconverted = true;
      } catch (reconvertErr) {
        console.warn('Reconvert failed, falling back to saveFieldMapping:', reconvertErr);
        await conversionService.saveFieldMapping(projectId, screenId, mappings);
      }

      setSavedMsg(
        reconverted
          ? 'Field mapping saved! Re-conversion triggered. Moving to AI Validation...'
          : 'Field mapping updated! Moving to AI Validation...'
      );
      setTimeout(() => {
        navigate(ROUTES.PROJECTS.REVIEW(projectId, screenId));
      }, 800);
    } catch (err) {
      console.warn('Backend mapping save failed, caching locally and proceeding:', err);
      try {
        localStorage.setItem(`alsm_mapping_${projectId}_${screenId}`, JSON.stringify(mappings));
      } catch {}
      setSavedMsg('Field mapping saved! Redirecting to AI Validation step...');
      setTimeout(() => {
        navigate(ROUTES.PROJECTS.REVIEW(projectId, screenId));
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCode = async () => {
    setLoading(true);
    try {
      if (projectId && screenId) {
        localStorage.setItem(`alsm_custom_code_${projectId}_${screenId}`, tsxCode);
        localStorage.setItem(`alsm_mapping_${projectId}_${screenId}`, JSON.stringify(mappings));
        try {
          const saveRes = await conversionService.saveScreenCode(projectId, screenId, tsxCode, codeFilename);
          if (saveRes?.conversionJobId) {
            try {
              await validationService.triggerAiValidation(projectId, saveRes.conversionJobId);
            } catch (valErr) {
              console.warn('Could not auto-trigger validation:', valErr);
            }
          }
          await queryClient.invalidateQueries({ queryKey: conversionKeys.all });
          await queryClient.invalidateQueries({ queryKey: validationKeys.all });
        } catch (apiErr) {
          console.warn('Backend saveScreenCode fallback:', apiErr);
        }
      }
    } catch (e) {
      console.warn('Could not cache to localStorage', e);
    }
    setSavedMsg('TSX Code saved! AI Validation triggered on updated code. Redirecting to review findings...');
    setTimeout(() => {
      navigate(ROUTES.PROJECTS.REVIEW(projectId, screenId));
    }, 800);
  };

  const handleResetCode = () => {
    if (originalTsxCode) {
      setTsxCode(originalTsxCode);
      if (projectId && screenId) {
        localStorage.removeItem(`alsm_custom_code_${projectId}_${screenId}`);
      }
    }
  };

  const filtered = mappings.filter((m) =>
    m.legacyField.name.toLowerCase().includes(search.toLowerCase())
  );

  const liveMetadata = React.useMemo(() => {
    if (!metadata) return null;
    const patched = JSON.parse(JSON.stringify(metadata));
    mappings.forEach(m => {
      const fieldName = m.legacyField.name;
      const { displayRow, displayCol } = m.componentMapping;
      if (displayRow !== undefined || displayCol !== undefined) {
        // Patch inputs
        const input = patched.inputs?.find((i: any) => i.name === fieldName);
        if (input) {
          if (displayRow !== undefined && displayRow > 0) input.row = displayRow;
          if (displayCol !== undefined && displayCol > 0) input.col = displayCol;
        }
        // Patch labels (if they match the name)
        const label = patched.labels?.find((l: any) => l.name === fieldName);
        if (label) {
          if (displayRow !== undefined && displayRow > 0) label.row = displayRow;
          if (displayCol !== undefined && displayCol > 0) label.col = displayCol;
        }
      }
    });
    return patched;
  }, [metadata, mappings]);

  return (
    <div className="space-y-6">

      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Automated Field Mapping</h1>
          <p className="text-xs text-slate-500 mt-1">Configure structural component mapping and field validation rules between legacy fields and target React props.</p>
        </div>

        <div className="flex space-x-2.5 flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate(ROUTES.PROJECTS.REVIEW(projectId, screenId))} className="text-xs font-semibold">
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.PROJECTS.REVIEW(projectId, screenId))}
            className="text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Proceed to AI Validation &rarr;
          </Button>
          {editMode === 'code' ? (
            <Button
              onClick={handleSaveCode}
              isLoading={loading}
              className="space-x-1.5 text-xs font-semibold bg-[#0652CC] hover:bg-[#0655FF]"
            >
              <Save className="w-4 h-4" />
              <span>Save Code & Proceed to AI Validation</span>
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              isLoading={loading}
              disabled={mappingsLoading}
              className="space-x-1.5 text-xs font-semibold bg-[#0652CC] hover:bg-[#0655FF]"
            >
              <Save className="w-4 h-4" />
              <span>Save & Re-convert (Create Version v2)</span>
            </Button>
          )}
        </div>
      </div>

      {savedMsg && (
        <div className="bg-[#ECFDF3] border border-[#ABEFC6] text-[#079455] p-4 rounded-xl text-sm font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      <div className="bg-[#FFFAEB] border border-[#FEDF89] p-4 rounded-xl text-[#DC6803] text-xs flex items-center space-x-3 font-medium">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <span>Modifying this mapping will trigger a re-generation of the screen code upon saving.</span>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
          <button
            onClick={() => setEditMode('form')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              editMode === 'form'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Field Mapping Form
          </button>
          <button
            onClick={() => setEditMode('code')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              editMode === 'code'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Direct TSX Code Editor
          </button>
        </div>
        <p className="text-xs text-slate-500">
          {editMode === 'form'
            ? 'Select a field below to edit its component type, label, coordinates, and rules.'
            : 'Edit the generated React component code directly. Live preview updates in real-time.'}
        </p>
      </div>

      {editMode === 'code' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-1 flex-wrap gap-2">
              <span className="font-semibold text-slate-700">React Component Editor</span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 text-[11px] hidden sm:inline">Changes update screen in real-time</span>
                <Button
                  size="sm"
                  onClick={handleSaveCode}
                  isLoading={loading}
                  className="text-xs font-semibold px-3 py-1 bg-[#0652CC] hover:bg-[#0655FF] text-white space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Code & Proceed to AI Validation &rarr;</span>
                </Button>
              </div>
            </div>
            <CodeEditor
              code={tsxCode}
              onChange={setTsxCode}
              onSave={handleSaveCode}
              onReset={handleResetCode}
              isModified={Boolean(originalTsxCode && tsxCode !== originalTsxCode)}
              filename={codeFilename || `${screenId}.tsx`}
              height="580px"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-semibold text-slate-700">Live 3270 Screen Preview</span>
              <span className="text-emerald-600 text-[11px] font-medium">Synchronized</span>
            </div>
            <LiveTsxRenderer
              tsxCode={tsxCode}
              screenName={screenId}
              metadata={liveMetadata}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Live Preview Header */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Live Preview (Legacy Terminal)</h3>
            {tsxCode && liveMetadata ? (
              <LiveTsxRenderer
                tsxCode={tsxCode}
                screenName={screenId}
                metadata={liveMetadata}
              />
            ) : (
              <div className="text-slate-500 text-xs text-center py-8">Loading live preview...</div>
            )}
          </div>

      {mappingsLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500 shadow-sm">
          Loading field mapping…
        </div>
      ) : !selectedMapping ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500 shadow-sm">
          No field mapping has been saved for this screen yet.
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Legacy Source Fields</h3>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search fields..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600 shadow-xs"
            />
          </div>

          <div className="space-y-2">
            {filtered.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-50 border-brand-300 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-mono text-xs font-bold text-slate-900">{item.legacyField.name}</p>
                  <div className="text-[11px] text-slate-500 font-mono mt-1 space-y-0.5">
                    <p>Type: <span className="text-brand-700 font-semibold">{item.legacyField.type}</span></p>
                    <p>Length: {item.legacyField.length} | Pos: {item.legacyField.position}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Component Mapping & Validation — <span className="font-mono text-slate-900 font-bold">{selectedMapping.legacyField.name}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Component Type</label>
              <select
                value={selectedMapping.componentMapping.componentType}
                onChange={(e) => handleUpdateCurrent('componentType', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600 shadow-xs font-mono font-medium"
              >
                <option value="Text Field">Text Field</option>
                <option value="Password Input">Password Input</option>
                <option value="Button (Primary)">Button (Primary)</option>
              </select>
            </div>

            <Input
              label="Label Text"
              value={selectedMapping.componentMapping.labelText}
              onChange={(e) => handleUpdateCurrent('labelText', e.target.value)}
            />
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-600">Layout Overrides</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Display Row (Override)"
                type="number"
                value={selectedMapping.componentMapping.displayRow ?? ''}
                onChange={(e) => handleUpdateCurrent('displayRow', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Leave blank to use default"
              />
              <Input
                label="Display Col (Override)"
                type="number"
                value={selectedMapping.componentMapping.displayCol ?? ''}
                onChange={(e) => handleUpdateCurrent('displayCol', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Leave blank to use default"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-600">Validation Rules</h4>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="required"
                checked={selectedMapping.componentMapping.isRequired}
                onChange={(e) => handleUpdateCurrent('isRequired', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
              />
              <label htmlFor="required" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Required Field
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Min Length"
                type="number"
                value={selectedMapping.componentMapping.minLength}
                onChange={(e) => handleUpdateCurrent('minLength', parseInt(e.target.value) || 0)}
              />
              <Input
                label="Max Length"
                type="number"
                value={selectedMapping.componentMapping.maxLength}
                onChange={(e) => handleUpdateCurrent('maxLength', parseInt(e.target.value) || 0)}
              />
            </div>

            <Input
              label="Regex Pattern"
              value={selectedMapping.componentMapping.regexPattern}
              onChange={(e) => handleUpdateCurrent('regexPattern', e.target.value)}
              className="font-mono text-xs text-brand-700 font-semibold"
            />
          </div>
        </div>
      </div>
      )}
      </>
      )}
    </div>
  );
};
export default FieldMappingPage;
