import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, RefreshCw, Sliders, FileCode, Tag } from 'lucide-react';
import { mockASTData, mockConversionResult } from '@/mocks/conversions.mock';
import { ROUTES } from '@/shared/constants/routes';
import { Breadcrumb } from '@/shared/navigation/Breadcrumb';
import { CodeViewer } from '../components/CodeViewer';
import { ASTTree } from '../components/ASTTree';
import { Button } from '@/shared/ui/Button';

export const ResultInspectionPage: React.FC = () => {
  const { projectId = 'proj-acme', screenId = 'scr-login' } = useParams();
  const navigate = useNavigate();
  const [validating, setValidating] = useState(false);

  const handleReRunValidator = () => {
    setValidating(true);
    setTimeout(() => setValidating(false), 800);
  };

  return (
    <div className="space-y-6 py-2">
      <Breadcrumb
        items={[
          { label: 'Projects', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'Acme Corp Modernization', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'Screens', href: ROUTES.PROJECTS.SCREENS(projectId) },
          { label: 'Result Inspection' },
        ]}
      />

      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 font-mono">LoginScreen.bms</h1>
            <span className="bg-[#ECFDF3] text-[#079455] border border-[#ABEFC6] text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Converted Successfully
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Inspecting AST structure and generated React source code.</p>
        </div>

        <Button onClick={() => alert('Downloading single component...')} className="space-x-1.5 text-xs font-semibold">
          <Download className="w-4 h-4" />
          <span>Download</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-[11px] font-semibold uppercase">SCREEN NAME</p>
          <p className="font-bold text-slate-900 font-mono truncate mt-0.5">LoginScreen.bms</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-[11px] font-semibold uppercase">TIMESTAMP</p>
          <p className="font-bold text-slate-700 mt-0.5">Oct 12, 2023</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-[11px] font-semibold uppercase">EXECUTION</p>
          <p className="font-bold text-[#079455] mt-0.5">1.1s</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-[11px] font-semibold uppercase">AST NODES</p>
          <p className="font-bold text-brand-600 mt-0.5">242</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-[11px] font-semibold uppercase">GENERATED LOC</p>
          <p className="font-bold text-brand-600 mt-0.5">420 lines</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
            <span className="flex items-center space-x-1.5">
              <FileCode className="w-4 h-4 text-brand-600" />
              <span>Generated Code (React)</span>
            </span>
          </div>
          <CodeViewer code={mockConversionResult.generatedCode} filename="LoginScreen.tsx" />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
            <span className="flex items-center space-x-1.5">
              <Tag className="w-4 h-4 text-brand-600" />
              <span>Abstract Syntax Tree (BMS Legacy)</span>
            </span>
          </div>
          <ASTTree data={mockASTData} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
        <Button variant="outline" onClick={handleReRunValidator} isLoading={validating} className="space-x-1.5 text-xs font-semibold">
          <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          <span>Re-run Validation Engine</span>
        </Button>

        <div className="flex space-x-3">
          <Button variant="secondary" onClick={() => alert('Downloading component...')} className="space-x-1.5 text-xs font-semibold">
            <Download className="w-3.5 h-3.5" />
            <span>Download Single Component</span>
          </Button>
          <Button onClick={() => navigate(ROUTES.PROJECTS.MAPPING(projectId, screenId))} className="space-x-1.5 text-xs font-semibold">
            <Sliders className="w-3.5 h-3.5" />
            <span>Open in Field Editor</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ResultInspectionPage;
