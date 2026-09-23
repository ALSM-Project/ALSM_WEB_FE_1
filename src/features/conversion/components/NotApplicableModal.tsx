import React, { useState } from 'react';
import { Info } from 'lucide-react';

export interface NotApplicableModalProps {
  onClose: () => void;
  onConfirm: (reason: string) => void;
  findingTitle?: string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export const NotApplicableModal: React.FC<NotApplicableModalProps> = ({
  onClose,
  onConfirm,
  findingTitle,
  isSubmitting = false,
  errorMessage,
}) => {
  const [reason, setReason] = useState('');
  const trimmedReason = reason.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div
        className="flex w-full max-w-lg flex-col space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="not-applicable-title"
      >
        <div>
          <h3 id="not-applicable-title" className="text-2xl font-bold tracking-tight text-slate-900">
            Mark as not applicable?
          </h3>
          {findingTitle && <p className="mt-2 text-sm text-slate-500">{findingTitle}</p>}
        </div>

        <div>
          <label htmlFor="not-applicable-reason" className="mb-2 block text-sm font-semibold text-slate-800">
            Reason <span className="text-rose-600">*</span>
          </label>
          <textarea
            id="not-applicable-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={5}
            maxLength={1000}
            required
            placeholder="Explain why this finding is not applicable."
            className="w-full resize-none rounded-2xl border border-slate-300 bg-white p-4 text-sm text-slate-800 shadow-2xs transition-all placeholder-slate-400 focus:border-[#0052CC] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
          />
          <p className="mt-1 text-right text-xs text-slate-400">{reason.length}/1000</p>
        </div>

        <div className="flex items-start space-x-3 text-xs font-medium text-slate-600">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0052CC]" />
          <p className="leading-relaxed text-slate-700">
            This does not change generated code. It records an authoritative human review decision.
          </p>
        </div>

        {errorMessage && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => onConfirm(trimmedReason)}
            disabled={!trimmedReason || isSubmitting}
            className="w-full rounded-2xl bg-[#0052CC] px-6 py-3.5 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0047BA] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Saving decision…' : 'Confirm'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full rounded-2xl py-2.5 text-center text-sm font-semibold text-slate-600 transition-all hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotApplicableModal;
