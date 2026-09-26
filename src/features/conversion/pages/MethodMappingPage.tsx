import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Save, XCircle } from 'lucide-react';
import { conversionService } from '../services/conversion.service';
import type { MethodMappingEntry } from '../types/conversion';
import { ROUTES } from '@/shared/constants/routes';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

const JAVA_IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** UC-28: lets the user rename the real class/method names detected in a COBOL screen's
 * generated Java code. This is the COBOL-side sibling of FieldMappingPage (BMS) — the two
 * are intentionally separate pages since tool2java output has nothing in common with the
 * BMS field/component concepts FieldMappingPage edits. */
export const MethodMappingPage: React.FC = () => {
  const { projectId = 'proj-acme', screenId = 'scr-login' } = useParams();
  const navigate = useNavigate();

  const [entries, setEntries] = useState<MethodMappingEntry[]>([]);
  const [hasGeneratedCode, setHasGeneratedCode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    conversionService
      .getMethodMapping(projectId, screenId)
      .then((view) => {
        if (cancelled) return;
        setEntries(view.entries);
        setHasGeneratedCode(view.hasGeneratedCode);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Could not load method mapping.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, screenId]);

  const grouped = useMemo(() => {
    const byFile = new Map<string, MethodMappingEntry[]>();
    for (const entry of entries) {
      const list = byFile.get(entry.relativePath) ?? [];
      list.push(entry);
      byFile.set(entry.relativePath, list);
    }
    return Array.from(byFile.entries());
  }, [entries]);

  const invalidNames = useMemo(
    () => entries.filter((e) => !JAVA_IDENTIFIER_PATTERN.test(e.targetName)),
    [entries],
  );

  const handleRename = (relativePath: string, kind: 'CLASS' | 'METHOD', originalName: string, targetName: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.relativePath === relativePath && e.kind === kind && e.originalName === originalName
          ? { ...e, targetName }
          : e,
      ),
    );
  };

  const handleSave = async () => {
    setSaveError(null);
    setSavedMsg('');
    setSaving(true);
    try {
      const view = await conversionService.saveMethodMapping(projectId, screenId, entries);
      setEntries(view.entries);
      setSavedMsg('Method mapping saved and applied to the generated code.');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save method mapping.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Edit Method Mapping</h1>
          <p className="text-xs text-slate-500 mt-1">
            Rename the target Java class and method names generated from this COBOL program.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={() => navigate(ROUTES.PROJECTS.RESULT(projectId, screenId))} className="text-xs font-semibold">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            isLoading={saving}
            disabled={loading || !hasGeneratedCode || invalidNames.length > 0}
            className="space-x-1.5 text-xs font-semibold bg-[#0652CC] hover:bg-[#0655FF]"
          >
            <Save className="w-4 h-4" />
            <span>Save Mapping</span>
          </Button>
        </div>
      </div>

      {savedMsg && (
        <div className="bg-[#ECFDF3] border border-[#ABEFC6] text-[#079455] p-4 rounded-xl text-sm font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      {saveError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 text-xs font-medium flex items-start space-x-3">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {invalidNames.length > 0 && (
        <div className="bg-[#FFFAEB] border border-[#FEDF89] p-4 rounded-xl text-[#DC6803] text-xs flex items-center space-x-3 font-medium">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>Every target name must be a valid Java identifier (letters, digits, _ or $, not starting with a digit).</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500 shadow-sm">
          Loading method mapping…
        </div>
      ) : loadError ? (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 text-xs font-medium flex items-start space-x-3">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <span>{loadError}</span>
        </div>
      ) : !hasGeneratedCode ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500 shadow-sm">
          Run the COBOL→Java conversion for this screen first — there is no generated code to map yet.
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500 shadow-sm">
          No class or method names could be detected in the generated code.
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([relativePath, fileEntries]) => (
            <div key={relativePath} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
              <h3 className="text-xs font-mono font-semibold text-slate-500">{relativePath}</h3>
              <div className="space-y-3">
                {fileEntries.map((entry) => (
                  <div
                    key={`${entry.kind}-${entry.originalName}`}
                    className="grid grid-cols-1 sm:grid-cols-[80px_1fr_1fr] gap-3 items-end"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600 self-center">
                      {entry.kind}
                    </span>
                    <Input
                      id={`${entry.relativePath}-${entry.kind}-${entry.originalName}-original`}
                      label="Original Name"
                      value={entry.originalName}
                      disabled
                      className="font-mono text-xs"
                    />
                    <Input
                      id={`${entry.relativePath}-${entry.kind}-${entry.originalName}-target`}
                      label="Target Name"
                      value={entry.targetName}
                      onChange={(e) => handleRename(entry.relativePath, entry.kind, entry.originalName, e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default MethodMappingPage;
