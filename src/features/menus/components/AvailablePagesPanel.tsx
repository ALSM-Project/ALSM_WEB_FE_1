import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Card, Input, Select } from '@/shared/ui';
import { DynamicIcon } from '@/components/Sidebar/IconResolver';
import { MenuItem } from '../types/menu';

export interface AvailablePage {
  id: string;
  label: string;
  module: string;
  icon: string;
  path: string;
}

const AVAILABLE_PAGES_LIBRARY: AvailablePage[] = [
  { id: 'page-dashboard', label: 'Dashboard', module: 'Dashboard', icon: 'LayoutDashboard', path: '/' },
  { id: 'page-[#projects]', label: 'Projects & Workspaces', module: 'Projects', icon: 'Layers', path: '/projects/proj-acme/screens' },
  { id: 'page-upload', label: 'Upload BMS/DSPF', module: 'Projects', icon: 'UploadCloud', path: '/projects/proj-acme/upload' },
  { id: 'page-convert', label: 'Screen Converter', module: 'Conversion', icon: 'Cpu', path: '/projects/proj-acme/screens/scr-01/convert' },
  { id: 'page-bulk', label: 'Bulk Conversion', module: 'Conversion', icon: 'Layers', path: '/projects/proj-acme/screens/bulk-convert' },
  { id: 'page-usage', label: 'Resource Usage', module: 'Usage', icon: 'Activity', path: '/usage' },
  { id: 'page-pricing', label: 'Pricing & Plans', module: 'Subscription', icon: 'Sparkles', path: '/billing/pricing' },
  { id: 'page-invoices', label: 'Invoices & History', module: 'Subscription', icon: 'Receipt', path: '/billing/history' },
  { id: 'page-password', label: 'Change Password', module: 'Account & Security', icon: 'KeyRound', path: '/account/security/password' },
  { id: 'page-2fa', label: 'Two-Factor Auth', module: 'Account & Security', icon: 'Shield', path: '/account/security/2fa' },
  { id: 'page-sessions', label: 'Active Sessions', module: 'Account & Security', icon: 'Laptop', path: '/account/security/sessions' },
  { id: 'page-support', label: 'Help & Support', module: 'Support', icon: 'HelpCircle', path: '/contact' },
];

const MODULE_OPTIONS = [
  { value: 'ALL', label: 'All Modules' },
  { value: 'Dashboard', label: 'Dashboard' },
  { value: 'Projects', label: 'Projects' },
  { value: 'Conversion', label: 'Conversion' },
  { value: 'Usage', label: 'Usage' },
  { value: 'Subscription', label: 'Subscription' },
  { value: 'Account & Security', label: 'Account & Security' },
  { value: 'Support', label: 'Support' },
];

export interface AvailablePagesPanelProps {
  onAddPageToMenu: (page: AvailablePage) => void;
}

export const AvailablePagesPanel: React.FC<AvailablePagesPanelProps> = ({ onAddPageToMenu }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');

  const filteredPages = AVAILABLE_PAGES_LIBRARY.filter((page) => {
    const matchesSearch =
      page.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.module.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = selectedModule === 'ALL' || page.module === selectedModule;

    return matchesSearch && matchesModule;
  });

  return (
    <Card variant="default" padding="md" className="h-[640px] flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="pb-3 mb-3 border-b border-[#E5EAF0]">
          <h2 className="text-base font-bold text-[#091E42]">Available Pages</h2>
          <p className="text-xs text-[#6B778C] mt-0.5">Select a page to add to the menu.</p>
        </div>

        {/* Filter & Search Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <div className="sm:col-span-2 relative">
            <Input
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs py-1.5"
            />
            <Search className="w-3.5 h-3.5 text-[#6B778C] absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          <div>
            <Select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              options={MODULE_OPTIONS}
              className="text-xs py-1.5"
            />
          </div>
        </div>

        {/* Pages Library List */}
        <div className="overflow-y-auto max-h-[460px] pr-1 space-y-1.5">
          {filteredPages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-[#E5EAF0] bg-white hover:border-[#0652CC]/50 hover:bg-[#F7F9FC] transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#F7F9FC] border border-[#E5EAF0] flex items-center justify-center text-[#0652CC] group-hover:bg-[#E8F1FF]">
                  <DynamicIcon name={page.icon} className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#091E42] group-hover:text-[#0652CC]">
                    {page.label}
                  </h4>
                  <span className="text-[10px] text-[#6B778C]">{page.module}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onAddPageToMenu(page)}
                className="w-7 h-7 rounded-lg bg-[#0652CC] hover:bg-[#0655FF] text-white flex items-center justify-center transition-colors shadow-xs"
                title={`Add ${page.label} to menu structure`}
              >
                <Plus className="w-4 h-4 font-bold" />
              </button>
            </div>
          ))}

          {filteredPages.length === 0 && (
            <div className="p-6 text-center text-xs text-[#6B778C]">
              No available pages match your filter criteria.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AvailablePagesPanel;
