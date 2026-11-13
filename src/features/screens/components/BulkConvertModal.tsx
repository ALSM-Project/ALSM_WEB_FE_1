import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  X,
  FileCode,
  CheckSquare,
  Square,
  Play,
  Loader2,
  AlertTriangle,
  ListChecks,
  Info,
} from 'lucide-react';
import type { LegacyScreen } from '../types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';
import { StatusBadge } from '@/shared/ui/Badge';

export interface BulkConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  isPrograms?: boolean;
  programs: LegacyScreen[];
  onConfirm: (selectedIds: string[]) => void;
  isSubmitting?: boolean;
  error?: Error | null;
}

export const BulkConvertModal: React.FC<BulkConvertModalProps> = ({
  isOpen,
  onClose,
  projectId,
  isPrograms = true,
  programs,
  onConfirm,
  isSubmitting = false,
  error = null,
}) => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(programs.map((p) => p.id));
    }
  }, [isOpen, programs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isSubmitting]);

  const allSelected = useMemo(
    () => programs.length > 0 && selectedIds.length === programs.length,
    [programs.length, selectedIds.length],
  );

  const handleToggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : programs.map((p) => p.id));
  };

  const handleToggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleChoosePrograms = () => {
    onClose();
    navigate(ROUTES.PROJECTS.BULK_CONVERT(projectId), {
      state: { selectedIds: selectedIds.length > 0 ? selectedIds : undefined },
    });
  };

  const handleConvert = () => {
    if (selectedIds.length === 0 || isSubmitting) return;
    onConfirm(selectedIds);
  };

  if (!isOpen) return null;

  const hasPrograms = programs.length > 0;
  const noun = isPrograms ? 'programs' : 'screens';

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-[#14263F]/70 backdrop-blur-xs animate-fade-in"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="bg-white border border-[#D9E2EC] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-150"
        style={{ width: '680px', maxWidth: 'calc(100vw - 32px)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-convert-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 px-7 pt-6 pb-5 shrink-0">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#244A70] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
            <div className="min-w-0 pt-0.5">
              <h3
                id="bulk-convert-modal-title"
                className="text-xl font-bold text-[#091E42] tracking-tight leading-tight"
              >
                Bulk Convert
              </h3>
              <p className="text-sm text-[#6B778C] mt-1">
                Convert multiple COBOL {noun} to Java in one operation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 p-2 -mr-2 -mt-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <div className="px-7 pb-6 overflow-y-auto flex-1 min-h-0 space-y-4">
          {!hasPrograms ? (
            /* Empty state */
            <div className="rounded-2xl border border-dashed border-[#C9D6E6] bg-[#F7F9FC] px-8 py-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white border border-[#D4E3FC] flex items-center justify-center text-[#244A70] mx-auto shadow-sm">
                <FileCode className="w-8 h-8" />
              </div>
              <h4 className="mt-5 text-lg font-bold text-[#091E42] tracking-tight">
                Nothing to convert right now
              </h4>
              <p className="mt-2 text-sm text-[#42526E] leading-relaxed max-w-md mx-auto">
                All eligible COBOL {noun} have already been processed or are being converted.
              </p>
            </div>
          ) : (
            <>
              {/* Intro */}
              <div className="flex items-start gap-3 rounded-xl bg-[#E8F1FF] border border-[#D4E3FC] px-4 py-3">
                <Info className="w-4 h-4 text-[#244A70] shrink-0 mt-0.5" />
                <p className="text-sm text-[#244A70] leading-relaxed">
                  <strong className="font-semibold">
                    {programs.length} pending {noun}
                  </strong>{' '}
                  will be queued and converted in parallel. This workspace follows their live
                  progress.
                </p>
              </div>

              {/* List card: toolbar + rows */}
              <div className="border border-[#D9E2EC] rounded-xl overflow-hidden bg-white">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#F7F9FC] border-b border-[#E5EAF0]">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 text-sm font-semibold text-[#244A70] hover:text-[#1B3856] cursor-pointer disabled:opacity-50"
                  >
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{allSelected ? 'Deselect all' : 'Select all'}</span>
                  </button>

                  <span className="text-xs text-slate-500">
                    <strong className="text-[#244A70] font-bold">{selectedIds.length}</strong> of{' '}
                    {programs.length} selected
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {programs.map((prog) => {
                    const isSelected = selectedIds.includes(prog.id);
                    return (
                      <div
                        key={prog.id}
                        onClick={() => {
                          if (!isSubmitting) handleToggleOne(prog.id);
                        }}
                        className={`px-4 py-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#F2F7FF] hover:bg-[#EAF2FF]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#244A70] shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <div className="w-8 h-8 rounded-lg bg-white border border-[#E5EAF0] flex items-center justify-center shrink-0">
                            <FileCode className="w-4 h-4 text-[#6B778C]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold font-mono text-[#091E42] truncate">
                              {prog.name}
                            </p>
                            <p className="text-xs text-[#6B778C] font-mono truncate mt-0.5">
                              {prog.sourceType} • {prog.sizeKb ? `${prog.sizeKb} KB` : 'Source file'}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          <StatusBadge status={prog.status} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* In-progress */}
          {isSubmitting && (
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-[#244A70] shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-[#244A70]">Conversion in progress</p>
                <p className="text-xs text-[#42526E] mt-0.5">
                  Submitting {selectedIds.length} {noun} to the transpiler queue...
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold text-rose-700">Conversion request failed</p>
                <p className="mt-0.5 text-xs text-rose-600 leading-relaxed">
                  {error.message || 'Could not start the bulk conversion. Please try again.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div className="px-7 py-4 bg-[#F7F9FC] border-t border-[#E5EAF0] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <p className="hidden sm:flex items-center gap-1.5 text-xs text-[#6B778C]">
            <ListChecks className="w-3.5 h-3.5" />
            {hasPrograms
              ? 'Use "Choose programs" to pick them on a full page.'
              : 'Pick programs manually to review their status.'}
          </p>

          <div className="flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-sm font-semibold px-4 py-2 cursor-pointer"
            >
              Cancel
            </Button>

            {!hasPrograms ? (
              <Button
                onClick={handleChoosePrograms}
                disabled={isSubmitting}
                className="bg-[#244A70] hover:bg-[#1B3856] text-white text-sm font-semibold px-5 py-2 shadow-xs cursor-pointer"
              >
                Choose programs
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={handleChoosePrograms}
                  disabled={isSubmitting}
                  className="text-sm font-semibold px-4 py-2 cursor-pointer"
                >
                  Choose programs
                </Button>

                <Button
                  onClick={handleConvert}
                  isLoading={isSubmitting}
                  disabled={selectedIds.length === 0 || isSubmitting}
                  aria-label={`Convert ${selectedIds.length} ${noun}`}
                  className="bg-[#244A70] hover:bg-[#1B3856] text-white text-sm font-semibold px-5 py-2 gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {selectedIds.length > 0
                      ? `Convert ${selectedIds.length} ${noun}`
                      : `Convert ${noun}`}
                  </span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default BulkConvertModal;