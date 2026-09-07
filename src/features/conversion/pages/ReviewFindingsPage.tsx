import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Plus } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { Breadcrumb } from '@/shared/navigation/Breadcrumb';
import { FindingCard } from '../components/FindingCard';
import { NotApplicableModal } from '../components/NotApplicableModal';
import type { Finding, FindingStatus } from '../types/export';

const sampleBmsCodeLines = [
  { lineNum: '000100', text: 'DFHMSD TYPE=MAP,TIOAPFX=YES,MODE=INOUT,...', isHighlight: false },
  { lineNum: '000110', text: '       CTRL=(FREEKB,FRSET),T...', isHighlight: false },
  { lineNum: '000120', text: '       MAPATTS=(COLOR,HILIGHT...', isHighlight: false },
  { lineNum: '000130', text: 'LOGIN  DFHMDI SIZE=(24,80)', isHighlight: false },
  { lineNum: '000140', text: '* HEADER', isHighlight: false },
  { lineNum: '000150', text: "       DFHMDF POS=(01,25),LENGTH=20...", isHighlight: false },
  { lineNum: '000160', text: "              INITIAL='--- SYSTEM LOG...", isHighlight: false },
  { lineNum: '000170', text: '* USER ID FIELD', isHighlight: false },
  { lineNum: '000180', text: "       DFHMDF POS=(05,10),LENGTH=10...", isHighlight: false },
  { lineNum: '000190', text: "              INITIAL='USER ID: '", isHighlight: false },
  { lineNum: '000200', text: "CUSTID DFHMDF POS=(05,21),LENGTH=8...", isHighlight: true, findingId: 'f-1' },
  { lineNum: '000210', text: '              COLOR=GREEN', isHighlight: false },
  { lineNum: '000220', text: '* PASSWORD FIELD', isHighlight: false },
  { lineNum: '000230', text: "       DFHMDF POS=(07,10),LENGTH=10...", isHighlight: false },
  { lineNum: '000240', text: "              INITIAL='PASSWORD: '", isHighlight: false },
  { lineNum: '000250', text: "PASSWD DFHMDF POS=(07,21),LENGTH=8...", isHighlight: false },
  { lineNum: '000260', text: '* ACTIONS', isHighlight: false },
  { lineNum: '000270', text: "       DFHMDF POS=(15,10),LENGTH=15...", isHighlight: true, findingId: 'f-2' },
  { lineNum: '000280', text: "              INITIAL='PF3=EXIT'", isHighlight: true, findingId: 'f-2' },
  { lineNum: '000290', text: "       DFHMDF POS=(15,30),LENGTH=15...", isHighlight: true, findingId: 'f-2' },
  { lineNum: '000300', text: "              INITIAL='ENTER=SUBMIT...", isHighlight: false },
  { lineNum: '000310', text: '       DFHMSD TYPE=FINAL', isHighlight: false },
  { lineNum: '000320', text: '       END', isHighlight: false },
];

const initialFindings: Finding[] = [
  {
    id: 'f-1',
    lineNumber: 'Ln 20',
    startLine: 20,
    badge: 'Rule-based',
    description: 'Field mapped to TextField but source attribute NUM suggests NumberField.',
    status: 'pending',
  },
  {
    id: 'f-2',
    lineNumber: 'Ln 27-30',
    startLine: 27,
    endLine: 30,
    badge: 'AI-Suggested',
    description: 'Consider using a grid alignment for buttons on rows 15-20 (78% confidence).',
    status: 'pending',
  },
  {
    id: 'f-3',
    lineNumber: 'Ln 23',
    startLine: 23,
    description: 'No validation associated with PASSWD field.',
    status: 'pending',
  },
];

