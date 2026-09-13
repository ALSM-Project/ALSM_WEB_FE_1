import React, { useState } from 'react';
import { useWeb1Theme, Web1ThemeProvider } from '@/context/Web1ThemeContext';
import { Button, Input, Select, Card, Modal } from '@/shared/ui';
import { StatusBadge } from '@/shared/ui/Badge';
import { ModernizationWorkflow, type WorkflowStepId } from '@/shared/ui/ModernizationWorkflow';
import { Breadcrumb } from '@/shared/navigation/Breadcrumb';
import {
  Sparkles,
  FileText,
  Sliders,
  Maximize2,
} from 'lucide-react';

export const Web1WorkspacePreviewContent: React.FC = () => {
  const { theme } = useWeb1Theme();
  const [modalOpen, setModalOpen] = useState(false);
  const [inputVal, setInputVal] = useState('ACCTMAP.bms');
  const [selectVal, setSelectVal] = useState('React');
  const [activeStep, setActiveStep] = useState<WorkflowStepId>('conversion');

  const colors = theme.colors;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ─── Header & Breadcrumb Demo ─── */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5EAF0] pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0652CC] bg-[#E8F1FF] px-3 py-1 rounded-full border border-[#0652CC]/20">
              {theme.name}
            </span>
            <h1 className="text-2xl font-extrabold text-[#091E42] tracking-tight mt-2">
              Web 1 Workspace Theme Preview
            </h1>
            <p className="text-xs text-[#42526E] mt-1">
              Synchronized color tokens derived directly from <code>src/theme/public.ts</code>.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
              <Maximize2 className="w-4 h-4 mr-1.5" />
              Test Theme Modal
            </Button>
            <Button variant="primary" size="sm">
              <Sparkles className="w-4 h-4 mr-1.5" />
              Apply Public Colors
            </Button>
          </div>
        </div>

        <Breadcrumb
          items={[
            { label: 'Public Outer Theme', href: '/' },
            { label: 'Web 1 Workspace', href: '/dashboard' },
            { label: 'Theme Preview Studio' },
          ]}
        />
      </div>

      {/* ─── 1. Active Theme Token Palette ─── */}
      <Card variant="default" padding="lg" className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-3">
          <h2 className="text-sm font-bold text-[#091E42] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#0652CC]" />
            Color Token Swatches (Imported from <code>src/theme/public.ts</code>)
          </h2>
          <span className="text-[11px] font-mono text-[#6B778C]">Live Theme Context Active</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-[#D9E2EC] bg-white space-y-2">
            <div className="h-10 rounded-lg shadow-inner" style={{ backgroundColor: colors.primary.default }} />
            <p className="font-bold text-[#091E42]">Primary</p>
            <p className="font-mono text-[10px] text-[#6B778C]">{colors.primary.default}</p>
          </div>

          <div className="p-3 rounded-xl border border-[#D9E2EC] bg-white space-y-2">
            <div className="h-10 rounded-lg shadow-inner" style={{ backgroundColor: colors.secondary.default }} />
            <p className="font-bold text-[#091E42]">Secondary / Dark</p>
            <p className="font-mono text-[10px] text-[#6B778C]">{colors.secondary.default}</p>
          </div>

          <div className="p-3 rounded-xl border border-[#D9E2EC] bg-white space-y-2">
            <div className="h-10 rounded-lg shadow-inner" style={{ backgroundColor: colors.background.main }} />
            <p className="font-bold text-[#091E42]">Background</p>
            <p className="font-mono text-[10px] text-[#6B778C]">{colors.background.main}</p>
          </div>

          <div className="p-3 rounded-xl border border-[#D9E2EC] bg-white space-y-2">
            <div className="h-10 rounded-lg shadow-inner border border-slate-200" style={{ backgroundColor: colors.primary.light }} />
            <p className="font-bold text-[#091E42]">Primary Light</p>
            <p className="font-mono text-[10px] text-[#6B778C]">{colors.primary.light}</p>
          </div>

          <div className="p-3 rounded-xl border border-[#D9E2EC] bg-white space-y-2">
            <div className="h-10 rounded-lg shadow-inner" style={{ backgroundColor: colors.accent.cyan }} />
            <p className="font-bold text-[#091E42]">Accent Cyan</p>
            <p className="font-mono text-[10px] text-[#6B778C]">{colors.accent.cyan}</p>
          </div>

          <div className="p-3 rounded-xl border border-[#D9E2EC] bg-white space-y-2">
            <div className="h-10 rounded-lg shadow-inner" style={{ backgroundColor: colors.border.default }} />
            <p className="font-bold text-[#091E42]">Border</p>
            <p className="font-mono text-[10px] text-[#6B778C]">{colors.border.default}</p>
          </div>
        </div>
      </Card>

      {/* ─── 2. 7-Step Modernization Workflow Banner ─── */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#42526E] uppercase tracking-wider">
          7-Step Modernization Progress Component
        </h3>
        <ModernizationWorkflow currentStep={activeStep} onStepClick={(step) => setActiveStep(step)} />
      </div>

      {/* ─── 3. UI Component Library Preview ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Buttons & Badges */}
        <Card variant="default" padding="lg" className="space-y-6">
          <h3 className="text-sm font-bold text-[#091E42] border-b border-[#E5EAF0] pb-2">
            Button Variants & Status Badges
          </h3>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#42526E]">BUTTON VARIANTS</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="md">
                Primary Button (#0652CC)
              </Button>
              <Button variant="secondary" size="md">
                Secondary Button (#091E42)
              </Button>
              <Button variant="outline" size="md">
                Outline Button
              </Button>
              <Button variant="ghost" size="md">
                Ghost Button
              </Button>
              <Button variant="primary" size="md" disabled>
                Disabled
              </Button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#E5EAF0]">
            <p className="text-xs font-semibold text-[#42526E]">STATUS BADGES</p>
            <div className="flex flex-wrap gap-3 items-center">
              <StatusBadge status="Completed" />
              <StatusBadge status="In Progress" />
              <StatusBadge status="Review Required" />
              <StatusBadge status="Failed" />
              <StatusBadge status="Draft" />
            </div>
          </div>
        </Card>

        {/* Inputs & Form Controls */}
        <Card variant="default" padding="lg" className="space-y-4">
          <h3 className="text-sm font-bold text-[#091E42] border-b border-[#E5EAF0] pb-2">
            Form Controls & Inputs
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-[#091E42] mb-1 block">Legacy Screen Map File</label>
              <div className="relative">
                <Input
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Enter screen name..."
                  className="pl-8"
                />
                <FileText className="w-4 h-4 text-[#6B778C] absolute left-2.5 top-2.5" />
              </div>
            </div>

            <Select
              label="Target Modern Framework"
              value={selectVal}
              onChange={(e) => setSelectVal(e.target.value)}
              options={[
                { value: 'React', label: 'React 19 (TypeScript + Tailwind v4)' },
                { value: 'Java', label: 'Java 21 (Spring Boot Microservice)' },
                { value: 'Vue', label: 'Vue 3 Composition API' },
              ]}
              helperText="Determines AST parsing rule target."
            />

            <div className="p-3 rounded-xl bg-[#E8F1FF] border border-[#0652CC]/30 text-xs text-[#0652CC] flex items-center space-x-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Inputs dynamically reflect focus rings and theme border colors.</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── 4. Table Component Preview ─── */}
      <Card variant="default" padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-[#E5EAF0] bg-white flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#091E42]">Legacy Component Data Table</h3>
          <span className="text-xs text-[#6B778C]">Showing 3 legacy screens</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7F9FC] border-b border-[#D9E2EC] text-[#091E42] font-bold">
                <th className="p-3.5 pl-6">SCREEN / PROGRAM</th>
                <th className="p-3.5">TYPE</th>
                <th className="p-3.5">FIELDS / PARAGRAPHS</th>
                <th className="p-3.5">VALIDATION</th>
                <th className="p-3.5">STATUS</th>
                <th className="p-3.5 pr-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0] bg-white text-[#091E42]">
              <tr className="hover:bg-[#F7F9FC] transition-colors">
                <td className="p-3.5 pl-6 font-mono font-bold text-[#0652CC]">ACCTMAP.bms</td>
                <td className="p-3.5">IBM BMS Screen</td>
                <td className="p-3.5 font-mono">14 Fields</td>
                <td className="p-3.5">Rule + AI Validated</td>
                <td className="p-3.5"><StatusBadge status="Completed" /></td>
                <td className="p-3.5 pr-6 text-right">
                  <Button variant="ghost" size="sm">Inspect</Button>
                </td>
              </tr>
              <tr className="hover:bg-[#F7F9FC] transition-colors">
                <td className="p-3.5 pl-6 font-mono font-bold text-[#0652CC]">CUSTDSPF.dds</td>
                <td className="p-3.5">AS/400 DSPF Screen</td>
                <td className="p-3.5 font-mono">22 Fields</td>
                <td className="p-3.5">Human Review Required</td>
                <td className="p-3.5"><StatusBadge status="Review Required" /></td>
                <td className="p-3.5 pr-6 text-right">
                  <Button variant="outline" size="sm">Review</Button>
                </td>
              </tr>
              <tr className="hover:bg-[#F7F9FC] transition-colors">
                <td className="p-3.5 pl-6 font-mono font-bold text-[#0652CC]">ACCTPROC.cbl</td>
                <td className="p-3.5">COBOL Program</td>
                <td className="p-3.5 font-mono">8 Paragraphs</td>
                <td className="p-3.5">Converting…</td>
                <td className="p-3.5"><StatusBadge status="In Progress" /></td>
                <td className="p-3.5 pr-6 text-right">
                  <Button variant="ghost" size="sm">View Log</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── 5. Modal Component Test ─── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Web 1 Workspace Theme Modal Test"
      >
        <div className="space-y-4 text-xs text-[#42526E]">
          <p>
            This modal uses the surface and text color tokens matching the outer landing page modal theme.
          </p>
          <div className="p-3 rounded-xl bg-[#F7F9FC] border border-[#D9E2EC] space-y-1">
            <p className="font-bold text-[#091E42]">Modal Container Attributes:</p>
            <p>Background: <code>#FFFFFF</code> (Surface Card)</p>
            <p>Header Text: <code>#091E42</code> (Dark Navy)</p>
            <p>Action Button: <code>#0652CC</code> (Enterprise Blue)</p>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Close Modal
            </Button>
            <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
              Confirm Choice
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const Web1WorkspacePreview: React.FC = () => (
  <Web1ThemeProvider>
    <Web1WorkspacePreviewContent />
  </Web1ThemeProvider>
);

export default Web1WorkspacePreview;
