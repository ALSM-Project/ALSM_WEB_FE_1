import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import type { Finding, FindingStatus } from '../types/export';

export interface FindingCardProps {
  finding: Finding;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdateStatus: (id: string, newStatus: FindingStatus) => void;
  onMarkNotApplicable: (finding: Finding) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  isSelected,
  onSelect,
  onUpdateStatus,
  onMarkNotApplicable,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to render text with highlighted code tokens
  const renderFormattedDescription = (text: string) => {
    const tokens = ['TextField', 'NUM', 'NumberField', 'PASSWD', '15-20', 'USER ID', 'CUSTID'];
    // Replace known code tokens with styled spans if present
    const parts = text.split(/(`[^`]+`|\bTextField\b|\bNUM\b|\bNumberField\b|\bPASSWD\b)/g);
    return parts.map((part, index) => {
      if (tokens.includes(part) || part.startsWith('`')) {
        const clean = part.replace(/`/g, '');
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-800 font-mono text-[11px] font-semibold"
          >
            {clean}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div
      onClick={onSelect}
      className={`relative p-5 rounded-2xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-white border-brand-500 shadow-sm ring-1 ring-brand-500/20'
          : finding.status === 'not-applicable'
          ? 'bg-slate-50/70 border-slate-200 opacity-60'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          {/* Badge (Rule-based / AI-Suggested) */}
          {finding.badge && (
            <span
              className={`px-2.5 py-0.5 text-xs font-medium rounded-md border ${
                finding.badge === 'Rule-based'
                  ? 'bg-blue-50 text-brand-700 border-brand-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              {finding.badge}
            </span>
          )}

          {/* Line reference */}
          <span className="text-xs text-slate-400 font-mono font-medium">
            {finding.lineNumber}
          </span>
        </div>

        {/* 3-Dot Kebab Menu */}
        <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 animate-fade-in text-xs font-medium text-slate-700">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onMarkNotApplicable(finding);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-600 cursor-pointer"
              >
                <span>Mark as not applicable</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description text */}
      <p
        className={`text-xs leading-relaxed ${
          finding.status === 'not-applicable' ? 'text-slate-400 line-through' : 'text-slate-700'
        }`}
      >
        {renderFormattedDescription(finding.description)}
      </p>

      {/* Action Buttons */}
      {finding.status !== 'not-applicable' && (
        <div className="mt-4 pt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() =>
              onUpdateStatus(
                finding.id,
                finding.status === 'needs-correction' ? 'pending' : 'needs-correction'
              )
            }
            className={`py-2 px-4 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              finding.status === 'needs-correction'
                ? 'bg-[#0052CC] text-white border-[#0052CC]'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Needs Correction
          </button>

          <button
            onClick={() =>
              onUpdateStatus(
                finding.id,
                finding.status === 'manual-review' ? 'pending' : 'manual-review'
              )
            }
            className={`py-2 px-4 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              finding.status === 'manual-review'
                ? 'bg-[#0052CC] text-white border-[#0052CC]'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Manual Review
          </button>
        </div>
      )}
    </div>
  );
};

export default FindingCard;