export const ReviewFindingsPage: React.FC = () => {
  const { projectId = 'proj-acme', screenId = 'scr-login' } = useParams();
  const navigate = useNavigate();

  const [activeCodeTab, setActiveCodeTab] = useState<'source' | 'generated'>('source');
  const [findings, setFindings] = useState<Finding[]>(initialFindings);
  const [selectedFindingId, setSelectedFindingId] = useState<string>('f-1');
  const [modalFinding, setModalFinding] = useState<Finding | null>(null);

  const resolvedCount = findings.filter((f) => f.status !== 'pending').length;
  const totalCount = findings.length;

  const handleUpdateStatus = (id: string, newStatus: FindingStatus) => {
    setFindings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const handleConfirmNotApplicable = (reason: string) => {
    if (!modalFinding) return;
    setFindings((prev) =>
      prev.map((item) =>
        item.id === modalFinding.id
          ? { ...item, status: 'not-applicable', notApplicableReason: reason }
          : item
      )
    );
    setModalFinding(null);
  };

  const handleAddFinding = () => {
    const newId = `f-${Date.now()}`;
    const newFinding: Finding = {
      id: newId,
      lineNumber: 'Ln 15',
      startLine: 15,
      badge: 'AI-Suggested',
      description: 'System header label detected. Mapped to top bar title component.',
      status: 'pending',
    };
    setFindings((prev) => [newFinding, ...prev]);
    setSelectedFindingId(newId);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] pb-24 space-y-6 py-2 bg-slate-50/30">
      {/* Breadcrumb & Title */}
      <div className="space-y-3">
        <Breadcrumb
          items={[
            { label: 'Projects', href: ROUTES.PROJECTS.SCREENS(projectId) },
            { label: 'Legacy Migration Alpha', href: ROUTES.PROJECTS.SCREENS(projectId) },
            { label: 'Screens', href: ROUTES.PROJECTS.SCREENS(projectId) },
            { label: 'LoginScreen.bms', href: ROUTES.PROJECTS.CONVERT(projectId, screenId) },
            { label: 'Review' },
          ]}
        />

        {/* Page Title & Meta Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Review Findings</h1>
            <span className="bg-amber-50 text-amber-700 border border-amber-200/80 text-xs px-3 py-1 rounded-full font-semibold inline-flex items-center space-x-1.5 shadow-2xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Review Required</span>
            </span>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            <span>{resolvedCount} of {totalCount} Findings reviewed</span>
          </div>
        </div>
      </div>

      {/* Split View Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Code Viewer Panel */}
        <div className="lg:col-span-7 bg-[#161b22] rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-lg">
          {/* Header Tabs */}
          <div className="bg-[#0d1117] px-4 pt-3 flex items-center space-x-2 border-b border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveCodeTab('source')}
              className={`px-4 py-2 rounded-t-xl transition-colors cursor-pointer ${
                activeCodeTab === 'source'
                  ? 'bg-[#161b22] text-slate-100 border-t border-x border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Source
            </button>
            <button
              onClick={() => setActiveCodeTab('generated')}
              className={`px-4 py-2 rounded-t-xl transition-colors cursor-pointer ${
                activeCodeTab === 'generated'
                  ? 'bg-[#161b22] text-slate-100 border-t border-x border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Generated Code
            </button>
          </div>

          {/* Code Viewer Body */}
          <div className="p-4 overflow-x-auto font-mono text-xs leading-6 text-slate-300 flex-1 min-h-[480px]">
            {activeCodeTab === 'source' ? (
              sampleBmsCodeLines.map((item) => {
                const isSelected = item.findingId === selectedFindingId;
                return (
                  <div
                    key={item.lineNum}
                    onClick={() => item.findingId && setSelectedFindingId(item.findingId)}
                    className={`flex items-start px-2 py-0.5 rounded transition-colors ${
                      isSelected
                        ? 'bg-amber-950/80 border-l-4 border-amber-500 text-amber-100 font-semibold'
                        : item.isHighlight
                        ? 'bg-amber-950/40 hover:bg-amber-900/50 cursor-pointer'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <span className="w-16 text-slate-600 select-none font-mono text-[11px]">
                      {item.lineNum}
                    </span>
                    <pre className="flex-1 overflow-x-auto whitespace-pre font-mono text-slate-200">
                      {item.text}
                    </pre>
                  </div>
                );
              })
            ) : (
              <div className="text-slate-400 p-4">
                <p>// Generated React TypeScript component code preview...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Findings List Panel */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Action Row */}
          <div className="flex justify-end">
            <button
              onClick={handleAddFinding}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-500" />
              <span>Add Finding</span>
            </button>
          </div>

          {/* Findings Cards List */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
            {findings.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                isSelected={finding.id === selectedFindingId}
                onSelect={() => setSelectedFindingId(finding.id)}
                onUpdateStatus={handleUpdateStatus}
                onMarkNotApplicable={(item) => setModalFinding(item)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-6 py-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Progress Indicator */}
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="w-36 sm:w-48 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.round((resolvedCount / totalCount) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-700">
              {resolvedCount} of {totalCount} resolved
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => alert('Draft saved successfully!')}
              className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              Save Draft
            </button>
            <button
              onClick={() => navigate(ROUTES.PROJECTS.EXPORT(projectId))}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      {/* Not Applicable Modal Overlay */}
      <NotApplicableModal
        isOpen={!!modalFinding}
        onClose={() => setModalFinding(null)}
        onConfirm={handleConfirmNotApplicable}
        findingLineNumber={modalFinding?.lineNumber}
      />
    </div>
  );
};

export default ReviewFindingsPage;
