import React, { useState } from 'react';
import { Info } from 'lucide-react';

export interface NotApplicableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  findingLineNumber?: string;
}

export const NotApplicableModal: React.FC<NotApplicableModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-8 flex flex-col space-y-6"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Title */}
        <div>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Mark as not applicable?</h3>
        </div>

        {/* Text Area Input */}
        <div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            placeholder="Why is this Finding a false positive? (optional)"
            className="w-full p-4 bg-white border border-slate-300 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC] transition-all resize-none shadow-2xs"
          />
        </div>

        {/* Info Note */}
        <div className="flex items-start space-x-3 text-xs text-slate-600 font-medium">
          <Info className="w-4 h-4 text-[#0052CC] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed text-slate-700">
            This won't change the generated code — it only records your review decision.
          </p>
        </div>

        {/* Stacked Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 px-6 bg-[#0052CC] hover:bg-[#0047BA] text-white font-semibold text-sm rounded-2xl shadow-sm transition-all cursor-pointer text-center"
          >
            Confirm
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-sm rounded-2xl transition-all cursor-pointer text-center"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotApplicableModal;
