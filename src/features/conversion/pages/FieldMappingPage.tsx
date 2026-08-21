import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, Save, CheckCircle2 } from 'lucide-react';
import { mockFieldMappings } from '@/mocks/conversions.mock';
import { conversionService } from '../services/conversion.service';
import type { FieldMapping } from '../types/conversion';
import { ROUTES } from '@/shared/constants/routes';
import { Breadcrumb } from '@/shared/navigation/Breadcrumb';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

export const FieldMappingPage: React.FC = () => {
  const { projectId = 'proj-acme', screenId = 'scr-login' } = useParams();
  const navigate = useNavigate();

  const [mappings, setMappings] = useState<FieldMapping[]>([...mockFieldMappings]);
  const [selectedId, setSelectedId] = useState<string>('fm-1');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const selectedMapping = mappings.find((m) => m.id === selectedId) || mappings[0];

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
      await conversionService.saveFieldMapping(screenId, mappings);
      setSavedMsg('Field mapping updated! Code re-generated successfully.');
      setTimeout(() => {
        navigate(ROUTES.PROJECTS.CONVERT(projectId, screenId));
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const filtered = mappings.filter((m) =>
    m.legacyField.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 py-2">
      <Breadcrumb
        items={[
          { label: 'Projects', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'Acme Corp Modernization', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'Screens', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'LoginScreen.bms' },
          { label: 'Edit Mapping' },
        ]}
      />

      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Field Mapping</h1>
          <p className="text-xs text-slate-500 mt-1">Configure structural component mapping and field validation rules.</p>
        </div>

        <div className="flex space-x-3">
          <Button variant="secondary" onClick={() => navigate(ROUTES.PROJECTS.CONVERT(projectId, screenId))} className="text-xs font-semibold">
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={loading} className="space-x-1.5 text-xs font-semibold">
            <Save className="w-4 h-4" />
            <span>Save Mapping & Re-generate</span>
          </Button>
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
    </div>
  );
};
export default FieldMappingPage;
